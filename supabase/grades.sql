-- ──────────────────────────────────────────────────────────────
-- IPMD — Notes (Étape C)
-- À exécuter dans Supabase > SQL Editor APRÈS enrollments.sql
-- (utilise la fonction public.owns_course()).
-- ──────────────────────────────────────────────────────────────

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  score numeric(6, 2) not null,
  max_score numeric(6, 2) not null default 20,
  comment text,
  created_at timestamptz not null default now()
);

alter table public.grades enable row level security;

-- L'enseignant gère les notes de ses cours.
drop policy if exists "Teachers manage grades" on public.grades;
create policy "Teachers manage grades"
  on public.grades for all
  to authenticated
  using (public.owns_course(course_id))
  with check (public.owns_course(course_id));

-- L'étudiant lit ses propres notes.
drop policy if exists "Students read own grades" on public.grades;
create policy "Students read own grades"
  on public.grades for select
  to authenticated
  using (student_id = auth.uid());

-- Les admins lisent toutes les notes.
drop policy if exists "Admins read all grades" on public.grades;
create policy "Admins read all grades"
  on public.grades for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));
