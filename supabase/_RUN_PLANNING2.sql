-- ════════════════════════════════════════════════════════════════
-- IPMD — PLANNING (suite) : présence par étudiant + statut paie.
-- Copier-coller TOUT, puis RUN. Idempotent.
-- (À lancer APRÈS _RUN_PLANNING.sql)
-- ════════════════════════════════════════════════════════════════

-- ███  session-attendance.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Présence par étudiant (par séance datée)
-- L'enseignant coche présent/absent chaque étudiant de sa séance.
-- À exécuter dans Supabase > SQL Editor APRÈS course-sessions.sql.
-- ──────────────────────────────────────────────────────────────

-- L'enseignant est-il le prof de cette séance ?
create or replace function public.owns_session(sid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.course_sessions s
    where s.id = sid and s.teacher_id = auth.uid()
  );
$$;

create table if not exists public.session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  present boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, student_id)
);
alter table public.session_attendance enable row level security;

drop policy if exists "Read attendance" on public.session_attendance;
create policy "Read attendance" on public.session_attendance
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or public.owns_session(session_id)
    or public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie', 'scolarite')
  );

drop policy if exists "Teacher marks attendance" on public.session_attendance;
create policy "Teacher marks attendance" on public.session_attendance
  for all to authenticated
  using (public.owns_session(session_id))
  with check (public.owns_session(session_id));

drop policy if exists "Staff manage attendance" on public.session_attendance;
create policy "Staff manage attendance" on public.session_attendance
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'))
  with check (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'));

-- L'enseignant peut lire la liste des élèves de ses classes…
drop policy if exists "Teacher reads class members" on public.class_members;
create policy "Teacher reads class members" on public.class_members
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.teaches_class(class_id)
    or public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie', 'scolarite')
  );

-- … et le nom des étudiants (pour faire l'appel).
drop policy if exists "Teacher reads student profiles" on public.profiles;
create policy "Teacher reads student profiles" on public.profiles
  for select to authenticated
  using (public.current_user_role()::text = 'enseignant' and role = 'etudiant');


-- ███  teacher-payouts.sql

-- ──────────────────────────────────────────────────────────────
-- IPMD — Statut de paie par enseignant et par période
-- En attente → Validé → Payé (historique conservé).
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.teacher_payouts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  hours numeric(8, 2) not null default 0,
  amount numeric(12, 2) not null default 0,
  status text not null default 'en_attente', -- en_attente | valide | paye
  note text,
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (teacher_id, period_start, period_end)
);
alter table public.teacher_payouts enable row level security;

drop policy if exists "Admins manage payouts" on public.teacher_payouts;
create policy "Admins manage payouts" on public.teacher_payouts
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin'))
  with check (public.current_user_role()::text in ('admin', 'super_admin'));

drop policy if exists "Teacher reads own payouts" on public.teacher_payouts;
create policy "Teacher reads own payouts" on public.teacher_payouts
  for select to authenticated using (teacher_id = auth.uid());

