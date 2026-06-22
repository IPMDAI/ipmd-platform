-- ──────────────────────────────────────────────────────────────
-- IPMD — Référentiel : filières, classes (promotions), salles
-- À exécuter dans Supabase > SQL Editor APRÈS roles-rbac.sql.
-- Base de la digitalisation (planning central par niveau & filière).
-- ──────────────────────────────────────────────────────────────

-- ── Filières ───────────────────────────────────────────────────
create table if not exists public.filieres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ── Classes / promotions ───────────────────────────────────────
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  filiere_id uuid references public.filieres (id) on delete set null,
  level text,
  academic_year text,
  created_at timestamptz not null default now()
);

-- ── Salles ─────────────────────────────────────────────────────
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity int,
  created_at timestamptz not null default now()
);

-- ── Appartenance d'un étudiant à une classe (1 classe courante) ─
create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id)
);

alter table public.filieres enable row level security;
alter table public.classes enable row level security;
alter table public.rooms enable row level security;
alter table public.class_members enable row level security;

-- Lecture ouverte aux utilisateurs connectés (noms de filières/classes/salles
-- non sensibles, utiles pour le planning et l'affichage).
drop policy if exists "Read filieres" on public.filieres;
create policy "Read filieres" on public.filieres for select to authenticated using (true);

drop policy if exists "Read classes" on public.classes;
create policy "Read classes" on public.classes for select to authenticated using (true);

drop policy if exists "Read rooms" on public.rooms;
create policy "Read rooms" on public.rooms for select to authenticated using (true);

-- Gestion réservée aux admins.
drop policy if exists "Admins manage filieres" on public.filieres;
create policy "Admins manage filieres" on public.filieres for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Admins manage classes" on public.classes;
create policy "Admins manage classes" on public.classes for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Admins manage rooms" on public.rooms;
create policy "Admins manage rooms" on public.rooms for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- Affectation des étudiants aux classes : admins gèrent, l'étudiant lit la sienne.
drop policy if exists "Admins manage class members" on public.class_members;
create policy "Admins manage class members" on public.class_members for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Students read own class" on public.class_members;
create policy "Students read own class" on public.class_members for select to authenticated
  using (student_id = auth.uid());
