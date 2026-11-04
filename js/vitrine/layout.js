/* =========================================================
   Vitrine 3D — layout em perspectiva da galeria.
   Usado pela cena WebGL e pela versão em imagens (fallback),
   para que as duas se movam exatamente do mesmo jeito.
   d = posição relativa ao kit ativo (0 = centro, ±1 vizinhos…)
   ========================================================= */
export function slotFor(d, compact){
  const a = Math.abs(d), s = Math.sign(d);
  const near = Math.min(a, 1), far = Math.max(a - 1, 0);
  const spread = compact ? 2.7 : 3.35;
  const step = compact ? 1.25 : 1.85;
  return {
    x: s * (near * spread + far * step),
    z: -(near * 2.3 + far * 2.1),
    ry: -s * (near * 0.62 + Math.min(far, 2) * 0.1),
    scale: 1 - near * 0.2 - Math.min(far, 3) * 0.06,
    fade: Math.min(1, near * 0.35 + far * 0.25),
    visible: a < 3.6
  };
}

export const prefersReducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
