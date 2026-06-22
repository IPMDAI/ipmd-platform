-- ──────────────────────────────────────────────────────────────
-- IPMD — Modules par filière (chaque filière contient des modules)
-- À exécuter dans Supabase > SQL Editor APRÈS referentiel.sql.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  filiere_id uuid not null references public.filieres (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;

-- Lecture ouverte (utile pour le planning, les cours…).
drop policy if exists "Read modules" on public.modules;
create policy "Read modules" on public.modules for select to authenticated
  using (true);

-- Gestion réservée aux admins.
drop policy if exists "Admins manage modules" on public.modules;
create policy "Admins manage modules" on public.modules for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
