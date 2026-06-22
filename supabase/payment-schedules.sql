-- ──────────────────────────────────────────────────────────────
-- IPMD — Échéancier de paiement
-- L'administration définit des échéances (montant + date) par étudiant.
-- Le statut (payée / à venir / en retard) est calculé côté application
-- à partir du total déjà payé.
-- À exécuter dans Supabase > SQL Editor APRÈS finance.sql.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.payment_schedules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  amount numeric(12, 2) not null,
  due_date date not null,
  created_at timestamptz not null default now()
);

alter table public.payment_schedules enable row level security;

drop policy if exists "Admins manage schedules" on public.payment_schedules;
create policy "Admins manage schedules" on public.payment_schedules
  for all to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Students read own schedule" on public.payment_schedules;
create policy "Students read own schedule" on public.payment_schedules
  for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "Parents read children schedule" on public.payment_schedules;
create policy "Parents read children schedule" on public.payment_schedules
  for select to authenticated
  using (public.is_parent_of(student_id));
