-- ──────────────────────────────────────────────────────────────
-- IPMD — Espace Parent : liens parent ↔ enfant (Étape C)
-- À exécuter dans Supabase > SQL Editor APRÈS enrollments.sql + grades.sql.
-- ──────────────────────────────────────────────────────────────

-- ── Liens parent ↔ enfant ──────────────────────────────────────
create table if not exists public.parent_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

alter table public.parent_links enable row level security;

-- Fonctions security definer (évitent la récursion RLS).
create or replace function public.is_parent_of(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parent_links
    where parent_id = auth.uid() and student_id = p_student_id
  );
$$;

-- Le parent courant a-t-il un enfant inscrit à ce cours ?
create or replace function public.parent_has_course(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.parent_links pl on pl.student_id = e.student_id
    where e.course_id = p_course_id and pl.parent_id = auth.uid()
  );
$$;

-- Le parent lit ses propres liens ; les admins les gèrent.
drop policy if exists "Parents read own links" on public.parent_links;
create policy "Parents read own links"
  on public.parent_links for select
  to authenticated
  using (parent_id = auth.uid());

drop policy if exists "Admins manage parent links" on public.parent_links;
create policy "Admins manage parent links"
  on public.parent_links for all
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- ── Le parent lit les données de son/ses enfant(s) ─────────────
drop policy if exists "Parents read children profiles" on public.profiles;
create policy "Parents read children profiles"
  on public.profiles for select
  to authenticated
  using (public.is_parent_of(id));

drop policy if exists "Parents read children enrollments" on public.enrollments;
create policy "Parents read children enrollments"
  on public.enrollments for select
  to authenticated
  using (public.is_parent_of(student_id));

drop policy if exists "Parents read children grades" on public.grades;
create policy "Parents read children grades"
  on public.grades for select
  to authenticated
  using (public.is_parent_of(student_id));

drop policy if exists "Parents read children courses" on public.courses;
create policy "Parents read children courses"
  on public.courses for select
  to authenticated
  using (public.parent_has_course(id));

drop policy if exists "Parents read children assignments" on public.assignments;
create policy "Parents read children assignments"
  on public.assignments for select
  to authenticated
  using (public.parent_has_course(course_id));

drop policy if exists "Parents read children sessions" on public.schedule_sessions;
create policy "Parents read children sessions"
  on public.schedule_sessions for select
  to authenticated
  using (public.parent_has_course(course_id));
