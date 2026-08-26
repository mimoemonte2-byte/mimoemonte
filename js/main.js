/* =========================================================
   MIMO & MONTE — Comportamentos compartilhados do site
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  initMobileNav();
  initWhatsappLinks();
  initAccordion();
  await initHomeShowcase();
  await initKitsPage();
  await initKitDetail();
  initHeaderSearch();
  initHeaderSearchToggle();
});

/* ---------- Ícone de busca do cabeçalho (popover) ---------- */
function initHeaderSearchToggle(){
  const toggle = document.querySelector("#search-toggle");
  const popover = document.querySelector("#header-search-popover");
  if(!toggle || !popover) return;
  toggle.addEventListener("click", () => {
    popover.classList.toggle("open");
    if(popover.classList.contains("open")) popover.querySelector("input")?.focus();
  });
  document.addEventListener("click", (e) => {
    if(!popover.contains(e.target) && e.target !== toggle){
      popover.classList.remove("open");
    }
  });
}

/* ---------- Menu mobile (hambúrguer) ---------- */
function initMobileNav(){
  const btn = document.querySelector(".hamburger");
  const nav = document.querySelector(".mobile-nav");
  if(!btn || !nav) return;
  btn.addEventListener("click", () => {
    nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", nav.classList.contains("open"));
  });
}

/* ---------- Links de WhatsApp (header, footer, cards, CTAs) ---------- */
function initWhatsappLinks(){
  document.querySelectorAll("[data-whatsapp]").forEach(el => {
    const msg = el.getAttribute("data-whatsapp") || "";
    el.href = whatsappLink(msg || undefined);
    el.target = "_blank";
    el.rel = "noopener";
  });
  document.querySelectorAll("[data-fill='whatsappDisplay']").forEach(el => el.textContent = SITE_CONFIG.whatsappDisplay);
  document.querySelectorAll("[data-fill='telefone']").forEach(el => el.textContent = SITE_CONFIG.telefone);
  document.querySelectorAll("[data-fill='email']").forEach(el => el.textContent = SITE_CONFIG.email);
  document.querySelectorAll("[data-fill='instagram']").forEach(el => el.textContent = SITE_CONFIG.instagram);
  document.querySelectorAll("[data-fill='endereco']").forEach(el => el.textContent = SITE_CONFIG.endereco);
  document.querySelectorAll("[data-fill='horario']").forEach(el => el.textContent = SITE_CONFIG.horario);
  document.querySelectorAll("[data-fill='instagramUrl']").forEach(el => el.href = SITE_CONFIG.instagramUrl);
  document.querySelectorAll("[data-fill-href]").forEach(el => el.href = SITE_CONFIG[el.getAttribute("data-fill-href")] || "#");
}

/* ---------- Acordeão (Dúvidas) ---------- */
function initAccordion(){
  document.querySelectorAll(".accordion-item").forEach(item => {
    const q = item.querySelector(".accordion-q");
    const a = item.querySelector(".accordion-a");
    if(!q || !a) return;
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".accordion-item.open").forEach(other => {
        if(other !== item){
          other.classList.remove("open");
          other.querySelector(".accordion-a").style.maxHeight = null;
        }
      });
      item.classList.toggle("open", !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : null;
    });
  });
}

/* ---------- Catálogo de kits (Supabase, com fallback para os dados locais) ---------- */
let CACHED_KITS = null;

function mapDbKitToClient(row){
  const photos = (row.photos && row.photos.length) ? row.photos : (row.photo_url ? [row.photo_url] : []);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryLabel: row.category_label,
    icon: row.icon || "🎁",
    colorFrom: row.color_from || "#FFE3DB",
    colorTo: row.color_to || "#FFB9A6",
    price: Number(row.price) || 0,
    status: row.status,
    photo: photos[0] || row.photo_url,
    photos: photos,
    description: row.description,
    refUrl: row.ref_url
  };
}

async function loadKits({ fresh = false } = {}){
  if(CACHED_KITS && !fresh) return CACHED_KITS;
  if(typeof supabaseClient !== "undefined" && supabaseClient){
    try{
      const { data, error } = await supabaseClient
        .from("kits")
        .select("*")
        .order("created_at", { ascending: true });
      if(!error && data && data.length){
        CACHED_KITS = data.map(mapDbKitToClient);
        return CACHED_KITS;
      }
    }catch(e){
      console.warn("Não foi possível carregar os kits do Supabase, usando catálogo local.", e);
    }
  }
  CACHED_KITS = KITS;
  return CACHED_KITS;
}

/* ---------- Formatação de preço em Real (pt-BR) ---------- */
function formatPrice(value){
  return Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- Card de kit (usado na Home e em Kit's) ---------- */
function renderKitCard(kit){
  const photoHtml = kit.photo
    ? `<img src="${kit.photo}" alt="${kit.title}" loading="lazy">`
    : `<div class="kit-placeholder" style="background:linear-gradient(135deg, ${kit.colorFrom}, ${kit.colorTo})">
         <span class="icon">${kit.icon}</span>
         <small>Foto de referência em atualização</small>
       </div>`;
  const unavailable = kit.status !== "disponivel";
  const whatsMsg = `Olá! Tenho interesse no kit "${kit.title}" (R$ ${formatPrice(kit.price)}). Poderiam me ajudar a consultar a disponibilidade?`;
  return `
  <article class="kit-card" data-category="${kit.category}" data-title="${kit.title.toLowerCase()}" data-price="${kit.price}" data-status="${kit.status}">
    <div class="kit-photo">
      ${photoHtml}
      <span class="kit-badge ${unavailable ? "unavailable" : ""}">${unavailable ? "Indisponível" : "Disponível"}</span>
    </div>
    <div class="kit-body">
      <span class="kit-theme">${kit.categoryLabel}</span>
      <h3 class="kit-title">${kit.title}</h3>
      <div class="kit-price">Aluguel por <span>R$ ${formatPrice(kit.price)}</span></div>
      <div class="kit-actions">
        <a class="btn btn-ghost btn-sm" href="kit.html?id=${kit.id}">Ver detalhes</a>
        <a class="btn btn-primary btn-sm" data-whatsapp="${whatsMsg}" href="#">Consultar</a>
      </div>
    </div>
  </article>`;
}

/* ---------- Vitrine da Home ---------- */
async function initHomeShowcase(){
  const el = document.querySelector("#home-showcase");
  if(!el) return;
  const kits = await loadKits();
  const destaque = kits.slice(0, 8);
  el.innerHTML = destaque.map(renderKitCard).join("");
  initWhatsappLinks();
}

/* ---------- Página Kit's (catálogo completo + filtros) ---------- */
async function initKitsPage(){
  const grid = document.querySelector("#kits-grid");
  if(!grid) return;

  const searchInput = document.querySelector("#kit-search");
  const themeSelect = document.querySelector("#filter-theme");
  const categorySelect = document.querySelector("#filter-category");
  const priceSelect = document.querySelector("#filter-price");
  const availSelect = document.querySelector("#filter-availability");
  const resultCount = document.querySelector("#kits-count");
  const emptyState = document.querySelector("#kits-empty");
  const allKits = await loadKits();

  // Popular selects de tema/categoria dinamicamente a partir dos dados
  const categorias = [...new Set(allKits.map(k => k.category))].map(cat => {
    const found = allKits.find(k => k.category === cat);
    return { value: cat, label: found.categoryLabel };
  }).sort((a,b) => a.label.localeCompare(b.label, "pt-BR"));

  if(themeSelect){
    categorias.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.value; opt.textContent = c.label;
      themeSelect.appendChild(opt);
    });
  }
  if(categorySelect){
    categorias.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.value; opt.textContent = c.label;
      categorySelect.appendChild(opt);
    });
  }

  function applyFilters(){
    const term = (searchInput?.value || "").toLowerCase().trim();
    const theme = themeSelect?.value || "";
    const cat = categorySelect?.value || "";
    const price = priceSelect?.value || "";
    const avail = availSelect?.value || "";

    const filtered = allKits.filter(k => {
      if(term && !k.title.toLowerCase().includes(term)) return false;
      if(theme && k.category !== theme) return false;
      if(cat && k.category !== cat) return false;
      if(price === "ate-180" && k.price > 180) return false;
      if(price === "acima-180" && k.price <= 180) return false;
      if(avail === "disponivel" && k.status !== "disponivel") return false;
      if(avail === "indisponivel" && k.status === "disponivel") return false;
      return true;
    });

    grid.innerHTML = filtered.map(renderKitCard).join("");
    if(resultCount) resultCount.textContent = `${filtered.length} kit${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}`;
    if(emptyState) emptyState.style.display = filtered.length ? "none" : "block";
    initWhatsappLinks();
  }

  [searchInput, themeSelect, categorySelect, priceSelect, availSelect].forEach(el => {
    if(!el) return;
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  // Suporte a ?q= vindo da busca do cabeçalho e ?tema= vindo da Home
  const params = new URLSearchParams(location.search);
  if(params.get("q") && searchInput) searchInput.value = params.get("q");
  if(params.get("tema") && themeSelect) themeSelect.value = params.get("tema");

  applyFilters();
}

/* ---------- Página de detalhes do kit ---------- */
async function initKitDetail(){
  const el = document.querySelector("#kit-detail");
  if(!el) return;
  const params = new URLSearchParams(location.search);
  const effectiveKits = await loadKits();
  const kit = effectiveKits.find(k => k.id === params.get("id")) || effectiveKits[0];

  document.title = `${kit.title} — Mimo & Monte`;

  const photos = (kit.photos && kit.photos.length) ? kit.photos : (kit.photo ? [kit.photo] : []);

  const mainPhotoHtml = photos.length
    ? `<img src="${photos[0]}" alt="${kit.title}" class="kit-gallery-main" data-index="0">`
    : `<div class="kit-placeholder" style="background:linear-gradient(135deg, ${kit.colorFrom}, ${kit.colorTo}); min-height:340px;">
         <span class="icon" style="font-size:4rem;">${kit.icon}</span>
         <small>Foto de referência em atualização</small>
       </div>`;

  const thumbsHtml = photos.length > 1
    ? `<div class="kit-gallery-thumbs">${photos.map((p, i) => `
        <button type="button" class="kit-gallery-thumb${i === 0 ? " active" : ""}" data-index="${i}">
          <img src="${p}" alt="${kit.title} — foto ${i + 1}">
        </button>`).join("")}</div>`
    : "";

  const descricaoHtml = kit.description
    ? `<p>${kit.description}</p>`
    : `<p>Informações detalhadas em atualização. Consulte nossa equipe.</p>`;

  const whatsMsg = `Olá! Tenho interesse no kit "${kit.title}" (R$ ${formatPrice(kit.price)}). Poderiam me ajudar a consultar a disponibilidade?`;

  el.innerHTML = `
    <div class="two-col">
      <div>
        <div class="round-photo kit-gallery" id="kit-gallery">${mainPhotoHtml}</div>
        ${thumbsHtml}
      </div>
      <div>
        <span class="eyebrow">${kit.categoryLabel}</span>
        <h1>${kit.title}</h1>
        <div class="kit-price" style="font-size:1.4rem; margin-bottom:16px;">Aluguel por <span>R$ ${formatPrice(kit.price)}</span></div>
        ${descricaoHtml}
        <div class="notice-box" style="margin-bottom:22px;">
          Foto meramente ilustrativa/referencial, em processo de substituição por fotos próprias da Mimo &amp; Monte.
        </div>
        <div class="hero-actions">
          <a class="btn btn-primary" data-whatsapp="${whatsMsg}" href="#">Consultar disponibilidade</a>
          <a class="btn btn-secondary" href="reserva.html?id=${kit.id}">Fazer reserva</a>
        </div>
      </div>
    </div>
  `;
  initWhatsappLinks();
  initKitGallery(photos);

  const relEl = document.querySelector("#kit-relacionados");
  if(relEl){
    const relacionados = effectiveKits.filter(k => k.category === kit.category && k.id !== kit.id).slice(0, 4);
    relEl.innerHTML = relacionados.map(renderKitCard).join("");
    initWhatsappLinks();
  }
}

/* ---------- Galeria de fotos do kit (miniaturas + zoom) ---------- */
function initKitGallery(photos){
  const mainImg = document.querySelector(".kit-gallery-main");
  if(!mainImg || !photos.length) return;

  document.querySelectorAll(".kit-gallery-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const i = Number(thumb.dataset.index);
      mainImg.src = photos[i];
      mainImg.dataset.index = i;
      document.querySelectorAll(".kit-gallery-thumb").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  mainImg.addEventListener("click", () => openLightbox(photos, Number(mainImg.dataset.index) || 0));
}

/* ---------- Lightbox (zoom da foto) — reutilizável em qualquer página ---------- */
function openLightbox(photos, startIndex){
  let index = startIndex || 0;
  let lightbox = document.querySelector("#mimo-lightbox");
  if(!lightbox){
    lightbox = document.createElement("div");
    lightbox.id = "mimo-lightbox";
    lightbox.className = "mimo-lightbox";
    lightbox.innerHTML = `
      <button type="button" class="mimo-lightbox-close" aria-label="Fechar">✕</button>
      <button type="button" class="mimo-lightbox-nav prev" aria-label="Foto anterior">‹</button>
      <img class="mimo-lightbox-img" alt="">
      <button type="button" class="mimo-lightbox-nav next" aria-label="Próxima foto">›</button>
    `;
    document.body.appendChild(lightbox);

    lightbox.querySelector(".mimo-lightbox-close").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => { if(e.target === lightbox) closeLightbox(); });
    lightbox.querySelector(".prev").addEventListener("click", () => showLightboxPhoto(-1));
    lightbox.querySelector(".next").addEventListener("click", () => showLightboxPhoto(1));
    lightbox.querySelector(".mimo-lightbox-img").addEventListener("click", (e) => {
      e.stopPropagation();
      const zoomed = e.currentTarget.classList.toggle("zoomed");
      lightbox.classList.toggle("zoomed-mode", zoomed);
    });
    document.addEventListener("keydown", (e) => {
      if(!lightbox.classList.contains("open")) return;
      if(e.key === "Escape") closeLightbox();
      if(e.key === "ArrowLeft") showLightboxPhoto(-1);
      if(e.key === "ArrowRight") showLightboxPhoto(1);
    });
  }

  function resetZoom(){
    lightbox.querySelector(".mimo-lightbox-img").classList.remove("zoomed");
    lightbox.classList.remove("zoomed-mode");
  }

  function showLightboxPhoto(delta){
    index = (index + delta + photos.length) % photos.length;
    lightbox.querySelector(".mimo-lightbox-img").src = photos[index];
    resetZoom();
  }

  resetZoom();
  lightbox.querySelectorAll(".mimo-lightbox-nav").forEach(btn => {
    btn.style.display = photos.length > 1 ? "flex" : "none";
  });
  lightbox.querySelector(".mimo-lightbox-img").src = photos[index];
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox(){
  const lightbox = document.querySelector("#mimo-lightbox");
  if(!lightbox) return;
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------- Busca do cabeçalho ---------- */
function initHeaderSearch(){
  document.querySelectorAll(".js-search-form").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type='search'], input[type='text']");
      const term = input ? input.value.trim() : "";
      window.location.href = "kits.html" + (term ? `?q=${encodeURIComponent(term)}` : "");
    });
  });
}
