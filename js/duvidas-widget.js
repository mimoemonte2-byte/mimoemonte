/* =========================================================
   MIMO & MONTE — Botão de dúvidas flutuante (estilo "Globalinho")
   Não é um chat com IA: a mensagem é salva no Supabase e a
   equipe responde depois (e-mail/WhatsApp), igual ao modelo
   usado no Global Engenharia Academy.
   ========================================================= */

function buildDuvidasWidget(){
  if(document.querySelector("#mimo-duvidas-float")) return;

  const float = document.createElement("button");
  float.id = "mimo-duvidas-float";
  float.className = "mimo-float";
  float.type = "button";
  float.setAttribute("aria-label", "Dúvidas — falar com a Mimo & Monte");
  float.innerHTML = `<img src="images/mimo-face.png" alt="">`;

  const panel = document.createElement("div");
  panel.id = "mimo-duvidas-panel";
  panel.className = "mimo-panel";
  panel.innerHTML = `
    <div class="mimo-panel-head">
      <img src="images/mimo-face.png" alt="">
      <div>
        <strong>Fale com a Mimo</strong>
        <small>Normalmente respondemos em até 24h</small>
      </div>
      <button type="button" class="mimo-panel-close" aria-label="Fechar">✕</button>
    </div>
    <div class="mimo-panel-body">
      <p>Oi! Deixe sua dúvida aqui embaixo que nossa equipe te responde por e-mail ou WhatsApp. 💌</p>
      <form id="mimo-duvidas-form" class="stack">
        <div class="field">
          <label for="mimo-nome">Seu nome</label>
          <input id="mimo-nome" name="nome" type="text" required>
        </div>
        <div class="field">
          <label for="mimo-email">Seu e-mail ou WhatsApp</label>
          <input id="mimo-email" name="email" type="text" required>
        </div>
        <div class="field">
          <label for="mimo-mensagem">Sua dúvida</label>
          <textarea id="mimo-mensagem" name="mensagem" required placeholder="Ex: o kit tal está disponível pra dia 20?"></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Enviar dúvida</button>
      </form>
      <div id="mimo-duvidas-success" class="notice-box" style="display:none;">
        Recebemos sua dúvida! Vamos te responder em breve. 💛
      </div>
    </div>`;

  document.body.appendChild(float);
  document.body.appendChild(panel);

  float.addEventListener("click", () => {
    panel.classList.toggle("open");
  });
  panel.querySelector(".mimo-panel-close").addEventListener("click", () => {
    panel.classList.remove("open");
  });

  const form = panel.querySelector("#mimo-duvidas-form");
  const successBox = panel.querySelector("#mimo-duvidas-success");

  prefillFromLoggedInUser(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    const email = form.email.value.trim();
    const mensagem = form.mensagem.value.trim();
    if(!nome || !email || !mensagem) return;

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    if(!supabaseClient){
      // Supabase ainda não configurado: manda pelo WhatsApp como alternativa
      const msg = `Olá! Meu nome é ${nome} (${email}). Minha dúvida: ${mensagem}`;
      window.open(whatsappLink(msg), "_blank", "noopener");
      form.reset();
      prefillFromLoggedInUser(form);
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar dúvida";
      return;
    }

    try{
      const user = await getCurrentUser();
      const { error } = await supabaseClient.from("duvidas").insert({
        user_id: user ? user.id : null,
        nome, email, mensagem
      });
      if(error) throw error;
      form.style.display = "none";
      successBox.style.display = "block";
      setTimeout(() => {
        panel.classList.remove("open");
        form.style.display = "";
        successBox.style.display = "none";
        form.reset();
        prefillFromLoggedInUser(form);
      }, 3200);
    }catch(err){
      alert("Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.");
      console.error(err);
    }finally{
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar dúvida";
    }
  });
}

async function prefillFromLoggedInUser(form){
  if(!supabaseClient) return;
  const user = await getCurrentUser();
  if(!user) return;
  const profile = await getProfile(user.id);
  if(profile?.nome) form.nome.value = profile.nome;
  if(user.email) form.email.value = user.email;
}

document.addEventListener("DOMContentLoaded", buildDuvidasWidget);
