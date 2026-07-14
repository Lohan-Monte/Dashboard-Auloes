// =============================================================
// CRUD de responsáveis (analistas)
// =============================================================

async function carregarLista() {
  const container = document.getElementById("listaAnalistas");
  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  const { data, error } = await supabaseClient
    .from("analistas")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    mostrarToast("Erro ao carregar equipe: " + error.message, "error");
    container.innerHTML = `<div class="empty-state">Não foi possível carregar a equipe.</div>`;
    return;
  }

  if (!data.length) {
    container.innerHTML = `<div class="empty-state">Nenhum responsável cadastrado ainda. Adicione o primeiro acima.</div>`;
    return;
  }

  container.innerHTML = "";
  data.forEach((a) => {
    const row = document.createElement("div");
    row.className = "analista-row";
    row.innerHTML = `
      <div class="analista-info">
        <span class="color-dot" style="background:${a.cor || "#1A56DB"}"></span>
        <span>${escapeHtml(a.nome)}</span>
      </div>
      <button class="btn btn-danger" data-id="${a.id}" data-nome="${escapeHtml(a.nome)}">Remover</button>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => removerAnalista(btn.dataset.id, btn.dataset.nome));
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function removerAnalista(id, nome) {
  const confirmar = confirm(`Remover "${nome}" da equipe? Os aulões já atribuídos a essa pessoa ficarão sem responsável.`);
  if (!confirmar) return;

  const { error } = await supabaseClient.from("analistas").delete().eq("id", id);
  if (error) {
    mostrarToast("Erro ao remover: " + error.message, "error");
    return;
  }
  mostrarToast(`${nome} removido(a).`);
  carregarLista();
}

async function adicionarAnalista(nome, cor) {
  const { error } = await supabaseClient.from("analistas").insert({ nome, cor });
  if (error) {
    mostrarToast("Erro ao adicionar: " + error.message, "error");
    return;
  }
  mostrarToast(`${nome} adicionado(a) à equipe.`);
  carregarLista();
}

async function iniciar() {
  try {
    const session = await exigirLogin();
    if (!session) return;

    // Chegou aqui com sessão válida: reseta o contador de loop
    sessionStorage.removeItem("upseller_redirect_count");

    document.getElementById("userEmail").textContent = session.user.email;
    document.getElementById("avatarDot").textContent = iniciaisDe(session.user.email);

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });

    document.getElementById("addForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nomeInput = document.getElementById("nomeInput");
      const corInput = document.getElementById("corInput");
      const nome = nomeInput.value.trim();
      if (!nome) return;
      await adicionarAnalista(nome, corInput.value);
      nomeInput.value = "";
      corInput.value = "#1A56DB";
    });

    await carregarLista();
  } catch (e) {
    mostrarErroFatal("Erro ao carregar a página de responsáveis: " + e.message);
  }
}

iniciar();
