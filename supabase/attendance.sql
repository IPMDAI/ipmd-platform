-- ──────────────────────────────────────────────────────────────
-- IPMD — Séances réalisées (fiche pédagogique) + présence
-- À exécuter dans Supabase > SQL Editor APRÈS enrollments.sql + parents.sql.
-- ──────────────────────────────────────────────────────────────

-- Une séance réalisée = fiche pédagogique d'un cours donné.
create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_date date not null,
  theme text,
  resources text,        -- documents, vidéos, liens distribués
  hours numeric(4, 1),   -- nombre d'heures
  created_at timestamptz not null default now()
);

-- Présence d'un étudiant à une séance.
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  present boolean not null default true,
  created_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

alter table public.course_lessons enable row level security;
alter table public.attendance enable row level security;

-- L'enseignant propriétaire de la séance (via son cours).
create or replace function public.owns_course_lesson(p_lesson_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.course_lessons l
    join public.courses c on c.id = l.course_id
    where l.id = p_lesson_id and c.teacher_id = auth.uid()
  );
$$;

-- ── Séances ────────────────────────────────────────────────────
drop policy if exists "Teachers manage lessons" on public.course_lessons;
create policy "Teachers manage lessons" on public.course_lessons for all to authenticated
  using (public.owns_course(course_id))
  with check (public.owns_course(course_id));

drop policy if exists "Admins read lessons" on public.course_lessons;
create policy "Admins read lessons" on public.course_lessons for select to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Students read enrolled lessons" on public.course_lessons;
create policy "Students read enrolled lessons" on public.course_lessons for select to authenticated
  using (public.is_enrolled(course_id));

drop policy if exists "Parents read children lessons" on public.course_lessons;
create policy "Parents read children lessons" on public.course_lessons for select to authenticated
  using (public.parent_has_course(course_id));

-- ── Présence ───────────────────────────────────────────────────
drop policy if exists "Teachers manage attendance" on public.attendance;
create policy "Teachers manage attendance" on public.attendance for all to authenticated
  using (public.owns_course_lesson(lesson_id))
  with check (public.owns_course_lesson(lesson_id));

drop policy if exists "Students read own attendance" on public.attendance;
create policy "Students read own attendance" on public.attendance for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "Parents read children attendance" on public.attendance;
create policy "Parents read children attendance" on public.attendance for select to authenticated
  using (public.is_parent_of(student_id));

drop policy if exists "Admins read attendance" on public.attendance;
create policy "Admins read attendance" on public.attendance for select to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));
