-- ──────────────────────────────────────────────────────────────
-- IPMD — Modération : signalements + archivage
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

-- Archivage des messages internes (traçabilité).
alter table public.internal_messages
  add column if not exists archived boolean not null default false;

-- Signalements de contenu.
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  content_type text not null, -- class_announcement | announcement | internal_message
  content_id uuid not null,
  reason text,
  status text not null default 'open', -- open | resolved
  created_at timestamptz not null default now()
);
alter table public.content_reports enable row level security;

drop policy if exists "Report content" on public.content_reports;
create policy "Report content" on public.content_reports
  for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists "Read own reports" on public.content_reports;
create policy "Read own reports" on public.content_reports
  for select to authenticated using (reporter_id = auth.uid());

drop policy if exists "Admins read reports" on public.content_reports;
create policy "Admins read reports" on public.content_reports
  for select to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins resolve reports" on public.content_reports;
create policy "Admins resolve reports" on public.content_reports
  for update to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));
