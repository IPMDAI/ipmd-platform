-- ──────────────────────────────────────────────────────────────
-- IPMD — Inscriptions étudiants aux cours (Étape C)
-- À exécuter dans Supabase > SQL Editor APRÈS teaching.sql + schedule.sql.
-- ──────────────────────────────────────────────────────────────

-- Fonctions security definer : évitent la récursion infinie entre les
-- policies de courses ↔ enrollments (elles lisent sans déclencher la RLS).
create or replace function public.owns_course(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.courses
    where id = p_course_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_enrolled(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.enrollments
    where course_id = p_course_id and student_id = auth.uid()
  );
$$;

-- ── Inscriptions ───────────────────────────────────────────────
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, student_id)
);

alter table public.enrollments enable row level security;

-- L'enseignant gère les inscriptions de ses cours.
drop policy if exists "Teachers manage enrollments" on public.enrollments;
create policy "Teachers manage enrollments"
  on public.enrollments for all
  to authenticated
  using (public.owns_course(course_id))
  with check (public.owns_course(course_id));

-- L'étudiant lit ses propres inscriptions.
drop policy if exists "Students read own enrollments" on public.enrollments;
create policy "Students read own enrollments"
  on public.enrollments for select
  to authenticated
  using (student_id = auth.uid());

-- Les admins lisent toutes les inscriptions.
drop policy if exists "Admins read all enrollments" on public.enrollments;
create policy "Admins read all enrollments"
  on public.enrollments for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));

-- ── L'étudiant lit les cours / devoirs / séances où il est inscrit ──
drop policy if exists "Students read enrolled courses" on public.courses;
create policy "Students read enrolled courses"
  on public.courses for select
  to authenticated
  using (public.is_enrolled(id));

drop policy if exists "Students read enrolled assignments" on public.assignments;
create policy "Students read enrolled assignments"
  on public.assignments for select
  to authenticated
  using (public.is_enrolled(course_id));

drop policy if exists "Students read enrolled sessions" on public.schedule_sessions;
create policy "Students read enrolled sessions"
  on public.schedule_sessions for select
  to authenticated
  using (public.is_enrolled(course_id));

-- ── L'enseignant peut lister les profils étudiants (pour les inscrire) ──
drop policy if exists "Teachers read student profiles" on public.profiles;
create policy "Teachers read student profiles"
  on public.profiles for select
  to authenticated
  using (role = 'etudiant' and public.current_user_role() = 'enseignant');
