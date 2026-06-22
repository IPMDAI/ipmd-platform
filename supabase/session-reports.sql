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
