-- =============================================================
-- Agenda de Aulões UpSeller — schema Supabase
-- Rode este script inteiro em: Supabase > SQL Editor > New query
-- =============================================================

-- Extensão para gerar UUIDs (normalmente já vem ativa no Supabase)
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Tabela: analistas (quem pode ser responsável pelo aulão)
-- -------------------------------------------------------------
create table if not exists public.analistas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor text default '#1A56DB', -- cor de identificação no dashboard
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Tabela: aulaos (agenda diária: data, responsável e tema)
-- -------------------------------------------------------------
create table if not exists public.aulaos (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  analista_id uuid references public.analistas(id) on delete set null,
  tema text default '',
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Habilitar Row Level Security
-- -------------------------------------------------------------
alter table public.analistas enable row level security;
alter table public.aulaos enable row level security;

-- Qualquer usuário AUTENTICADO (login feito) pode ler e escrever.
-- Ninguém não-autenticado tem acesso (chave anon sozinha não basta).
drop policy if exists "analistas_select" on public.analistas;
create policy "analistas_select" on public.analistas
  for select using (auth.role() = 'authenticated');

drop policy if exists "analistas_insert" on public.analistas;
create policy "analistas_insert" on public.analistas
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "analistas_update" on public.analistas;
create policy "analistas_update" on public.analistas
  for update using (auth.role() = 'authenticated');

drop policy if exists "analistas_delete" on public.analistas;
create policy "analistas_delete" on public.analistas
  for delete using (auth.role() = 'authenticated');

drop policy if exists "aulaos_select" on public.aulaos;
create policy "aulaos_select" on public.aulaos
  for select using (auth.role() = 'authenticated');

drop policy if exists "aulaos_insert" on public.aulaos;
create policy "aulaos_insert" on public.aulaos
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "aulaos_update" on public.aulaos;
create policy "aulaos_update" on public.aulaos
  for update using (auth.role() = 'authenticated');

drop policy if exists "aulaos_delete" on public.aulaos;
create policy "aulaos_delete" on public.aulaos
  for delete using (auth.role() = 'authenticated');

-- -------------------------------------------------------------
-- Dados iniciais: Lohan, Ricardo e Guilherme
-- (edite/apague livremente depois pela tela de Responsáveis)
-- -------------------------------------------------------------
insert into public.analistas (nome, cor)
values
  ('Lohan', '#1A56DB'),
  ('Ricardo', '#16A34A'),
  ('Guilherme', '#F59E0B')
on conflict do nothing;
