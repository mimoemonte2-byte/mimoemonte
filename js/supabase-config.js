/* =========================================================
   MIMO & MONTE — Configuração do Supabase
   Preencha as duas linhas abaixo com os dados do SEU projeto
   (Supabase > Project Settings > API):
   ========================================================= */

const SUPABASE_URL = "https://fmzvlffhjjemdiypafyt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nOGRU95wxoKrs4yYp7hWuA_yP7ShCdp";

const supabaseClient = (
  typeof window.supabase !== "undefined" &&
  SUPABASE_URL.startsWith("http") &&
  SUPABASE_ANON_KEY.length > 20
) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if(!supabaseClient){
  console.warn("[Mimo & Monte] Supabase ainda não configurado. Preencha SUPABASE_URL e SUPABASE_ANON_KEY em js/supabase-config.js. Até lá, o site funciona normalmente com o catálogo local (login, painel Gerente e Minha conta ficam desativados).");
}
