-- ──────────────────────────────────────────────────────────────
-- IPMD — Fiche enseignant (dossier interne)
-- À exécuter dans Supabase > SQL Editor.
-- Contient des infos sensibles (CV, diplômes, autorisation) :
-- visible UNIQUEMENT par les services et l'enseignant lui-même.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.teacher_profiles (
  teacher_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  function text,        -- fonction réelle (ex. « Consultant en Marketing digital »)
  title text,           -- titre / qualité (ex. « Dr », « Enseignant-chercheur »)
  specialty text,       -- spécialité
  availability text,    -- disponibilité
  bio text,
  cv_url text,
  diplomas text,
  "authorization" text, -- autorisation d'enseigner (mot réservé → entre guillemets)
  status text not null default 'en_attente', -- en_attente | valide | actif | inactif | archive
  updated_at timestamptz not null default now()
);
alter table public.teacher_profiles enable row level security;

-- Services pédagogiques / administratifs : accès complet.
drop policy if exists "Staff manage teacher profiles" on public.teacher_profiles;
create policy "Staff manage teacher profiles" on public.teacher_profiles
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie', 'scolarite'))
  with check (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie', 'scolarite'));

-- L'enseignant lit sa propre fiche.
drop policy if exists "Teacher reads own profile sheet" on public.teacher_profiles;
create policy "Teacher reads own profile sheet" on public.teacher_profiles
  for select to authenticated using (teacher_id = auth.uid());

-- Les services (pédagogie / scolarité) peuvent lire les profils (noms des
-- enseignants et étudiants) — comme les admins. (Les étudiants, eux, ne
-- voient toujours pas les profils des autres.)
drop policy if exists "Staff read profiles" on public.profiles;
create policy "Staff read profiles" on public.profiles
  for select to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie', 'scolarite'));
