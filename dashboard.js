// =============================================================
// Dashboard — agenda semanal de aulões (Seg a Sex)
// =============================================================

const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

let analistas = [];
let semanaAtual = getSegundaFeira(new Date());

function getSegundaFeira(data) {
  const d = new Date(data);
  const diaSemana = d.getDay(); // 0 = domingo
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatarData(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ehHoje(d) {
  const hoje = new Date();
  return d.getFullYear() === hoje.getFullYear() &&
         d.getMonth() === hoje.getMonth() &&
         d.getDate() === hoje.getDate();
}

function diasDaSemana(segunda) {
  const dias = [];
  for (let i = 0; i < 5; i++) { // Seg a Sex
    const d = new Date(segunda);
    d.setDate(d.getDate() + i);
    dias.push(d);
  }
  return dias;
}

function atualizarLabelSemana(dias) {
  const inicio = dias[0], fim = dias[dias.length - 1];
  const label = inicio.getMonth() === fim.getMonth()
    ? `${inicio.getDate()} a ${fim.getDate()} de ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`
    : `${inicio.getDate()} de ${MESES[inicio.getMonth()]} a ${fim.getDate()} de ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`;
  document.getElementById("weekRange").textContent = label;
}

async function carregarAnalistas() {
  const { data, error } = await supabaseClient
    .from("analistas")
    .select("*")
    .order("nome", { ascending: true });
  if (error) {
    mostrarToast("Erro ao carregar responsáveis: " + error.message, "error");
    return [];
  }
  return data;
}

async function carregarAulaos(datasStr) {
  const { data, error } = await supabaseClient
    .from("aulaos")
    .select("*")
    .in("data", datasStr);
  if (error) {
    mostrarToast("Erro ao carregar agenda: " + error.message, "error");
    return [];
  }
  return data;
}

function montarSelectAnalistas(valorAtual) {
  const select = document.createElement("select");
  select.className = "inline-select";
  const optVazio = document.createElement("option");
  optVazio.value = "";
  optVazio.textContent = "— Selecionar —";
  select.appendChild(optVazio);
  analistas.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.nome;
    if (a.id === valorAtual) opt.selected = true;
    select.appendChild(opt);
  });
  return select;
}

async function salvarCampo(data, campo, valor) {
  const payload = { data, [campo]: valor, updated_at: new Date().toISOString() };
  const { error } = await supabaseClient
    .from("aulaos")
    .upsert(payload, { onConflict: "data" });

  const hint = document.getElementById("saveHint");
  if (error) {
    mostrarToast("Erro ao salvar: " + error.message, "error");
    return;
  }
  hint.classList.add("show");
  setTimeout(() => hint.classList.remove("show"), 1500);
}

async function renderizarSemana() {
  const tbody = document.getElementById("tabelaBody");
  tbody.innerHTML = `<tr class="loading-row"><td colspan="3">Carregando agenda...</td></tr>`;

  const dias = diasDaSemana(semanaAtual);
  atualizarLabelSemana(dias);
  const datasStr = dias.map(formatarData);

  const [aulaos] = await Promise.all([carregarAulaos(datasStr)]);
  const aulaoPorData = {};
  aulaos.forEach((a) => (aulaoPorData[a.data] = a));

  tbody.innerHTML = "";
  dias.forEach((d) => {
    const dataStr = formatarData(d);
    const registro = aulaoPorData[dataStr] || {};

    const tr = document.createElement("tr");
    if (ehHoje(d)) tr.classList.add("row-today");

    // Coluna dia
    const tdDia = document.createElement("td");
    tdDia.innerHTML = `<div class="day-label">${DIAS_SEMANA[d.getDay()]}</div>
                        <div class="day-sub">${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}</div>`;
    tr.appendChild(tdDia);

    // Coluna responsável
    const tdResp = document.createElement("td");
    const select = montarSelectAnalistas(registro.analista_id || "");
    select.addEventListener("change", () => salvarCampo(dataStr, "analista_id", select.value || null));
    tdResp.appendChild(select);
    tr.appendChild(tdResp);

    // Coluna tema
    const tdTema = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-input";
    input.placeholder = "Ex.: Como usar o módulo de Compras";
    input.value = registro.tema || "";
    let timeoutId;
    input.addEventListener("input", () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => salvarCampo(dataStr, "tema", input.value), 600);
    });
    input.addEventListener("blur", () => {
      clearTimeout(timeoutId);
      salvarCampo(dataStr, "tema", input.value);
    });
    tdTema.appendChild(input);
    tr.appendChild(tdTema);

    tbody.appendChild(tr);
  });
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

    document.getElementById("prevWeek").addEventListener("click", () => {
      semanaAtual.setDate(semanaAtual.getDate() - 7);
      renderizarSemana();
    });
    document.getElementById("nextWeek").addEventListener("click", () => {
      semanaAtual.setDate(semanaAtual.getDate() + 7);
      renderizarSemana();
    });
    document.getElementById("hojeBtn").addEventListener("click", () => {
      semanaAtual = getSegundaFeira(new Date());
      renderizarSemana();
    });

    analistas = await carregarAnalistas();
    await renderizarSemana();
  } catch (e) {
    mostrarErroFatal("Erro ao carregar o dashboard: " + e.message);
    document.getElementById("tabelaBody").innerHTML =
      `<tr><td colspan="3" style="text-align:center; color:#dc2626; padding:24px;">Não foi possível carregar a agenda. Veja o aviso vermelho no topo da página.</td></tr>`;
  }
}

iniciar();
