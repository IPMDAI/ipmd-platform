-- ──────────────────────────────────────────────────────────────
-- IPMD — Emploi du temps : séances de cours (Étape C)
-- À exécuter dans Supabase > SQL Editor APRÈS teaching.sql.
-- ──────────────────────────────────────────────────────────────

-- Une séance = un créneau hebdomadaire récurrent rattaché à un cours.
create table if not exists public.schedule_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7), -- 1 = Lundi
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now()
);

alter table public.schedule_sessions enable row level security;

-- L'enseignant gère les séances des cours qu'il possède.
drop policy if exists "Teachers manage own sessions" on public.schedule_sessions;
create policy "Teachers manage own sessions"
  on public.schedule_sessions for all
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

-- Les admins peuvent lire toutes les séances.
drop policy if exists "Admins read all sessions" on public.schedule_sessions;
create policy "Admins read all sessions"
  on public.schedule_sessions for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));
