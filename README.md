# Agenda de Aulões — UpSeller

Site simples e privado para você, Ricardo e Guilherme organizarem quem apresenta
o aulão do dia e qual o tema. Tudo em HTML/CSS/JS puro (sem build), pronto para
rodar no **GitHub Pages**, com dados no **Supabase** (banco de dados gratuito
com login incluso).

## O que o site tem

- **Login** — só quem tiver usuário cadastrado no Supabase entra.
- **Dashboard** — visão da semana (segunda a sexta), com o responsável e o
  tema de cada dia. Editar é só clicar e escolher/digitar — salva sozinho.
- **Responsáveis** — tela de CRUD para adicionar ou remover quem pode ser
  escalado (você já começa com Lohan, Ricardo e Guilherme cadastrados).

A identidade visual (barra superior azul-marinho, tipografia e cores) segue o
padrão do UpSeller ERP, com base nas telas que você enviou.

---

## Passo 1 — Criar o projeto no Supabase (gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta / faça login.
2. Clique em **New project**, escolha um nome (ex.: `upseller-aulao`) e uma
   senha de banco (guarde-a, mas ela não será usada pelo site).
3. Aguarde o projeto finalizar de provisionar (leva ~2 minutos).

## Passo 2 — Criar as tabelas

1. No menu lateral, abra **SQL Editor** → **New query**.
2. Copie todo o conteúdo do arquivo [`sql/schema.sql`](sql/schema.sql) deste
   projeto, cole no editor e clique em **Run**.
3. Isso cria as tabelas `analistas` e `aulaos`, ativa a segurança (RLS) e já
   cadastra Lohan, Ricardo e Guilherme como responsáveis.

## Passo 3 — Criar os logins de vocês três

O Supabase cuida da autenticação, então não é preciso programar nada disso:

1. Menu lateral → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Cadastre um usuário para cada um (e-mail + senha), por exemplo:
   - `lohan@upseller.com`
   - `ricardo@upseller.com`
   - `guilherme@upseller.com`
3. Marque **Auto Confirm User** ao criar (assim não precisa de e-mail de
   confirmação). Repita para os três.
4. Depois, cada um pode trocar a própria senha em **Authentication → Users**
   (ou você adiciona um fluxo de "esqueci senha" depois, se quiser evoluir o
   projeto).

## Passo 4 — Pegar a URL e a chave do projeto

1. Menu lateral → **Project Settings** → **API**.
2. Copie o **Project URL** e a chave **anon public**.
3. Abra o arquivo [`js/supabase-client.js`](js/supabase-client.js) neste
   projeto e preencha:

```js
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "sua-chave-anon-aqui";
```

> A chave `anon` é pública por natureza (é ela que o navegador usa), quem
> protege os dados de verdade é a Row Level Security que o `schema.sql` já
> deixou configurada — só usuário logado consegue ler ou editar qualquer coisa.

## Passo 5 — Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser privado) e suba todos os
   arquivos desta pasta (`index.html`, `dashboard.html`, `responsaveis.html`,
   `css/`, `js/`, `sql/`, `README.md`).
2. No repositório, vá em **Settings → Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/ (root)`, depois
   **Save**.
4. Em ~1 minuto o GitHub mostra o link do site, algo como:
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`
5. Envie esse link para você, Ricardo e Guilherme. Cada um entra com o
   e-mail/senha criados no Passo 3.

> Se o repositório for privado, o GitHub Pages nesse plano pode exigir conta
> paga para publicar — nesse caso, deixe o repositório público (os dados
> continuam protegidos pelo login do Supabase; só o *código* do site fica
> visível, e ele não tem nenhuma informação sensível).

## Passo 6 — Testar

1. Abra o link do site → tela de login.
2. Entre com um dos três usuários.
3. No **Dashboard**, escolha o responsável e digite o tema em qualquer dia
   da semana — o campo salva sozinho (aparece um "Salvo ✓" no topo do card).
4. Use as setas `‹ ›` para navegar entre semanas, e o botão **Hoje** para
   voltar para a semana atual.
5. Em **Responsáveis**, adicione ou remova pessoas da equipe conforme a
   necessidade.

---

## Estrutura de arquivos

```
upseller-aulao/
├── index.html            → tela de login
├── dashboard.html        → agenda semanal (responsável + tema)
├── responsaveis.html     → CRUD de responsáveis
├── css/
│   └── style.css         → identidade visual UpSeller
├── js/
│   ├── supabase-client.js → configuração da conexão (preencher URL/chave)
│   ├── dashboard.js       → lógica da agenda
│   └── responsaveis.js    → lógica do CRUD
└── sql/
    └── schema.sql         → script para rodar uma vez no Supabase
```

## Possíveis evoluções futuras (não incluídas agora)

- Tela de "esqueci minha senha".
- Histórico/relatório de aulões já realizados.
- Notificação automática (e-mail/Slack) do responsável do dia.

Qualquer um desses três, é só pedir que dá para adicionar depois — a base já
fica pronta para isso.
