-- ──────────────────────────────────────────────────────────────
-- IPMD — Lot C2 : liens signés du pack d'admission (accès sans compte)
-- Additif & idempotent. Un pack peut avoir plusieurs liens dans le temps
-- (régénérations/renouvellements) ; un seul actif à la fois côté application.
-- On ne stocke JAMAIS le token en clair : uniquement son hash SHA-256.
-- ──────────────────────────────────────────────────────────────

create table if not exists public.admission_pack_links (
  id         uuid primary key default gen_random_uuid(),
  pack_id    uuid not null references public.admission_packs(id) on delete cascade,
  token_hash text not null,            -- SHA-256 du token (jamais le token brut)
  expires_at timestamptz not null,
  revoked_at timestamptz,
  sent_at    timestamptz,
  used_at    timestamptz,              -- 1re utilisation
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists admission_pack_links_pack_idx  on public.admission_pack_links(pack_id);
create index if not exists admission_pack_links_token_idx on public.admission_pack_links(token_hash);

alter table public.admission_pack_links enable row level security;

-- Les admins gèrent les liens. La LECTURE par jeton (candidat non connecté) se
-- fait côté serveur via la clé service-role après vérification du hash.
drop policy if exists "Admins manage admission_pack_links" on public.admission_pack_links;
create policy "Admins manage admission_pack_links"
  on public.admission_pack_links
  for all to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));
