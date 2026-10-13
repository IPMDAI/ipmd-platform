-- ══════════════════════════════════════════════════════════════
-- IPMD — Lot Pro-DB #1 (préparatoire, additif & sûr).
-- REVUE UNIQUEMENT — NE PAS APPLIQUER SANS FEU VERT.
--
-- Portée (aucune session, aucun prix, aucun passage 'open') :
--   1) 5 colonnes « profil professionnel » sur inscription_requests (nullable)
--   2) profil documentaire 'pro' : ajout de bulletins (optional)
--   3) policy RLS anon : items OUVERTS ayant une OFFRE ouverte sous rentrée ouverte
--   4) 2 renommages catalogue Pro (références auditées = sûres)
--
-- Idempotent, transactionnel, non destructif. NE crée aucune donnée métier.
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Colonnes profil professionnel (Étape 2 Pro) — nullable, additif
alter table public.inscription_requests
  add column if not exists professional_status text,
  add column if not exists current_position    text,
  add column if not exists organization        text,
  add column if not exists sector              text,
  add column if not exists experience_years    int;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='inscription_requests_experience_years_chk') then
    alter table public.inscription_requests
      add constraint inscription_requests_experience_years_chk
      check (experience_years is null or experience_years >= 0);
  end if;
end $$;

comment on column public.inscription_requests.professional_status is
  'Situation pro (Pro) : salarie/entrepreneur/independant/demandeur_emploi/autre. Validé côté RPC.';
comment on column public.inscription_requests.current_position is 'Fonction / poste actuel (Pro).';
comment on column public.inscription_requests.organization is 'Organisation / entreprise (Pro, facultatif).';
comment on column public.inscription_requests.sector is 'Secteur d''activité (Pro, facultatif).';
comment on column public.inscription_requests.experience_years is 'Années d''expérience (Pro, facultatif).';

-- 2) Profil documentaire 'pro' : bulletins facultatif (id/diplome/cv déjà requis ; justif pro optional)
insert into public.document_profiles (profile_key, doc_key, requirement, sort_order)
values ('pro','bulletins','optional',5)
on conflict (profile_key, doc_key) do nothing;

-- 3) Policy RLS anon : rend visibles au public les items OUVERTS ayant une OFFRE
--    ouverte sous une rentrée ouverte (couvre les diplômes Pro/Executive une fois
--    offerts). Additive (OR avec les policies existantes) ; n'expose aucun draft.
drop policy if exists "Public read open offered items" on public.catalog_items;
create policy "Public read open offered items" on public.catalog_items for select to anon
  using (
    status = 'open'
    and exists (
      select 1
      from public.catalog_offerings co
      join public.intakes i on i.id = co.intake_id
      where co.item_id = catalog_items.id
        and co.status = 'open'
        and i.status = 'open'
    )
  );

-- 4) Renommages catalogue Pro (0 référence candidature ; sans impact filieres Campus)
update public.catalog_items set name = 'E-commerce'
  where universe='professionnel' and name = 'E-commerce & commerce international';
update public.catalog_items set name = 'Finance digitale (FinTech)'
  where universe='professionnel' and name = 'Finance digitale';

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from information_schema.columns
   where table_name='inscription_requests'
     and column_name in ('professional_status','current_position','organization','sector','experience_years');
  if v <> 5 then raise exception 'CTRL colonnes profil pro : %/5', v; end if;
  if not exists (select 1 from public.document_profiles where profile_key='pro' and doc_key='bulletins' and requirement='optional')
    then raise exception 'CTRL bulletins pro absent'; end if;
  if not exists (select 1 from pg_policies where tablename='catalog_items' and policyname='Public read open offered items')
    then raise exception 'CTRL policy anon absente'; end if;
  if not exists (select 1 from public.catalog_items where universe='professionnel' and name='E-commerce')
    then raise exception 'CTRL renommage E-commerce'; end if;
  if not exists (select 1 from public.catalog_items where universe='professionnel' and name='Finance digitale (FinTech)')
    then raise exception 'CTRL renommage FinTech'; end if;
  raise notice 'OK — Lot Pro-DB #1 (colonnes + bulletins + policy + renommages).';
end $$;

commit;

-- ROLLBACK (bloc de secours, non exécuté) :
-- alter table public.inscription_requests drop constraint if exists inscription_requests_experience_years_chk;
-- alter table public.inscription_requests
--   drop column if exists professional_status, drop column if exists current_position,
--   drop column if exists organization, drop column if exists sector, drop column if exists experience_years;
-- delete from public.document_profiles where profile_key='pro' and doc_key='bulletins';
-- drop policy if exists "Public read open offered items" on public.catalog_items;
-- update public.catalog_items set name='E-commerce & commerce international' where universe='professionnel' and name='E-commerce';
-- update public.catalog_items set name='Finance digitale' where universe='professionnel' and name='Finance digitale (FinTech)';
