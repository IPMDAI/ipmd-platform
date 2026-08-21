-- ──────────────────────────────────────────────────────────────
-- IPMD — Lot C1 : table du pack d'admission
-- Additif & idempotent. Aucune donnée existante modifiée/supprimée.
-- Le pack porte le snapshot des frais (AFFICHAGE prévisionnel — le moteur de
-- paiement reste au Lot D) et l'avancement consultation/acceptation/signature
-- (rempli aux Lots C2–C4). Les LIENS/tokens sont une table séparée (Lot C2).
-- ──────────────────────────────────────────────────────────────

create table if not exists public.admission_packs (
  id                    uuid primary key default gen_random_uuid(),
  candidature_id        uuid not null references public.inscription_requests(id) on delete cascade,
  status                text not null default 'draft',  -- draft|sent|viewed|reglement_ok|signed|closed

  -- Snapshot frais (prévisionnel, AFFICHAGE seul — Lot D = moteur réel)
  accepted_level        text,
  registration_fee      integer,
  tuition_due           integer,
  academic_year         text,
  schedule_json         jsonb,           -- échéancier PRÉVISIONNEL / non contractuel (Lot C2)

  -- Envoi
  sent_at               timestamptz,
  sent_count            integer not null default 0,

  -- Consultation / acceptation / signature (remplis Lots C2–C4)
  first_viewed_at       timestamptz,
  last_viewed_at        timestamptz,
  reglement_version     text,
  reglement_accepted_at timestamptz,
  convention_status     text not null default 'non_envoyee',  -- non_envoyee|en_attente_signature|signee|refusee
  signature_method      text,            -- prestataire_externe|scan_manuscrit|accord_principe_non_contraignant
  signature_provider    text,
  signature_envelope_id text,
  signature_evidence_url text,
  convention_signed_at  timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,

  -- Modèle validé : 1 candidature → 1 pack (→ N liens en table séparée, Lot C2).
  unique (candidature_id)
);

alter table public.admission_packs enable row level security;

-- Les admins gèrent les packs (la lecture par jeton public viendra au Lot C2).
drop policy if exists "Admins manage admission_packs" on public.admission_packs;
create policy "Admins manage admission_packs"
  on public.admission_packs
  for all to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));
