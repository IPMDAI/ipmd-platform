-- ══════════════════════════════════════════════════════════════
-- IPMD — LOT 1 : Socle identité étudiante (Option C)
--
-- Principe : le DOSSIER académique (students) est PERMANENT et DISTINCT
-- du COMPTE de connexion (profiles / auth.users). Un compte est facultatif
-- et rattachable plus tard, sans déplacer le dossier.
--
-- ⚠️ Ce script N'ALTÈRE aucune table existante et NE REPOINTE aucune FK.
--    Les profils historiques (archive2324 / archive2425) restent en place ;
--    ils sont seulement RELIÉS à l'identité canonique via student_legacy_links.
--
-- À exécuter dans Supabase > SQL Editor. Idempotent.
-- Nécessite public.current_user_role() (roles-rbac.sql).
-- ══════════════════════════════════════════════════════════════

-- 1.1 — Identité académique permanente
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  matricule text unique not null,          -- ex. '23-24IPMD008' (permanent)
  full_name text not null,
  birth_date date,
  birth_place text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 — Historique annuel des inscriptions (L1/L2/L3…), plusieurs par étudiant
create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year text not null,             -- '2023-2024'
  level text,                              -- 'Licence 1'
  filiere text,                            -- 'Marketing Digital'
  class_id uuid references public.classes(id) on delete set null,
  status text not null default 'en_cours', -- en_cours|valide|admis_sous_reserve|abandonne
  created_at timestamptz not null default now(),
  unique (student_id, academic_year)
);

-- 1.3 — Liens vers les profils HISTORIQUES (sources), SANS repointer les FK
create table if not exists public.student_legacy_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  legacy_profile_id uuid not null references public.profiles(id) on delete cascade,
  academic_year text,
  note text,
  created_at timestamptz not null default now(),
  unique (legacy_profile_id)               -- un profil legacy → une seule identité
);

-- 1.4 — Rattachement FUTUR d'un compte de connexion (facultatif)
create table if not exists public.student_accounts (
  student_id uuid primary key references public.students(id) on delete cascade,
  profile_id uuid unique references public.profiles(id) on delete set null,
  linked_at timestamptz not null default now()
);

-- Index utiles
create index if not exists student_enrollments_student_idx
  on public.student_enrollments (student_id, academic_year);
create index if not exists student_legacy_links_student_idx
  on public.student_legacy_links (student_id);

-- ── Row Level Security ─────────────────────────────────────────
alter table public.students             enable row level security;
alter table public.student_enrollments  enable row level security;
alter table public.student_legacy_links enable row level security;
alter table public.student_accounts     enable row level security;

-- Gestion complète réservée aux admins.
drop policy if exists "students admins all" on public.students;
create policy "students admins all" on public.students for all to authenticated
  using (public.current_user_role() in ('super_admin','admin'))
  with check (public.current_user_role() in ('super_admin','admin'));

drop policy if exists "enrollments admins all" on public.student_enrollments;
create policy "enrollments admins all" on public.student_enrollments for all to authenticated
  using (public.current_user_role() in ('super_admin','admin'))
  with check (public.current_user_role() in ('super_admin','admin'));

drop policy if exists "legacy links admins all" on public.student_legacy_links;
create policy "legacy links admins all" on public.student_legacy_links for all to authenticated
  using (public.current_user_role() in ('super_admin','admin'))
  with check (public.current_user_role() in ('super_admin','admin'));

drop policy if exists "student accounts admins all" on public.student_accounts;
create policy "student accounts admins all" on public.student_accounts for all to authenticated
  using (public.current_user_role() in ('super_admin','admin'))
  with check (public.current_user_role() in ('super_admin','admin'));

-- Lecture par l'étudiant de SON dossier, quand un compte lui sera rattaché.
drop policy if exists "student accounts self read" on public.student_accounts;
create policy "student accounts self read" on public.student_accounts for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "students self read" on public.students;
create policy "students self read" on public.students for select to authenticated
  using (id in (select student_id from public.student_accounts where profile_id = auth.uid()));

drop policy if exists "enrollments self read" on public.student_enrollments;
create policy "enrollments self read" on public.student_enrollments for select to authenticated
  using (student_id in (select student_id from public.student_accounts where profile_id = auth.uid()));
