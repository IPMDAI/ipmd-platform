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
