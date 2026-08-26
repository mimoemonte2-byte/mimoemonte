/* =========================================================
   MIMO & MONTE — Autenticação e área do usuário (Supabase)
   ========================================================= */

async function getSession(){
  if(!supabaseClient) return null;
  const { data } = await supabaseClient.auth.getSession();
  return data.session || null;
}

async function getCurrentUser(){
  const session = await getSession();
  return session ? session.user : null;
}

async function getProfile(userId){
  if(!supabaseClient || !userId) return null;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if(error) return null;
  return data;
}

async function signUp(email, password, nome){
  const { data, error } = await supabaseClient.auth.signUp({
    email, password,
    options: { data: { nome } }
  });
  if(error) throw error;
  return data;
}

async function signIn(email, password){
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}

async function signOut(){
  if(!supabaseClient) return;
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

/* Envia a foto para o bucket "avatars" e atualiza o perfil */
async function uploadAvatar(file){
  const user = await getCurrentUser();
  if(!user) throw new Error("Você precisa estar logado.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/avatar.${ext}`;
  const { error: uploadError } = await supabaseClient
    .storage.from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if(uploadError) throw uploadError;
  const { data: pub } = supabaseClient.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = pub.publicUrl + "?t=" + Date.now();
  const { error: updateError } = await supabaseClient
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if(updateError) throw updateError;
  return avatarUrl;
}

/* Usa em páginas protegidas (ex: minha-conta.html, admin.html).
   opts.role = "gerente" exige o papel de Gerente. */
async function requireAuth(opts = {}){
  if(!supabaseClient){
    window.location.href = "index.html";
    return null;
  }
  const user = await getCurrentUser();
  if(!user){
    window.location.href = "login.html?redirect=" + encodeURIComponent(location.pathname.split("/").pop());
    return null;
  }
  const profile = await getProfile(user.id);
  if(opts.role && profile?.role !== opts.role){
    window.location.href = "index.html";
    return null;
  }
  return { user, profile };
}

function initialsFrom(nome, email){
  const base = (nome || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if(parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

/* Injeta o botão de login/avatar no cabeçalho de qualquer página do site */
async function injectAuthHeader(){
  if(!supabaseClient) return;

  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;

  document.querySelectorAll(".header-actions").forEach(slot => {
    if(slot.querySelector(".auth-widget")) return;
    const wrap = document.createElement("div");
    wrap.className = "auth-widget";
    if(user){
      const avatarInner = profile?.avatar_url
        ? `<img src="${profile.avatar_url}" alt="${profile.nome || "Avatar"}">`
        : `<span>${initialsFrom(profile?.nome, user.email)}</span>`;
      wrap.innerHTML = `
        <button class="avatar-btn" id="auth-avatar-btn" aria-haspopup="true" aria-expanded="false" aria-label="Minha conta">
          <span class="avatar-circle">${avatarInner}</span>
        </button>
        <div class="avatar-menu" id="auth-avatar-menu">
          <div class="avatar-menu-head">
            <strong>${profile?.nome || "Minha conta"}</strong>
            <small>${user.email}</small>
          </div>
          <a href="minha-conta.html">👤 Minha conta</a>
          ${profile?.role === "gerente" ? '<a href="admin.html">🛠️ Painel Gerente</a>' : ""}
          <button type="button" id="auth-logout-btn">🚪 Sair</button>
        </div>`;
    } else {
      wrap.innerHTML = `<a class="btn btn-ghost btn-sm" href="login.html">Entrar</a>`;
    }
    const hamburger = slot.querySelector(".hamburger");
    if(hamburger) slot.insertBefore(wrap, hamburger);
    else slot.appendChild(wrap);
  });

  document.querySelectorAll(".mobile-nav").forEach(slot => {
    if(slot.querySelector(".auth-widget-mobile")) return;
    const wrap = document.createElement("div");
    wrap.className = "auth-widget-mobile";
    if(user){
      wrap.innerHTML = `
        <a href="minha-conta.html">👤 Minha conta</a>
        ${profile?.role === "gerente" ? '<a href="admin.html">🛠️ Painel Gerente</a>' : ""}
        <button type="button" class="btn btn-ghost btn-sm btn-block" id="auth-logout-btn-mobile">Sair</button>`;
    } else {
      wrap.innerHTML = `<a class="btn btn-secondary btn-block" href="login.html">Entrar / Cadastrar</a>`;
    }
    slot.appendChild(wrap);
  });

  document.querySelectorAll("#auth-logout-btn, #auth-logout-btn-mobile").forEach(btn => {
    btn.addEventListener("click", signOut);
  });

  const avatarBtn = document.querySelector("#auth-avatar-btn");
  const avatarMenu = document.querySelector("#auth-avatar-menu");
  if(avatarBtn && avatarMenu){
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarMenu.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if(!avatarMenu.contains(e.target) && e.target !== avatarBtn){
        avatarMenu.classList.remove("open");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", injectAuthHeader);
