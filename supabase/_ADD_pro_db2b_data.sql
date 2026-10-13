-- ══════════════════════════════════════════════════════════════
-- IPMD — Lot Pro-DB #2b (données) : prix + 2 sessions Pro + 80 offres.
-- Requiert Pro-DB #1 et #2a appliqués. Idempotent (on conflict do nothing).
-- Pro reste séparé de Campus (catalogue ; PAS intake_offerings/classes).
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Prix « à partir de » (exigé par le trigger de publication) + frais d'inscription,
--    puis ouverture des 8 items Pro.
update public.catalog_items set price=1850000, registration_fee=300000 where universe='professionnel';
update public.catalog_items set status='open' where universe='professionnel';

-- 2) 2 sessions Pro dédiées — ouvertes DIRECTEMENT (pas open_intake, Campus-spécifique).
--    start_date = début des cours ; enrollment_date = rentrée.
insert into public.intakes(academic_year,label,start_date,enrollment_date,status,sort_order) values
  ('2026-2027','Session Pro - Fevrier 2027','2027-02-23','2027-02-16','open',10),
  ('2026-2027','Session Pro - Mai 2027','2027-05-18','2027-05-11','open',11)
on conflict (academic_year,label) do nothing;

-- 3) 80 offres = 8 filières × 5 niveaux × 2 sessions ; prix PAR NIVEAU (barème Campus).
insert into public.catalog_offerings(item_id,intake_id,status,level,price)
select ci.id, i.id, 'open', lv.level, lv.price
from public.catalog_items ci
cross join (values
  ('Licence 1',1850000),('Licence 2',1850000),('Licence 3',2500000),
  ('Master 1',2850000),('Master 2',2850000)) lv(level,price)
cross join public.intakes i
where ci.universe='professionnel'
  and i.academic_year='2026-2027'
  and i.label in ('Session Pro - Fevrier 2027','Session Pro - Mai 2027')
on conflict do nothing;

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from public.catalog_items where universe='professionnel' and status='open';
  if v <> 8 then raise exception 'CTRL items open : %/8', v; end if;
  select count(*) into v from public.intakes where label like 'Session Pro -%';
  if v <> 2 then raise exception 'CTRL sessions Pro : %/2', v; end if;
  select count(*) into v from public.catalog_offerings co join public.catalog_items ci on ci.id=co.item_id where ci.universe='professionnel';
  if v <> 80 then raise exception 'CTRL offres Pro : %/80', v; end if;
  raise notice 'OK — Pro-DB #2b : 8 items open, 2 sessions, 80 offres.';
end $$;

commit;
