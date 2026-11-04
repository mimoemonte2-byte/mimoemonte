/* =========================================================
   MIMO & MONTE — Vitrine 3D: catálogo de temas
   ---------------------------------------------------------
   Um único cadastro alimenta a galeria 3D, a lista, o
   fallback sem WebGL, a página do tema e o formulário de
   reserva. Para criar um tema novo, copie um objeto abaixo
   e combine os tipos de peça já existentes (veja o resumo
   de tipos em js/vitrine/builders.js).

   REGRAS COMERCIAIS
   - Todo tema é uma "Prévia 3D" ilustrativa.
   - "commercial.kitId" só deve apontar para um kit que já
     existe no acervo (js/data.js ou tabela "kits" do
     Supabase). Preço, foto e status vêm desse kit.
   - "commercial.confirmed" lista apenas informações que
     constam no cadastro do kit (título/medidas). Não
     adicionar itens, preços ou estoque sem confirmação.
   - Sem kitId => o tema aparece como "Sob consulta".
   ========================================================= */

window.VITRINE_AUDIENCES = {
  meninos: "Meninos",
  meninas: "Meninas"
};

window.VITRINE_THEMES = [
  /* ---------------- MENINOS ---------------- */
  {
    slug: "missao-espacial",
    name: "Missão Espacial",
    audience: "meninos",
    short: "Painel lunar, pedestais-foguete e planetas flutuando sobre uma mesa escura.",
    description: "Um cenário de contagem regressiva: lua cheia com crateras em primeiro plano, céu estrelado ao fundo, três pedestais inspirados em foguetes e uma mesa escura cercada de planetas e estrelas.",
    stage: { bg: "#EEF1FB", accent: "#1E6FD9" },
    commercial: null,
    parts: {
      panel: { title: "Painel lunar", text: "Lua redonda com crateras sobre um painel em arco azul-noite com estrelas." },
      pedestals: { title: "Pedestais-foguete", text: "Trio em alturas diferentes, com bico, aletas e janelinha de foguete." },
      table: { title: "Mesa escura", text: "Mesa retangular azul-marinho com bolo de planetas." },
      accessories: { title: "Planetas e estrelas", text: "Planetas com anéis e estrelas douradas em volta do painel." }
    },
    composition: {
      base: { color: "#2B3A67", top: "#DCE3F5", radius: 2.35 },
      panel: { type: "moon", color: "#1F2B57", moon: "#E9E6DA", crater: "#C9C4B4", star: "#F4B93F" },
      pedestals: [
        { style: "rocket", x: -1.35, z: 0.15, h: 0.95, r: 0.3, color: "#FFFFFF", trim: "#E8402A", window: "#7FC4F2" },
        { style: "rocket", x: 1.2, z: 0.0, h: 1.25, r: 0.32, color: "#F3F6FF", trim: "#1E6FD9", window: "#FFD36E" },
        { style: "rocket", x: 1.75, z: 0.75, h: 0.7, r: 0.26, color: "#FFFFFF", trim: "#F4B93F", window: "#7FC4F2" }
      ],
      table: { style: "cabinet", x: -0.1, z: 0.75, w: 1.7, d: 0.62, h: 0.72, color: "#22305A", trim: "#F4B93F" },
      accessories: [
        { type: "cake", on: "table", x: -0.1, z: 0.75, tiers: ["#1E6FD9", "#F3F6FF"], topper: "planet", color: "#F4B93F" },
        { type: "planet", x: -1.55, y: 2.25, z: -0.55, r: 0.28, color: "#FF8A73", ring: "#FFE29A", feature: true },
        { type: "planet", x: 1.45, y: 2.45, z: -0.6, r: 0.2, color: "#9B6BD9", ring: null },
        { type: "planet", x: 0.75, y: 0.95, z: 0.82, r: 0.13, color: "#7DD3AE", ring: "#FFFFFF", on: "table" },
        { type: "star", x: -0.75, y: 2.7, z: -0.7, s: 0.17, color: "#F4B93F" },
        { type: "star", x: 0.95, y: 2.05, z: -0.55, s: 0.12, color: "#FFE29A" },
        { type: "star", x: -1.85, y: 1.45, z: -0.35, s: 0.1, color: "#F4B93F" },
        { type: "balloon", x: -1.85, y: 0.0, z: -0.45, color: "#1E6FD9", h: 1.7 },
        { type: "balloon", x: -1.65, y: 0.0, z: -0.65, color: "#F3F6FF", h: 2.0 }
      ]
    }
  },
  {
    slug: "mundo-dos-dinossauros",
    name: "Mundo dos Dinossauros",
    audience: "meninos",
    short: "Folhagens tropicais, cilindros de pedra e ovos gigantes numa mesa rústica.",
    description: "Uma clareira jurássica: painel com vulcão e folhagens recortadas, cilindros com aparência de pedra, mesa rústica de tábuas e ovos de dinossauro com pegadas espalhadas pelo chão.",
    stage: { bg: "#EEF6EC", accent: "#3AA76D" },
    commercial: null,
    parts: {
      panel: { title: "Painel de folhagens", text: "Painel verde com vulcão e folhas tropicais escapando pelas bordas." },
      pedestals: { title: "Cilindros de pedra", text: "Trio facetado em tons de pedra, com alturas escalonadas." },
      table: { title: "Mesa rústica", text: "Tampo de tábuas de madeira com pés robustos." },
      accessories: { title: "Ovos e pegadas", text: "Ovos pintados, palmeira e pegadas de três dedos no piso." }
    },
    composition: {
      base: { color: "#5B7F3A", top: "#E3EED0", radius: 2.35 },
      panel: { type: "leafy", color: "#BFE3B0", volcano: "#8C6A4F", lava: "#FF8A73", leaves: ["#3AA76D", "#7DD3AE", "#2E7D4F"] },
      pedestals: [
        { style: "rock", x: -1.5, z: 0.1, h: 0.62, r: 0.36, color: "#A8A08F" },
        { style: "rock", x: -0.9, z: 0.55, h: 0.95, r: 0.3, color: "#B9B2A2" },
        { style: "rock", x: 1.55, z: 0.25, h: 0.78, r: 0.34, color: "#9C9483" }
      ],
      table: { style: "rustic", x: 0.35, z: 0.6, w: 1.6, d: 0.66, h: 0.68, color: "#B98A5A" },
      accessories: [
        { type: "egg", on: "table", x: 0.0, z: 0.62, s: 0.2, color: "#F2E6D6", spots: "#7DD3AE", feature: true },
        { type: "egg", on: "table", x: 0.38, z: 0.55, s: 0.16, color: "#FFE29A", spots: "#FF8A73" },
        { type: "cake", on: "table", x: 0.82, z: 0.6, tiers: ["#7DD3AE", "#F2E6D6"], topper: "egg", color: "#3AA76D" },
        { type: "egg", on: "pedestal:1", s: 0.17, color: "#E9F3D9", spots: "#3AA76D" },
        { type: "palm", x: 1.95, z: -0.55, h: 1.9, color: "#8C6A4F", leaf: "#3AA76D" },
        { type: "footprint", x: -0.45, z: 1.55, s: 0.24, ry: 0.4, color: "#8C6A4F" },
        { type: "footprint", x: 0.25, z: 1.75, s: 0.24, ry: 0.2, color: "#8C6A4F" },
        { type: "footprint", x: 1.0, z: 1.55, s: 0.24, ry: -0.1, color: "#8C6A4F" },
        { type: "bush", x: -1.95, z: -0.45, s: 0.42, color: "#3AA76D" }
      ]
    }
  },
  {
    slug: "pista-de-corrida",
    name: "Pista de Corrida",
    audience: "meninos",
    short: "Painel quadriculado de largada, pedestais de pneu e pódio para o aniversariante.",
    description: "Clima de grande prêmio: painel quadriculado com faixa de largada, pedestais empilhados como pneus, uma mesa em formato de pódio com troféu e bandeiras de chegada nas laterais.",
    stage: { bg: "#F3F3F6", accent: "#E8402A" },
    commercial: null,
    parts: {
      panel: { title: "Painel quadriculado", text: "Painel retangular xadrez com faixa vermelha de largada no topo." },
      pedestals: { title: "Pedestais de pneu", text: "Pilhas de pneus estilizados com tampo colorido." },
      table: { title: "Mesa pódio", text: "Três degraus numerados, com o 1º lugar no centro." },
      accessories: { title: "Bandeiras e troféu", text: "Bandeiras quadriculadas, troféu dourado e cones de pista." }
    },
    composition: {
      base: { color: "#3C3F48", top: "#E6E8EE", radius: 2.35 },
      panel: { type: "checker", color: "#FFFFFF", dark: "#1D2230", banner: "#E8402A", post: "#E8402A" },
      pedestals: [
        { style: "tire", x: -1.6, z: 0.35, h: 0.75, r: 0.33, color: "#22252D", cap: "#E8402A" },
        { style: "tire", x: 1.6, z: 0.35, h: 0.55, r: 0.33, color: "#22252D", cap: "#F4B93F" },
        { style: "tire", x: 1.05, z: -0.15, h: 1.05, r: 0.3, color: "#22252D", cap: "#1E6FD9" }
      ],
      table: { style: "podium", x: -0.15, z: 0.6, w: 1.95, d: 0.6, h: 0.75, colors: ["#F4B93F", "#C9CED8", "#E39A5B"] },
      accessories: [
        { type: "trophy", on: "table", x: -0.15, z: 0.6, s: 0.32, color: "#F4B93F", feature: true },
        { type: "flag", x: -2.0, z: -0.25, h: 1.9, ry: 0.5 },
        { type: "flag", x: 2.0, z: -0.25, h: 1.9, ry: -0.5, mirror: true },
        { type: "cone", x: -0.95, z: 1.55, s: 0.22, color: "#FF7A2F" },
        { type: "cone", x: 0.75, z: 1.6, s: 0.22, color: "#FF7A2F" },
        { type: "tire-stack", on: "pedestal:0", s: 0.16, color: "#22252D" }
      ]
    }
  },
  {
    slug: "safari-dos-bichos",
    name: "Safari dos Bichos",
    audience: "meninos",
    short: "Painel em arco com vegetação, cilindros de madeira e bichinhos da savana.",
    description: "Uma expedição na savana: painel em arco com céu de fim de tarde e vegetação, cilindros com textura de madeira, mesa clara e animais estilizados — leão, girafa e elefante.",
    stage: { bg: "#F6F2E6", accent: "#3AA76D" },
    commercial: {
      kitId: "safari",
      confirmed: {
        source: "Título do kit no catálogo da Mimo & Monte",
        measures: ["Painel redondo de 1,50 m"],
        items: ["Painel redondo", "Capas de cilindros 3D"]
      }
    },
    parts: {
      panel: { title: "Painel em arco", text: "Arco com céu dourado, sol e vegetação contornando a borda." },
      pedestals: { title: "Cilindros de madeira", text: "Trio com textura de veios de madeira em tons naturais." },
      table: { title: "Mesa clara", text: "Mesa retangular em madeira clara com bolo de folhas." },
      accessories: { title: "Animais estilizados", text: "Leão, girafa e elefante em volumes simples e arredondados." }
    },
    composition: {
      base: { color: "#8B6B45", top: "#EFE4C8", radius: 2.35 },
      panel: { type: "arch", color: "#FFD58A", inner: "#FFB46B", sun: "#FFF1C2", leaves: ["#3AA76D", "#7DD3AE", "#2E7D4F"] },
      pedestals: [
        { style: "wood", x: -1.3, z: 0.05, h: 0.85, r: 0.33, color: "#C99A62" },
        { style: "wood", x: -0.65, z: 0.45, h: 0.6, r: 0.29, color: "#DDB27C" },
        { style: "wood", x: 1.35, z: 0.1, h: 1.0, r: 0.33, color: "#B9864E" }
      ],
      table: { style: "rect", x: 0.4, z: 0.75, w: 1.5, d: 0.6, h: 0.7, color: "#F3E6CF", trim: "#C99A62" },
      accessories: [
        { type: "lion", on: "pedestal:0", s: 0.3, color: "#F4B93F", mane: "#D9772E", feature: true },
        { type: "giraffe", x: 1.95, z: -0.2, s: 0.5, color: "#F4C35A", spots: "#B7742E" },
        { type: "elephant", on: "pedestal:2", s: 0.27, color: "#AEB4C2" },
        { type: "cake", on: "table", x: 0.4, z: 0.75, tiers: ["#7DD3AE", "#F3E6CF"], topper: "leaf", color: "#3AA76D" },
        { type: "bush", x: -1.95, z: -0.3, s: 0.45, color: "#3AA76D" },
        { type: "bush", x: -0.2, z: 1.65, s: 0.25, color: "#7DD3AE" }
      ]
    }
  },
  {
    slug: "construcao-em-festa",
    name: "Construção em Festa",
    audience: "meninos",
    short: "Painel de obra com guindaste, cilindros amarelos, cones e maquininhas.",
    description: "Um canteiro de obras divertido: painel de tijolinhos com moldura zebrada e guindaste, cilindros amarelos com faixa de sinalização, bancada decorada, cones e máquinas estilizadas.",
    stage: { bg: "#FBF4E2", accent: "#F4B93F" },
    commercial: null,
    parts: {
      panel: { title: "Painel de obra", text: "Parede de tijolinhos com moldura zebrada e guindaste lateral." },
      pedestals: { title: "Cilindros amarelos", text: "Trio amarelo com faixa preta e amarela de sinalização." },
      table: { title: "Bancada decorada", text: "Bancada de madeira com prateleira inferior e capacete de obra." },
      accessories: { title: "Cones e máquinas", text: "Cones de sinalização, escavadeira e caminhão basculante." }
    },
    composition: {
      base: { color: "#5A5E66", top: "#EDE7DA", radius: 2.35 },
      panel: { type: "construction", color: "#E39A5B", mortar: "#F6D8BE", stripe: "#F4B93F", crane: "#F4B93F" },
      pedestals: [
        { style: "stripes", x: -1.6, z: 0.2, h: 0.95, r: 0.3, color: "#F4B93F" },
        { style: "stripes", x: -1.05, z: 0.55, h: 0.62, r: 0.28, color: "#FFD049" },
        { style: "stripes", x: 1.55, z: 0.4, h: 0.78, r: 0.3, color: "#F4B93F" }
      ],
      table: { style: "workbench", x: 0.3, z: 0.6, w: 1.7, d: 0.6, h: 0.74, color: "#C99A62", frame: "#5A5E66" },
      accessories: [
        { type: "excavator", x: -0.6, z: 1.5, s: 0.42, color: "#F4B93F", feature: true },
        { type: "truck", on: "table", x: 0.75, z: 0.6, s: 0.3, color: "#FF7A2F" },
        { type: "helmet", on: "table", x: -0.05, z: 0.6, s: 0.2, color: "#F4B93F" },
        { type: "cone", x: 0.65, z: 1.65, s: 0.22, color: "#FF7A2F" },
        { type: "cone", on: "pedestal:2", s: 0.16, color: "#FF7A2F" },
        { type: "cone", x: 2.0, z: 0.85, s: 0.2, color: "#FF7A2F" }
      ]
    }
  },

  /* ---------------- MENINAS ---------------- */
  {
    slug: "jardim-encantado",
    name: "Jardim Encantado",
    audience: "meninas",
    short: "Painel floral vazado, cilindros canelados e borboletas sobre mesa oval.",
    description: "Um jardim de conto: painel vazado com recortes de flores, cilindros canelados em tons de rosa e verde, mesa oval com bolo florido, flores ao redor e borboletas pousando.",
    stage: { bg: "#FCEFF3", accent: "#F2669B" },
    commercial: null,
    parts: {
      panel: { title: "Painel floral vazado", text: "Painel de topo arredondado com flores recortadas que deixam o fundo aparecer." },
      pedestals: { title: "Cilindros canelados", text: "Trio com caneluras verticais em rosa, menta e creme." },
      table: { title: "Mesa oval", text: "Mesa oval branca com barrado rosa e bolo florido." },
      accessories: { title: "Borboletas e flores", text: "Borboletas de asas duplas e flores de cinco pétalas." }
    },
    composition: {
      base: { color: "#7DBE8F", top: "#EAF6E6", radius: 2.35 },
      panel: { type: "floral", color: "#FFFFFF", trim: "#F7B6CF", backdrop: "#9ED9B4", flowers: ["#F2669B", "#FFD36E", "#B79CEB"] },
      pedestals: [
        { style: "fluted", x: -1.45, z: 0.15, h: 0.9, r: 0.31, color: "#F7B6CF" },
        { style: "fluted", x: 1.0, z: 0.55, h: 0.6, r: 0.28, color: "#B7EAD1" },
        { style: "fluted", x: 1.55, z: -0.05, h: 1.1, r: 0.31, color: "#FFF1E0" }
      ],
      table: { style: "oval", x: -0.25, z: 0.7, w: 1.55, d: 0.75, h: 0.7, color: "#FFFFFF", trim: "#F7B6CF" },
      accessories: [
        { type: "butterfly", x: -1.0, y: 2.15, z: -0.55, s: 0.26, color: "#B79CEB", feature: true },
        { type: "butterfly", x: 1.2, y: 1.55, z: -0.45, s: 0.2, color: "#FF8A73", ry: -0.5 },
        { type: "butterfly", on: "pedestal:2", s: 0.18, color: "#F2669B" },
        { type: "cake", on: "table", x: -0.25, z: 0.7, tiers: ["#F7B6CF", "#FFFFFF"], topper: "flower", color: "#F2669B" },
        { type: "flower", x: -1.95, z: 0.55, s: 0.2, color: "#F2669B" },
        { type: "flower", x: -1.75, z: 0.95, s: 0.15, color: "#FFD36E" },
        { type: "flower", on: "pedestal:0", s: 0.16, color: "#B79CEB" },
        { type: "flower", x: 0.85, z: 1.55, s: 0.14, color: "#F2669B" },
        { type: "bush", x: 2.0, z: 0.6, s: 0.32, color: "#7DD3AE" }
      ]
    }
  },
  {
    slug: "sereias-do-oceano",
    name: "Sereias do Oceano",
    audience: "meninas",
    short: "Painel em concha, pedestais perolados, mesa ondulada, corais e bolhas.",
    description: "Um fundo do mar cintilante: painel em forma de concha com nervuras, pedestais perolados coroados por pérolas, mesa com saia ondulada, corais coloridos e bolhas flutuando.",
    stage: { bg: "#EAF5F8", accent: "#3BB5C7" },
    commercial: null,
    parts: {
      panel: { title: "Painel em concha", text: "Leque de concha com bordas recortadas e nervuras em relevo." },
      pedestals: { title: "Pedestais perolados", text: "Acabamento perolado iridescente com fio de pérolas no topo." },
      table: { title: "Mesa ondulada", text: "Mesa redonda com saia em ondas, como a espuma do mar." },
      accessories: { title: "Corais e bolhas", text: "Corais ramificados, estrela-do-mar e bolhas translúcidas." }
    },
    composition: {
      base: { color: "#4FA3B5", top: "#E9F1EC", radius: 2.35 },
      panel: { type: "shell", color: "#F9C9D6", rib: "#F3A8BE", pearl: "#FFF8F0" },
      pedestals: [
        { style: "pearl", x: -1.45, z: 0.35, h: 0.72, r: 0.3, color: "#F3D9E6" },
        { style: "pearl", x: 1.5, z: 0.3, h: 0.95, r: 0.31, color: "#CDEBF0" },
        { style: "pearl", x: 1.0, z: 0.8, h: 0.55, r: 0.25, color: "#E4DAF5" }
      ],
      table: { style: "wavy", x: -0.15, z: 0.5, w: 1.3, d: 1.3, h: 0.7, color: "#BFE6EA", trim: "#FFFFFF" },
      accessories: [
        { type: "coral", x: -1.9, z: -0.15, s: 1.05, color: "#FF8A73", feature: true },
        { type: "coral", x: 1.95, z: -0.3, s: 0.9, color: "#B79CEB" },
        { type: "starfish", on: "pedestal:0", s: 0.16, color: "#FFB46B" },
        { type: "cake", on: "table", x: -0.15, z: 0.5, tiers: ["#BFE6EA", "#F9C9D6"], topper: "shell", color: "#F9C9D6" },
        { type: "bubble", x: -1.25, y: 1.95, z: -0.3, r: 0.13 },
        { type: "bubble", x: -1.05, y: 2.35, z: -0.4, r: 0.08 },
        { type: "bubble", x: 1.3, y: 2.05, z: -0.35, r: 0.11 },
        { type: "bubble", x: 1.15, y: 1.55, z: 0.2, r: 0.07 },
        { type: "bubble", x: 0.55, y: 1.35, z: 0.55, r: 0.06 }
      ]
    }
  },
  {
    slug: "castelo-de-contos",
    name: "Castelo de Contos",
    audience: "meninas",
    short: "Painéis em forma de torres, cilindros lilás e uma mesa central de princesa.",
    description: "Um castelo de livro de histórias: três painéis recortados como torres com ameias, janelas e telhados cônicos, cilindros lilás, mesa central redonda com coroa e estrelas cintilantes.",
    stage: { bg: "#F4F0FB", accent: "#9B6BD9" },
    commercial: null,
    parts: {
      panel: { title: "Painéis-torre", text: "Três torres recortadas com ameias, janelas em arco e telhados cônicos." },
      pedestals: { title: "Cilindros lilás", text: "Trio lilás em degradê, do mais alto ao mais baixo." },
      table: { title: "Mesa central", text: "Mesa redonda com toalha e bolo de dois andares com coroa." },
      accessories: { title: "Estrelas e coroa", text: "Estrelas douradas, coroa e balões em tons de lavanda." }
    },
    composition: {
      base: { color: "#8A6BC2", top: "#F1EAF8", radius: 2.35 },
      panel: { type: "towers", color: "#E9DDF8", alt: "#F7D6E8", roof: "#9B6BD9", window: "#6E58A8", flag: "#F2669B" },
      pedestals: [
        { style: "plain", x: -1.55, z: 0.5, h: 0.95, r: 0.3, color: "#C9B3EF" },
        { style: "plain", x: 1.55, z: 0.5, h: 0.95, r: 0.3, color: "#C9B3EF" },
        { style: "plain", x: 1.0, z: 0.95, h: 0.55, r: 0.24, color: "#DCCDF5" }
      ],
      table: { style: "round", x: 0.0, z: 0.55, w: 1.2, d: 1.2, h: 0.72, color: "#FFFFFF", trim: "#C9B3EF" },
      accessories: [
        { type: "cake", on: "table", x: 0.0, z: 0.55, tiers: ["#C9B3EF", "#FFFFFF"], topper: "crown", color: "#F4B93F", feature: true },
        { type: "star", x: -0.95, y: 2.65, z: -0.4, s: 0.15, color: "#F4B93F" },
        { type: "star", x: 1.0, y: 2.55, z: -0.4, s: 0.13, color: "#FFE29A" },
        { type: "star", on: "pedestal:0", s: 0.13, color: "#F4B93F", standing: true },
        { type: "star", on: "pedestal:1", s: 0.13, color: "#F4B93F", standing: true },
        { type: "balloon", x: -2.0, y: 0.0, z: -0.3, color: "#C9B3EF", h: 1.8 },
        { type: "balloon", x: 2.0, y: 0.0, z: -0.3, color: "#F7D6E8", h: 1.9 }
      ]
    }
  },
  {
    slug: "bale-em-festa",
    name: "Balé em Festa",
    audience: "meninas",
    short: "Cortinas de teatro, pedestais rosados com tule e mesa de doces.",
    description: "Uma noite de estreia: painel com cortinas de teatro drapeadas e bandô recortado, pedestais rosados com saia de tule, mesa de doces com cupcakes, laços e sapatilhas de ponta.",
    stage: { bg: "#FCEEF2", accent: "#E0607E" },
    commercial: {
      kitId: "bailarina",
      confirmed: {
        source: "Título do kit no catálogo da Mimo & Monte",
        measures: ["Painel de 1,5 m"],
        items: ["Painel", "Trio de capas para cilindro"]
      }
    },
    parts: {
      panel: { title: "Painel de cortinas", text: "Moldura de palco com cortinas drapeadas e bandô em ondas." },
      pedestals: { title: "Pedestais rosados", text: "Trio rosado com saia de tule no topo, em três alturas." },
      table: { title: "Mesa de doces", text: "Mesa com toalha rosada, cupcakes e bolo com laço." },
      accessories: { title: "Laços e sapatilhas", text: "Sapatilhas de ponta com fitas e laços de cetim." }
    },
    composition: {
      base: { color: "#C95C7C", top: "#FBEAEF", radius: 2.35 },
      panel: { type: "curtain", color: "#FFE9F0", curtain: "#E0607E", frame: "#F4C76B", valance: "#C94A6A" },
      pedestals: [
        { style: "tutu", x: -1.5, z: 0.3, h: 0.85, r: 0.29, color: "#F7B6CF", tulle: "#FFFFFF" },
        { style: "tutu", x: 1.45, z: 0.15, h: 1.05, r: 0.29, color: "#F3A1BE", tulle: "#FFE9F0" },
        { style: "tutu", x: 1.85, z: 0.75, h: 0.6, r: 0.24, color: "#FBCFDF", tulle: "#FFFFFF" }
      ],
      table: { style: "sweets", x: -0.1, z: 0.65, w: 1.75, d: 0.62, h: 0.72, color: "#FFFFFF", trim: "#F7B6CF" },
      accessories: [
        { type: "slipper", on: "pedestal:0", s: 0.2, color: "#F7B6CF", feature: true },
        { type: "bow", on: "pedestal:1", s: 0.2, color: "#E0607E" },
        { type: "cake", on: "table", x: -0.1, z: 0.65, tiers: ["#F7B6CF", "#FFFFFF"], topper: "bow", color: "#E0607E" },
        { type: "cupcake", on: "table", x: -0.7, z: 0.6, s: 0.13, color: "#F7B6CF" },
        { type: "cupcake", on: "table", x: 0.5, z: 0.6, s: 0.13, color: "#FFFFFF" },
        { type: "slipper", x: -0.75, z: 1.55, s: 0.2, ry: 0.6, color: "#F7B6CF" },
        { type: "bow", x: 0.0, y: 2.62, z: -0.6, s: 0.22, color: "#E0607E" }
      ]
    }
  },
  {
    slug: "festa-das-nuvens",
    name: "Festa das Nuvens",
    audience: "meninas",
    short: "Arco-íris em relevo, pedestais em tons pastel e nuvens volumétricas.",
    description: "Um céu de algodão-doce: arco-íris em faixas pastel com nuvens nas pontas, pedestais em tons suaves de alturas variadas, mesa branca arredondada e nuvens fofas flutuando pelo cenário.",
    stage: { bg: "#EEF5FC", accent: "#6FB3E0" },
    commercial: null,
    parts: {
      panel: { title: "Painel arco-íris", text: "Arco-íris em cinco faixas pastel, com nuvens apoiando as pontas." },
      pedestals: { title: "Pedestais pastel", text: "Três pedestais em azul, amarelo e menta, com alturas variadas." },
      table: { title: "Mesa branca", text: "Mesa branca com cantos arredondados e bolo de nuvem." },
      accessories: { title: "Nuvens volumétricas", text: "Nuvens fofas, gotinhas de chuva e balões pastel." }
    },
    composition: {
      base: { color: "#8DBEE3", top: "#F3F8FD", radius: 2.35 },
      panel: { type: "rainbow", colors: ["#FF9AA2", "#FFC79A", "#FFE29A", "#B7EAD1", "#AFD8F4"], cloud: "#FFFFFF" },
      pedestals: [
        { style: "plain", x: -1.6, z: 0.6, h: 0.6, r: 0.29, color: "#AFD8F4" },
        { style: "plain", x: -1.0, z: 0.95, h: 0.4, r: 0.25, color: "#FFE29A" },
        { style: "plain", x: 1.6, z: 0.55, h: 0.85, r: 0.3, color: "#B7EAD1" }
      ],
      table: { style: "rounded", x: 0.2, z: 0.6, w: 1.5, d: 0.6, h: 0.7, color: "#FFFFFF", trim: "#AFD8F4" },
      accessories: [
        { type: "cloud", x: 0.15, y: 2.75, z: -0.25, s: 0.4, feature: true },
        { type: "cloud", x: -1.5, y: 1.75, z: 0.25, s: 0.25 },
        { type: "cloud", x: 1.6, y: 1.95, z: 0.15, s: 0.22 },
        { type: "cloud", on: "pedestal:2", s: 0.18 },
        { type: "cake", on: "table", x: 0.2, z: 0.6, tiers: ["#AFD8F4", "#FFFFFF"], topper: "cloud", color: "#FFFFFF" },
        { type: "drop", x: -1.45, y: 1.4, z: 0.3, s: 0.07, color: "#6FB3E0" },
        { type: "drop", x: -1.6, y: 1.25, z: 0.2, s: 0.06, color: "#6FB3E0" },
        { type: "balloon", x: 2.0, y: 0.0, z: -0.15, color: "#FFC79A", h: 1.75 },
        { type: "balloon", x: -2.0, y: 0.0, z: -0.2, color: "#B7EAD1", h: 1.85 }
      ]
    }
  }
];
