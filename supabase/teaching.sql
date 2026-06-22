-- ──────────────────────────────────────────────────────────────
-- IPMD — Pédagogie : cours & devoirs (Étape C)
-- À exécuter dans Supabase > SQL Editor APRÈS roles-rbac.sql.
-- ──────────────────────────────────────────────────────────────

-- ── Cours ──────────────────────────────────────────────────────
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  field text,
  created_at timestamptz not null default now()
);

-- ── Devoirs (rattachés à un cours) ─────────────────────────────
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.assignments enable row level security;

-- L'enseignant gère (CRUD) ses propres cours.
drop policy if exists "Teachers manage own courses" on public.courses;
create policy "Teachers manage own courses"
  on public.courses for all
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- Les admins peuvent lire tous les cours.
drop policy if exists "Admins read all courses" on public.courses;
create policy "Admins read all courses"
  on public.courses for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));

-- L'enseignant gère les devoirs des cours qu'il possède.
drop policy if exists "Teachers manage own assignments" on public.assignments;
create policy "Teachers manage own assignments"
  on public.assignments for all
  to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.teacher_id = auth.uid()
    )
  );

-- Les admins peuvent lire tous les devoirs.
drop policy if exists "Admins read all assignments" on public.assignments;
create policy "Admins read all assignments"
  on public.assignments for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));
