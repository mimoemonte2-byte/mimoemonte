/* =========================================================
   Vitrine 3D — galeria em perspectiva (WebGL)
   Os kits ficam em fila; o ativo vem ao centro, de frente e
   maior; os vizinhos recuam em profundidade (névoa suave).
   A cena só é redesenhada enquanto algo se move.
   ========================================================= */
import * as THREE from "../vendor/three.min.js";
import { buildKit } from "./builders.js";
import { getRenderer, mountRenderer, addStudioLights, DemandLoop, fitDistance } from "./engine.js";
import { slotFor } from "./layout.js";

export function createGallery3D({ host, reduced = false }){
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  const bg = new THREE.Color("#FFF6EC"), bgTarget = new THREE.Color("#FFF6EC");
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 10, 24);
  addStudioLights(scene, { shadows: false });

  let items = [];          // temas visíveis (filtrados)
  let kits = [];           // grupos 3D correspondentes (podem ainda não estar prontos)
  let target = 0, cur = 0, dragging = false;
  let compact = false, dist = 10;
  let unmount = null, attached = false, buildTimer = 0;
  const allKits = new Map(); // slug -> group já adicionados à cena

  const loop = new DemandLoop(tick);

  function layoutCamera(w, h){
    camera.aspect = w / h;
    compact = camera.aspect < 1.05;
    dist = fitDistance(camera, compact ? 5.4 : 7.6, 4.7);
    camera.position.set(0, 1.4 + dist * 0.2, dist);
    camera.lookAt(0, 1.3, 0);
    camera.updateProjectionMatrix();
    scene.fog.near = dist + 0.8;
    scene.fog.far = dist + (compact ? 7 : 10);
    loop.request();
  }

  function ensureKit(i){
    if(kits[i]) return kits[i];
    const theme = items[i];
    const g = buildKit(theme);
    if(g.parent !== scene) scene.add(g);
    allKits.set(theme.slug, g);
    kits[i] = g;
    return g;
  }

  /* Constrói primeiro os kits próximos e o resto em segundo plano */
  function scheduleBuild(){
    clearTimeout(buildTimer);
    const center = Math.round(target);
    const order = items.map((_, i) => i).sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
    order.slice(0, 3).forEach(ensureKit);
    const rest = order.slice(3);
    const step = () => {
      const i = rest.shift();
      if(i == null) return;
      ensureKit(i);
      loop.request();
      buildTimer = setTimeout(step, 30);
    };
    buildTimer = setTimeout(step, 60);
  }

  function applyLayout(){
    const visible = new Set();
    kits.forEach((g, i) => {
      if(!g) return;
      const s = slotFor(i - cur, compact);
      g.visible = s.visible;
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.ry;
      g.scale.setScalar(s.scale);
      if(s.visible) visible.add(g);
    });
    allKits.forEach((g) => { if(!visible.has(g) && !kits.includes(g)) g.visible = false; });
  }

  function tick(dt){
    let moving = false;
    if(dragging){
      cur += (target - cur) * Math.min(1, dt * 24);
      moving = true;
    }else if(reduced){
      cur = target;
    }else{
      cur += (target - cur) * (1 - Math.exp(-dt * 7.5));
      if(Math.abs(target - cur) < 0.0008) cur = target; else moving = true;
    }
    const active = items[Math.max(0, Math.min(items.length - 1, Math.round(cur)))];
    if(active){
      bgTarget.set(active.stage?.bg || "#FFF6EC");
      if(reduced) bg.copy(bgTarget); else bg.lerp(bgTarget, Math.min(1, dt * 5));
      scene.fog.color.copy(bg);
      if(Math.abs(bg.r - bgTarget.r) + Math.abs(bg.g - bgTarget.g) + Math.abs(bg.b - bgTarget.b) > 0.003) moving = true;
    }
    applyLayout();
    getRenderer().render(scene, camera);
    return moving;
  }

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmpBox = new THREE.Box3(), hit = new THREE.Vector3();

  return {
    setItems(list, index = 0){
      kits.forEach((g) => { if(g) g.visible = false; });
      items = list.slice();
      kits = new Array(items.length).fill(null);
      items.forEach((t, i) => { const g = allKits.get(t.slug); if(g){ kits[i] = g; if(g.parent !== scene) scene.add(g); } });
      target = cur = index;
      scheduleBuild();
      loop.request();
    },
    setOffset(o, { drag = false, immediate = false } = {}){
      target = o; dragging = drag;
      if(immediate) cur = o;
      if(!drag) scheduleBuild();
      loop.request();
    },
    endDrag(){ dragging = false; loop.request(); },
    /* Devolve o índice do kit sob o ponteiro (ou -1) */
    pick(clientX, clientY){
      const el = getRenderer().domElement, r = el.getBoundingClientRect();
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let best = -1, bestD = Infinity;
      kits.forEach((g, i) => {
        if(!g || !g.visible) return;
        g.updateMatrixWorld();
        tmpBox.copy(g.userData.bounds).applyMatrix4(g.matrixWorld);
        if(ray.ray.intersectBox(tmpBox, hit)){
          const d = hit.distanceTo(camera.position);
          if(d < bestD){ bestD = d; best = i; }
        }
      });
      return best;
    },
    attach(){
      if(attached) return;
      attached = true;
      kits.forEach((g) => { if(g && g.parent !== scene) scene.add(g); });
      allKits.forEach((g) => { if(g.parent !== scene) scene.add(g); });
      unmount = mountRenderer(host, layoutCamera);
      const r = getRenderer();
      layoutCamera(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
      r.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), false);
      loop.resume();
    },
    detach(){
      if(!attached) return;
      attached = false;
      loop.pause();
      clearTimeout(buildTimer);
      if(unmount) unmount();
      unmount = null;
    },
    pause(){ loop.pause(); },
    resume(){ if(attached) loop.resume(); },
    renderNow(){ loop.request(); },
    destroy(){
      this.detach();
      allKits.forEach((g) => scene.remove(g));
      allKits.clear();
      kits = []; items = [];
    }
  };
}
