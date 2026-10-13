-- ══════════════════════════════════════════════════════════════
-- IPMD — Certificats Lot DB #2 UltraJobs (données). REVUE — NE PAS APPLIQUER SANS FEU VERT.
-- Requiert Lot DB #1 certificats (colonnes + needs_intake + 2 sessions preparation).
-- Configure les 24 items UltraJobs, ouvre items+sessions, crée 48 offerings.
-- N'affecte QUE UltraJobs (ultraboost/ultraexecutive/seniorshub intacts).
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Configurer les 24 items UltraJobs (competence / 6 mois / 785000 / reg 185000 / credential / category)
update public.catalog_items ci set
  cert_tier='competence', duration_months=6, price=785000, registration_fee=185000,
  credential='Certificat de Compétence', category=m.cat
from (values
  (11,'Design & création visuelle'),(12,'Développement d''applications'),
  (13,'Domotique & automatisation'),(14,'Stratégie IA & transformation digitale'),
  (15,'Vente & E-commerce'),(16,'Design & création visuelle'),
  (17,'Assistance, secrétariat digital & direction'),(18,'Assistance, secrétariat digital & direction'),
  (19,'Cybersécurité'),(20,'Data & Business Intelligence'),
  (21,'Assistance, secrétariat digital & direction'),(22,'Assistance, secrétariat digital & direction'),
  (23,'Domotique & automatisation'),(24,'Communication & réseaux sociaux'),
  (25,'Marketing des technologies'),(26,'Marketing des technologies'),
  (27,'Marketing des technologies'),(28,'Communication & réseaux sociaux'),
  (29,'Design & création visuelle'),(30,'Design & création visuelle'),
  (31,'Design & création visuelle'),(32,'Design & création visuelle'),
  (33,'Design & création visuelle'),(34,'Développement d''applications')
) as m(so,cat)
where ci.universe='ultrajobs' and ci.sort_order=m.so;

-- 2) Ouvrir les 24 items
update public.catalog_items set status='open' where universe='ultrajobs';

-- 3) Sessions : dates confirmées + open
update public.intakes set enrollment_date='2026-10-12', start_date='2026-10-20', status='open' where label='Certificats - Octobre 2026';
update public.intakes set enrollment_date='2027-02-15', start_date='2027-02-22', status='open' where label='Certificats - Fevrier 2027';

-- 4) 48 offerings = 24 items × 2 sessions (level NULL ; prix 785000)
insert into public.catalog_offerings(item_id,intake_id,status,level,price)
select ci.id, i.id, 'open', null, 785000
from public.catalog_items ci
cross join public.intakes i
where ci.universe='ultrajobs' and i.label in ('Certificats - Octobre 2026','Certificats - Fevrier 2027')
on conflict do nothing;

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from public.catalog_items where universe='ultrajobs' and cert_tier='competence' and price=785000 and category is not null and status='open';
  if v <> 24 then raise exception 'CTRL items UJ : %/24', v; end if;
  select count(*) into v from public.catalog_offerings co join public.catalog_items ci on ci.id=co.item_id where ci.universe='ultrajobs';
  if v <> 48 then raise exception 'CTRL offres UJ : %/48', v; end if;
  select count(*) into v from public.intakes where label like 'Certificats -%' and status='open';
  if v <> 2 then raise exception 'CTRL sessions open : %/2', v; end if;
  raise notice 'OK — Certificats Lot DB #2 UltraJobs : 24 items open, 2 sessions open, 48 offerings.';
end $$;

commit;
