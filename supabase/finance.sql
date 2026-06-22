-- ──────────────────────────────────────────────────────────────
-- IPMD — Finance : frais de scolarité & paiements
-- À exécuter dans Supabase > SQL Editor APRÈS parents.sql.
-- ──────────────────────────────────────────────────────────────

-- Montant total dû par étudiant (frais de scolarité).
create table if not exists public.student_finance (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  total_due numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

-- Paiements enregistrés.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null,
  method text,
  label text,
  paid_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.student_finance enable row level security;
alter table public.payments enable row level security;

-- Les admins (Scolarité / Finance) gèrent.
drop policy if exists "Admins manage finance" on public.student_finance;
create policy "Admins manage finance" on public.student_finance for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments" on public.payments for all to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- L'étudiant lit sa situation ; le parent celle de son enfant.
drop policy if exists "Students read own finance" on public.student_finance;
create policy "Students read own finance" on public.student_finance for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "Parents read children finance" on public.student_finance;
create policy "Parents read children finance" on public.student_finance for select to authenticated
  using (public.is_parent_of(student_id));

drop policy if exists "Students read own payments" on public.payments;
create policy "Students read own payments" on public.payments for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "Parents read children payments" on public.payments;
create policy "Parents read children payments" on public.payments for select to authenticated
  using (public.is_parent_of(student_id));
