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
  status text not null default 'prevue',
  -- prevue | realisee | reportee | annulee | remplacee | ferie | absence_prof | absence_classe
  created_at timestamptz not null default now(),
  unique (class_id, session_date, start_time)
);
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
