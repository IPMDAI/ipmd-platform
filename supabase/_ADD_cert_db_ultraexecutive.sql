-- ══════════════════════════════════════════════════════════════
-- IPMD — Certificats UltraExecutive (données). REVUE — NE PAS APPLIQUER SANS FEU VERT.
-- Requiert Lot DB #1 certificats (colonnes + needs_intake + sessions) déjà appliqué.
-- Configure les 10 items UltraExecutive (elite), les ouvre, crée 20 offerings sur les
-- 2 sessions certificat déjà ouvertes. doc_profile inchangé (cert-cv). RPC v6 déjà OK.
-- N'affecte QUE UltraExecutive. Ne touche pas SeniorsHub.
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Configurer les 10 items UltraExecutive
update public.catalog_items ci set
  cert_tier='elite', duration_months=6, price=950000, registration_fee=185000,
  credential='Certificat d''Élite', category=m.cat
from (values
  (50,'Stratégie IA & transformation digitale'),(51,'Stratégie IA & transformation digitale'),
  (52,'Leadership & gouvernance'),(53,'Leadership & gouvernance'),
  (54,'Data & Business Intelligence'),(55,'Finance digitale & FinTech'),
  (56,'Expérience client & innovation'),(57,'Cybersécurité'),
  (58,'Stratégie IA & transformation digitale'),(59,'Leadership & gouvernance')
) as m(so,cat)
where ci.universe='ultraexecutive' and ci.sort_order=m.so;

-- 2) Ouvrir les 10 items
update public.catalog_items set status='open' where universe='ultraexecutive';

-- 3) 20 offerings = 10 items × 2 sessions certificat déjà ouvertes (level NULL ; prix 950000)
insert into public.catalog_offerings(item_id,intake_id,status,level,price)
select ci.id, i.id, 'open', null, 950000
from public.catalog_items ci
cross join public.intakes i
where ci.universe='ultraexecutive' and i.label in ('Certificats - Octobre 2026','Certificats - Fevrier 2027')
on conflict do nothing;

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from public.catalog_items where universe='ultraexecutive' and cert_tier='elite' and price=950000 and category is not null and status='open';
  if v <> 10 then raise exception 'CTRL items UExec : %/10', v; end if;
  select count(*) into v from public.catalog_offerings co join public.catalog_items ci on ci.id=co.item_id where ci.universe='ultraexecutive';
  if v <> 20 then raise exception 'CTRL offres UExec : %/20', v; end if;
  raise notice 'OK — UltraExecutive : 10 items open (elite), 20 offerings.';
end $$;

commit;
