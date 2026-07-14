// =============================================================
// CONFIGURAÇÃO DO SUPABASE
// Preencha com os dados do SEU projeto (Supabase > Project Settings > API)
// =============================================================
const SUPABASE_URL = "https://xapjgaibkhthuaeirgpl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcGpnYWlia2h0aHVhZWlyZ3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTEwMjcsImV4cCI6MjA5OTYyNzAyN30.goYe3D5kDNPDXarHgiwdmlyE3vM4k61GlzWT0Ai0cbc";

// Cliente único, usado em todas as páginas
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------------------------------------------
// Helper: garante que existe uma sessão logada.
// Se não existir, manda o usuário de volta para o login.
// Retorna a sessão (ou null, já tendo redirecionado).
// -------------------------------------------------------------
async function exigirLogin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
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
