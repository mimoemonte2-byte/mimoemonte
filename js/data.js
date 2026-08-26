/* =========================================================
   MIMO & MONTE — Dados do site (catálogo, FAQ, contato)
   Estrutura pensada para ser facilmente substituída por um
   painel administrativo / backend futuramente.
   ========================================================= */

/* Placeholders de contato — SUBSTITUIR pelos dados reais antes de publicar */
const SITE_CONFIG = {
  nomeFantasia: "Mimo & Monte",
  whatsapp: "", // ex: "5515900000000" (apenas números, com DDI 55)
  whatsappDisplay: "[WhatsApp a confirmar]",
  telefone: "[Telefone a confirmar]",
  email: "[e-mail a confirmar]",
  instagram: "[@mimoemonte — a confirmar]",
  instagramUrl: "#",
  endereco: "[Endereço de retirada a confirmar]",
  horario: "[Horário de atendimento a confirmar]",
  cidadeReferencia: "Sorocaba/SP" // conforme foro definido em contrato
};

/* Mensagem padrão enviada ao clicar em botões de WhatsApp */
function whatsappLink(mensagem){
  const numero = SITE_CONFIG.whatsapp;
  const texto = encodeURIComponent(mensagem || "Olá! Vim pelo site da Mimo & Monte e gostaria de consultar disponibilidade de um kit. 🎉");
  if(!numero){
    return "https://wa.me/?text=" + texto; // sem número cadastrado ainda — placeholder funcional
  }
  return "https://wa.me/" + numero + "?text=" + texto;
}

/* ---------------------------------------------------------
   Catálogo inicial — 17 kits Pegue e Monte
   Todos com: locação, R$ 180,00, status disponível.
   "photo": null => ainda não há foto autorizada; o card
   renderiza um placeholder temático bonito no lugar.
   "refUrl": link do anúncio de referência usado apenas para
   identificar título/tema (uso interno, não exibido ao público).
--------------------------------------------------------- */
const KITS = [
  {
    id: "hulk-vingador",
    title: "Kit Festa Painel + Trio de Cilindros Incrível Hulk Vingador",
    category: "herois",
    categoryLabel: "Heróis",
    icon: "💥",
    colorFrom: "#CFF3DC", colorTo: "#9FE3B8",
    price: 180,
    status: "disponivel",
    photo: "images/kits/hulk-vingador.jpg",
    refUrl: "https://www.mercadolivre.com.br/kit-festa-painel-trio-de-cilindros-incrivel-hulk-vingador/p/MLB2092913129?pdp_filters=item_id:MLB4975509657"
  },
  {
    id: "morcego",
    title: "Kit Painel 1,5 m + Trio Capa Cilindro Morcego Pegue e Monte",
    category: "herois",
    categoryLabel: "Heróis",
    icon: "🦇",
    colorFrom: "#DCE3F5", colorTo: "#AEBBE8",
    price: 180,
    status: "disponivel",
    photo: "images/kits/morcego.jpg",
    refUrl: "https://www.mercadolivre.com.br/kit-painel-15-m--trio-capa-cilindro-morcego-pegue-e-monte/up/MLBU3985495364?pdp_filters=item_id:MLB6800385994"
  },
  {
    id: "bailarina",
    title: "Kit Painel 1,5 m + Trio Capa Cilindro Pegue Monte Bailarina",
    category: "bailarina",
    categoryLabel: "Bailarina",
    icon: "🩰",
    colorFrom: "#FBE1EE", colorTo: "#F3B8D6",
    price: 180,
    status: "disponivel",
    photo: "images/kits/bailarina.jpg",
    refUrl: "https://www.mercadolivre.com.br/kit-painel-15-m--trio-capa-cilindro-pegue-monte-bailarina/up/MLBU3985486718?pdp_filters=item_id:MLB6800348238"
  },
  {
    id: "temas-comemorativos",
    title: "Capas Cilindro + Painel 1,50 Temas Comemorativos Tecido",
    category: "variados",
    categoryLabel: "Temas variados",
    icon: "🎉",
    colorFrom: "#FFE3DB", colorTo: "#FFB9A6",
    price: 180,
    status: "disponivel",
    photo: "images/kits/temas-comemorativos.jpg",
    refUrl: "https://produto.mercadolivre.com.br/MLB-3442787887-capas-cilindro-painel-150-temas-comemorativos-tecido-_JM"
  },
  {
    id: "cavalos",
    title: "Capa Painel Redondo Cavalos + Trio Cilindros Pegue Monte",
    category: "animais",
    categoryLabel: "Animais",
    icon: "🐴",
    colorFrom: "#F2E6D6", colorTo: "#DDC29A",
    price: 180,
    status: "disponivel",
    photo: "images/kits/cavalos.jpg",
    refUrl: "https://produto.mercadolivre.com.br/MLB-1849577414-capa-painel-redondo-cavalos-trio-cilindros-pegue-monte-_JM"
  },
  {
    id: "roblox",
    title: "Painel Redondo + Trio De Cilindro Capas Sublimados Rblox",
    category: "anime-games",
    categoryLabel: "Anime e games",
    icon: "🎮",
    colorFrom: "#D9F2E4", colorTo: "#A9E0C0",
    price: 180,
    status: "disponivel",
    photo: "images/kits/roblox.jpg",
    refUrl: "https://www.mercadolivre.com.br/painel-redondo-trio-de-cilindro-capas-sublimados-rblox/p/MLB2065651757"
  },
  {
    id: "temas-herois-trio",
    title: "Trio Capas Cilindros Painel Redondo Pegue Monte Temas Heróis",
    category: "herois",
    categoryLabel: "Heróis",
    icon: "🦸",
    colorFrom: "#DCEBFC", colorTo: "#A9CEF5",
    price: 180,
    status: "disponivel",
    photo: "images/kits/temas-herois-trio.jpg",
    refUrl: "https://produto.mercadolivre.com.br/MLB-5315102856-trio-capas-cilindros-painel-redondo-pegue-monte-temas-herois-_JM"
  },
  {
    id: "super-herois-289",
    title: "Kit Painel + Trio Capas de Cilindros Tema Super Heróis 289",
    category: "herois",
    categoryLabel: "Heróis",
    icon: "🦸‍♂️",
    colorFrom: "#DCEBFC", colorTo: "#A9CEF5",
    price: 180,
    status: "disponivel",
    photo: "images/kits/super-herois-289.jpg",
    refUrl: "https://www.mercadolivre.com.br/kit-painel-trio-capas-de-cilindros-tema-super-herois-289/p/MLB2101672626"
  },
  {
    id: "anime-decor",
    title: "Capas Para Cilindros + Painel - Anime - Kit Decoração Festa",
    category: "anime-games",
    categoryLabel: "Anime e games",
    icon: "⭐",
    colorFrom: "#EBE1FA", colorTo: "#CDB3EF",
    price: 180,
    status: "disponivel",
    photo: "images/kits/anime-decor.jpg",
    refUrl: "https://www.mercadolivre.com.br/capas-para-cilindros-painel-anime-kit-decoracao-festa/p/MLB2085200145"
  },
  {
    id: "boteco-2",
    title: "Kit Painel + Trio Capas De Cilindros Tema Boteco 2",
    category: "boteco",
    categoryLabel: "Boteco",
    icon: "🍻",
    colorFrom: "#FDEFCB", colorTo: "#F6D480",
    price: 180,
    status: "disponivel",
    photo: "images/kits/boteco-2.jpg",
    refUrl: "https://www.mercadolivre.com.br/kit-painel-trio-capas-de-cilindros-tema-boteco-2/p/MLB2092719961"
  },
  {
    id: "super-herois-290",
    title: "Kit Painel +trio Capas De Cilindros Tema Super Heróis 290",
    category: "herois",
    categoryLabel: "Heróis",
    icon: "🛡️",
    colorFrom: "#FFE1DD", colorTo: "#FBB2A8",
    price: 180,
    status: "disponivel",
    photo: "images/kits/super-herois-290.jpg",
    refUrl: "https://www.mercadolivre.com.br/kit-painel-trio-capas-de-cilindros-tema-super-herois-290/p/MLB2101654960"
  },
  {
    id: "safari",
    title: "Painel Redondo 1,50m + Capas Cilindros 3D Pegue Monte Safari",
    category: "safari",
    categoryLabel: "Safari",
    icon: "🦁",
    colorFrom: "#E9F3D9", colorTo: "#C4E1A0",
    price: 180,
    status: "disponivel",
    photo: "images/kits/safari.jpg",
    refUrl: "https://www.mercadolivre.com.br/painel-redondo-150m--capas-cilindros-3d-pegue-monte-safari/up/MLBU4598055859"
  },
  {
    id: "cha-revelacao",
    title: "Painel Redondo + Capas Cilindros Chá Revelação Pegue Monte",
    category: "cha-revelacao",
    categoryLabel: "Chá revelação",
    icon: "👶",
    colorFrom: "#DDEBFC", colorTo: "#F6C9DC",
    price: 180,
    status: "disponivel",
    photo: "images/kits/cha-revelacao.jpg",
    refUrl: "https://www.mercadolivre.com.br/painel-redondo--capas-cilindros-cha-revelacao-pegue-monte/up/MLBU4626602350"
  },
  {
    id: "veste-facil",
    title: "Capa Painel Redondo + Trio Cilindro Veste Fácil Pegue Monte",
    category: "variados",
    categoryLabel: "Temas variados",
    icon: "🎀",
    colorFrom: "#EBE1FA", colorTo: "#CDB3EF",
    price: 180,
    status: "disponivel",
    photo: "images/kits/veste-facil.jpg",
    refUrl: "https://produto.mercadolivre.com.br/MLB-3032101354-capa-painel-redondo-trio-cilindro-veste-facil-pegue-monte-_JM"
  },
  {
    id: "mais-vendidos",
    title: "Trio Capas Cilindros + Painel Tema Mais Vendidos",
    category: "variados",
    categoryLabel: "Temas variados",
    icon: "✨",
    colorFrom: "#FFE3DB", colorTo: "#FFB9A6",
    price: 180,
    status: "disponivel",
    photo: "images/kits/mais-vendidos.jpg",
    refUrl: "https://produto.mercadolivre.com.br/MLB-3738730619-trio-capas-cilindros-painel-tema-mais-vendidos-_JM"
  },
  {
    id: "happy-birthday-1",
    title: "Trio Capa Cilindro + Painel Tema Happy Birthday Veste Fácil – Preto e Dourado",
    category: "aniversario",
    categoryLabel: "Aniversário",
    icon: "🎂",
    colorFrom: "#FDEFCB", colorTo: "#F6D480",
    price: 180,
    status: "disponivel",
    photo: "images/kits/happy-birthday-1.jpg",
    refUrl: "https://produto.mercadolivre.com.br/MLB-2684832523-trio-capa-cilindro-painel-tema-happy-birthday-veste-facil-_JM"
  },
  {
    id: "happy-birthday-2",
    title: "Trio Capa Cilindro + Painel Tema Happy Birthday Veste Fácil – Rosê",
    category: "aniversario",
    categoryLabel: "Aniversário",
    icon: "🎈",
    colorFrom: "#DCEBFC", colorTo: "#A9CEF5",
    price: 180,
    status: "disponivel",
    photo: "images/kits/happy-birthday-2.jpg",
    refUrl: "https://produto.mercadolivre.com.br/MLB-2684826911-trio-capa-cilindro-painel-tema-happy-birthday-veste-facil-_JM"
  }
];

/* ---------------------------------------------------------
   Perguntas frequentes — respostas alinhadas ao contrato
   "Contrato de Locação Pegue e Monte" da Mimo & Monte.
--------------------------------------------------------- */
const FAQ = [
  {
    q: "Como funciona o Pegue e Monte?",
    a: "Você escolhe o kit, retira na data combinada e faz a montagem no local da sua festa, no seu tempo e do seu jeito. É simples, prático e deixa a decoração com a sua cara."
  },
  {
    q: "Como faço uma reserva?",
    a: "Escolha o kit desejado, clique em “Consultar disponibilidade” e fale com a nossa equipe pelo WhatsApp informando o tema e a data do evento. Vamos confirmar a disponibilidade e te passar todos os próximos passos."
  },
  {
    q: "A solicitação garante a reserva?",
    a: "Não. A simples solicitação ou consulta não garante a reserva da data. A reserva só é confirmada mediante o pagamento de 50% do valor total da locação (sinal)."
  },
  {
    q: "Quanto preciso pagar para confirmar?",
    a: "É necessário o pagamento de 50% do valor total da locação como sinal para confirmar a sua reserva."
  },
  {
    q: "Existe cobrança de caução?",
    a: "Sim. É exigida uma caução como garantia da integridade dos itens locados. O valor é informado no momento da reserva."
  },
  {
    q: "Quando a caução é devolvida?",
    a: "A caução é devolvida após a conferência dos itens devolvidos, verificando se tudo está completo e nas condições combinadas."
  },
  {
    q: "Como funcionam retirada e devolução?",
    a: "A retirada e a devolução são feitas nas datas combinadas no momento da reserva, mediante checklist de conferência dos itens do kit."
  },
  {
    q: "Os itens precisam ser devolvidos limpos?",
    a: "Sim. Os itens devem ser devolvidos limpos e nas mesmas condições em que foram entregues."
  },
  {
    q: "Posso cancelar ou mudar a data?",
    a: "Cancelamentos com até 15 dias de antecedência têm reembolso integral do sinal. Entre 7 e 14 dias, há retenção de 50% do sinal. Com menos de 7 dias, não há devolução do sinal. Para alterações de data, fale com a nossa equipe — cada caso será avaliado conforme a disponibilidade."
  },
  {
    q: "O que acontece se algum item for danificado?",
    a: "Qualquer dano, quebra, perda, extravio ou furto é de responsabilidade do contratante, que deverá ressarcir integralmente o valor de um item novo equivalente ao danificado ou perdido."
  },
  {
    q: "Existe multa por atraso?",
    a: "Sim. É cobrada multa de R$ 200,00 por dia de atraso na devolução dos itens."
  },
  {
    q: "A Mimo & Monte realiza a montagem?",
    a: "No modelo Pegue e Monte, a montagem é feita por você, de forma fácil e guiada, no local do seu evento. A Mimo & Monte não realiza o serviço de montagem — assim você tem liberdade para montar do seu jeito, no seu tempo."
  }
];
