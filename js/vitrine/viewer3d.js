/* =========================================================
   Vitrine 3D — visualizador dedicado de um tema
   Rotação 360°, zoom limitado, vistas Frente / Lateral /
   Visão geral e pontos de informação (botões HTML sobre o
   canvas, sincronizados com a lista em texto da página).
   ========================================================= */
import * as THREE from "../vendor/three.min.js";
import { buildKit } from "./builders.js";
import { getRenderer, mountRenderer, addStudioLights, DemandLoop, fitDistance, getTier } from "./engine.js";

const PART_ORDER = ["panel", "pedestals", "table", "accessories"];
const TAU = Math.PI * 2;

export function createViewer3D({ host, overlay, theme, reduced = false, onHotspot, onFirstFrame, onUserMove }){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.stage?.bg || "#FFF6EC");
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  addStudioLights(scene, { shadows: true });

  const kit = buildKit(theme);
  kit.position.set(0, 0, 0); kit.rotation.set(0, 0, 0); kit.scale.setScalar(1); kit.visible = true;
  scene.add(kit);

  if(getTier().shadows){
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.12 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.001; floor.receiveShadow = true;
    scene.add(floor);
    scene.userData.floor = floor;
  }

  /* ---------- órbita ---------- */
  const lookAt = new THREE.Vector3(0, 1.35, 0);
  const lookGoal = lookAt.clone();
  let fit = 9;
  const VIEWS = {
    front:    () => ({ theta: 0,     phi: 1.36, radius: fit }),
    side:     () => ({ theta: 1.15,  phi: 1.3,  radius: fit }),
    overview: () => ({ theta: -0.55, phi: 0.95, radius: fit * 1.15 })
  };
  const s = { ...VIEWS.front() }, goal = { ...s };
  const limits = () => ({ min: fit * 0.5, max: fit * 1.35 });

  const loop = new DemandLoop(tick);
  let firstFrame = true;

  function resize(w, h){
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const prev = fit;
    fit = fitDistance(camera, 5.5, 4.4);
    const k = fit / prev;
    s.radius *= k; goal.radius *= k;
    loop.request();
  }

  function tick(dt){
    const a = reduced ? 1 : 1 - Math.exp(-dt * 8);
    let moving = false;
    for(const key of ["theta", "phi", "radius"]){
      const d = goal[key] - s[key];
      if(Math.abs(d) > 0.0005){ s[key] += d * a; moving = true; } else s[key] = goal[key];
    }
    if(lookAt.distanceToSquared(lookGoal) > 1e-6){ lookAt.lerp(lookGoal, a); moving = true; } else lookAt.copy(lookGoal);
    const sp = Math.sin(s.phi);
    camera.position.set(
      lookAt.x + s.radius * sp * Math.sin(s.theta),
      lookAt.y + s.radius * Math.cos(s.phi),
      lookAt.z + s.radius * sp * Math.cos(s.theta)
    );
    camera.lookAt(lookAt);
    getRenderer().render(scene, camera);
    updateHotspots();
    if(firstFrame){ firstFrame = false; onFirstFrame && onFirstFrame(); }
    return moving;
  }

  /* ---------- pontos de informação ---------- */
  const anchors = kit.userData.anchors;
  const buttons = PART_ORDER.map((key, i) => {
    const part = theme.parts[key];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "vt-hotspot";
    b.dataset.part = key;
    b.textContent = String(i + 1);
    b.setAttribute("aria-label", `${i + 1}. ${part.title}: ${part.text}`);
    b.addEventListener("click", (e) => { e.stopPropagation(); onHotspot && onHotspot(key); });
    overlay.appendChild(b);
    return { key, b };
  });
  const pv = new THREE.Vector3(), toCam = new THREE.Vector3();
  function updateHotspots(){
    const w = host.clientWidth, h = host.clientHeight;
    buttons.forEach(({ key, b }) => {
      const an = anchors[key];
      pv.copy(an.pos).project(camera);
      const x = (pv.x * 0.5 + 0.5) * w, y = (-pv.y * 0.5 + 0.5) * h;
      toCam.copy(camera.position).sub(an.pos).normalize();
      const facing = toCam.dot(an.normal);
      const inView = pv.z < 1 && x > 12 && x < w - 12 && y > 12 && y < h - 12;
      b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      b.classList.toggle("is-behind", facing < -0.15);
      b.hidden = !inView;
    });
  }

  /* ---------- entrada: arrastar, pinça, Ctrl+roda, teclado ---------- */
  const pointers = new Map();
  let pinchStart = 0, radiusStart = 0, lastX = 0, lastY = 0, dragging = false, downX = 0, downY = 0;
  const el = host;

  function onDown(e){
    if(e.target.closest(".vt-hotspot")) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    lastX = downX = e.clientX; lastY = downY = e.clientY; dragging = false;
    if(pointers.size === 2){
      const [p1, p2] = [...pointers.values()];
      pinchStart = Math.hypot(p1.x - p2.x, p1.y - p2.y); radiusStart = goal.radius;
    }
  }
  function onMove(e){
    if(!pointers.has(e.pointerId)) return;
    const p = pointers.get(e.pointerId);
    p.x = e.clientX; p.y = e.clientY;
    if(pointers.size === 2){
      const [p1, p2] = [...pointers.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if(pinchStart > 0) setRadius(radiusStart * pinchStart / d);
      e.preventDefault();
      return;
    }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if(!dragging){
      const tx = Math.abs(e.clientX - downX), ty = Math.abs(e.clientY - downY);
      if(e.pointerType === "touch" ? (tx > 8 && tx > ty) : (tx + ty > 4)){
        dragging = true;
        try{ el.setPointerCapture(e.pointerId); }catch(_){ /* noop */ }
        el.classList.add("is-dragging");
        onUserMove && onUserMove();
      }else return;
    }
    lastX = e.clientX; lastY = e.clientY;
    goal.theta -= dx * 0.0085;
    if(e.pointerType !== "touch") goal.phi = clampPhi(goal.phi - dy * 0.006);
    s.theta = reduced ? goal.theta : s.theta;
    loop.request();
  }
  function onUp(e){
    pointers.delete(e.pointerId);
    if(pointers.size < 2) pinchStart = 0;
    if(pointers.size === 0){ dragging = false; el.classList.remove("is-dragging"); }
  }
  function onWheel(e){
    if(!(e.ctrlKey || e.metaKey)) return; // rolagem normal da página continua livre
    e.preventDefault();
    setRadius(goal.radius * (1 + Math.sign(e.deltaY) * 0.1));
  }
  function onKey(e){
    const k = e.key;
    if(k === "ArrowLeft"){ goal.theta += 0.3; }
    else if(k === "ArrowRight"){ goal.theta -= 0.3; }
    else if(k === "ArrowUp"){ goal.phi = clampPhi(goal.phi - 0.12); }
    else if(k === "ArrowDown"){ goal.phi = clampPhi(goal.phi + 0.12); }
    else if(k === "+" || k === "="){ setRadius(goal.radius * 0.88); }
    else if(k === "-" || k === "_"){ setRadius(goal.radius * 1.12); }
    else return;
    e.preventDefault();
    loop.request();
  }
  const clampPhi = (v) => Math.min(1.5, Math.max(0.55, v));
  function setRadius(r){ const l = limits(); goal.radius = Math.min(l.max, Math.max(l.min, r)); loop.request(); }

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("keydown", onKey);

  const unmount = mountRenderer(host, resize);
  resize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
  Object.assign(s, VIEWS.front()); Object.assign(goal, s);
  loop.request();

  /* Pausa quando o visualizador sai da tela */
  const io = new IntersectionObserver(([en]) => { en.isIntersecting ? loop.resume() : loop.pause(); });
  io.observe(host);

  function nearestTheta(t){
    let d = (t - goal.theta) % TAU;
    if(d > Math.PI) d -= TAU; if(d < -Math.PI) d += TAU;
    return goal.theta + d;
  }

  return {
    setView(name){
      const v = (VIEWS[name] || VIEWS.front)();
      goal.theta = nearestTheta(v.theta); goal.phi = v.phi; goal.radius = v.radius;
      lookGoal.set(0, 1.35, 0);
      loop.request();
    },
    zoom(dir){ setRadius(goal.radius * (dir > 0 ? 0.85 : 1.18)); },
    focusPart(key){
      const an = anchors[key];
      if(!an) return;
      goal.theta = nearestTheta(Math.atan2(an.normal.x, an.normal.z));
      goal.phi = key === "table" || key === "pedestals" ? 1.12 : 1.3;
      goal.radius = fit * 0.72;
      lookGoal.set(an.pos.x * 0.6, 0.6 + an.pos.y * 0.5, an.pos.z * 0.4);
      buttons.forEach(({ key: k, b }) => b.classList.toggle("is-active", k === key));
      loop.request();
    },
    clearFocus(){ buttons.forEach(({ b }) => b.classList.remove("is-active")); },
    destroy(){
      loop.pause();
      io.disconnect();
      unmount();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKey);
      buttons.forEach(({ b }) => b.remove());
      scene.remove(kit);
      const floor = scene.userData.floor;
      if(floor){ floor.geometry.dispose(); floor.material.dispose(); }
      getRenderer().domElement.remove();
    }
  };
}
