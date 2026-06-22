-- ──────────────────────────────────────────────────────────────
-- IPMD — Jours fériés (calendrier)
-- Permet d'afficher les dates réelles et de marquer les jours sans cours.
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  label text not null,
  created_at timestamptz not null default now()
);
alter table public.holidays enable row level security;

drop policy if exists "Read holidays" on public.holidays;
create policy "Read holidays" on public.holidays
  for select to authenticated using (true);

drop policy if exists "Admins manage holidays" on public.holidays;
create policy "Admins manage holidays" on public.holidays
  for all to authenticated
  using (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'))
  with check (public.current_user_role()::text in ('admin', 'super_admin', 'pedagogie'));

-- Jours fériés civils de Côte d'Ivoire (2026, dates fixes).
-- (Les fêtes religieuses mobiles — Pâques, Ascension, Aïd, Maouloud… —
--  sont à ajouter à la main car leur date varie chaque année.)
insert into public.holidays (day, label) values
  ('2026-01-01', 'Jour de l''An'),
  ('2026-05-01', 'Fête du Travail'),
  ('2026-08-07', 'Fête de l''Indépendance'),
  ('2026-08-15', 'Assomption'),
  ('2026-11-01', 'Toussaint'),
  ('2026-11-15', 'Journée nationale de la paix'),
  ('2026-12-25', 'Noël')
on conflict (day) do nothing;
