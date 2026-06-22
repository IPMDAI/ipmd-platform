-- ──────────────────────────────────────────────────────────────
-- IPMD — Messagerie interne (utilisateur ↔ administration)
-- Étudiants / parents / enseignants écrivent à l'administration
-- (question, justification d'absence, scolarité…) ; l'admin répond.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.internal_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  category text not null default 'question',
  subject text not null,
  body text not null,
  admin_reply text,
  status text not null default 'nouveau', -- nouveau | repondu
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

alter table public.internal_messages enable row level security;

drop policy if exists "Send own messages" on public.internal_messages;
create policy "Send own messages" on public.internal_messages
  for insert to authenticated with check (sender_id = auth.uid());

drop policy if exists "Read own messages" on public.internal_messages;
create policy "Read own messages" on public.internal_messages
  for select to authenticated using (sender_id = auth.uid());

drop policy if exists "Admins read messages" on public.internal_messages;
create policy "Admins read messages" on public.internal_messages
  for select to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins reply messages" on public.internal_messages;
create policy "Admins reply messages" on public.internal_messages
  for update to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));
