-- ──────────────────────────────────────────────────────────────
-- IPMD — Annonces / communication de l'administration
-- L'administration publie des annonces visibles dans l'espace.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all', -- all | etudiant | parent | enseignant
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Lecture ouverte aux utilisateurs connectés (communications de l'école).
drop policy if exists "Read announcements" on public.announcements;
create policy "Read announcements" on public.announcements
  for select to authenticated using (true);

-- Seule l'administration publie / supprime.
drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements" on public.announcements
  for all to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));
