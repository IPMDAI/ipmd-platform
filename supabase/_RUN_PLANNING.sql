-- ════════════════════════════════════════════════════════════════
-- IPMD — MODULE PLANNING / SÉANCES / PAIE — 1 SEUL FICHIER À RUN.
-- Copier-coller TOUT, puis RUN. Idempotent (re-exécutable sans risque).
-- ════════════════════════════════════════════════════════════════

-- ███  holidays.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Jours fériés (calendrier)
-- Permet d'afficher les dates réelles et de marquer les jours sans cours.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  label text not null,
  created_at timestamptz not null default now()
);
alter table public.holidays enable row level security;

drop policy if exists "Read holidays" on public.holidays;
create policy "Read holidays" on public.holidays
  for select to authenticated using (true);

drop policy if exists "Admins manage holidays" on public.holidays;
create policy "Admins manage holidays" on public.holidays
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'))
  with check (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'));

-- Jours fériés civils de Côte d'Ivoire (2026, dates fixes).
-- (Les fêtes religieuses mobiles — Pâques, Ascension, Aïd, Maouloud… —
--  sont à ajouter à la main car leur date varie chaque année.)
insert into public.holidays (day, label) values
  ('2026-01-01', 'Jour de l''An'),
  ('2026-05-01', 'Fête du Travail'),
  ('2026-08-07', 'Fête de l''Indépendance'),
  ('2026-08-15', 'Assomption'),
  ('2026-11-01', 'Toussaint'),
  ('2026-11-15', 'Journée nationale de la paix'),
  ('2026-12-25', 'Noël')
on conflict (day) do nothing;


-- ███  teacher-pay.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Paie enseignants (taux horaire par prof OU forfait projet)
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.teacher_pay (
  teacher_id uuid primary key references public.profiles (id) on delete cascade,
  pay_type text not null default 'horaire', -- horaire | projet
  hourly_rate numeric(12, 2) not null default 0,
  project_fee numeric(12, 2) not null default 0,
  note text,
  updated_at timestamptz not null default now()
);
alter table public.teacher_pay enable row level security;

drop policy if exists "Admins manage teacher pay" on public.teacher_pay;
create policy "Admins manage teacher pay" on public.teacher_pay
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin'))
  with check (public.current_user_role()::text in ('admin', 'super_admin'));

drop policy if exists "Teacher reads own pay" on public.teacher_pay;
create policy "Teacher reads own pay" on public.teacher_pay
  for select to authenticated using (teacher_id = auth.uid());


-- ███  teacher-profiles.sql

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


-- ███  course-sessions.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Séances datées (planning par dates réelles)
-- Générées depuis le planning hebdomadaire, jours fériés exclus.
-- À exécuter dans Supabase > SQL Editor APRÈS class-announcements.sql
-- (utilise in_class / teaches_class) et holidays.sql.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  teacher_id uuid references public.profiles (id) on delete set null,
  subject text not null,
  room_id uuid references public.rooms (id) on delete set null,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  semester text,
  -- Instantané affichable par l'étudiant (sans accès aux profils / fiches).
  teacher_name text,
  teacher_function text,
  room_name text,
  status text not null default 'prevue',
  -- prevue | realisee | reportee | annulee | remplacee | ferie | absence_prof | absence_classe
  created_at timestamptz not null default now(),
  unique (class_id, session_date, start_time)
);
-- Colonnes instantané (si la table existait déjà sans elles).
alter table public.course_sessions add column if not exists teacher_name text;
alter table public.course_sessions add column if not exists teacher_function text;
alter table public.course_sessions add column if not exists room_name text;

alter table public.course_sessions enable row level security;

-- Lecture : étudiant de la classe, enseignant de la séance, ou services.
drop policy if exists "Read sessions" on public.course_sessions;
create policy "Read sessions" on public.course_sessions
  for select to authenticated
  using (
    public.in_class(class_id)
    or teacher_id = auth.uid()
    or public.teaches_class(class_id)
    or public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie', 'scolarite')
  );

-- Gestion par les services pédagogiques / admin.
drop policy if exists "Staff manage sessions" on public.course_sessions;
create policy "Staff manage sessions" on public.course_sessions
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'))
  with check (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'));

-- L'enseignant met à jour le statut de ses propres séances.
drop policy if exists "Teacher updates own sessions" on public.course_sessions;
create policy "Teacher updates own sessions" on public.course_sessions
  for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());


-- ███  session-reports.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Fiche pédagogique par séance (+ validation Pédagogie)
-- Remplie par l'enseignant après la séance, validée par la Pédagogie.
-- Base de la paie sur heures réellement effectuées.
-- À exécuter dans Supabase > SQL Editor APRÈS course-sessions.sql.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.session_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.course_sessions (id) on delete cascade,
  teacher_id uuid references public.profiles (id) on delete set null,
  content text,
  actual_start time,
  actual_end time,
  supports text,
  observations text,
  present_count integer,
  absent_count integer,
  validated boolean not null default false,
  validated_by uuid references public.profiles (id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.session_reports enable row level security;

drop policy if exists "Read session reports" on public.session_reports;
create policy "Read session reports" on public.session_reports
  for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie')
  );

drop policy if exists "Teacher manages own report" on public.session_reports;
create policy "Teacher manages own report" on public.session_reports
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "Staff manage reports" on public.session_reports;
create policy "Staff manage reports" on public.session_reports
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'))
  with check (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'));

-- Garde-fou : seule la Pédagogie / admin peut valider une fiche.
create or replace function public.guard_report_validation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role()::text not in ('admin', 'super_admin', 'pedagogie') then
    NEW.validated := false;
    NEW.validated_by := null;
    NEW.validated_at := null;
  end if;
  return NEW;
end;
$$;

drop trigger if exists guard_report_validation on public.session_reports;
create trigger guard_report_validation
  before insert or update on public.session_reports
  for each row execute function public.guard_report_validation();

