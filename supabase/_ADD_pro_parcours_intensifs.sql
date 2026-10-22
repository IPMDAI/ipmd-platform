-- ============================================================================
-- IPMD Professionnel — Parcours intensifs (10 mois)  [Option B]
-- ----------------------------------------------------------------------------
-- Conditions commerciales RATTACHÉES AU NIVEAU (source de vérité = tuition_levels),
-- indépendantes de la classe.
--
--   • Licence Professionnelle intensive – 10 mois : scolarité 4 550 000, 8 échéances max
--   • Master Professionnel intensif – 10 mois     : scolarité 5 550 000, 8 échéances max
--
-- Frais d'inscription = 300 000 F CFA (défaut Pro global, finance_settings) → AUCUNE
-- colonne `registration_fee` ajoutée à tuition_levels (inutile : identique au Pro classique).
-- Seul ajout de schéma : tuition_levels.max_installments (plafond d'échéances par niveau).
--
-- 48 offres = 2 parcours × 8 filières Pro × 3 sessions Pro (Novembre 2026, Février 2027,
-- Mai 2027). Trigger anti-divergence : catalog_offerings.price ≡ tuition_levels.amount
-- pour les SEULS niveaux intensifs (max_installments IS NOT NULL).
--
-- PROTECTIONS : niveaux classiques L1/L2/L3/M1/M2 et tous les autres univers STRICTEMENT
-- inchangés (colonne max_installments = NULL → ancien comportement). Idempotent + atomique.
-- Identification robuste : par max_installments IS NOT NULL (donnée), jamais par libellé codé.
-- ============================================================================

begin;

-- 1) Plafond d'échéances par niveau. NULL = niveau classique (comportement inchangé).
alter table public.tuition_levels
  add column if not exists max_installments integer;

-- 2) Les 2 niveaux intensifs : amount = scolarité officielle ; max_installments = plafond (8).
insert into public.tuition_levels (level, amount, sort_order, max_installments) values
  ('Licence Professionnelle intensive – 10 mois', 4550000, 8, 8),
  ('Master Professionnel intensif – 10 mois',     5550000, 9, 8)
on conflict (level) do update set
  amount           = excluded.amount,
  sort_order       = excluded.sort_order,
  max_installments = excluded.max_installments,
  updated_at       = now();

-- 3) Intake « Session Pro - Novembre 2026 » (si absent). Libellé aligné sur les sessions
--    Pro existantes (séparateur « - »). Antérieure à Février → sort_order 9.
insert into public.intakes (academic_year, label, start_date, status, sort_order)
select '2026-2027', 'Session Pro - Novembre 2026', date '2026-11-17', 'open', 9
where not exists (
  select 1 from public.intakes where label = 'Session Pro - Novembre 2026'
);

-- 4a) Anti-divergence à l'écriture d'une offre : niveau intensif → price forcé = amount du niveau.
create or replace function public.sync_intensive_offering_price()
returns trigger language plpgsql as $$
declare
  v_amount numeric;
  v_mi     integer;
begin
  select amount, max_installments into v_amount, v_mi
    from public.tuition_levels where level = new.level;
  if v_mi is not null then
    new.price := v_amount;  -- niveau = source de vérité (affiché = facturé)
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_intensive_offering_price on public.catalog_offerings;
create trigger trg_sync_intensive_offering_price
  before insert or update of price, level, item_id, intake_id
  on public.catalog_offerings
  for each row execute function public.sync_intensive_offering_price();

-- 4b) Anti-divergence au changement de tarif d'un niveau intensif → cascade sur ses offres.
create or replace function public.propagate_intensive_level_amount()
returns trigger language plpgsql as $$
begin
  if new.max_installments is not null and new.amount is distinct from old.amount then
    update public.catalog_offerings set price = new.amount where level = new.level;
  end if;
  return new;
end $$;

drop trigger if exists trg_propagate_intensive_level_amount on public.tuition_levels;
create trigger trg_propagate_intensive_level_amount
  after update of amount on public.tuition_levels
  for each row execute function public.propagate_intensive_level_amount();

-- 5) Les 48 offres (2 niveaux × 8 filières Pro × 3 sessions Pro). price = amount du niveau
--    (le trigger 4a le re-confirme). L'index unique (item_id, intake_id, coalesce(level,''))
--    rend tout doublon impossible → ON CONFLICT DO NOTHING (aucune duplication Février/Mai).
insert into public.catalog_offerings (item_id, intake_id, status, price, level)
select i.id, k.id, 'open', tl.amount, tl.level
from public.catalog_items i
cross join public.intakes k
cross join public.tuition_levels tl
where i.universe = 'professionnel'
  and k.label in (
    'Session Pro - Novembre 2026',
    'Session Pro - Fevrier 2027',
    'Session Pro - Mai 2027'
  )
  and tl.level in (
    'Licence Professionnelle intensive – 10 mois',
    'Master Professionnel intensif – 10 mois'
  )
on conflict (item_id, intake_id, coalesce(level, '')) do nothing;

commit;
