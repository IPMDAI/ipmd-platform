-- ══════════════════════════════════════════════════════════════
-- IPMD — Lot Pro-DB #2a (schéma niveau × filière × session).
-- REVUE UNIQUEMENT — additif & sûr. AUCUNE donnée créée (ni session, ni offre).
--
--   1) catalog_offerings.level  (niveau porté par l'offre Pro)
--   2) intakes.enrollment_date  (date de rentrée, distincte de start_date=début cours)
--   3) unicité (item_id, intake_id, level) au lieu de (item_id, intake_id)
--
-- Pro reste dans le catalogue (catalog_items/catalog_offerings), séparé de
-- intake_offerings/classes Campus. Idempotent, transactionnel.
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Niveau sur l'offre Pro
alter table public.catalog_offerings add column if not exists level text;
comment on column public.catalog_offerings.level is
  'Niveau visé de l''offre (Pro : Licence 1..Master 2). NULL pour offres sans niveau.';

-- 2) Date de rentrée distincte du début des cours (start_date)
alter table public.intakes add column if not exists enrollment_date date;
comment on column public.intakes.enrollment_date is
  'Date de rentrée (distincte de start_date = début des cours). NULL si non renseignée.';

-- 3) Unicité (filière, session, niveau) — remplace (filière, session)
alter table public.catalog_offerings drop constraint if exists catalog_offerings_unique;
drop index if exists catalog_offerings_uq_lvl;
create unique index catalog_offerings_uq_lvl
  on public.catalog_offerings (item_id, intake_id, coalesce(level,''));

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='catalog_offerings' and column_name='level')
    then raise exception 'CTRL: catalog_offerings.level absent'; end if;
  if not exists (select 1 from information_schema.columns where table_name='intakes' and column_name='enrollment_date')
    then raise exception 'CTRL: intakes.enrollment_date absent'; end if;
  if not exists (select 1 from pg_indexes where indexname='catalog_offerings_uq_lvl')
    then raise exception 'CTRL: index unique catalog_offerings_uq_lvl absent'; end if;
  if exists (select 1 from pg_constraint where conname='catalog_offerings_unique')
    then raise exception 'CTRL: ancienne contrainte catalog_offerings_unique encore présente'; end if;
  raise notice 'OK — Pro-DB #2a (level + enrollment_date + unicité par niveau).';
end $$;

commit;

-- ROLLBACK (bloc de secours, non exécuté) :
-- drop index if exists catalog_offerings_uq_lvl;
-- alter table public.catalog_offerings add constraint catalog_offerings_unique unique (item_id, intake_id);
-- alter table public.intakes drop column if exists enrollment_date;
-- alter table public.catalog_offerings drop column if exists level;
