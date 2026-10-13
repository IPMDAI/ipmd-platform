-- P3c — Convocations (admin → étudiant + parent).
create table if not exists public.convocations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  reason text,
  scheduled_at timestamptz,
  location text,
  status text not null default 'envoyee'
    check (status in ('envoyee','vue','honoree','annulee')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

create index if not exists convocations_student_idx on public.convocations(student_id);

alter table public.convocations enable row level security;

-- Staff (admin/scolarité/pédagogie) gère tout.
drop policy if exists "Staff manage convocations" on public.convocations;
create policy "Staff manage convocations" on public.convocations
  for all
  using ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']))
  with check ((current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie']));

-- Parent : lecture + accusé de réception des convocations de son enfant.
drop policy if exists "Parent reads child convocations" on public.convocations;
create policy "Parent reads child convocations" on public.convocations
  for select using (public.is_parent_of(student_id));
drop policy if exists "Parent acks child convocations" on public.convocations;
create policy "Parent acks child convocations" on public.convocations
  for update using (public.is_parent_of(student_id)) with check (public.is_parent_of(student_id));

-- Étudiant : lecture + accusé de réception de ses propres convocations.
drop policy if exists "Student reads own convocations" on public.convocations;
create policy "Student reads own convocations" on public.convocations
  for select using (student_id = auth.uid());
drop policy if exists "Student acks own convocations" on public.convocations;
create policy "Student acks own convocations" on public.convocations
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());
