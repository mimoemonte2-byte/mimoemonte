/* =========================================================
   MIMO & MONTE — Vitrine 3D: interface e rotas
   - Toda navegação, textos e botões ficam em HTML.
   - O 3D (three.js) é carregado sob demanda; enquanto carrega,
     ou se faltar WebGL, a galeria funciona com imagens.
   - Rotas: /vitrine (galeria) e /vitrine/<tema> (página do
     tema). Também aceita vitrine.html?kit=<tema>.
   ========================================================= */
import { slotFor, prefersReducedMotion } from "./layout.js";

const THEMES = window.VITRINE_THEMES || [];
const AUD = window.VITRINE_AUDIENCES || {};
const reduced = prefersReducedMotion();
const params = new URLSearchParams(location.search);
const WEBGL = webglAvailable();
const BY_SLUG = new Map(THEMES.map((t) => [t.slug, t]));

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const posterOf = (t) => t.poster || `images/vitrine/${t.slug}.webp`;
const themeHref = (slug) => `/vitrine/${slug}`;

const el = {
  galleryView: $("#vt-gallery-view"), themeView: $("#vt-theme-view"),
  filters: $("#vt-filters"), modes: $("#vt-modes"),
  galleryBlock: $("#vt-gallery-block"), list: $("#vt-list"),
  stage: $("#vt-stage"), flow: $("#vt-flow"), host: $("#vt-canvas-host"), loading: $("#vt-loading"),
  prev: $("#vt-prev"), next: $("#vt-next"),
  aud: $("#vt-aud"), badges: $("#vt-badges"), title: $("#vt-title"), desc: $("#vt-desc"),
  explore: $("#vt-explore"), consult: $("#vt-consult"), pos: $("#vt-pos"), dots: $("#vt-dots"),
  status: $("#vt-status"), hint: $("#vt-hint")
};

const state = {
  filter: "todos", mode: "gallery", items: THEMES.slice(), index: 0, offset: 0,
  view: "gallery", kits: null, stageVisible: true
};
let g3d = null, threeState = "idle", viewer = null, viewerToken = 0;

/* ---------------------------------------------------------
   Dados comerciais (Supabase com fallback local — main.js)
--------------------------------------------------------- */
let kitsPromise = null;
const localKits = () => (typeof KITS !== "undefined" ? KITS : []);
function commercialKits(){
  if(state.kits) return Promise.resolve(state.kits);
  if(kitsPromise) return kitsPromise;
  const remote = (typeof loadKits === "function" ? loadKits() : Promise.resolve(localKits()))
    .then((k) => { state.kits = k && k.length ? k : localKits(); return state.kits; })
    .catch(() => { state.kits = localKits(); return state.kits; });
  // Se o Supabase demorar, usa o catálogo local (mesmo fallback do main.js)
  const slow = new Promise((res) => setTimeout(() => {
    if(!state.kits) state.kits = localKits();
    res(state.kits);
  }, 4000));
  kitsPromise = Promise.race([remote, slow]);
  remote.then(() => {
    if(state.view === "theme") renderConfirmed(BY_SLUG.get(currentSlug()));
    else{ syncInfo(false); renderList(); }
  });
  return kitsPromise;
}
function linkedKit(theme){
  const id = theme.commercial?.kitId;
  if(!id || !state.kits) return null;
  return state.kits.find((k) => k.id === id) || null;
}
function badgeHtml(theme){
  const k = linkedKit(theme);
  const confirmed = theme.commercial?.kitId && (state.kits ? !!k : true);
  let html = `<span class="vt-badge vt-badge--preview">Prévia 3D</span>`;
  if(confirmed){
    html += k && k.status !== "disponivel"
      ? `<span class="vt-badge vt-badge--off">Indisponível no momento</span>`
      : `<span class="vt-badge vt-badge--ok">Kit no acervo</span>`;
  }else html += `<span class="vt-badge vt-badge--ask">Sob consulta</span>`;
  return html;
}
function whatsMessage(theme){
  const k = linkedKit(theme);
  if(k){
    const price = typeof formatPrice === "function" ? ` (R$ ${formatPrice(k.price)})` : "";
    return `Olá! Vi o tema "${theme.name}" na Vitrine 3D da Mimo & Monte e tenho interesse no kit "${k.title}"${price}. Poderiam me ajudar a consultar a disponibilidade?`;
  }
  return `Olá! Vi o tema "${theme.name}" na Vitrine 3D da Mimo & Monte e gostaria de consultar a disponibilidade desse kit. 🎉`;
}
function reservaHref(theme){
  const id = theme.commercial?.kitId;
  return id && linkedKit(theme) ? `reserva.html?id=${encodeURIComponent(id)}&tema=${theme.slug}` : `reserva.html?tema=${theme.slug}`;
}
function refreshWhatsapp(){ if(typeof initWhatsappLinks === "function") initWhatsappLinks(); }

/* ---------------------------------------------------------
   Galeria: imagens em perspectiva (prévia e fallback)
--------------------------------------------------------- */
function renderFlow(){
  el.flow.innerHTML = state.items.map((t, i) => `
    <div class="vt-flow-item" data-index="${i}" style="--bg:${esc(t.stage?.bg || "#FFF6EC")}">
      <img src="${esc(posterOf(t))}" alt="" draggable="false" decoding="async" ${Math.abs(i - state.index) > 2 ? 'loading="lazy"' : ""}>
      <span class="vt-flow-fallback">${esc(t.name)}</span>
    </div>`).join("");
  $$("img", el.flow).forEach((img) => img.addEventListener("error", () => img.parentElement.classList.add("no-poster"), { once: true }));
  positionFlow();
}
function positionFlow(){
  const w = el.stage.clientWidth || 1, h = el.stage.clientHeight || 1;
  const compact = w / h < 1.05;
  // mesma largura visível usada pela câmera 3D (limitada pela altura do palco)
  const U = Math.min(w / (compact ? 5.4 : 7.6), h / 4.7);
  el.flow.style.perspective = `${Math.round(U * 11)}px`;
  const iw = U * 5.6, ih = iw * 0.75;
  $$(".vt-flow-item", el.flow).forEach((node) => {
    const i = Number(node.dataset.index);
    const s = slotFor(i - state.offset, compact);
    node.style.width = `${iw}px`;
    node.style.height = `${ih}px`;
    node.style.marginLeft = `${-iw / 2}px`;
    node.style.marginTop = `${-ih / 2}px`;
    node.style.transform = `translate3d(${(s.x * U).toFixed(1)}px, 0, ${(s.z * U).toFixed(1)}px) rotateY(${s.ry.toFixed(3)}rad) scale(${s.scale.toFixed(3)})`;
    node.style.opacity = s.visible ? String(1 - s.fade * 0.5) : "0";
    node.style.filter = `saturate(${(1 - s.fade * 0.35).toFixed(2)})`;
    node.style.zIndex = String(100 - Math.round(Math.abs(i - state.offset) * 10));
    node.style.visibility = s.visible ? "visible" : "hidden";
    node.classList.toggle("is-active", i === state.index);
  });
  const active = state.items[state.index];
  if(active) el.stage.style.setProperty("--stage-bg", active.stage?.bg || "#FFF6EC");
}

/* ---------------------------------------------------------
   Seleção e sincronização de textos/botões
--------------------------------------------------------- */
function go(i, { announce = true } = {}){
  const n = state.items.length;
  if(!n) return;
  i = Math.max(0, Math.min(n - 1, Math.round(i)));
  state.index = i;
  state.offset = i;
  if(g3d) g3d.setOffset(i);
  positionFlow();
  syncInfo(announce);
}
function syncInfo(announce){
  const t = state.items[state.index];
  if(!t) return;
  el.aud.textContent = AUD[t.audience] || "";
  el.aud.dataset.aud = t.audience;
  el.badges.innerHTML = badgeHtml(t);
  el.title.textContent = t.name;
  el.desc.textContent = t.short;
  el.explore.href = themeHref(t.slug);
  el.explore.setAttribute("aria-label", `Explorar kit ${t.name}`);
  el.consult.setAttribute("data-whatsapp", whatsMessage(t));
  el.consult.setAttribute("aria-label", `Consultar disponibilidade do kit ${t.name} pelo WhatsApp`);
  el.pos.textContent = `${String(state.index + 1).padStart(2, "0")} / ${String(state.items.length).padStart(2, "0")}`;
  el.prev.disabled = state.index === 0;
  el.next.disabled = state.index === state.items.length - 1;
  $$("button", el.dots).forEach((b, i) => { b.setAttribute("aria-current", i === state.index ? "true" : "false"); });
  refreshWhatsapp();
  if(announce) el.status.textContent = `${t.name}, ${state.index + 1} de ${state.items.length}. ${AUD[t.audience] || ""}.`;
}
function renderDots(){
  el.dots.innerHTML = state.items.map((t, i) => `<button type="button" data-go="${i}" aria-label="${esc(t.name)}" style="--dot:${esc(t.stage?.accent || "#F2664C")}"></button>`).join("");
}

/* ---------------------------------------------------------
   Filtros e modos (galeria / lista)
--------------------------------------------------------- */
function applyFilter(filter, { keepSlug } = {}){
  state.filter = ["meninos", "meninas"].includes(filter) ? filter : "todos";
  const current = keepSlug || state.items[state.index]?.slug;
  state.items = state.filter === "todos" ? THEMES.slice() : THEMES.filter((t) => t.audience === state.filter);
  const idx = state.items.findIndex((t) => t.slug === current);
  state.index = state.offset = idx >= 0 ? idx : 0;
  $$("[data-filter]", el.filters).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === state.filter)));
  renderFlow();
  renderDots();
  renderList();
  if(g3d) g3d.setItems(state.items, state.index);
  syncInfo(false);
  el.status.textContent = `${state.items.length} temas em ${state.filter === "todos" ? "todos os públicos" : AUD[state.filter]}.`;
}
function setMode(mode){
  state.mode = mode === "list" ? "list" : "gallery";
  $$("[data-mode]", el.modes).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
  el.galleryBlock.hidden = state.mode === "list";
  el.list.hidden = state.mode !== "list";
  if(g3d){ state.mode === "list" ? g3d.pause() : g3d.resume(); }
  if(state.mode === "gallery") requestAnimationFrame(positionFlow);
}
function renderList(){
  el.list.innerHTML = state.items.map((t) => `
    <article class="vt-card">
      <a class="vt-card-media" href="${themeHref(t.slug)}" data-theme-link="${t.slug}" style="--bg:${esc(t.stage?.bg || "#FFF6EC")}" tabindex="-1" aria-hidden="true">
        <img src="${esc(posterOf(t))}" alt="" loading="lazy" decoding="async">
      </a>
      <div class="vt-card-body">
        <span class="vt-aud" data-aud="${t.audience}">${esc(AUD[t.audience])}</span>
        <h3><a href="${themeHref(t.slug)}" data-theme-link="${t.slug}">${esc(t.name)}</a></h3>
        <p>${esc(t.short)}</p>
        <div class="vt-badges">${badgeHtml(t)}</div>
        <div class="vt-card-actions">
          <a class="btn btn-secondary btn-sm" href="${themeHref(t.slug)}" data-theme-link="${t.slug}">Explorar kit</a>
          <a class="btn btn-primary btn-sm" data-whatsapp="${esc(whatsMessage(t))}" href="#">Consultar</a>
        </div>
      </div>
    </article>`).join("");
  $$("img", el.list).forEach((img) => img.addEventListener("error", () => img.closest(".vt-card-media").classList.add("no-poster"), { once: true }));
  refreshWhatsapp();
}

/* ---------------------------------------------------------
   Entrada: arrastar / swipe / clique / teclado
   touch-action: pan-y no palco preserva a rolagem vertical.
--------------------------------------------------------- */
function initStageInput(){
  let down = null, dragging = false, lastX = 0, lastT = 0, vel = 0;
  const itemPx = () => el.stage.clientWidth * (el.stage.clientWidth < el.stage.clientHeight * 1.05 ? 0.55 : 0.3);

  el.stage.addEventListener("pointerdown", (e) => {
    if(e.button !== 0 || e.target.closest("button")) return;
    down = { x: e.clientX, y: e.clientY, offset: state.offset, id: e.pointerId };
    dragging = false; lastX = e.clientX; lastT = performance.now(); vel = 0;
  });
  el.stage.addEventListener("pointermove", (e) => {
    if(!down || e.pointerId !== down.id){
      if(g3d && e.pointerType === "mouse" && threeState === "ready") el.stage.classList.toggle("is-pointing", g3d.pick(e.clientX, e.clientY) >= 0);
      return;
    }
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if(!dragging){
      if(Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2){
        dragging = true;
        try{ el.stage.setPointerCapture(e.pointerId); }catch(_){ /* noop */ }
        el.stage.classList.add("is-dragging");
      }else return;
    }
    const n = state.items.length;
    let o = down.offset - dx / itemPx();
    if(o < 0) o = o * 0.35; else if(o > n - 1) o = n - 1 + (o - (n - 1)) * 0.35;
    const now = performance.now();
    vel = 0.8 * vel + 0.2 * ((e.clientX - lastX) / Math.max(1, now - lastT));
    lastX = e.clientX; lastT = now;
    state.offset = o;
    if(g3d) g3d.setOffset(o, { drag: true });
    positionFlow();
    const near = Math.max(0, Math.min(n - 1, Math.round(o)));
    if(near !== state.index){ state.index = near; syncInfo(false); }
    e.preventDefault();
  });
  const finish = (e, cancelled) => {
    if(!down || e.pointerId !== down.id) return;
    el.stage.classList.remove("is-dragging");
    if(dragging){
      // impulso do gesto: no máximo um kit além de onde o dedo soltou
      const fling = -vel * 0.15 * 1000 / itemPx();
      const goalIdx = Math.round(state.offset + Math.max(-1, Math.min(1, fling)));
      if(g3d) g3d.endDrag();
      go(goalIdx);
    }else if(!cancelled){
      const idx = pickAt(e.clientX, e.clientY);
      if(idx >= 0 && idx !== state.index) go(idx);
      else if(idx === state.index) openTheme(state.items[idx].slug);
    }
    down = null; dragging = false;
  };
  el.stage.addEventListener("pointerup", (e) => finish(e, false));
  el.stage.addEventListener("pointercancel", (e) => {
    if(dragging){ if(g3d) g3d.endDrag(); go(state.offset); }
    finish(e, true);
  });

  el.stage.addEventListener("keydown", (e) => { if(handleKey(e)) e.preventDefault(); });
  document.addEventListener("keydown", (e) => {
    if(e.defaultPrevented || state.view !== "gallery" || state.mode !== "gallery" || !state.stageVisible) return;
    const t = e.target;
    if(t !== document.body && t !== el.stage) return;
    if(t === el.stage) return; // já tratado
    if(["ArrowLeft", "ArrowRight"].includes(e.key) && handleKey(e)) e.preventDefault();
  });

  el.prev.addEventListener("click", () => go(state.index - 1));
  el.next.addEventListener("click", () => go(state.index + 1));
  el.dots.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if(b) go(Number(b.dataset.go)); });
}
function handleKey(e){
  switch(e.key){
    case "ArrowLeft": go(state.index - 1); return true;
    case "ArrowRight": go(state.index + 1); return true;
    case "Home": go(0); return true;
    case "End": go(state.items.length - 1); return true;
    case "Enter": case " ": if(e.target === el.stage){ openTheme(state.items[state.index].slug); return true; } return false;
    default: return false;
  }
}
function pickAt(x, y){
  if(g3d && threeState === "ready") return g3d.pick(x, y);
  const node = document.elementsFromPoint(x, y).find((n) => n.classList?.contains("vt-flow-item"));
  return node ? Number(node.dataset.index) : -1;
}

/* ---------------------------------------------------------
   Carregamento do 3D sob demanda
--------------------------------------------------------- */
function webglAvailable(){
  if(params.has("sem3d")) return false;
  try{
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  }catch(e){ return false; }
}
function useFallback(reason){
  threeState = "failed";
  el.stage.classList.remove("is-3d");
  el.stage.classList.add("is-fallback");
  el.loading.hidden = true;
  el.hint.textContent = "Modo imagens: o 3D não está disponível neste aparelho, mas você pode navegar normalmente.";
  if(reason) console.info("[Vitrine 3D] usando imagens:", reason);
}
async function start3D(){
  if(threeState !== "idle") return;
  if(!WEBGL){ useFallback("WebGL indisponível"); return; }
  threeState = "loading";
  try{
    const { createGallery3D } = await import("./gallery3d.js");
    if(state.view !== "gallery" && !g3d){ threeState = "idle"; return; }
    g3d = createGallery3D({ host: el.host, reduced });
    g3d.setItems(state.items, state.index);
    g3d.attach();
    const canvas = el.host.querySelector("canvas");
    canvas?.addEventListener("webglcontextlost", (ev) => { ev.preventDefault(); useFallback("contexto WebGL perdido"); }, { once: true });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      threeState = "ready";
      el.stage.classList.add("is-3d");
      el.loading.hidden = true;
      if(state.mode === "list") g3d.pause();
    }));
  }catch(err){
    console.warn("[Vitrine 3D] falha ao iniciar a cena:", err);
    useFallback("erro na cena");
  }
}

/* ---------------------------------------------------------
   Página do tema
--------------------------------------------------------- */
function themeTemplate(t){
  const audLabel = AUD[t.audience] || "";
  const partKeys = ["panel", "pedestals", "table", "accessories"];
  const related = THEMES.filter((x) => x.audience === t.audience && x.slug !== t.slug).slice(0, 4);
  return `
  <div class="container vt-theme">
    <nav class="vt-crumbs" aria-label="Você está em">
      <a href="/vitrine" data-back class="btn btn-ghost btn-sm">← Voltar à vitrine</a>
      <span><a href="/vitrine?filtro=${t.audience}" data-back-filter="${t.audience}">${esc(audLabel)}</a> / <strong>${esc(t.name)}</strong></span>
    </nav>

    <div class="vt-theme-grid">
      <div class="vt-viewer-col">
        <div class="vt-viewer" id="vt-viewer" tabindex="0" role="region" style="--stage-bg:${esc(t.stage?.bg || "#FFF6EC")}"
             aria-label="Visualizador 3D do cenário ${esc(t.name)}. Arraste para girar; use as setas para girar e + ou − para zoom.">
          <img class="vt-viewer-poster" src="${esc(posterOf(t))}" alt="Prévia ilustrada do cenário ${esc(t.name)}" decoding="async">
          <div class="vt-viewer-host" id="vt-viewer-host"></div>
          <div class="vt-hotspots" id="vt-hotspots"></div>
          <div class="vt-hotspot-card" id="vt-hotspot-card" hidden>
            <button type="button" class="vt-hotspot-close" aria-label="Fechar informação">✕</button>
            <strong></strong><p></p>
          </div>
          <span class="vt-stage-tag">Prévia 3D</span>
        </div>
        <div class="vt-viewer-tools" role="toolbar" aria-label="Controles do visualizador" id="vt-tools">
          <button type="button" data-view="front" aria-pressed="true">Frente</button>
          <button type="button" data-view="side" aria-pressed="false">Lateral</button>
          <button type="button" data-view="overview" aria-pressed="false">Visão geral</button>
          <span class="vt-tools-sep" aria-hidden="true"></span>
          <button type="button" data-zoom="-1" aria-label="Afastar">−</button>
          <button type="button" data-zoom="1" aria-label="Aproximar">+</button>
        </div>
        <p class="vt-viewer-hint" id="vt-viewer-hint">Arraste para girar 360° · pinça ou Ctrl + roda do mouse para zoom · toque nos números</p>
      </div>

      <div class="vt-theme-info">
        <span class="vt-aud" data-aud="${t.audience}">${esc(audLabel)}</span>
        <h1>${esc(t.name)}</h1>
        <div class="vt-badges" id="vt-theme-badges">${badgeHtml(t)}</div>
        <p class="vt-theme-desc">${esc(t.description)}</p>
        <div class="vt-theme-ctas">
          <a class="btn btn-whatsapp" id="vt-theme-whats" href="#">💬 Consultar disponibilidade</a>
          <a class="btn btn-secondary" id="vt-theme-reserva" href="${reservaHref(t)}">Solicitar orçamento</a>
        </div>
        <p class="form-note">A consulta não garante a reserva: a data é confirmada com o sinal de 50%, conforme a <a href="contrato.html">política de locação</a>.</p>
      </div>
    </div>

    <section class="vt-parts" aria-labelledby="vt-parts-h">
      <h2 id="vt-parts-h">O que aparece nesta prévia</h2>
      <p class="vt-section-note">Composição ilustrativa do cenário em 3D. Os números correspondem aos pontos no visualizador.</p>
      <ol class="vt-parts-list">
        ${partKeys.map((k, i) => `
        <li data-part="${k}">
          <span class="vt-part-num" aria-hidden="true">${i + 1}</span>
          <div><h3>${esc(t.parts[k].title)}</h3><p>${esc(t.parts[k].text)}</p></div>
          <button type="button" class="btn btn-ghost btn-sm vt-part-focus" data-focus="${k}">Ver no 3D</button>
        </li>`).join("")}
      </ol>
    </section>

    <section class="vt-confirmed" aria-labelledby="vt-confirmed-h">
      <h2 id="vt-confirmed-h">Itens confirmados no acervo</h2>
      <div id="vt-confirmed-body"><p class="vt-section-note">Carregando informações do acervo…</p></div>
    </section>

    ${related.length ? `
    <section class="vt-related" aria-labelledby="vt-related-h">
      <h2 id="vt-related-h">Outros temas para ${esc(audLabel.toLowerCase())}</h2>
      <div class="vt-related-grid">
        ${related.map((r) => `
        <a class="vt-related-card" href="${themeHref(r.slug)}" data-theme-link="${r.slug}" style="--bg:${esc(r.stage?.bg || "#FFF6EC")}">
          <img src="${esc(posterOf(r))}" alt="" loading="lazy" decoding="async">
          <span>${esc(r.name)}</span>
        </a>`).join("")}
      </div>
    </section>` : ""}
  </div>`;
}

function renderConfirmed(t){
  const box = $("#vt-confirmed-body");
  if(!box || !t) return;
  if(t.commercial?.kitId && !state.kits){
    box.innerHTML = '<p class="vt-section-note">Carregando informações do acervo…</p>';
    return;
  }
  const k = linkedKit(t);
  if(k){
    const photos = (k.photos && k.photos.length) ? k.photos : (k.photo ? [k.photo] : []);
    const conf = t.commercial.confirmed || {};
    const available = k.status === "disponivel";
    box.innerHTML = `
      <div class="vt-confirmed-card">
        ${photos.length ? `<button type="button" class="vt-confirmed-photo" id="vt-photo-btn" aria-label="Ampliar foto do kit ${esc(k.title)}">
          <img src="${esc(photos[0])}" alt="${esc(k.title)}" loading="lazy"></button>` : ""}
        <div class="vt-confirmed-info">
          <span class="kit-badge ${available ? "" : "unavailable"}" style="position:static;display:inline-block;">${available ? "Disponível" : "Indisponível"}</span>
          <h3>${esc(k.title)}</h3>
          <dl class="vt-facts">
            ${conf.measures?.length ? `<div><dt>Medidas informadas</dt><dd>${conf.measures.map(esc).join("<br>")}</dd></div>` : ""}
            ${conf.items?.length ? `<div><dt>Itens informados</dt><dd>${conf.items.map(esc).join("<br>")}</dd></div>` : ""}
            <div><dt>Locação</dt><dd>R$ ${typeof formatPrice === "function" ? formatPrice(k.price) : k.price}</dd></div>
          </dl>
          <p class="vt-section-note">Fonte: ${esc(conf.source || "cadastro do kit")}. Foto meramente ilustrativa/referencial, em processo de substituição por fotos próprias da Mimo &amp; Monte. Mesa, bolo e acessórios da Prévia 3D são ilustrativos — confirme com a equipe o que acompanha o kit.</p>
          <a class="btn btn-ghost btn-sm" href="kit.html?id=${encodeURIComponent(k.id)}">Ver ficha completa do kit</a>
        </div>
      </div>`;
    $("#vt-photo-btn")?.addEventListener("click", () => typeof openLightbox === "function" && openLightbox(photos, 0));
  }else{
    box.innerHTML = `
      <div class="vt-empty-confirmed">
        <span class="vt-badge vt-badge--ask">Sob consulta</span>
        <p>Este tema ainda não tem fotos, medidas ou itens confirmados no acervo. A composição acima é uma <strong>Prévia 3D ilustrativa</strong>: disponibilidade, itens inclusos e valor são informados pela nossa equipe no atendimento.</p>
        <a class="btn btn-whatsapp btn-sm" data-whatsapp="${esc(whatsMessage(t))}" href="#">💬 Perguntar sobre este tema</a>
      </div>`;
  }
  const wa = $("#vt-theme-whats");
  if(wa) wa.setAttribute("data-whatsapp", whatsMessage(t));
  const rs = $("#vt-theme-reserva");
  if(rs) rs.href = reservaHref(t);
  const b = $("#vt-theme-badges");
  if(b) b.innerHTML = badgeHtml(t);
  refreshWhatsapp();
}

async function openTheme(slug, { push = true } = {}){
  const t = BY_SLUG.get(slug);
  if(!t) return showGallery({ push: false });
  state.view = "theme";
  if(push) history.pushState({ slug }, "", themeHref(slug));
  document.title = `${t.name} — Vitrine 3D | Mimo & Monte`;
  setMeta(`${t.name}: ${t.short} Prévia 3D do kit Pegue e Monte da Mimo & Monte.`);
  if(g3d) g3d.detach();
  el.galleryView.hidden = true;
  el.themeView.hidden = false;
  el.themeView.innerHTML = themeTemplate(t);
  window.scrollTo(0, 0);
  wireTheme(t);
  const token = ++viewerToken;
  commercialKits().then(() => { if(token === viewerToken){ renderConfirmed(t); } });
  renderConfirmed(t);
  $("h1", el.themeView)?.focus?.();

  const vbox = $("#vt-viewer");
  if(!WEBGL || threeState === "failed"){ viewerFallback(); return; }
  vbox.classList.add("is-loading");
  try{
    const { createViewer3D } = await import("./viewer3d.js");
    if(token !== viewerToken) return;
    viewer = createViewer3D({
      host: $("#vt-viewer-host"), overlay: $("#vt-hotspots"), theme: t, reduced,
      onHotspot: (k) => focusPart(k, true),
      onUserMove: () => $$("[data-view]", el.themeView).forEach((b) => b.setAttribute("aria-pressed", "false")),
      onFirstFrame: () => { vbox.classList.remove("is-loading"); vbox.classList.add("is-3d"); }
    });
    vbox.querySelector("canvas")?.addEventListener("webglcontextlost", (ev) => { ev.preventDefault(); viewerFallback(); }, { once: true });
  }catch(err){
    console.warn("[Vitrine 3D] visualizador indisponível:", err);
    viewerFallback();
  }
}
function viewerFallback(){
  const vbox = $("#vt-viewer");
  if(!vbox) return;
  vbox.classList.remove("is-loading", "is-3d");
  vbox.classList.add("is-fallback");
  $("#vt-tools")?.setAttribute("hidden", "");
  $$(".vt-part-focus", el.themeView).forEach((b) => b.hidden = true);
  const hint = $("#vt-viewer-hint");
  if(hint) hint.textContent = "Modo imagem: o 3D não está disponível neste aparelho. Veja abaixo cada elemento do cenário.";
}
function focusPart(key, fromHotspot){
  if(viewer) viewer.focusPart(key);
  const t = BY_SLUG.get(currentSlug());
  $$(".vt-parts-list li", el.themeView).forEach((li) => li.classList.toggle("is-active", li.dataset.part === key));
  const card = $("#vt-hotspot-card");
  if(card && t){
    card.hidden = false;
    $("strong", card).textContent = t.parts[key].title;
    $("p", card).textContent = t.parts[key].text;
  }
  $$("[data-view]", el.themeView).forEach((b) => b.setAttribute("aria-pressed", "false"));
  if(!fromHotspot){
    const v = $("#vt-viewer");
    const r = v.getBoundingClientRect();
    if(r.top < 60 || r.bottom > innerHeight) v.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }
}
function wireTheme(t){
  const root = el.themeView;
  root.addEventListener("click", onThemeClick);
  function onThemeClick(e){
    const viewBtn = e.target.closest("[data-view]");
    if(viewBtn){
      viewer?.setView(viewBtn.dataset.view);
      viewer?.clearFocus();
      $("#vt-hotspot-card").hidden = true;
      $$(".vt-parts-list li", root).forEach((li) => li.classList.remove("is-active"));
      $$("[data-view]", root).forEach((b) => b.setAttribute("aria-pressed", String(b === viewBtn)));
      return;
    }
    const zoomBtn = e.target.closest("[data-zoom]");
    if(zoomBtn){ viewer?.zoom(Number(zoomBtn.dataset.zoom)); return; }
    const focusBtn = e.target.closest("[data-focus]");
    if(focusBtn){ focusPart(focusBtn.dataset.focus, false); return; }
    if(e.target.closest(".vt-hotspot-close")){ $("#vt-hotspot-card").hidden = true; viewer?.clearFocus(); return; }
  }
  root._cleanup = () => root.removeEventListener("click", onThemeClick);
}
function closeTheme(){
  viewerToken++;
  if(viewer){ viewer.destroy(); viewer = null; }
  if(el.themeView._cleanup){ el.themeView._cleanup(); el.themeView._cleanup = null; }
  el.themeView.innerHTML = "";
  el.themeView.hidden = true;
}
function showGallery({ push = true, slug, filter } = {}){
  const fromTheme = state.view === "theme";
  const lastSlug = slug || (fromTheme ? currentSlug() : null);
  closeTheme();
  state.view = "gallery";
  el.galleryView.hidden = false;
  document.title = "Vitrine 3D de Kits — Mimo & Monte";
  setMeta("Explore em 3D os temas de kits Pegue e Monte da Mimo & Monte: gire os cenários, veja painel, cilindros, mesa e acessórios e consulte a disponibilidade.");
  if(filter && filter !== state.filter) applyFilter(filter, { keepSlug: lastSlug });
  else if(lastSlug){
    if(!state.items.some((t) => t.slug === lastSlug)) applyFilter("todos", { keepSlug: lastSlug });
    const idx = state.items.findIndex((t) => t.slug === lastSlug);
    if(idx >= 0){ state.index = state.offset = idx; }
  }
  if(push) history.pushState({}, "", galleryHref());
  if(g3d){ g3d.setItems(state.items, state.index); g3d.attach(); }
  else start3D();
  positionFlow();
  syncInfo(false);
  if(fromTheme) requestAnimationFrame(() => el.stage.focus({ preventScroll: true }));
}
function galleryHref(){ return "/vitrine" + (state.filter !== "todos" ? `?filtro=${state.filter}` : ""); }
function currentSlug(){
  const m = location.pathname.match(/\/vitrine\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : params.get("kit");
}
function setMeta(text){ const m = $('meta[name="description"]'); if(m) m.setAttribute("content", text); }

/* Links internos para temas e para a vitrine (sem recarregar) */
function initLinks(){
  document.addEventListener("click", (e) => {
    if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a");
    if(!a) return;
    if(a.dataset.themeLink){ e.preventDefault(); openTheme(a.dataset.themeLink); return; }
    if(a === el.explore){ e.preventDefault(); openTheme(state.items[state.index].slug); return; }
    if(a.hasAttribute("data-back")){ e.preventDefault(); showGallery(); return; }
    if(a.dataset.backFilter){ e.preventDefault(); showGallery({ filter: a.dataset.backFilter }); return; }
  });
  window.addEventListener("popstate", () => route({ push: false }));
}
function route({ push = false } = {}){
  const slug = currentSlug();
  const q = new URLSearchParams(location.search);
  if(slug && BY_SLUG.has(slug)){ openTheme(slug, { push }); return; }
  showGallery({ push, filter: q.get("filtro") || "todos" });
}

/* ---------------------------------------------------------
   Inicialização
--------------------------------------------------------- */
function init(){
  if(!THEMES.length || !el.stage) return;
  if(reduced) document.documentElement.classList.add("vt-reduced");
  const q = new URLSearchParams(location.search);
  state.filter = ["meninos", "meninas"].includes(q.get("filtro")) ? q.get("filtro") : "todos";
  state.items = state.filter === "todos" ? THEMES.slice() : THEMES.filter((t) => t.audience === state.filter);
  $$("[data-filter]", el.filters).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === state.filter)));
  renderFlow(); renderDots(); renderList(); syncInfo(false);

  el.filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if(!b) return;
    applyFilter(b.dataset.filter);
    history.replaceState({}, "", galleryHref());
  });
  el.modes.addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if(b) setMode(b.dataset.mode); });
  initStageInput();
  initLinks();
  new ResizeObserver(() => positionFlow()).observe(el.stage);
  new IntersectionObserver(([en]) => {
    state.stageVisible = en.isIntersecting;
    if(!g3d) return;
    en.isIntersecting && state.view === "gallery" && state.mode === "gallery" ? g3d.resume() : g3d.pause();
  }, { rootMargin: "120px" }).observe(el.stage);

  commercialKits().then(() => { syncInfo(false); renderList(); });

  // Libera GPU e memória ao sair da experiência
  window.addEventListener("pagehide", async (e) => {
    if(e.persisted) return;
    if(viewer){ viewer.destroy(); viewer = null; }
    if(g3d){ g3d.destroy(); g3d = null; }
    if(threeState === "ready" || threeState === "loading"){
      const { disposeEngine } = await import("./engine.js");
      disposeEngine();
    }
  });

  if(q.has("captura")){
    import("./capture.js").then((m) => m.runCapture(THEMES)).catch((err) => console.error(err));
    return;
  }
  route({ push: false });
}

init();
