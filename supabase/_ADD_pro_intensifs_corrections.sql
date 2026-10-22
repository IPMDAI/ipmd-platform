-- ============================================================================
-- IPMD Professionnel — corrections post-lot parcours intensifs
-- ----------------------------------------------------------------------------
-- 1) Libellés des niveaux intensifs : tiret simple « - » (ASCII) au lieu du tiret
--    long « – » (évite toute dépendance à un caractère non-ASCII dans l'affichage).
-- 2) +40 offres CLASSIQUES sur la Session Novembre 2026 (5 niveaux × 8 filières),
--    prix miroir des sessions existantes. L'index unique garantit l'absence de doublon.
-- 3) Renommage des 3 sessions Pro : « Session Pro - … » → « Session IPMD Professionnel - … »
--    (« IPMD Professionnel » partout, plus de « Pro » côté candidat).
-- Idempotent + atomique. Classiques L1..M2 et autres univers inchangés.
-- ============================================================================

begin;

-- 1) Libellés intensifs → tiret ASCII
update public.tuition_levels set level = 'Licence Professionnelle intensive - 10 mois'
  where level like 'Licence Professionnelle intensive%';
update public.tuition_levels set level = 'Master Professionnel intensif - 10 mois'
  where level like 'Master Professionnel intensif%';
update public.catalog_offerings set level = 'Licence Professionnelle intensive - 10 mois'
  where level like 'Licence Professionnelle intensive%';
update public.catalog_offerings set level = 'Master Professionnel intensif - 10 mois'
  where level like 'Master Professionnel intensif%';

-- 2) +40 offres CLASSIQUES Novembre 2026 (gabarits classiques existants × Novembre)
insert into public.catalog_offerings (item_id, intake_id, status, price, level)
select ct.item_id, nov.id, 'open', ct.price, ct.level
from (
  select distinct o.item_id, o.level, o.price
  from public.catalog_offerings o
  join public.catalog_items i on i.id = o.item_id
  where i.universe = 'professionnel' and o.level not like '%intensi%'
) ct
cross join (
  select id from public.intakes
  where label in ('Session IPMD Professionnel - Novembre 2026', 'Session Pro - Novembre 2026')
  limit 1
) nov
on conflict (item_id, intake_id, coalesce(level, '')) do nothing;

-- 3) Renommage des sessions (« Pro » → « IPMD Professionnel »)
update public.intakes set label = 'Session IPMD Professionnel - Novembre 2026' where label = 'Session Pro - Novembre 2026';
update public.intakes set label = 'Session IPMD Professionnel - Fevrier 2027'  where label = 'Session Pro - Fevrier 2027';
update public.intakes set label = 'Session IPMD Professionnel - Mai 2027'      where label = 'Session Pro - Mai 2027';

commit;
