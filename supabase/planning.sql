-- ──────────────────────────────────────────────────────────────
-- IPMD — Planning central (emploi du temps par classe)
-- À exécuter dans Supabase > SQL Editor APRÈS referentiel.sql.
-- La Pédagogie planifie : matière + prof + salle + créneau, par classe.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  subject text not null,
  teacher_id uuid references public.profiles (id) on delete set null,
  room_id uuid references public.rooms (id) on delete set null,
  day_of_week smallint not null check (day_of_week between 1 and 7), -- 1 = Lundi
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

alter table public.timetable_slots enable row level security;

-- Lecture ouverte aux utilisateurs connectés (l'app filtre par classe).
drop policy if exists "Read timetable" on public.timetable_slots;
create policy "Read timetable" on public.timetable_slots for select to authenticated
  using (true);

-- Seuls les admins (Pédagogie) construisent le planning.
drop policy if exists "Admins manage timetable" on public.timetable_slots;
create policy "Admins manage timetable" on public.timetable_slots for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));
