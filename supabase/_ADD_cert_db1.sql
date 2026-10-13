-- ══════════════════════════════════════════════════════════════
-- IPMD — Certificats Lot DB #1 (structure). REVUE UNIQUEMENT — NE PAS APPLIQUER SANS FEU VERT.
-- Additif & sûr. NE réconcilie AUCUN item, NE change AUCUN prix/statut, NE crée AUCUN offering.
--
--   1) catalog_items : cert_tier / category / duration_months (nullable) + check tier
--   2) catalog_types : certificat.needs_intake = true (modèle unifié intakes/offerings)
--   3) 2 sessions certificat (intakes) Octobre 2026 + Février 2027 en 'preparation'
--
-- ⚠️ needs_intake=true porte sur le TYPE 'certificat' (partagé ultrajobs/ultraboost/
--    ultraexecutive) : structurel, sans effet live (items draft, 0 offering). La
--    visibilité publique repose désormais sur la policy "Public read open offered items"
--    (déjà déployée) — aucune nouvelle policy requise.
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Colonnes certificat
alter table public.catalog_items add column if not exists cert_tier text;
alter table public.catalog_items add column if not exists category text;
alter table public.catalog_items add column if not exists duration_months int;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='catalog_items_cert_tier_chk') then
    alter table public.catalog_items add constraint catalog_items_cert_tier_chk
      check (cert_tier is null or cert_tier in ('competence','specialite','elite'));
  end if;
end $$;
comment on column public.catalog_items.cert_tier is 'Type de certificat : competence | specialite | elite (NULL hors certificats).';
comment on column public.catalog_items.category is 'Domaine de référence (7 domaines + catégories complémentaires).';
comment on column public.catalog_items.duration_months is 'Durée en mois (ex. 6 pour les certificats).';

-- 2) Type certificat -> needs_intake=true (n'affecte aucun item ; permet catalog_offerings)
update public.catalog_types set needs_intake=true where type_key='certificat';

-- 3) Sessions certificat (préparation ; ouverture + dates + offerings dans un lot ultérieur)
insert into public.intakes(academic_year,label,status,sort_order) values
  ('2026-2027','Certificats - Octobre 2026','preparation',30),
  ('2026-2027','Certificats - Fevrier 2027','preparation',31)
on conflict (academic_year,label) do nothing;

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from information_schema.columns where table_name='catalog_items' and column_name in ('cert_tier','category','duration_months');
  if v <> 3 then raise exception 'CTRL colonnes : %/3', v; end if;
  if (select needs_intake from public.catalog_types where type_key='certificat') <> true then raise exception 'CTRL needs_intake certificat'; end if;
  if (select needs_intake from public.catalog_types where type_key='diplome') <> true then raise exception 'CTRL diplome altéré'; end if;
  select count(*) into v from public.intakes where label like 'Certificats -%';
  if v <> 2 then raise exception 'CTRL sessions cert : %/2', v; end if;
  raise notice 'OK — Certificats Lot DB #1 (colonnes + needs_intake + 2 sessions preparation).';
end $$;

commit;

-- ROLLBACK (secours) :
-- delete from public.intakes where label in ('Certificats - Octobre 2026','Certificats - Fevrier 2027');
-- update public.catalog_types set needs_intake=false where type_key='certificat';
-- alter table public.catalog_items drop constraint if exists catalog_items_cert_tier_chk;
-- alter table public.catalog_items drop column if exists duration_months, drop column if exists category, drop column if exists cert_tier;
