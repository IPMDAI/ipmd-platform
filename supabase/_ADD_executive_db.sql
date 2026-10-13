-- ══════════════════════════════════════════════════════════════
-- IPMD — Lot Executive-DB (données) : prix + 2 sessions + 18 offres.
-- REVUE UNIQUEMENT — NE PAS APPLIQUER SANS FEU VERT.
-- Requiert Pro-DB #2a (catalog_offerings.level + intakes.enrollment_date déjà en base).
-- Executive reste séparé de Pro/Campus (catalogue ; PAS intake_offerings/classes).
-- Idempotent (on conflict do nothing).
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Prix Executive EXPLICITE = 3 550 000 (⚠️ PAS la grille Campus) « à partir de »
--    + frais d'inscription 300 000, puis ouverture des 3 items gouvernance.
update public.catalog_items set price=3550000, registration_fee=300000 where universe='gouvernance';
update public.catalog_items set status='open' where universe='gouvernance';

-- 2) 2 sessions Executive dédiées (open direct ; distinctes de Pro/Campus).
--    start_date = début des cours ; enrollment_date = rentrée.
insert into public.intakes(academic_year,label,start_date,enrollment_date,status,sort_order) values
  ('2026-2027','Session Executive - Fevrier 2027','2027-02-23','2027-02-16','open',20),
  ('2026-2027','Session Executive - Mai 2027','2027-05-18','2027-05-11','open',21)
on conflict (academic_year,label) do nothing;

-- 3) 18 offres = 3 filières × 3 niveaux (L3/M1/M2) × 2 sessions ; prix Executive uniforme.
insert into public.catalog_offerings(item_id,intake_id,status,level,price)
select ci.id, i.id, 'open', lv.level, 3550000
from public.catalog_items ci
cross join (values ('Licence 3'),('Master 1'),('Master 2')) lv(level)
cross join public.intakes i
where ci.universe='gouvernance'
  and i.academic_year='2026-2027'
  and i.label in ('Session Executive - Fevrier 2027','Session Executive - Mai 2027')
on conflict do nothing;

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from public.catalog_items where universe='gouvernance' and status='open';
  if v <> 3 then raise exception 'CTRL items open : %/3', v; end if;
  select count(*) into v from public.intakes where label like 'Session Executive -%';
  if v <> 2 then raise exception 'CTRL sessions : %/2', v; end if;
  select count(*) into v from public.catalog_offerings co join public.catalog_items ci on ci.id=co.item_id where ci.universe='gouvernance';
  if v <> 18 then raise exception 'CTRL offres : %/18', v; end if;
  if exists (select 1 from public.catalog_offerings co join public.catalog_items ci on ci.id=co.item_id where ci.universe='gouvernance' and co.level in ('Licence 1','Licence 2'))
    then raise exception 'CTRL : niveau L1/L2 interdit pour Executive'; end if;
  raise notice 'OK — Executive-DB : 3 items open (3 550 000 / reg 300 000), 2 sessions, 18 offres.';
end $$;

commit;
