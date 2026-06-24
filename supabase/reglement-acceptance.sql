-- ──────────────────────────────────────────────────────────────
-- IPMD — Accusé de lecture du règlement intérieur.
-- Qui a lu/accepté quelle version, et quand.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.reglement_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, version)
);

alter table public.reglement_acceptances enable row level security;

-- L'utilisateur enregistre / lit sa propre acceptation.
drop policy if exists "User accepts own reglement" on public.reglement_acceptances;
create policy "User accepts own reglement" on public.reglement_acceptances for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "User reads own reglement acceptance" on public.reglement_acceptances;
create policy "User reads own reglement acceptance" on public.reglement_acceptances for select to authenticated
  using (user_id = auth.uid());

-- L'administration consulte toutes les acceptations (suivi).
drop policy if exists "Staff reads reglement acceptances" on public.reglement_acceptances;
create policy "Staff reads reglement acceptances" on public.reglement_acceptances for select to authenticated
  using (public.current_user_role() in ('super_admin', 'admin', 'scolarite', 'pedagogie'));
