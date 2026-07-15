// =============================================================
// Dashboard — agenda semanal de aulões (Seg a Sex)
// =============================================================

const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DIAS_SEMANA_CURTO = ["2ª", "3ª", "4ª", "5ª", "6ª", "Sá", "Do"]; // começa na segunda
const LIMITE_DIAS_PERIODO = 90;

let analistas = [];
let semanaAtual = getSegundaFeira(new Date());

// Modo de exibição: "semana" (padrão) ou "periodo" (filtro aplicado)
let modoAtual = "semana";
let periodoInicio = null;
let periodoFim = null;

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

function formatarDataBR(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function ehHoje(d) {
  const hoje = new Date();
  return d.getFullYear() === hoje.getFullYear() &&
         d.getMonth() === hoje.getMonth() &&
         d.getDate() === hoje.getDate();
}

function mesmoDia(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
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

// Todas as datas entre inicio e fim (inclusive), em ordem
function diasDoPeriodo(inicio, fim) {
  const dias = [];
  const d = new Date(inicio);
  d.setHours(0, 0, 0, 0);
  const fimLimpo = new Date(fim);
  fimLimpo.setHours(0, 0, 0, 0);
  while (d <= fimLimpo) {
    dias.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

function diferencaDias(a, b) {
  const ms = new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86400000);
}

function labelSemana(dias) {
  const inicio = dias[0], fim = dias[dias.length - 1];
  return inicio.getMonth() === fim.getMonth()
    ? `${inicio.getDate()} a ${fim.getDate()} de ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`
    : `${inicio.getDate()} de ${MESES[inicio.getMonth()]} a ${fim.getDate()} de ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`;
}

function labelPeriodo(inicio, fim) {
  return `${formatarDataBR(inicio)} a ${formatarDataBR(fim)}`;
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

async function renderizarDias(dias, labelTexto) {
  const tbody = document.getElementById("tabelaBody");
  tbody.innerHTML = `<tr class="loading-row"><td colspan="3">Carregando agenda...</td></tr>`;

  document.getElementById("weekRange").textContent = labelTexto;

  const tableWrap = document.querySelector(".table-wrap");
  tableWrap.classList.toggle("periodo-mode", modoAtual === "periodo");

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

async function renderizarSemana() {
  modoAtual = "semana";
  document.getElementById("tituloCard").textContent = "Semana";
  document.getElementById("weekNavGroup").style.display = "";
  document.getElementById("limparPeriodoBtn").hidden = true;
  document.getElementById("periodoChipLabel").textContent = "Selecionar período";
  marcarSegmentoAtivo(null);
  const dias = diasDaSemana(semanaAtual);
  await renderizarDias(dias, labelSemana(dias));
}

async function renderizarPeriodo() {
  modoAtual = "periodo";
  document.getElementById("tituloCard").textContent = "Período selecionado";
  document.getElementById("weekNavGroup").style.display = "none";
  document.getElementById("limparPeriodoBtn").hidden = false;
  document.getElementById("periodoChipLabel").textContent = labelPeriodo(periodoInicio, periodoFim);
  const dias = diasDoPeriodo(periodoInicio, periodoFim);
  await renderizarDias(dias, labelPeriodo(periodoInicio, periodoFim));
}

// Destaca o botão do atalho ativo na barra segmentada ("Últimos 7 dias" etc.).
// tipo = "7d" | "30d" | "mes" | "custom" (data avulsa, marca o botão de data) | null (nenhum)
function marcarSegmentoAtivo(tipo) {
  document.querySelectorAll(".segment-btn").forEach((btn) => btn.classList.remove("active"));
  if (!tipo) return;
  if (tipo === "custom") {
    document.getElementById("abrirPeriodoBtn").classList.add("active");
  } else {
    const btn = document.querySelector(`.segment-btn[data-quick="${tipo}"]`);
    if (btn) btn.classList.add("active");
  }
}

// =============================================================
// Filtro por período — seletor de duas datas com calendário duplo
// =============================================================

let calMesEsquerda = getSegundaFeira(new Date()); // âncora do mês exibido à esquerda
let selInicio = null;
let selFim = null;

function primeiroDiaDoMes(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function construirGradeMes(anchor) {
  const primeiro = primeiroDiaDoMes(anchor);
  const diaSemanaPrimeiro = primeiro.getDay(); // 0=domingo
  // deslocamento para começar na segunda-feira
  const deslocamento = diaSemanaPrimeiro === 0 ? 6 : diaSemanaPrimeiro - 1;
  const inicioGrade = new Date(primeiro);
  inicioGrade.setDate(inicioGrade.getDate() - deslocamento);

  const dias = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicioGrade);
    d.setDate(d.getDate() + i);
    dias.push(d);
  }
  return dias;
}

function renderizarCalendario(gridEl, tituloEl, anchor) {
  tituloEl.textContent = `${MESES[anchor.getMonth()]} de ${anchor.getFullYear()}`;
  gridEl.innerHTML = "";

  DIAS_SEMANA_CURTO.forEach((label) => {
    const el = document.createElement("div");
    el.className = "cal-weekday";
    el.textContent = label;
    gridEl.appendChild(el);
  });

  const dias = construirGradeMes(anchor);
  dias.forEach((d) => {
    const el = document.createElement("div");
    el.className = "cal-day";
    el.textContent = d.getDate();

    if (d.getMonth() !== anchor.getMonth()) el.classList.add("other-month");
    if (ehHoje(d)) el.classList.add("is-today");

    if (selInicio && mesmoDia(d, selInicio)) el.classList.add("range-start");
    if (selFim && mesmoDia(d, selFim)) el.classList.add("range-end");
    if (selInicio && selFim && d > selInicio && d < selFim) el.classList.add("in-range");

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      selecionarDataCalendario(new Date(d));
    });
    gridEl.appendChild(el);
  });
}

function renderizarCalendarios() {
  const mesDireita = new Date(calMesEsquerda.getFullYear(), calMesEsquerda.getMonth() + 1, 1);
  renderizarCalendario(document.getElementById("calGridLeft"), document.getElementById("calTitleLeft"), calMesEsquerda);
  renderizarCalendario(document.getElementById("calGridRight"), document.getElementById("calTitleRight"), mesDireita);

  document.getElementById("inicioInput").value = selInicio ? formatarDataBR(selInicio) : "";
  document.getElementById("fimInput").value = selFim ? formatarDataBR(selFim) : "";

  const aviso = document.getElementById("periodoAvisoLimite");
  if (selInicio && selFim && diferencaDias(selInicio, selFim) + 1 > LIMITE_DIAS_PERIODO) {
    aviso.textContent = `Máximo de ${LIMITE_DIAS_PERIODO} dias por período.`;
  } else {
    aviso.textContent = "";
  }
}

function selecionarDataCalendario(d) {
  d.setHours(0, 0, 0, 0);
  if (!selInicio || (selInicio && selFim)) {
    selInicio = d;
    selFim = null;
  } else {
    if (d < selInicio) {
      selFim = selInicio;
      selInicio = d;
    } else {
      selFim = d;
    }
  }
  renderizarCalendarios();
}

function definirIntervaloRapido(tipo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (tipo === "hoje") {
    selInicio = new Date(hoje);
    selFim = new Date(hoje);
  } else if (tipo === "7d") {
    selFim = new Date(hoje);
    selInicio = new Date(hoje);
    selInicio.setDate(selInicio.getDate() - 6);
  } else if (tipo === "30d") {
    selFim = new Date(hoje);
    selInicio = new Date(hoje);
    selInicio.setDate(selInicio.getDate() - 29);
  } else if (tipo === "mes") {
    selInicio = primeiroDiaDoMes(hoje);
    selFim = new Date(hoje);
  }

  calMesEsquerda = primeiroDiaDoMes(selInicio);
  renderizarCalendarios();
}

function abrirPopoverPeriodo() {
  // Pré-carrega com o período já filtrado (se houver) ou os últimos 7 dias
  if (modoAtual === "periodo" && periodoInicio && periodoFim) {
    selInicio = new Date(periodoInicio);
    selFim = new Date(periodoFim);
  } else {
    selInicio = null;
    selFim = null;
  }
  calMesEsquerda = primeiroDiaDoMes(selInicio || new Date());
  renderizarCalendarios();
  document.getElementById("periodoPopover").hidden = false;
}

function fecharPopoverPeriodo() {
  document.getElementById("periodoPopover").hidden = true;
}

function configurarFiltroPeriodo() {
  // Botão de data (canto direito da barra) abre o popover de calendário para período customizado
  document.getElementById("abrirPeriodoBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    abrirPopoverPeriodo();
  });

  // Atalhos "Últimos 7 dias" / "Últimos 30 dias" / "Este mês" aplicam o filtro na hora,
  // sem precisar abrir o popover — igual ao comportamento de referência.
  document.querySelectorAll('.segment-btn[data-quick]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      fecharPopoverPeriodo();
      const tipo = btn.dataset.quick;
      definirIntervaloRapido(tipo);
      periodoInicio = selInicio;
      periodoFim = selFim;
      marcarSegmentoAtivo(tipo);
      renderizarPeriodo();
    });
  });

  document.getElementById("cancelarPeriodoBtn").addEventListener("click", fecharPopoverPeriodo);

  document.getElementById("aplicarPeriodoBtn").addEventListener("click", () => {
    if (!selInicio || !selFim) {
      mostrarToast("Selecione a data inicial e a data final.", "error");
      return;
    }
    if (diferencaDias(selInicio, selFim) + 1 > LIMITE_DIAS_PERIODO) {
      mostrarToast(`O período não pode ultrapassar ${LIMITE_DIAS_PERIODO} dias.`, "error");
      return;
    }
    periodoInicio = selInicio;
    periodoFim = selFim;
    fecharPopoverPeriodo();
    marcarSegmentoAtivo("custom");
    renderizarPeriodo();
  });

  document.getElementById("limparPeriodoBtn").addEventListener("click", () => {
    periodoInicio = null;
    periodoFim = null;
    semanaAtual = getSegundaFeira(new Date());
    renderizarSemana();
  });

  document.querySelectorAll(".cal-nav").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.nav;
      const novo = new Date(calMesEsquerda);
      if (nav === "prev-month") novo.setMonth(novo.getMonth() - 1);
      if (nav === "next-month") novo.setMonth(novo.getMonth() + 1);
      if (nav === "prev-year") novo.setFullYear(novo.getFullYear() - 1);
      if (nav === "next-year") novo.setFullYear(novo.getFullYear() + 1);
      calMesEsquerda = novo;
      renderizarCalendarios();
    });
  });

  // Fecha o popover ao clicar fora dele.
  // Importante: usamos composedPath() em vez de popover.contains(e.target),
  // porque um clique num dia do calendário reconstrói o grid (o elemento
  // clicado é removido do DOM durante o próprio handler). Nesse caso
  // "contains" já retorna falso e fecharia o popover incorretamente.
  // composedPath() reflete a árvore no momento do clique, antes da remoção.
  document.addEventListener("click", (e) => {
    const popover = document.getElementById("periodoPopover");
    const abrirBtn = document.getElementById("abrirPeriodoBtn");
    if (popover.hidden) return;
    const caminho = e.composedPath();
    if (caminho.includes(popover) || caminho.includes(abrirBtn)) return;
    fecharPopoverPeriodo();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharPopoverPeriodo();
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

    configurarFiltroPeriodo();

    analistas = await carregarAnalistas();
    await renderizarSemana();
  } catch (e) {
    mostrarErroFatal("Erro ao carregar o dashboard: " + e.message);
    document.getElementById("tabelaBody").innerHTML =
      `<tr><td colspan="3" style="text-align:center; color:#dc2626; padding:24px;">Não foi possível carregar a agenda. Veja o aviso vermelho no topo da página.</td></tr>`;
  }
}

iniciar();
