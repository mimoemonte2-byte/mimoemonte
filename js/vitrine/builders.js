/* =========================================================
   MIMO & MONTE — Vitrine 3D: construtor procedural de kits
   ---------------------------------------------------------
   Cada kit é montado a partir de "composition" (js/vitrine-data.js)
   usando uma biblioteca de peças reutilizáveis:

   PAINÉIS      moon, leafy, checker, arch, construction, floral,
                shell, towers, curtain, rainbow
   PEDESTAIS    plain, rocket, rock, tire, wood, stripes, fluted,
                pearl, tutu
   MESAS        cabinet, rustic, podium, workbench, rect, oval,
                wavy, round, sweets, rounded
   ACESSÓRIOS   cake, planet, star, balloon, egg, footprint, palm,
                bush, flag, cone, tire-stack, trophy, lion, giraffe,
                elephant, excavator, truck, helmet, butterfly,
                flower, coral, starfish, bubble, slipper, bow,
                cupcake, cloud, drop

   Depois de montado, o kit é "achatado": todas as malhas que
   compartilham material viram uma só geometria (poucas draw
   calls por cenário, essencial no celular).
   ========================================================= */
import * as THREE from "../vendor/three.min.js";
import { RoundedBoxGeometry, mergeGeometries } from "../vendor/three.min.js";

export const BASE_H = 0.2;      // altura do tablado
const PZ = -0.95;               // profundidade do painel
let SEG = 1;                    // multiplicador de segmentos (qualidade)

export function setDetail(level){ SEG = level === "low" ? 0.6 : 1; }
const seg = (n) => Math.max(3, Math.round(n * SEG));

/* ---------------- caches ---------------- */
const matCache = new Map();
const texCache = new Map();
const kitCache = new Map();

function mat(color, o = {}){
  const key = color + "|" + JSON.stringify(o);
  if(matCache.has(key)) return matCache.get(key);
  let m;
  if(o.pearl){
    m = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.3, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.25,
      iridescence: 0.9, iridescenceIOR: 1.35, sheen: 0.6, sheenColor: new THREE.Color("#FFFFFF")
    });
  }else if(o.glass){
    m = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.05, metalness: 0, clearcoat: 1, transparent: true,
      opacity: o.opacity ?? 0.32, depthWrite: false, iridescence: 0.6
    });
  }else{
    m = new THREE.MeshStandardMaterial({
      color, roughness: o.rough ?? 0.62, metalness: o.metal ?? 0,
      flatShading: !!o.flat,
      side: o.double ? THREE.DoubleSide : THREE.FrontSide,
      transparent: !!o.opacity, opacity: o.opacity ?? 1,
      depthWrite: o.opacity ? false : true
    });
    if(o.glow){ m.emissive = new THREE.Color(color); m.emissiveIntensity = o.glow; }
  }
  matCache.set(key, m);
  return m;
}

function texMat(key, texture, o = {}){
  const k = "tex|" + key + "|" + JSON.stringify(o);
  if(matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshStandardMaterial({
    map: texture, roughness: o.rough ?? 0.65, metalness: o.metal ?? 0,
    color: o.color || "#FFFFFF",
    transparent: !!o.alpha, alphaTest: o.alpha ? 0.5 : 0,
    side: o.double ? THREE.DoubleSide : THREE.FrontSide
  });
  matCache.set(k, m);
  return m;
}

function canvasTex(key, w, h, draw, repeat){
  const k = key + "|" + (repeat ? repeat.join("x") : "");
  if(texCache.has(k)) return texCache.get(k);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if(repeat) t.repeat.set(repeat[0], repeat[1]);
  texCache.set(k, t);
  return t;
}

/* ---------------- texturas procedurais ---------------- */
const TEX = {
  checker(cols, rows, dark, light){
    return canvasTex(`checker${cols}${rows}${dark}${light}`, cols * 64, rows * 64, (g) => {
      for(let y = 0; y < rows; y++) for(let x = 0; x < cols; x++){
        g.fillStyle = (x + y) % 2 ? dark : light;
        g.fillRect(x * 64, y * 64, 64, 64);
      }
    });
  },
  brick(color, mortar, repeat){
    return canvasTex(`brick${color}${mortar}`, 256, 256, (g) => {
      g.fillStyle = mortar; g.fillRect(0, 0, 256, 256);
      const bw = 64, bh = 32, rnd = rng(7);
      for(let row = 0; row < 8; row++){
        const off = row % 2 ? bw / 2 : 0;
        for(let col = -1; col < 5; col++){
          g.fillStyle = shade(color, (rnd() - 0.5) * 0.14);
          roundRect(g, col * bw + off + 3, row * bh + 3, bw - 6, bh - 6, 4);
        }
      }
    }, repeat);
  },
  wood(color){
    return canvasTex(`wood${color}`, 256, 256, (g) => {
      g.fillStyle = color; g.fillRect(0, 0, 256, 256);
      const rnd = rng(3);
      for(let i = 0; i < 46; i++){
        const x = rnd() * 256, w = 1 + rnd() * 3;
        g.fillStyle = shade(color, -0.08 - rnd() * 0.12);
        g.globalAlpha = 0.35 + rnd() * 0.35;
        g.beginPath();
        g.moveTo(x, 0);
        g.bezierCurveTo(x + (rnd() - 0.5) * 18, 90, x + (rnd() - 0.5) * 18, 170, x, 256);
        g.lineTo(x + w, 256);
        g.bezierCurveTo(x + w, 170, x + w, 90, x + w, 0);
        g.fill();
      }
      g.globalAlpha = 1;
    }, [2, 1]);
  },
  hazard(yellow, black){
    return canvasTex(`hazard${yellow}${black}`, 256, 64, (g) => {
      g.fillStyle = yellow; g.fillRect(0, 0, 256, 64);
      g.fillStyle = black;
      for(let x = -64; x < 320; x += 48){
        g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 24, 64); g.lineTo(x + 48, 0); g.lineTo(x + 24, 0); g.fill();
      }
    }, [4, 1]);
  },
  digit(n){
    return canvasTex(`digit${n}`, 128, 128, (g) => {
      g.clearRect(0, 0, 128, 128);
      g.fillStyle = "#FFFFFF";
      g.font = "800 92px 'Baloo 2', 'Arial Rounded MT Bold', Arial, sans-serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(n), 64, 70);
    });
  },
  spots(color, spot){
    return canvasTex(`spots${color}${spot}`, 256, 256, (g) => {
      g.fillStyle = color; g.fillRect(0, 0, 256, 256);
      g.fillStyle = spot;
      const rnd = rng(11);
      for(let i = 0; i < 26; i++){
        const cx = rnd() * 256, cy = rnd() * 256, r = 10 + rnd() * 14;
        g.beginPath();
        for(let k = 0; k < 7; k++){
          const a = k / 7 * Math.PI * 2, rr = r * (0.75 + rnd() * 0.4);
          k ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        g.fill();
      }
    }, [2, 2]);
  },
  blob(){
    return canvasTex("blob", 128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      gr.addColorStop(0, "rgba(34,51,87,0.42)");
      gr.addColorStop(0.55, "rgba(34,51,87,0.16)");
      gr.addColorStop(1, "rgba(34,51,87,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    });
  }
};

function roundRect(g, x, y, w, h, r){
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.fill();
}
function shade(hex, amt){
  const c = new THREE.Color(hex);
  const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amt)));
  return "#" + c.getHexString();
}
function rng(seed){
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hash3(x, y, z){
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return h - Math.floor(h);
}

/* ---------------- helpers de geometria ---------------- */
function M(geo, material, p = {}){
  const m = new THREE.Mesh(geo, material);
  m.position.set(p.x || 0, p.y || 0, p.z || 0);
  m.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
  if(p.s != null){ Array.isArray(p.s) ? m.scale.set(p.s[0], p.s[1], p.s[2]) : m.scale.setScalar(p.s); }
  return m;
}
function grp(...children){ const g = new THREE.Group(); children.forEach(c => c && g.add(c)); return g; }
function place(obj, p = {}){
  obj.position.set(p.x || 0, p.y || 0, p.z || 0);
  obj.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
  if(p.s != null) obj.scale.setScalar(p.s);
  return obj;
}
const cyl = (rt, rb, h, rs = 32, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg(rs), 1, open);
const sph = (r, ws = 24, hs = 16) => new THREE.SphereGeometry(r, seg(ws), seg(hs));
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const rbox = (w, h, d, r = 0.03) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
const torus = (r, t, rs = 12, ts = 32, arc) => new THREE.TorusGeometry(r, t, seg(rs), seg(ts), arc);

function extrude(shape, depth, bevel = 0.012, curve = 24){
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 2, curveSegments: seg(curve)
  });
  g.translate(0, 0, -depth / 2);
  return g;
}
function rrShape(w, h, r){
  const s = new THREE.Shape(), x = -w / 2;
  s.moveTo(x + r, 0); s.lineTo(x + w - r, 0); s.quadraticCurveTo(x + w, 0, x + w, r);
  s.lineTo(x + w, h - r); s.quadraticCurveTo(x + w, h, x + w - r, h);
  s.lineTo(x + r, h); s.quadraticCurveTo(x, h, x, h - r);
  s.lineTo(x, r); s.quadraticCurveTo(x, 0, x + r, 0);
  return s;
}
function archShape(w, h){
  const r = w / 2, s = new THREE.Shape();
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r);
  s.absarc(0, h - r, r, 0, Math.PI, false);
  s.lineTo(-r, 0);
  return s;
}
function starShape(R, r = R * 0.45, n = 5){
  const s = new THREE.Shape();
  for(let i = 0; i < n * 2; i++){
    const a = Math.PI / 2 + i * Math.PI / n, rad = i % 2 ? r : R;
    i ? s.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : s.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  s.closePath();
  return s;
}
function leafShape(L, W){
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(W, L * 0.45, 0, L); s.quadraticCurveTo(-W, L * 0.45, 0, 0);
  return s;
}
function flowerOutline(target, cx, cy, R, petals = 5, pts = 60){
  for(let i = 0; i <= pts; i++){
    const a = i / pts * Math.PI * 2;
    const r = R * (0.55 + 0.45 * Math.abs(Math.cos(petals * a / 2)));
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? target.lineTo(x, y) : target.moveTo(x, y);
  }
  return target;
}
function bandShape(rOut, rIn){
  const s = new THREE.Shape();
  s.moveTo(rOut, 0); s.absarc(0, 0, rOut, 0, Math.PI, false);
  s.lineTo(-rIn, 0); s.absarc(0, 0, rIn, Math.PI, 0, true);
  s.lineTo(rOut, 0);
  return s;
}
function towerShape(w, h, merlons){
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h);
  if(merlons){
    const n = merlons * 2 - 1, mw = w / n, mh = mw * 0.9;
    for(let k = 0; k < n; k++){
      const x0 = w / 2 - k * mw, x1 = x0 - mw;
      if(k % 2 === 0){ s.lineTo(x0, h + mh); s.lineTo(x1, h + mh); s.lineTo(x1, h); }
      else s.lineTo(x1, h);
    }
  }else s.lineTo(-w / 2, h);
  s.lineTo(-w / 2, 0);
  return s;
}
function displace(geo, fn){
  const p = geo.attributes.position, v = new THREE.Vector3();
  for(let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/* =========================================================
   PAINÉIS — origem no centro-base do painel, voltado para +z
   ========================================================= */
const PANELS = {
  moon(p){
    const g = grp();
    g.add(M(extrude(archShape(2.9, 2.55), 0.06, 0.02), mat(p.color, { rough: 0.8 }), { z: -0.1 }));
    const starM = mat(p.star, { glow: 0.25, rough: 0.4 });
    [[-1.05, 2.05, 0.09], [-0.85, 1.05, 0.06], [1.05, 1.95, 0.07], [0.95, 0.65, 0.05], [-0.25, 2.35, 0.05], [1.2, 1.25, 0.04], [-1.15, 0.45, 0.05]]
      .forEach(([x, y, s]) => g.add(M(extrude(starShape(s), 0.02, 0.006, 4), starM, { x, y, z: -0.05 })));
    const moonM = mat(p.moon, { rough: 0.9 });
    g.add(M(extrude(new THREE.Shape().absarc(0, 0, 1.0, 0, Math.PI * 2), 0.1, 0.04, 48), moonM, { x: 0.12, y: 1.32, z: 0.04 }));
    const craterM = mat(p.crater, { rough: 0.95 });
    [[-0.3, 1.7, 0.2], [0.5, 1.05, 0.16], [0.35, 1.75, 0.1], [-0.25, 0.9, 0.12], [0.7, 1.55, 0.08], [-0.55, 1.3, 0.07]]
      .forEach(([x, y, r]) => g.add(M(cyl(r, r * 1.08, 0.04, 20), craterM, { x: x + 0.12, y, z: 0.13, rx: Math.PI / 2 })));
    return g;
  },

  leafy(p){
    const g = grp();
    g.add(M(extrude(rrShape(2.6, 2.1, 0.22), 0.06, 0.02), mat(p.color, { rough: 0.85 })));
    const vol = new THREE.Shape();
    vol.moveTo(-0.95, 0); vol.lineTo(-0.28, 1.15); vol.quadraticCurveTo(0, 1.24, 0.28, 1.15); vol.lineTo(0.95, 0); vol.lineTo(-0.95, 0);
    g.add(M(extrude(vol, 0.05, 0.015), mat(p.volcano, { rough: 0.9 }), { x: 0.3, y: 0.05, z: 0.06 }));
    const lava = new THREE.Shape();
    lava.moveTo(-0.3, 0); lava.quadraticCurveTo(0, 0.12, 0.3, 0); lava.lineTo(0.2, -0.22); lava.quadraticCurveTo(0.1, -0.1, 0.02, -0.32); lava.quadraticCurveTo(-0.05, -0.12, -0.16, -0.2); lava.lineTo(-0.3, 0);
    g.add(M(extrude(lava, 0.03, 0.01), mat(p.lava, { glow: 0.2 }), { x: 0.3, y: 1.2, z: 0.1 }));
    const leaves = [
      [-1.25, 1.85, 0.55, 0.9], [-0.85, 2.05, 0.7, 0.3], [-0.35, 2.0, 0.6, -0.15], [0.45, 2.02, 0.65, 0.25],
      [0.95, 2.0, 0.7, -0.45], [1.3, 1.6, 0.6, -1.1], [-1.35, 1.15, 0.5, 1.4], [1.35, 0.85, 0.45, -1.5], [-1.25, 0.35, 0.42, 1.7]
    ];
    leaves.forEach(([x, y, L, rz], i) => {
      g.add(M(extrude(leafShape(L, L * 0.38), 0.015, 0.008, 12), mat(p.leaves[i % p.leaves.length], { rough: 0.7 }),
        { x, y: y - 0.2, z: 0.09 + (i % 3) * 0.025, rz, rx: (i % 2 ? 0.25 : -0.2) }));
    });
    return g;
  },

  checker(p){
    const g = grp();
    const postM = mat(p.post, { rough: 0.45 });
    g.add(M(cyl(0.07, 0.08, 2.35, 16), postM, { x: -1.45, y: 1.175 }));
    g.add(M(cyl(0.07, 0.08, 2.35, 16), postM, { x: 1.45, y: 1.175 }));
    g.add(M(rbox(2.75, 1.75, 0.06, 0.02), mat(p.dark), { y: 1.05 }));
    g.add(M(new THREE.PlaneGeometry(2.65, 1.65), texMat("chk", TEX.checker(8, 5, p.dark, p.color), { rough: 0.5 }), { y: 1.05, z: 0.032 }));
    g.add(M(rbox(3.0, 0.36, 0.1, 0.04), mat(p.banner, { rough: 0.5 }), { y: 2.12 }));
    ["#E8402A", "#F4B93F", "#F4B93F", "#3AA76D", "#3AA76D"].forEach((c, i) =>
      g.add(M(sph(0.07, 16, 12), mat(c, { glow: 0.35, rough: 0.3 }), { x: -0.6 + i * 0.3, y: 2.12, z: 0.06 })));
    return g;
  },

  arch(p){
    const g = grp();
    g.add(M(extrude(archShape(2.5, 2.5), 0.06, 0.02, 40), mat(p.color, { rough: 0.85 })));
    g.add(M(extrude(archShape(2.1, 2.2), 0.04, 0.012, 40), mat(p.inner, { rough: 0.85 }), { y: 0.06, z: 0.05 }));
    g.add(M(extrude(new THREE.Shape().absarc(0, 0, 0.34, 0, Math.PI * 2), 0.03, 0.01, 32), mat(p.sun, { glow: 0.3 }), { x: 0.45, y: 1.6, z: 0.08 }));
    const hill = new THREE.Shape();
    hill.moveTo(-1.05, 0); hill.lineTo(-1.05, 0.42); hill.bezierCurveTo(-0.6, 0.7, -0.2, 0.3, 0.2, 0.48); hill.bezierCurveTo(0.6, 0.66, 0.9, 0.45, 1.05, 0.5); hill.lineTo(1.05, 0); hill.lineTo(-1.05, 0);
    g.add(M(extrude(hill, 0.03, 0.01), mat(p.leaves[1], { rough: 0.85 }), { y: 0.06, z: 0.09 }));
    const treeM = mat(p.leaves[2], { rough: 0.8 });
    g.add(M(box(0.06, 0.6, 0.02), mat("#7A5534"), { x: -0.45, y: 0.85, z: 0.1 }));
    const canopy = new THREE.Shape(); canopy.absellipse(0, 0, 0.42, 0.11, 0, Math.PI * 2);
    g.add(M(extrude(canopy, 0.02, 0.01, 24), treeM, { x: -0.45, y: 1.18, z: 0.11 }));
    for(let i = 0; i <= 10; i++){
      const a = Math.PI * (0.02 + 0.96 * i / 10);
      const r = 1.25, cx = Math.cos(a) * r, cy = 1.25 + Math.sin(a) * r;
      const L = 0.42 + (i % 3) * 0.08;
      g.add(M(extrude(leafShape(L, L * 0.36), 0.015, 0.008, 10), mat(p.leaves[i % 3], { rough: 0.7 }),
        { x: cx * 1.02, y: cy - 0.05, z: 0.1 + (i % 2) * 0.03, rz: a - Math.PI / 2 + (i % 2 ? 0.35 : -0.35) }));
    }
    [[-1.3, 0.05, 1.9], [-1.2, 0.05, 2.3], [1.3, 0.05, -1.9], [1.22, 0.05, -2.4]].forEach(([x, y, rz], i) =>
      g.add(M(extrude(leafShape(0.6, 0.2), 0.015, 0.008, 10), mat(p.leaves[i % 3]), { x, y: y + 0.05, z: 0.12, rz })));
    return g;
  },

  construction(p){
    const g = grp();
    g.add(M(rbox(2.6, 1.85, 0.06, 0.02), mat(p.mortar), { y: 1.0 }));
    g.add(M(new THREE.PlaneGeometry(2.5, 1.75), texMat("brick", TEX.brick(p.color, p.mortar, [3, 2.4]), { rough: 0.9 }), { y: 1.0, z: 0.032 }));
    const hz = texMat("hazard", TEX.hazard(p.stripe, "#22252D"), { rough: 0.55 });
    g.add(M(box(2.8, 0.16, 0.1), hz, { y: 2.0 }));
    g.add(M(box(2.8, 0.16, 0.1), hz, { y: 0.05 }));
    g.add(M(box(0.16, 2.1, 0.1), hz, { x: -1.32, y: 1.02, rz: 0 }));
    const craneM = mat(p.crane, { rough: 0.45 });
    g.add(M(box(0.14, 3.05, 0.14), craneM, { x: 1.55, y: 1.52 }));
    for(let i = 0; i < 7; i++) g.add(M(box(0.03, 0.2, 0.15), mat("#22252D"), { x: 1.55, y: 0.25 + i * 0.4, rz: 0.6 }));
    g.add(M(box(2.0, 0.12, 0.12), craneM, { x: 0.75, y: 3.0 }));
    g.add(M(box(0.5, 0.14, 0.14), craneM, { x: 1.95, y: 3.0 }));
    g.add(M(box(0.24, 0.24, 0.22), mat("#5A5E66"), { x: 2.05, y: 2.86 }));
    g.add(M(cyl(0.008, 0.008, 0.55, 6), mat("#22252D"), { x: -0.05, y: 2.67 }));
    g.add(M(rbox(0.5, 0.26, 0.06, 0.03), hz, { x: -0.05, y: 2.27 }));
    return g;
  },

  floral(p){
    const g = grp();
    const s = archShape(2.5, 2.45);
    const holes = [[-0.65, 0.55], [0, 0.85], [0.65, 0.55], [-0.65, 1.3], [0.65, 1.3], [0, 1.65], [-0.32, 2.05], [0.32, 2.05]];
    holes.forEach(([x, y], i) => s.holes.push(flowerOutline(new THREE.Path(), x, y, i === 1 ? 0.27 : 0.2)));
    g.add(M(extrude(s, 0.06, 0.02, 40), mat(p.color, { rough: 0.6 })));
    if(p.backdrop) g.add(M(extrude(archShape(2.3, 2.3), 0.03, 0.01, 40), mat(p.backdrop, { rough: 0.85 }), { y: 0.05, z: -0.09 }));
    const trim = archShape(2.62, 2.51);
    trim.holes.push(new THREE.Path(archShape(2.48, 2.44).getPoints(seg(40))));
    g.add(M(extrude(trim, 0.08, 0.012, 40), mat(p.trim, { rough: 0.5 })));
    const centers = mat("#FFD36E", { rough: 0.5 });
    [[-1.15, 2.05], [1.2, 1.7], [-1.22, 0.85], [1.22, 0.4], [0.0, 2.52]].forEach(([x, y], i) => {
      const f = flowerHead(0.17, p.flowers[i % p.flowers.length], centers);
      place(f, { x, y, z: 0.07 });
      g.add(f);
    });
    return g;
  },

  shell(p){
    const g = grp();
    const R = 1.6, a0 = 0.12 * Math.PI, a1 = 0.88 * Math.PI, ribs = 9;
    const s = new THREE.Shape(); s.moveTo(0, 0);
    const steps = ribs * 10;
    for(let i = 0; i <= steps; i++){
      const a = a0 + (a1 - a0) * i / steps, frac = (i % 10) / 10;
      const r = R * (0.93 + 0.07 * Math.sin(Math.PI * frac));
      s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.lineTo(0, 0);
    const shellM = mat(p.color, { pearl: true });
    g.add(M(extrude(s, 0.08, 0.035, 8), shellM, { y: 0.3 }));
    const ribM = mat(p.rib, { rough: 0.45 });
    for(let k = 1; k < ribs; k++){
      const a = a0 + (a1 - a0) * k / ribs, L = R * 0.86;
      g.add(M(rbox(0.05, L, 0.04, 0.02), ribM, { x: Math.cos(a) * L / 2, y: 0.3 + Math.sin(a) * L / 2, z: 0.07, rz: a - Math.PI / 2 }));
    }
    const ear = new THREE.Shape();
    ear.moveTo(-0.42, 0); ear.lineTo(0.42, 0); ear.lineTo(0.2, 0.34); ear.lineTo(-0.2, 0.34); ear.lineTo(-0.42, 0);
    g.add(M(extrude(ear, 0.09, 0.03), mat(p.rib, { rough: 0.5 })));
    g.add(M(sph(0.13), mat(p.pearl, { pearl: true }), { y: 0.36, z: 0.12 }));
    return g;
  },

  towers(p){
    const g = grp();
    const winM = mat(p.window, { rough: 0.7 });
    const wall = towerShape(2.5, 1.05, 6);
    g.add(M(extrude(wall, 0.06, 0.012), mat(p.alt, { rough: 0.75 }), { z: -0.12 }));
    const center = grp(
      M(extrude(towerShape(1.05, 2.05, 0), 0.08, 0.015), mat(p.color, { rough: 0.7 })),
      M(new THREE.ConeGeometry(0.66, 0.85, seg(32)), mat(p.roof, { rough: 0.5 }), { y: 2.47 }),
      M(cyl(0.012, 0.012, 0.35, 6), mat("#8A6BC2"), { y: 3.05 }),
      M(extrude(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.26, -0.08), new THREE.Vector2(0, -0.16)]), 0.01, 0.004), mat(p.flag, { double: true }), { y: 3.2, x: 0.01 }),
      M(extrude(archShape(0.42, 0.62), 0.03, 0.01, 20), winM, { y: 0.0, z: 0.05 }),
      M(extrude(archShape(0.2, 0.34), 0.03, 0.008, 16), winM, { x: -0.22, y: 1.35, z: 0.05 }),
      M(extrude(archShape(0.2, 0.34), 0.03, 0.008, 16), winM, { x: 0.22, y: 1.35, z: 0.05 }),
      M(extrude(new THREE.Shape().absarc(0, 0, 0.13, 0, Math.PI * 2), 0.03, 0.008, 24), mat(p.flag, { rough: 0.5 }), { y: 1.82, z: 0.05 })
    );
    g.add(center);
    [-1, 1].forEach((side) => {
      const t = grp(
        M(extrude(towerShape(0.78, 1.55, 3), 0.07, 0.015), mat(p.alt, { rough: 0.7 })),
        M(new THREE.ConeGeometry(0.46, 0.62, seg(28)), mat(p.roof, { rough: 0.5 }), { y: 2.08 }),
        M(extrude(archShape(0.18, 0.32), 0.03, 0.008, 16), winM, { y: 0.95, z: 0.045 })
      );
      place(t, { x: side * 1.05, z: 0.18, ry: -side * 0.32 });
      g.add(t);
    });
    return g;
  },

  curtain(p){
    const g = grp();
    g.add(M(extrude(rrShape(2.8, 2.35, 0.1), 0.05, 0.015), mat(p.color, { rough: 0.85 }), { z: -0.1 }));
    const frameM = mat(p.frame, { rough: 0.35, metal: 0.35 });
    g.add(M(rbox(0.16, 2.45, 0.14, 0.04), frameM, { x: -1.42, y: 1.22 }));
    g.add(M(rbox(0.16, 2.45, 0.14, 0.04), frameM, { x: 1.42, y: 1.22 }));
    g.add(M(rbox(3.04, 0.16, 0.14, 0.04), frameM, { y: 2.42 }));
    const curtM = mat(p.curtain, { rough: 0.75, double: true });
    [-1, 1].forEach((side) => g.add(new THREE.Mesh(curtainGeo(side, 1.35, 2.15), curtM)));
    const val = new THREE.Shape();
    val.moveTo(-1.36, 0.32); val.lineTo(1.36, 0.32); val.lineTo(1.36, 0);
    const sc = 7, sw = 2.72 / sc;
    for(let i = 0; i < sc; i++){ const x0 = 1.36 - i * sw; val.quadraticCurveTo(x0 - sw / 2, -0.22, x0 - sw, 0); }
    val.lineTo(-1.36, 0.32);
    g.add(M(extrude(val, 0.06, 0.02, 12), mat(p.valance, { rough: 0.7 }), { y: 2.0, z: 0.12 }));
    [-1, 1].forEach((side) => g.add(M(torus(0.07, 0.022, 8, 20), frameM, { x: side * 1.03, y: 0.85, z: 0.12 })));
    return g;
  },

  rainbow(p){
    const g = grp();
    const R0 = 1.45, bw = 0.16;
    p.colors.forEach((c, i) => {
      g.add(M(extrude(bandShape(R0 - i * bw, R0 - (i + 1) * bw + 0.005), 0.16, 0.02, 48), mat(c, { rough: 0.55 }), { y: 0.3 }));
    });
    [-1, 1].forEach((side) => { const c = cloudCluster(0.42, p.cloud); place(c, { x: side * 1.05, y: 0.02, z: 0.1 }); g.add(c); });
    return g;
  }
};

function curtainGeo(side, cw, ch){
  const geo = new THREE.PlaneGeometry(cw, ch, seg(40), 10);
  const p = geo.attributes.position;
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i), y = p.getY(i);
    const u = (x + cw / 2) / cw, v = (y + ch / 2) / ch;
    const tie = 0.38;
    const gth = v >= tie ? 0.4 + 0.6 * Math.pow((v - tie) / (1 - tie), 1.4) : 0.4 + (tie - v) * 0.75;
    const edge = side < 0 ? -1.34 : 1.34;
    const nx = edge - side * u * cw * gth;
    const nz = 0.07 * Math.sin(u * Math.PI * 7) * (0.5 + 0.5 * gth) + 0.06;
    p.setXYZ(i, nx, y + ch / 2 + 0.08, nz);
  }
  geo.computeVertexNormals();
  return geo;
}

/* =========================================================
   PEDESTAIS — origem no centro da base
   ========================================================= */
const PEDESTALS = {
  plain(p){
    const g = grp(M(cyl(p.r, p.r, p.h, 40), mat(p.color, { rough: 0.5 }), { y: p.h / 2 }));
    g.add(M(torus(p.r * 0.98, 0.018, 8, 40), mat(shade(p.color, 0.08), { rough: 0.4 }), { y: p.h, rx: Math.PI / 2 }));
    return { obj: g, top: p.h };
  },
  rocket(p){
    const g = grp();
    g.add(M(cyl(p.r, p.r * 1.02, p.h, 36), mat(p.color, { rough: 0.35 }), { y: p.h / 2 }));
    g.add(M(cyl(p.r * 1.04, p.r * 1.04, 0.08, 36), mat(p.trim, { rough: 0.4 }), { y: 0.12 }));
    g.add(M(new THREE.ConeGeometry(p.r * 1.0, p.r * 1.5, seg(36)), mat(p.trim, { rough: 0.4 }), { y: p.h + p.r * 0.75 }));
    const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(p.r * 0.7, -0.05); fin.lineTo(p.r * 0.75, 0.05); fin.lineTo(0, p.r * 1.3); fin.lineTo(0, 0);
    for(let k = 0; k < 3; k++){
      const a = k / 3 * Math.PI * 2 + Math.PI / 6;
      g.add(M(extrude(fin, 0.03, 0.01, 6), mat(p.trim, { rough: 0.4 }), { x: Math.sin(a) * p.r * 0.95, z: Math.cos(a) * p.r * 0.95, y: 0.06, ry: a - Math.PI / 2 }));
    }
    g.add(M(cyl(p.r * 0.34, p.r * 0.34, 0.04, 24), mat(p.window, { rough: 0.15, glow: 0.15 }), { y: p.h * 0.68, z: p.r * 0.99, rx: Math.PI / 2 }));
    g.add(M(torus(p.r * 0.36, 0.022, 8, 24), mat("#C9CED8", { metal: 0.6, rough: 0.3 }), { y: p.h * 0.68, z: p.r * 1.01 }));
    return { obj: g, top: p.h + p.r * 1.5 };
  },
  rock(p){
    const geo = new THREE.CylinderGeometry(p.r * 0.9, p.r * 1.06, p.h, 9, 3);
    displace(geo, (v) => {
      const n = hash3(Math.round(v.x * 100), Math.round(v.y * 100), Math.round(v.z * 100));
      const k = 1 + (n - 0.5) * 0.2;
      v.x *= k; v.z *= k;
      if(Math.abs(v.y - p.h / 2) < 1e-4) v.y += (n - 0.5) * 0.05;
    });
    const g = grp(M(geo, mat(p.color, { flat: true, rough: 0.95 }), { y: p.h / 2 }));
    const rnd = rng(Math.round(p.h * 100));
    for(let i = 0; i < 3; i++){
      const a = rnd() * Math.PI * 2, s = 0.05 + rnd() * 0.05;
      g.add(M(new THREE.DodecahedronGeometry(s, 0), mat(shade(p.color, -0.08), { flat: true, rough: 0.95 }), { x: Math.cos(a) * p.r * 1.25, y: s * 0.6, z: Math.sin(a) * p.r * 1.25, ry: a }));
    }
    return { obj: g, top: p.h + 0.02 };
  },
  tire(p){
    const g = grp();
    const tireM = mat(p.color, { rough: 0.85 });
    const t = p.r * 0.3, n = Math.max(2, Math.round(p.h / (t * 2.05)));
    const step = p.h / n;
    for(let i = 0; i < n; i++) g.add(M(torus(p.r - t, t, 12, 32), tireM, { y: step * i + step / 2, rx: Math.PI / 2, s: [1, 1, step / (t * 2)] }));
    g.add(M(cyl(p.r - t, p.r - t, p.h, 24), mat("#3A3E48", { rough: 0.8 }), { y: p.h / 2 }));
    g.add(M(cyl(p.r * 0.92, p.r * 0.92, 0.04, 32), mat(p.cap, { rough: 0.4 }), { y: p.h + 0.02 }));
    g.add(M(cyl(p.r * 0.3, p.r * 0.3, 0.02, 20), mat("#E6E8EE", { metal: 0.5, rough: 0.3 }), { y: p.h + 0.05 }));
    return { obj: g, top: p.h + 0.06 };
  },
  wood(p){
    const woodM = texMat("wood" + p.color, TEX.wood(p.color), { rough: 0.75 });
    const g = grp(M(cyl(p.r, p.r, p.h, 36), woodM, { y: p.h / 2 }));
    g.add(M(cyl(p.r * 1.02, p.r * 1.02, 0.03, 36), mat(shade(p.color, -0.12), { rough: 0.7 }), { y: p.h - 0.015 }));
    return { obj: g, top: p.h };
  },
  stripes(p){
    const g = grp(M(cyl(p.r, p.r, p.h, 36), mat(p.color, { rough: 0.45 }), { y: p.h / 2 }));
    g.add(M(cyl(p.r * 1.012, p.r * 1.012, 0.14, 36, true), texMat("hazardband", TEX.hazard(p.color, "#22252D"), { rough: 0.45 }), { y: p.h - 0.16 }));
    return { obj: g, top: p.h };
  },
  fluted(p){
    const geo = new THREE.CylinderGeometry(p.r, p.r, p.h, seg(72), 1);
    displace(geo, (v) => {
      const rr = Math.hypot(v.x, v.z);
      if(rr < 1e-4) return;
      const k = 1 + 0.06 * Math.cos(Math.atan2(v.z, v.x) * 14);
      v.x *= k; v.z *= k;
    });
    const m = mat(p.color, { rough: 0.5 });
    const g = grp(M(geo, m, { y: p.h / 2 }));
    g.add(M(cyl(p.r * 1.12, p.r * 1.12, 0.05, 40), mat(shade(p.color, 0.06), { rough: 0.45 }), { y: p.h + 0.025 }));
    g.add(M(cyl(p.r * 1.12, p.r * 1.16, 0.06, 40), mat(shade(p.color, 0.06), { rough: 0.45 }), { y: 0.03 }));
    return { obj: g, top: p.h + 0.05 };
  },
  pearl(p){
    const g = grp(M(cyl(p.r, p.r * 1.04, p.h, 40), mat(p.color, { pearl: true }), { y: p.h / 2 }));
    const pm = mat("#FFFDF8", { pearl: true });
    const n = 16;
    for(let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2;
      g.add(M(sph(p.r * 0.1, 12, 10), pm, { x: Math.cos(a) * p.r, z: Math.sin(a) * p.r, y: p.h }));
    }
    return { obj: g, top: p.h + 0.01 };
  },
  tutu(p){
    const g = grp(M(cyl(p.r, p.r, p.h, 40), mat(p.color, { rough: 0.5 }), { y: p.h / 2 }));
    const tulle = new THREE.CylinderGeometry(p.r * 1.03, p.r * 1.65, 0.22, seg(48), 2, true);
    displace(tulle, (v) => { const a = Math.atan2(v.z, v.x); const k = 1 + 0.06 * Math.sin(a * 16) * (0.5 - v.y / 0.22); v.x *= k; v.z *= k; });
    g.add(M(tulle, mat(p.tulle, { opacity: 0.82, double: true, rough: 0.9 }), { y: p.h - 0.11 }));
    g.add(M(torus(p.r * 1.02, 0.02, 8, 40), mat("#FFFFFF", { rough: 0.3 }), { y: p.h - 0.01, rx: Math.PI / 2 }));
    return { obj: g, top: p.h };
  }
};

/* =========================================================
   MESAS — origem no centro do piso; retorna topo
   ========================================================= */
const TABLES = {
  cabinet(t){
    const g = grp(M(rbox(t.w, t.h - 0.05, t.d, 0.04), mat(t.color, { rough: 0.55 }), { y: (t.h - 0.05) / 2 }));
    g.add(M(rbox(t.w + 0.08, 0.05, t.d + 0.08, 0.02), mat(t.trim, { rough: 0.35, metal: 0.3 }), { y: t.h - 0.025 }));
    const sm = mat(t.trim, { glow: 0.2, rough: 0.4 });
    [-0.5, 0, 0.5].forEach((x, i) => g.add(M(extrude(starShape(0.07 + (i === 1 ? 0.03 : 0)), 0.015, 0.005, 4), sm, { x: x * t.w * 0.75, y: t.h * 0.45, z: t.d / 2 + 0.01 })));
    return { obj: g, top: t.h };
  },
  rustic(t){
    const g = grp();
    const wm = texMat("woodtable" + t.color, TEX.wood(t.color), { rough: 0.8 });
    const pw = t.d / 3;
    for(let i = 0; i < 3; i++) g.add(M(rbox(t.w, 0.07, pw - 0.015, 0.015), wm, { y: t.h - 0.035, z: -t.d / 2 + pw * (i + 0.5) }));
    const legM = mat(shade(t.color, -0.15), { rough: 0.9 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(M(cyl(0.05, 0.06, t.h - 0.07, 10), legM, { x: sx * (t.w / 2 - 0.12), z: sz * (t.d / 2 - 0.1), y: (t.h - 0.07) / 2 })));
    g.add(M(box(t.w - 0.2, 0.05, 0.05), legM, { y: 0.2 }));
    return { obj: g, top: t.h };
  },
  podium(t){
    const g = grp();
    const bw = t.w / 3;
    const steps = [{ x: 0, h: t.h, n: 1, c: t.colors[0] }, { x: -bw, h: t.h * 0.72, n: 2, c: t.colors[1] }, { x: bw, h: t.h * 0.55, n: 3, c: t.colors[2] }];
    steps.forEach((s) => {
      g.add(M(rbox(bw - 0.02, s.h, t.d, 0.03), mat(s.c, { rough: 0.4, metal: 0.15 }), { x: s.x, y: s.h / 2 }));
      g.add(M(new THREE.PlaneGeometry(0.3, 0.3), texMat("digit" + s.n, TEX.digit(s.n), { alpha: true }), { x: s.x, y: s.h * 0.55, z: t.d / 2 + 0.005 }));
    });
    return { obj: g, top: t.h };
  },
  workbench(t){
    const g = grp();
    const wm = texMat("woodbench" + t.color, TEX.wood(t.color), { rough: 0.75 });
    g.add(M(rbox(t.w, 0.08, t.d, 0.02), wm, { y: t.h - 0.04 }));
    g.add(M(rbox(t.w - 0.12, 0.05, t.d - 0.1, 0.015), wm, { y: 0.22 }));
    const fm = mat(t.frame, { rough: 0.4, metal: 0.5 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(M(box(0.06, t.h - 0.08, 0.06), fm, { x: sx * (t.w / 2 - 0.06), z: sz * (t.d / 2 - 0.06), y: (t.h - 0.08) / 2 })));
    g.add(M(box(t.w - 0.1, 0.1, 0.012), texMat("hazard", TEX.hazard("#F4B93F", "#22252D"), { rough: 0.55 }), { y: t.h - 0.13, z: t.d / 2 - 0.02 }));
    return { obj: g, top: t.h };
  },
  rect(t){
    const g = grp(M(rbox(t.w, 0.07, t.d, 0.025), mat(t.color, { rough: 0.6 }), { y: t.h - 0.035 }));
    g.add(M(box(t.w - 0.12, 0.1, t.d - 0.12), mat(t.trim, { rough: 0.6 }), { y: t.h - 0.12 }));
    const lm = mat(t.trim, { rough: 0.6 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(M(cyl(0.035, 0.025, t.h - 0.07, 10), lm, { x: sx * (t.w / 2 - 0.1), z: sz * (t.d / 2 - 0.09), y: (t.h - 0.07) / 2 })));
    return { obj: g, top: t.h };
  },
  oval(t){
    const g = grp();
    g.add(M(cyl(0.5, 0.5, 0.06, 48), mat(t.color, { rough: 0.45 }), { y: t.h - 0.03, s: [t.w, 1, t.d] }));
    g.add(M(cyl(0.5, 0.53, t.h - 0.06, 48, true), mat(t.color, { rough: 0.7, double: true }), { y: (t.h - 0.06) / 2, s: [t.w * 0.98, 1, t.d * 0.98] }));
    g.add(M(torus(0.5, 0.025, 8, 48), mat(t.trim, { rough: 0.4 }), { y: t.h - 0.06, rx: Math.PI / 2, s: [t.w, t.d, 1] }));
    g.add(M(torus(0.53, 0.02, 8, 48), mat(t.trim, { rough: 0.4 }), { y: 0.03, rx: Math.PI / 2, s: [t.w * 0.98, t.d * 0.98, 1] }));
    return { obj: g, top: t.h };
  },
  wavy(t){
    const g = grp();
    const r = t.w / 2;
    g.add(M(cyl(r, r, 0.06, 48), mat(t.trim, { rough: 0.45 }), { y: t.h - 0.03 }));
    const skirt = new THREE.CylinderGeometry(r * 1.0, r * 1.08, t.h - 0.06, seg(80), 6, true);
    const sh = t.h - 0.06;
    displace(skirt, (v) => {
      const a = Math.atan2(v.z, v.x), tt = 0.5 - v.y / sh;
      const k = 1 + tt * 0.07 * Math.sin(a * 9);
      v.x *= k; v.z *= k;
      v.y -= tt * tt * 0.05 * (1 + Math.sin(a * 9));
    });
    g.add(M(skirt, mat(t.color, { rough: 0.6, double: true }), { y: sh / 2 + 0.06 }));
    return { obj: g, top: t.h };
  },
  round(t){
    const g = grp();
    const r = t.w / 2;
    g.add(M(cyl(r, r, 0.05, 48), mat(t.color, { rough: 0.55 }), { y: t.h - 0.025 }));
    g.add(M(cyl(r * 1.02, r * 1.12, t.h - 0.05, 48, true), mat(t.color, { rough: 0.7, double: true }), { y: (t.h - 0.05) / 2 }));
    g.add(M(cyl(r * 1.03, r * 1.06, 0.12, 48, true), mat(t.trim, { rough: 0.5, double: true }), { y: t.h - 0.1 }));
    return { obj: g, top: t.h };
  },
  sweets(t){
    const g = grp(M(rbox(t.w, 0.05, t.d, 0.02), mat(t.color, { rough: 0.55 }), { y: t.h - 0.025 }));
    g.add(M(box(t.w - 0.02, t.h - 0.05, t.d - 0.02), mat(t.color, { rough: 0.7 }), { y: (t.h - 0.05) / 2 }));
    const tm = mat(t.trim, { rough: 0.5 });
    const n = 9, sw = t.w / n;
    for(let i = 0; i < n; i++) g.add(M(sph(sw * 0.5, 16, 8), tm, { x: -t.w / 2 + sw * (i + 0.5), y: t.h - 0.08, z: t.d / 2 - 0.02, s: [1, 0.7, 0.35] }));
    g.add(M(box(t.w + 0.01, 0.05, t.d + 0.01), tm, { y: 0.025 }));
    return { obj: g, top: t.h };
  },
  rounded(t){
    const g = grp(M(rbox(t.w, t.h, t.d, 0.14), mat(t.color, { rough: 0.45 }), { y: t.h / 2 }));
    g.add(M(rbox(t.w + 0.01, 0.06, t.d + 0.01, 0.03), mat(t.trim, { rough: 0.5 }), { y: 0.08 }));
    return { obj: g, top: t.h };
  }
};

/* =========================================================
   ACESSÓRIOS — origem na base (apoiados em y=0)
   ========================================================= */
function flowerHead(s, color, centerM){
  const g = grp(M(sph(s * 0.32, 14, 10), centerM, { z: s * 0.08 }));
  const pm = mat(color, { rough: 0.55 });
  for(let i = 0; i < 5; i++){
    const a = i / 5 * Math.PI * 2;
    g.add(M(sph(s * 0.38, 14, 10), pm, { x: Math.cos(a) * s * 0.52, y: Math.sin(a) * s * 0.52, s: [1, 1, 0.38] }));
  }
  return g;
}
function cloudCluster(s, color = "#FFFFFF"){
  const m = mat(color, { rough: 0.95 });
  const g = grp();
  [[0, 0.55, 0, 0.55], [0.55, 0.38, 0.05, 0.42], [-0.55, 0.36, 0.05, 0.4], [0.25, 0.78, 0, 0.38], [-0.28, 0.72, 0.08, 0.36], [0, 0.4, 0.3, 0.38], [0.9, 0.28, 0, 0.26], [-0.88, 0.26, 0, 0.25]]
    .forEach(([x, y, z, r]) => g.add(M(sph(r * s, 20, 14), m, { x: x * s, y: y * s, z: z * s })));
  return g;
}
function candle(color){
  return grp(M(cyl(0.012, 0.012, 0.1, 8), mat(color)), M(sph(0.018, 8, 6), mat("#FFC45C", { glow: 0.8 }), { y: 0.07 }));
}

const TOPPERS = {
  planet: (c) => grp(M(sph(0.06), mat(c)), M(torus(0.09, 0.008, 6, 24), mat("#FFFFFF"), { rx: 1.2 })),
  egg: (c) => M(sph(0.055), mat("#F2E6D6"), { s: [1, 1.3, 1] }),
  leaf: (c) => M(extrude(leafShape(0.16, 0.06), 0.01, 0.005, 8), mat(c), { y: -0.05 }),
  flower: (c) => flowerHead(0.11, c, mat("#FFD36E")),
  shell: (c) => grp(M(sph(0.07, 16, 8, 0), mat(c, { pearl: true }), { s: [1, 0.8, 0.4] })),
  crown: (c) => {
    const s = new THREE.Shape(); s.moveTo(-0.09, 0); s.lineTo(0.09, 0); s.lineTo(0.1, 0.1); s.lineTo(0.05, 0.05); s.lineTo(0, 0.12); s.lineTo(-0.05, 0.05); s.lineTo(-0.1, 0.1); s.lineTo(-0.09, 0);
    return grp(M(extrude(s, 0.03, 0.008, 4), mat(c, { metal: 0.6, rough: 0.3 }), { y: -0.03 }));
  },
  bow: (c) => bowObj(0.09, c),
  cloud: (c) => place(cloudCluster(0.09, c), { y: -0.05 })
};

function bowObj(s, color){
  const m = mat(color, { rough: 0.45 });
  const g = grp(M(sph(s * 0.22, 14, 10), m));
  [-1, 1].forEach((side) => {
    g.add(M(torus(s * 0.32, s * 0.12, 10, 20), m, { x: side * s * 0.38, rz: side * 0.25, s: [1.1, 0.7, 0.6] }));
    g.add(M(box(s * 0.16, s * 0.55, s * 0.05), m, { x: side * s * 0.16, y: -s * 0.36, rz: side * 0.35 }));
  });
  return g;
}

const ACCESSORIES = {
  cake(a){
    const g = grp(M(cyl(0.26, 0.26, 0.02, 32), mat("#FFFFFF", { rough: 0.3 }), { y: 0.01 }));
    const t1 = mat(a.tiers[0], { rough: 0.55 }), t2 = mat(a.tiers[1], { rough: 0.55 });
    g.add(M(cyl(0.2, 0.2, 0.16, 36), t1, { y: 0.1 }));
    g.add(M(torus(0.2, 0.018, 8, 36), t2, { y: 0.18, rx: Math.PI / 2 }));
    g.add(M(cyl(0.135, 0.135, 0.13, 32), t2, { y: 0.245 }));
    g.add(M(torus(0.135, 0.014, 8, 32), t1, { y: 0.31, rx: Math.PI / 2 }));
    const top = (TOPPERS[a.topper] || candle)(a.color);
    place(top, { y: 0.39 });
    g.add(top);
    return g;
  },
  planet(a){
    const g = grp(M(sph(a.r, 32, 20), mat(a.color, { rough: 0.55 }), { y: a.r }));
    if(a.ring) g.add(M(torus(a.r * 1.55, a.r * 0.09, 6, 40), mat(a.ring, { rough: 0.4 }), { y: a.r, rx: Math.PI / 2 - 0.4, rz: 0.3, s: [1, 1, 0.35] }));
    return g;
  },
  star(a){
    return grp(M(extrude(starShape(a.s), a.s * 0.25, a.s * 0.08, 4), mat(a.color, { glow: 0.25, rough: 0.35, metal: 0.2 }), { y: a.s }));
  },
  balloon(a){
    const g = grp();
    const m = mat(a.color, { rough: 0.25 });
    g.add(M(sph(0.2, 24, 18), m, { y: a.h, s: [1, 1.15, 1] }));
    g.add(M(new THREE.ConeGeometry(0.03, 0.05, 8), m, { y: a.h - 0.245, rx: Math.PI }));
    g.add(M(cyl(0.004, 0.004, a.h - 0.26, 4), mat("#C9CED8"), { y: (a.h - 0.26) / 2 }));
    g.add(M(rbox(0.08, 0.06, 0.08, 0.02), mat(shade(a.color, -0.12)), { y: 0.03 }));
    return g;
  },
  egg(a){
    const g = grp(M(sph(a.s, 28, 20), mat(a.color, { rough: 0.5 }), { y: a.s * 1.3, s: [1, 1.3, 1] }));
    const sm = mat(a.spots, { rough: 0.5 });
    const dirs = [[0.6, 0.4, 0.7], [-0.7, 0.1, 0.7], [0.1, -0.2, 1], [0.9, -0.3, 0.3], [-0.3, 0.7, 0.6], [-0.9, -0.4, 0.2]];
    dirs.forEach(([x, y, z]) => {
      const d = new THREE.Vector3(x, y, z).normalize();
      const spot = M(sph(a.s * 0.2, 10, 8), sm, { s: [1, 1, 0.3] });
      spot.position.set(d.x * a.s * 0.97, a.s * 1.3 + d.y * a.s * 1.3 * 0.97, d.z * a.s * 0.97);
      spot.lookAt(spot.position.clone().add(d));
      g.add(spot);
    });
    return g;
  },
  footprint(a){
    const m = mat(a.color, { rough: 0.9 });
    const g = grp(M(cyl(0.5, 0.5, 0.02, 20), m, { s: [a.s * 0.9, 1, a.s * 1.1], y: 0.01 }));
    [-0.55, 0, 0.55].forEach((x, i) => g.add(M(cyl(0.5, 0.5, 0.02, 14), m, { x: x * a.s * 0.75, z: -a.s * (i === 1 ? 0.95 : 0.78), y: 0.01, s: [a.s * 0.28, 1, a.s * 0.5], ry: x * 0.6 })));
    g.rotation.y = a.ry || 0;
    return g;
  },
  palm(a){
    const g = grp();
    const tm = mat(a.color, { rough: 0.85 });
    const n = 7, sh = a.h / n;
    for(let i = 0; i < n; i++) g.add(M(cyl(0.06 - i * 0.004, 0.075 - i * 0.004, sh * 1.02, 10), tm, { x: Math.sin(i * 0.25) * 0.1, y: sh * (i + 0.5), rz: -0.04 }));
    const lm = mat(a.leaf, { rough: 0.7, double: true });
    const topX = Math.sin(n * 0.25) * 0.1;
    for(let k = 0; k < 7; k++){
      const ang = k / 7 * Math.PI * 2;
      const leaf = M(extrude(leafShape(0.75, 0.2), 0.012, 0.006, 10), lm);
      const pivot = grp(leaf);
      leaf.rotation.x = -Math.PI / 2 + 0.55;
      place(pivot, { x: topX, y: a.h, ry: ang });
      g.add(pivot);
    }
    g.add(M(sph(0.08, 12, 10), mat("#7A5534"), { x: topX, y: a.h - 0.02 }));
    return g;
  },
  bush(a){
    const m = mat(a.color, { rough: 0.85 });
    const m2 = mat(shade(a.color, -0.08), { rough: 0.85 });
    return grp(
      M(sph(a.s * 0.6, 18, 12), m, { y: a.s * 0.45 }),
      M(sph(a.s * 0.45, 16, 12), m2, { x: a.s * 0.5, y: a.s * 0.33 }),
      M(sph(a.s * 0.42, 16, 12), m2, { x: -a.s * 0.5, y: a.s * 0.3, z: a.s * 0.1 }),
      M(sph(a.s * 0.38, 16, 12), m, { z: a.s * 0.4, y: a.s * 0.28 })
    );
  },
  flag(a){
    const g = grp(M(cyl(0.02, 0.022, a.h, 10), mat("#C9CED8", { metal: 0.6, rough: 0.3 }), { y: a.h / 2 }));
    g.add(M(sph(0.035, 10, 8), mat("#F4B93F", { metal: 0.5, rough: 0.3 }), { y: a.h + 0.02 }));
    const fg = new THREE.PlaneGeometry(0.62, 0.42, seg(18), 2);
    displace(fg, (v) => { v.z = Math.sin((v.x + 0.31) * 7) * 0.035 * ((v.x + 0.31) / 0.62); });
    fg.translate(0.31, 0, 0);
    g.add(M(fg, texMat("flag", TEX.checker(6, 4, "#1D2230", "#FFFFFF"), { double: true, rough: 0.6 }), { x: 0.02, y: a.h - 0.24 }));
    g.rotation.y = (a.ry || 0) + (a.mirror ? Math.PI : 0);
    return g;
  },
  cone(a){
    const s = a.s, m = mat(a.color, { rough: 0.5 });
    return grp(
      M(rbox(s * 0.95, s * 0.08, s * 0.95, s * 0.03), mat(shade(a.color, -0.12)), { y: s * 0.04 }),
      M(cyl(s * 0.07, s * 0.36, s * 1.2, 24), m, { y: s * 0.68 }),
      M(cyl(s * 0.17, s * 0.23, s * 0.2, 24, true), mat("#FFFFFF", { rough: 0.4 }), { y: s * 0.8 })
    );
  },
  "tire-stack"(a){
    const m = mat(a.color, { rough: 0.85 });
    return grp(
      M(torus(a.s * 0.7, a.s * 0.3, 10, 24), m, { y: a.s * 0.3, rx: Math.PI / 2 }),
      M(torus(a.s * 0.7, a.s * 0.3, 10, 24), m, { y: a.s * 0.88, rx: Math.PI / 2 }),
      M(cyl(a.s * 0.45, a.s * 0.45, a.s * 0.08, 20), mat("#E8402A"), { y: a.s * 1.2 })
    );
  },
  trophy(a){
    const s = a.s;
    const pts = [[0, 0], [0.5, 0], [0.5, 0.12], [0.18, 0.18], [0.1, 0.45], [0.12, 0.55], [0.5, 0.72], [0.62, 1.15], [0.58, 1.18], [0.46, 0.8], [0, 0.66]].map(([x, y]) => new THREE.Vector2(x * s, y * s));
    const g = grp(M(new THREE.LatheGeometry(pts, seg(32)), mat(a.color, { metal: 0.75, rough: 0.25 })));
    [-1, 1].forEach((side) => g.add(M(torus(s * 0.2, s * 0.04, 8, 16, Math.PI), mat(a.color, { metal: 0.75, rough: 0.25 }), { x: side * s * 0.6, y: s * 0.95, rz: side > 0 ? -Math.PI / 2 : Math.PI / 2 })));
    return g;
  },
  lion(a){
    const s = a.s, m = mat(a.color, { rough: 0.6 }), mane = mat(a.mane, { rough: 0.8 });
    const g = grp(
      M(sph(s * 0.55, 20, 16), m, { y: s * 0.5, z: -s * 0.1, s: [1, 0.95, 1.1] }),
      M(torus(s * 0.42, s * 0.2, 12, 24), mane, { y: s * 1.15, z: s * 0.12 }),
      M(sph(s * 0.42, 20, 16), m, { y: s * 1.15, z: s * 0.18 }),
      M(sph(s * 0.16, 14, 10), mat("#FFF1D6"), { y: s * 1.06, z: s * 0.52, s: [1.2, 0.85, 0.8] }),
      M(sph(s * 0.05, 10, 8), mat("#5A3A2A"), { y: s * 1.12, z: s * 0.62 })
    );
    [-1, 1].forEach((side) => {
      g.add(M(sph(s * 0.045, 8, 6), mat("#22252D"), { x: side * s * 0.15, y: s * 1.27, z: s * 0.55 }));
      g.add(M(sph(s * 0.12, 12, 8), mane, { x: side * s * 0.3, y: s * 1.5, z: s * 0.1 }));
      g.add(M(sph(s * 0.15, 12, 10), m, { x: side * s * 0.25, y: s * 0.12, z: s * 0.35, s: [1, 0.7, 1.2] }));
    });
    return g;
  },
  giraffe(a){
    const s = a.s;
    const sm = texMat("giraffe", TEX.spots(a.color, a.spots), { rough: 0.7 });
    const lm = mat(a.color, { rough: 0.7 });
    const g = grp(M(sph(s * 0.55, 22, 16), sm, { y: s * 1.35, s: [1.25, 0.8, 0.7] }));
    [[-0.38, -0.2], [0.38, -0.2], [-0.38, 0.2], [0.38, 0.2]].forEach(([x, z]) => g.add(M(cyl(s * 0.07, s * 0.06, s * 1.05, 10), lm, { x: x * s, z: z * s, y: s * 0.52 })));
    g.add(M(cyl(s * 0.1, s * 0.15, s * 1.4, 14), sm, { x: s * 0.42, y: s * 2.05, rz: -0.45 }));
    g.add(M(sph(s * 0.2, 16, 12), lm, { x: s * 0.78, y: s * 2.7, s: [1.4, 0.85, 0.85] }));
    [-1, 1].forEach((side) => {
      g.add(M(cyl(s * 0.02, s * 0.02, s * 0.18, 6), mat("#B7742E"), { x: s * 0.72, y: s * 2.92, z: side * s * 0.07 }));
      g.add(M(sph(s * 0.04, 8, 6), mat("#B7742E"), { x: s * 0.72, y: s * 3.02, z: side * s * 0.07 }));
      g.add(M(sph(s * 0.03, 8, 6), mat("#22252D"), { x: s * 0.86, y: s * 2.76, z: side * s * 0.12 }));
    });
    g.rotation.y = -0.5;
    return g;
  },
  elephant(a){
    const s = a.s, m = mat(a.color, { rough: 0.7 });
    const g = grp(
      M(sph(s * 0.6, 20, 16), m, { y: s * 0.65, s: [1.15, 0.9, 1] }),
      M(sph(s * 0.42, 20, 16), m, { y: s * 1.05, z: s * 0.5 })
    );
    const trunk = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, s * 0.95, s * 0.85), new THREE.Vector3(0, s * 0.65, s * 1.0), new THREE.Vector3(0, s * 0.4, s * 1.05), new THREE.Vector3(0, s * 0.45, s * 1.25)
    ]), seg(16), s * 0.1, seg(10), false);
    g.add(M(trunk, m));
    [-1, 1].forEach((side) => {
      g.add(M(cyl(s * 0.32, s * 0.32, s * 0.05, 20), mat(shade(a.color, 0.06), { rough: 0.7 }), { x: side * s * 0.42, y: s * 1.08, z: s * 0.35, rz: Math.PI / 2, ry: side * 0.4 }));
      g.add(M(sph(s * 0.045, 8, 6), mat("#22252D"), { x: side * s * 0.17, y: s * 1.2, z: s * 0.85 }));
      [-0.3, 0.3].forEach((z) => g.add(M(cyl(s * 0.14, s * 0.15, s * 0.4, 12), m, { x: side * s * 0.35, y: s * 0.2, z: z * s })));
    });
    g.rotation.y = -0.35;
    return g;
  },
  excavator(a){
    const s = a.s, m = mat(a.color, { rough: 0.45 }), dark = mat("#3A3E48", { rough: 0.8 });
    const g = grp();
    [-1, 1].forEach((side) => g.add(M(rbox(s * 1.3, s * 0.32, s * 0.3, s * 0.14), dark, { z: side * s * 0.38, y: s * 0.16 })));
    g.add(M(rbox(s * 1.05, s * 0.4, s * 0.85, s * 0.06), m, { y: s * 0.55 }));
    g.add(M(rbox(s * 0.5, s * 0.5, s * 0.6, s * 0.06), m, { x: -s * 0.2, y: s * 1.0 }));
    g.add(M(box(s * 0.04, s * 0.32, s * 0.5), mat("#AFD8F4", { rough: 0.1 }), { x: s * 0.06, y: s * 1.02 }));
    g.add(M(rbox(s * 0.85, s * 0.14, s * 0.14, s * 0.05), m, { x: s * 0.6, y: s * 1.05, rz: 0.55 }));
    g.add(M(rbox(s * 0.7, s * 0.12, s * 0.12, s * 0.05), m, { x: s * 1.1, y: s * 0.85, rz: -0.9 }));
    g.add(M(rbox(s * 0.3, s * 0.28, s * 0.36, s * 0.04), dark, { x: s * 1.3, y: s * 0.48, rz: 0.4 }));
    g.rotation.y = 0.5;
    return g;
  },
  truck(a){
    const s = a.s, m = mat(a.color, { rough: 0.45 }), dark = mat("#22252D", { rough: 0.85 });
    const g = grp(
      M(rbox(s * 1.5, s * 0.16, s * 0.6, s * 0.04), mat("#5A5E66"), { y: s * 0.3 }),
      M(rbox(s * 0.45, s * 0.5, s * 0.58, s * 0.08), m, { x: s * 0.52, y: s * 0.62 }),
      M(box(s * 0.02, s * 0.22, s * 0.46), mat("#AFD8F4", { rough: 0.1 }), { x: s * 0.75, y: s * 0.7 }),
      M(rbox(s * 0.95, s * 0.4, s * 0.62, s * 0.05), mat("#F4B93F", { rough: 0.5 }), { x: -s * 0.28, y: s * 0.62, rz: -0.18 })
    );
    [[-0.45, -1], [-0.45, 1], [0.5, -1], [0.5, 1]].forEach(([x, side]) => g.add(M(cyl(s * 0.17, s * 0.17, s * 0.12, 18), dark, { x: x * s, y: s * 0.17, z: side * s * 0.3, rx: Math.PI / 2 })));
    g.rotation.y = -0.45;
    return g;
  },
  helmet(a){
    const s = a.s, m = mat(a.color, { rough: 0.35 });
    return grp(
      M(new THREE.SphereGeometry(s * 0.5, seg(24), seg(12), 0, Math.PI * 2, 0, Math.PI / 2), m, { y: s * 0.06 }),
      M(cyl(s * 0.62, s * 0.62, s * 0.06, 28), m, { y: s * 0.06, s: [1, 1, 1.15] }),
      M(box(s * 0.12, s * 0.12, s * 0.9), m, { y: s * 0.46, s: [1, 0.6, 1] })
    );
  },
  butterfly(a){
    const s = a.s, wm = mat(a.color, { rough: 0.5, double: true }), wm2 = mat(shade(a.color, 0.12), { rough: 0.5, double: true });
    const g = grp(M(new THREE.CapsuleGeometry(s * 0.06, s * 0.5, 4, seg(10)), mat("#45577A"), { y: s * 0.3 }));
    const up = new THREE.Shape(); up.absellipse(0, 0, s * 0.42, s * 0.3, 0, Math.PI * 2);
    const lo = new THREE.Shape(); lo.absellipse(0, 0, s * 0.28, s * 0.22, 0, Math.PI * 2);
    [-1, 1].forEach((side) => {
      const w1 = grp(M(extrude(up, 0.006, 0.004, 20), wm, { x: side * s * 0.4, y: s * 0.15 }), M(extrude(lo, 0.006, 0.004, 16), wm2, { x: side * s * 0.28, y: -s * 0.22 }));
      place(w1, { y: s * 0.35, ry: side * 0.45 });
      g.add(w1);
      g.add(M(cyl(s * 0.008, s * 0.008, s * 0.3, 4), mat("#45577A"), { x: side * s * 0.06, y: s * 0.7, rz: -side * 0.35 }));
    });
    g.rotation.y = a.ry || 0;
    return g;
  },
  flower(a){
    const s = a.s;
    const g = grp(M(cyl(s * 0.05, s * 0.06, s * 1.6, 6), mat("#3AA76D"), { y: s * 0.8 }));
    g.add(M(extrude(leafShape(s * 0.6, s * 0.22), 0.01, 0.005, 8), mat("#7DD3AE"), { y: s * 0.45, rz: -0.8 }));
    const head = flowerHead(s, a.color, mat("#FFD36E", { rough: 0.5 }));
    place(head, { y: s * 1.65, rx: -0.35 });
    g.add(head);
    return g;
  },
  coral(a){
    const s = a.s, m = mat(a.color, { rough: 0.7 });
    const g = grp();
    const rnd = rng(Math.round(s * 1000));
    function branch(x, y, z, len, r, ang, tilt, depth){
      const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(ang), Math.cos(tilt), Math.sin(tilt) * Math.sin(ang));
      const end = new THREE.Vector3(x, y, z).addScaledVector(dir, len);
      const c = M(cyl(r * 0.75, r, len, 10), m);
      c.position.set((x + end.x) / 2, (y + end.y) / 2, (z + end.z) / 2);
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      g.add(c);
      g.add(M(sph(r * 0.8, 10, 8), m, { x: end.x, y: end.y, z: end.z }));
      if(depth > 0){
        const k = 2 + (rnd() > 0.5 ? 1 : 0);
        for(let i = 0; i < k; i++) branch(end.x, end.y, end.z, len * 0.68, r * 0.72, ang + (i - (k - 1) / 2) * 1.3 + rnd() * 0.5, tilt + 0.35 + rnd() * 0.25, depth - 1);
      }
    }
    branch(0, 0, 0, s * 0.5, s * 0.08, 0, 0.05, 2);
    return g;
  },
  starfish(a){
    return grp(M(extrude(starShape(a.s, a.s * 0.42), a.s * 0.12, a.s * 0.1, 6), mat(a.color, { rough: 0.8 }), { y: a.s * 0.12, rx: -Math.PI / 2 }));
  },
  bubble(a){
    return grp(M(sph(a.r, 24, 18), mat("#E8F8FF", { glass: true }), { y: a.r }));
  },
  slipper(a){
    const s = a.s, m = mat(a.color, { rough: 0.3 }), inner = mat(shade(a.color, -0.12), { rough: 0.7 });
    const g = grp();
    [-1, 1].forEach((side) => {
      const sh = grp(
        M(sph(s * 0.5, 22, 14), m, { y: s * 0.18, s: [0.45, 0.36, 1] }),
        M(cyl(s * 0.17, s * 0.17, s * 0.02, 18), inner, { y: s * 0.355, z: -s * 0.12, s: [1, 1, 1.6] }),
        M(torus(s * 0.24, s * 0.012, 6, 24), mat("#FFFFFF", { rough: 0.3 }), { y: s * 0.5, z: -s * 0.12, rx: 0.2 })
      );
      place(sh, { x: side * s * 0.26, ry: side * 0.18 });
      g.add(sh);
    });
    g.rotation.y = a.ry || 0;
    return g;
  },
  bow(a){ return grp(place(bowObj(a.s, a.color), { y: a.s * 0.5 })); },
  cupcake(a){
    const s = a.s;
    const g = grp(M(cyl(s * 0.5, s * 0.38, s * 0.55, 18), mat("#FFE29A", { rough: 0.6, flat: true }), { y: s * 0.275 }));
    const fm = mat(a.color, { rough: 0.5 });
    [0.5, 0.38, 0.24].forEach((r, i) => g.add(M(torus(s * r, s * 0.14, 10, 24), fm, { y: s * (0.62 + i * 0.17), rx: Math.PI / 2 })));
    g.add(M(sph(s * 0.12, 10, 8), mat("#E8402A", { rough: 0.3 }), { y: s * 1.12 }));
    return g;
  },
  cloud(a){ return cloudCluster(a.s, a.color || "#FFFFFF"); },
  drop(a){
    const m = mat(a.color, { rough: 0.2 });
    return grp(M(sph(a.s, 16, 12), m, { y: a.s }), M(new THREE.ConeGeometry(a.s * 0.85, a.s * 1.4, seg(16)), m, { y: a.s * 2.1 - a.s * 0.25 }));
  }
};

export const PART_TYPES = {
  panels: Object.keys(PANELS),
  pedestals: Object.keys(PEDESTALS),
  tables: Object.keys(TABLES),
  accessories: Object.keys(ACCESSORIES),
  toppers: Object.keys(TOPPERS)
};

/* =========================================================
   MONTAGEM DO KIT
   ========================================================= */
function mergeByMaterial(group){
  group.updateMatrixWorld(true);
  const buckets = new Map();
  const rawGeos = new Set();
  group.traverse((o) => {
    if(!o.isMesh) return;
    rawGeos.add(o.geometry);
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for(const k of Object.keys(g.attributes)) if(!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    if(!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if(!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    if(!buckets.has(o.material)) buckets.set(o.material, []);
    buckets.get(o.material).push(g);
  });
  const meshes = [];
  for(const [m, list] of buckets){
    const merged = mergeGeometries(list, false);
    list.forEach((g) => g.dispose());
    if(!merged) continue;
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, m);
    mesh.castShadow = !m.transparent;
    mesh.receiveShadow = true;
    meshes.push(mesh);
  }
  rawGeos.forEach((g) => g.dispose());
  return meshes;
}

function boxOf(obj){ obj.updateMatrixWorld(true); return new THREE.Box3().setFromObject(obj); }

export function buildKit(theme){
  if(kitCache.has(theme.slug)) return kitCache.get(theme.slug);
  const c = theme.composition;
  const raw = new THREE.Group();

  // Tablado (base de miniatura)
  const R = c.base.radius || 2.35;
  raw.add(M(cyl(R, R + 0.05, BASE_H - 0.02, 64), mat(c.base.color, { rough: 0.5 }), { y: (BASE_H - 0.02) / 2 }));
  raw.add(M(cyl(R - 0.05, R - 0.05, 0.02, 64), mat(c.base.top, { rough: 0.8 }), { y: BASE_H - 0.01 }));
  raw.add(M(torus(R + 0.02, 0.025, 8, 64), mat(shade(c.base.color, 0.1), { rough: 0.4 }), { y: BASE_H - 0.02, rx: Math.PI / 2 }));

  const panel = (PANELS[c.panel.type] || PANELS.arch)(c.panel);
  place(panel, { y: BASE_H, z: PZ });
  raw.add(panel);

  const pedestals = c.pedestals.map((p) => {
    const built = (PEDESTALS[p.style] || PEDESTALS.plain)(p);
    place(built.obj, { x: p.x, y: BASE_H, z: p.z });
    raw.add(built.obj);
    return { ...p, obj: built.obj, top: BASE_H + built.top };
  });

  const t = c.table;
  const table = (TABLES[t.style] || TABLES.rect)(t);
  place(table.obj, { x: t.x, y: BASE_H, z: t.z });
  raw.add(table.obj);
  const tableTop = BASE_H + table.top;

  let featured = null;
  const accs = (c.accessories || []).map((a) => {
    const builder = ACCESSORIES[a.type];
    if(!builder) return null;
    const obj = builder(a);
    let x = a.x || 0, y = a.y != null ? a.y : BASE_H, z = a.z || 0;
    if(a.on === "table"){ x = a.x ?? t.x; z = a.z ?? t.z; y = tableTop; }
    else if(a.on && a.on.startsWith("pedestal:")){
      const pd = pedestals[Number(a.on.split(":")[1])];
      if(pd){ x = pd.x; z = pd.z; y = pd.top; }
    }
    obj.position.set(x, y, z);
    raw.add(obj);
    if(a.feature && !featured) featured = obj;
    return obj;
  }).filter(Boolean);

  // Âncoras dos pontos de informação (coordenadas locais do kit)
  const pb = boxOf(panel);
  const tallest = pedestals.reduce((a, b) => (b.top > a.top ? b : a));
  const tb = boxOf(table.obj);
  const fb = boxOf(featured || accs[0] || table.obj);
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const outward = (x, z) => v3(x, 0, z + 1.2).normalize();
  const anchors = {
    panel: { pos: v3((pb.min.x + pb.max.x) / 2 * 0.3, pb.max.y - 0.35, pb.max.z), normal: v3(0, 0, 1) },
    pedestals: { pos: v3(tallest.x, tallest.top + 0.06, tallest.z), normal: outward(tallest.x, tallest.z) },
    table: { pos: v3((tb.min.x + tb.max.x) / 2, tb.max.y - 0.12, tb.max.z), normal: v3(0, 0, 1) },
    accessories: { pos: v3((fb.min.x + fb.max.x) / 2, fb.max.y, (fb.min.z + fb.max.z) / 2), normal: outward((fb.min.x + fb.max.x) / 2, (fb.min.z + fb.max.z) / 2) }
  };

  const root = new THREE.Group();
  root.name = theme.slug;
  mergeByMaterial(raw).forEach((m) => root.add(m));

  const blob = M(new THREE.PlaneGeometry(R * 2.9, R * 2.9), blobMat(), { y: 0.004, rx: -Math.PI / 2 });
  blob.renderOrder = -1;
  root.add(blob);

  const bounds = new THREE.Box3(v3(-R, 0, -R), v3(R, 3.2, R));
  root.userData = { anchors, bounds, slug: theme.slug };
  kitCache.set(theme.slug, root);
  return root;
}

let _blobMat = null;
function blobMat(){
  if(!_blobMat) _blobMat = new THREE.MeshBasicMaterial({ map: TEX.blob(), transparent: true, depthWrite: false, toneMapped: false });
  return _blobMat;
}

/* Libera tudo que o construtor alocou na GPU */
export function disposeBuilders(){
  kitCache.forEach((root) => root.traverse((o) => { if(o.isMesh) o.geometry.dispose(); }));
  kitCache.clear();
  matCache.forEach((m) => m.dispose());
  matCache.clear();
  texCache.forEach((t) => t.dispose());
  texCache.clear();
  if(_blobMat){ _blobMat.dispose(); _blobMat = null; }
}
