-- ══════════════════════════════════════════════════════════════
-- IPMD — Stockage privé des signatures & cachets + historique.
-- À exécuter dans Supabase > SQL Editor.
-- Nécessite public.current_user_role() (roles-rbac.sql).
-- ══════════════════════════════════════════════════════════════

-- 1) Bucket PRIVÉ (public = false → aucune URL publique).
--    Accès uniquement via la clé service-role, côté serveur.
insert into storage.buckets (id, name, public)
values ('official-assets', 'official-assets', false)
on conflict (id) do nothing;

-- (Aucune policy storage volontairement : ni anon, ni authenticated ne
--  peuvent lire/écrire. Seul le service-role (serveur) y accède.)

-- 2) Historique des dépôts / remplacements (qui, quoi, quand).
create table if not exists public.official_asset_log (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null,            -- ex. 'signatures/admin-general.png'
  action text not null,               -- 'ajout' | 'remplacement'
  performed_by uuid references auth.users(id) on delete set null,
  performed_by_name text,
  performed_at timestamptz not null default now()
);

create index if not exists official_asset_log_key_idx
  on public.official_asset_log (asset_key, performed_at desc);

alter table public.official_asset_log enable row level security;

-- Lecture réservée aux admins (l'insertion se fait via service-role, qui
-- contourne la RLS — aucune policy insert nécessaire).
drop policy if exists "Admins read asset log" on public.official_asset_log;
create policy "Admins read asset log"
  on public.official_asset_log for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));
