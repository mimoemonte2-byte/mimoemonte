/* =========================================================
   Vitrine 3D — motor compartilhado
   - Um único WebGLRenderer (um canvas ativo por vez), movido
     entre a galeria e o visualizador.
   - Perfil de qualidade por dispositivo (resolução e sombras).
   - Loop sob demanda: só desenha enquanto há movimento.
   ========================================================= */
import * as THREE from "../vendor/three.min.js";
import { RoomEnvironment } from "../vendor/three.min.js";
import { setDetail, disposeBuilders } from "./builders.js";

let renderer = null, envTex = null, tierCache = null;

export function getTier(){
  if(tierCache) return tierCache;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const small = Math.min(screen.width, screen.height) < 760;
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;
  let level = "high";
  if(coarse || small) level = (mem <= 3 || cores <= 4) ? "low" : "mid";
  const q = new URLSearchParams(location.search).get("qualidade");
  if(q === "baixa") level = "low";
  tierCache = {
    level,
    pixelRatio: level === "low" ? Math.min(dpr, 1.25) : level === "mid" ? Math.min(dpr, 1.6) : Math.min(dpr, 2),
    antialias: level !== "low",
    shadows: level === "high"
  };
  return tierCache;
}

export function webglAvailable(){
  if(new URLSearchParams(location.search).has("sem3d")) return false;
  try{
    const c = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && c.getContext("webgl2")) || !!c.getContext("webgl");
  }catch(e){ return false; }
}

export function getRenderer(){
  if(renderer) return renderer;
  const tier = getTier();
  setDetail(tier.level);
  renderer = new THREE.WebGLRenderer({ antialias: tier.antialias, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false });
  renderer.setPixelRatio(tier.pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = tier.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "vt-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  envTex = pmrem.fromScene(room, 0.04).texture;
  room.traverse((o) => { if(o.isMesh){ o.geometry.dispose(); o.material.dispose(); } });
  pmrem.dispose();
  return renderer;
}

export function getEnvironment(){ getRenderer(); return envTex; }

/* Coloca o canvas único dentro do container e mantém o tamanho em dia */
export function mountRenderer(container, onResize){
  const r = getRenderer();
  container.appendChild(r.domElement);
  const ro = new ResizeObserver(() => {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    r.setSize(w, h, false);
    onResize && onResize(w, h);
  });
  ro.observe(container);
  return () => ro.disconnect();
}

/* Luzes padrão de estúdio de miniatura */
export function addStudioLights(scene, { shadows = false } = {}){
  scene.environment = getEnvironment();
  scene.environmentIntensity = 0.55;
  const hemi = new THREE.HemisphereLight("#FFFFFF", "#E9D8C6", 0.55);
  const key = new THREE.DirectionalLight("#FFF3E2", 1.7);
  key.position.set(-3.5, 6.5, 5.5);
  const fill = new THREE.DirectionalLight("#DCE7FF", 0.5);
  fill.position.set(4.5, 3, 3);
  scene.add(hemi, key, key.target, fill);
  if(shadows && getTier().shadows){
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera;
    sc.left = -3.4; sc.right = 3.4; sc.top = 3.6; sc.bottom = -3.2; sc.near = 1; sc.far = 18;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = 3;
  }
  return { hemi, key, fill };
}

/* Loop sob demanda: tick() devolve true enquanto ainda há animação */
export class DemandLoop{
  constructor(tick){
    this.tick = tick; this.raf = 0; this.paused = false; this.last = 0;
    this.frameTimes = [];
  }
  request(){
    if(this.raf || this.paused) return;
    this.raf = requestAnimationFrame((t) => {
      this.raf = 0;
      const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 1 / 60;
      this.last = t;
      const again = this.tick(dt);
      this.watchPerformance(dt);
      if(again) this.request(); else this.last = 0;
    });
  }
  pause(){ this.paused = true; if(this.raf) cancelAnimationFrame(this.raf); this.raf = 0; this.last = 0; }
  resume(){ this.paused = false; this.request(); }
  /* Reduz a resolução se o aparelho não sustentar ~30 fps */
  watchPerformance(dt){
    if(!renderer) return;
    this.frameTimes.push(dt);
    if(this.frameTimes.length < 40) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    const pr = renderer.getPixelRatio();
    if(avg > 0.034 && pr > 1){
      renderer.setPixelRatio(Math.max(1, pr - 0.25));
      const c = renderer.domElement.parentElement;
      if(c) renderer.setSize(c.clientWidth, c.clientHeight, false);
    }
  }
}

/* Ajusta a distância da câmera para enquadrar um kit (largura x altura) */
export function fitDistance(camera, width = 5.6, height = 3.9){
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  return Math.max(width / (2 * t * camera.aspect), height / (2 * t));
}

export function disposeEngine(){
  disposeBuilders();
  if(envTex){ envTex.dispose(); envTex = null; }
  if(renderer){
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    renderer = null;
  }
}
