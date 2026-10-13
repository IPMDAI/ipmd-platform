-- ══════════════════════════════════════════════════════════════
-- IPMD — Certificats UltraBoost (données). REVUE — NE PAS APPLIQUER SANS FEU VERT.
-- Requiert Lot DB #1 certificats (colonnes + needs_intake + sessions) déjà appliqué.
-- Configure les 15 items UltraBoost (specialite), les ouvre, crée 30 offerings
-- sur les 2 sessions certificat déjà ouvertes. doc_profile inchangé (cert-cv).
-- N'affecte QUE UltraBoost. RPC v6 déjà compatible (aucune modif).
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Configurer les 15 items UltraBoost
update public.catalog_items ci set
  cert_tier='specialite', duration_months=6, price=785000, registration_fee=185000,
  credential='Certificat de Spécialité', category=m.cat
from (values
  (35,'Marketing des technologies'),(36,'Communication & réseaux sociaux'),
  (37,'Design & création visuelle'),(38,'Développement d''applications'),
  (39,'Développement d''applications'),(40,'Data & Business Intelligence'),
  (41,'Data & Business Intelligence'),(42,'Stratégie IA & transformation digitale'),
  (43,'Management de projet digital'),(44,'Management de projet digital'),
  (45,'Cybersécurité'),(46,'Finance digitale & FinTech'),
  (47,'Vente & E-commerce'),(48,'Vente & E-commerce'),
  (49,'Domotique & automatisation')
) as m(so,cat)
where ci.universe='ultraboost' and ci.sort_order=m.so;

-- 2) Ouvrir les 15 items
update public.catalog_items set status='open' where universe='ultraboost';

-- 3) 30 offerings = 15 items × 2 sessions certificat déjà ouvertes (level NULL ; prix 785000)
insert into public.catalog_offerings(item_id,intake_id,status,level,price)
select ci.id, i.id, 'open', null, 785000
from public.catalog_items ci
cross join public.intakes i
where ci.universe='ultraboost' and i.label in ('Certificats - Octobre 2026','Certificats - Fevrier 2027')
on conflict do nothing;

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from public.catalog_items where universe='ultraboost' and cert_tier='specialite' and price=785000 and category is not null and status='open';
  if v <> 15 then raise exception 'CTRL items UB : %/15', v; end if;
  select count(*) into v from public.catalog_offerings co join public.catalog_items ci on ci.id=co.item_id where ci.universe='ultraboost';
  if v <> 30 then raise exception 'CTRL offres UB : %/30', v; end if;
  raise notice 'OK — UltraBoost : 15 items open (specialite), 30 offerings.';
end $$;

commit;
