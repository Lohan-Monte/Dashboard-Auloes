// =============================================================
// CONFIGURAÇÃO DO SUPABASE
// Preencha com os dados do SEU projeto (Supabase > Project Settings > API)
// =============================================================
const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO_SUPABASE";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_ANON_KEY_DO_SEU_PROJETO_SUPABASE";

// Cliente único, usado em todas as páginas
let supabaseClient;
try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  mostrarErroFatal("Não consegui iniciar a conexão com o Supabase. Verifique SUPABASE_URL e SUPABASE_ANON_KEY em supabase-client.js. Detalhe técnico: " + e.message);
}

// -------------------------------------------------------------
// Helper: mostra um erro bem visível na tela (sem precisar de F12)
// e PARA a execução do resto do script, evitando loops.
// -------------------------------------------------------------
function mostrarErroFatal(mensagem) {
  // Se já existe um banner de erro, não duplica
  if (document.getElementById("erroFatalBanner")) return;

  const banner = document.createElement("div");
  banner.id = "erroFatalBanner";
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: #dc2626; color: #fff; padding: 16px 20px;
    font-family: -apple-system, Segoe UI, Arial, sans-serif;
    font-size: 14px; line-height: 1.5; box-shadow: 0 2px 8px rgba(0,0,0,.3);
  `;
  banner.innerHTML = `<strong>⚠ Erro ao carregar a página:</strong><br>${mensagem}`;
  document.body.prepend(banner);
}

// -------------------------------------------------------------
// Helper: proteção contra loop de redirecionamento (login ⇄ dashboard).
// Conta quantos redirecionamentos aconteceram em sequência; se passar
// de 3, para de redirecionar e mostra o erro na tela em vez de ficar
// recarregando para sempre.
// -------------------------------------------------------------
function podeRedirecionar() {
  const chave = "upseller_redirect_count";
  const agora = Date.now();
  let dados;
  try {
    dados = JSON.parse(sessionStorage.getItem(chave) || "{}");
  } catch {
    dados = {};
  }
  // Reseta a contagem se o último redirecionamento foi há mais de 5s
  if (!dados.ts || agora - dados.ts > 5000) {
    dados = { count: 0, ts: agora };
  }
  dados.count += 1;
  dados.ts = agora;
  sessionStorage.setItem(chave, JSON.stringify(dados));

  if (dados.count > 3) {
    mostrarErroFatal(
      "Detectei várias tentativas seguidas de redirecionamento entre login e dashboard — isso indica que a sessão do Supabase não está sendo validada corretamente (geralmente URL/chave erradas em supabase-client.js, ou o projeto Supabase pausado/instável). Corrija a configuração e recarregue a página manualmente."
    );
    return false;
  }
  return true;
}

// -------------------------------------------------------------
// Helper: garante que existe uma sessão logada.
// Se não existir, manda o usuário de volta para o login.
// Retorna a sessão (ou null, já tendo redirecionado).
// -------------------------------------------------------------
async function exigirLogin() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      mostrarErroFatal("Erro ao verificar sessão no Supabase: " + error.message);
      return null;
    }
    const session = data.session;
    if (!session) {
      if (podeRedirecionar()) window.location.href = "index.html";
      return null;
    }
    return session;
  } catch (e) {
    mostrarErroFatal("Erro inesperado ao verificar login: " + e.message);
    return null;
  }
}

// -------------------------------------------------------------
// Helper: toast simples de feedback
// -------------------------------------------------------------
function mostrarToast(mensagem, tipo = "ok") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = mensagem;
  el.className = "toast show" + (tipo === "error" ? " error" : "");
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.classList.remove("show"), 2600);
}

// -------------------------------------------------------------
// Helper: iniciais para o avatar do topo
// -------------------------------------------------------------
function iniciaisDe(nomeOuEmail) {
  if (!nomeOuEmail) return "?";
  const base = nomeOuEmail.split("@")[0];
  const partes = base.split(/[.\s_]+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}
