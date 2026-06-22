-- ──────────────────────────────────────────────────────────────
-- IPMD — Paie enseignants (taux horaire par prof OU forfait projet)
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.teacher_pay (
  teacher_id uuid primary key references public.profiles (id) on delete cascade,
  pay_type text not null default 'horaire', -- horaire | projet
  hourly_rate numeric(12, 2) not null default 0,
  project_fee numeric(12, 2) not null default 0,
  note text,
  updated_at timestamptz not null default now()
);
alter table public.teacher_pay enable row level security;

drop policy if exists "Admins manage teacher pay" on public.teacher_pay;
create policy "Admins manage teacher pay" on public.teacher_pay
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin'))
  with check (public.current_user_role()::text in ('admin', 'super_admin'));

drop policy if exists "Teacher reads own pay" on public.teacher_pay;
create policy "Teacher reads own pay" on public.teacher_pay
  for select to authenticated using (teacher_id = auth.uid());
