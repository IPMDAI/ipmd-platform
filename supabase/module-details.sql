-- ──────────────────────────────────────────────────────────────
-- IPMD — Fiche détaillée d'un module
-- À exécuter dans Supabase > SQL Editor APRÈS modules-levels.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.modules
  add column if not exists teacher_id uuid references public.profiles (id) on delete set null;
alter table public.modules add column if not exists hours numeric(5, 1);
alter table public.modules add column if not exists coefficient numeric(4, 1);
alter table public.modules add column if not exists syllabus text;

-- Supports de cours (documents, vidéos, liens) d'un module.
create table if not exists public.module_supports (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  label text not null,
  url text,
  created_at timestamptz not null default now()
);

alter table public.module_supports enable row level security;

drop policy if exists "Read module supports" on public.module_supports;
create policy "Read module supports" on public.module_supports for select to authenticated
  using (true);

drop policy if exists "Admins manage module supports" on public.module_supports;
create policy "Admins manage module supports" on public.module_supports for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
