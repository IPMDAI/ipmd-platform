-- ══════════════════════════════════════════════════════════════
-- IPMD — SeniorsHub : champs facultatifs « expertise » + « objectif ». REVUE — NE PAS
-- APPLIQUER SANS FEU VERT.
--   1) Migration ADDITIVE : 2 colonnes texte NULL sur inscription_requests
--        senior_expertise text NULL   -- « Domaine d'expérience ou d'expertise »
--        senior_goal      text NULL   -- « Que souhaitez-vous apprendre/développer ? »
--   2) RPC v7 : persiste ces 2 champs UNIQUEMENT quand universe='seniorshub'
--      (pour tout autre univers, restent NULL même si présents dans le payload).
--      « Situation actuelle » conserve son stockage existant (colonne message).
-- Additif et rétro-compatible : Campus/Pro/Executive/UltraJobs/UltraBoost/UltraExecutive
-- inchangés. N'affecte QUE la persistance SeniorsHub.
-- ══════════════════════════════════════════════════════════════

begin;

-- 1) Colonnes additives (idempotent)
alter table public.inscription_requests
  add column if not exists senior_expertise text null,
  add column if not exists senior_goal      text null;

-- 2) RPC v7 (= v6 + persistance des 2 champs seniorshub)
create or replace function public.submit_candidature(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_universe      text := p_payload->>'universe';
  v_variant       text;
  v_full          text := trim(trim(coalesce(p_payload->'identity'->>'last_name','')) || ' ' ||
                                trim(coalesce(p_payload->'identity'->>'first_name','')));
  v_email         text := trim(coalesce(p_payload->'identity'->>'email',''));
  v_phone         text := trim(coalesce(p_payload->'identity'->>'phone',''));
  v_whatsapp      text := nullif(trim(coalesce(p_payload->'identity'->>'whatsapp','')),'');
  v_birth_date    date;
  v_birth_place   text := nullif(trim(coalesce(p_payload->'identity'->>'birth_place','')),'');
  v_birth_country    text := nullif(trim(coalesce(p_payload->'identity'->>'birth_country','')),'');
  v_phone_country    text := nullif(trim(coalesce(p_payload->'identity'->>'phone_country','')),'');
  v_whatsapp_country text := nullif(trim(coalesce(p_payload->'identity'->>'whatsapp_country','')),'');
  v_min_age       int;
  v_age           int;
  v_last_level    text := nullif(trim(coalesce(p_payload->'background'->>'last_level','')),'');
  v_last_diploma  text := nullif(trim(coalesce(p_payload->'background'->>'last_diploma','')),'');
  v_situation     text := nullif(trim(coalesce(p_payload->'background'->>'current_situation','')),'');
  v_institution   text := nullif(trim(coalesce(p_payload->'background'->>'institution','')),'');
  v_grad_year     int;
  v_mode          text := nullif(trim(coalesce(p_payload->>'mode','')),'');
  -- Profil professionnel (Pro)
  v_prof_status   text := nullif(trim(coalesce(p_payload->'background'->>'professional_status','')),'');
  v_position      text := nullif(trim(coalesce(p_payload->'background'->>'current_position','')),'');
  v_organization  text := nullif(trim(coalesce(p_payload->'background'->>'organization','')),'');
  v_sector        text := nullif(trim(coalesce(p_payload->'background'->>'sector','')),'');
  v_experience    int;
  -- SeniorsHub (facultatifs) — persistés uniquement si universe='seniorshub'
  v_senior_expertise text := null;
  v_senior_goal      text := null;
  v_doc_profile   text;
  v_academic_year text;
  v_intake_id     uuid;
  v_filiere_id    uuid;
  v_offered_level text;
  v_program       text;
  v_prog_name     text;
  v_entry_level   text;
  v_ckey          text;
  v_offering_id   uuid;
  v_off_price     numeric;
  v_item_price    numeric;
  v_price         numeric;
  v_cert_tier     text;
  v_item_id       uuid;
  v_request_id    uuid;
begin
  -- 1) Identité minimale
  if v_full = '' or v_email = '' or v_phone = '' then raise exception 'IDENTITE_INCOMPLETE'; end if;

  -- 2) Variante depuis l'univers
  v_variant := case v_universe
    when 'campus'         then 'campus'
    when 'professionnel'  then 'pro'
    when 'gouvernance'    then 'executive'
    when 'ultrajobs'      then 'certificat'
    when 'ultraboost'     then 'certificat'
    when 'ultraexecutive' then 'certificat'
    when 'seniorshub'     then 'certificat'
    else null end;
  if v_variant is null then raise exception 'UNIVERS_INVALIDE'; end if;

  -- 2b) Pays (ISO-2) + téléphone/WhatsApp en E.164
  if v_birth_country is null or v_birth_country !~ '^[A-Z]{2}$' then raise exception 'PAYS_NAISSANCE_MANQUANT'; end if;
  if v_phone_country is null or v_phone_country !~ '^[A-Z]{2}$' then raise exception 'INDICATIF_TEL_MANQUANT'; end if;
  if v_phone !~ '^\+[1-9][0-9]{6,14}$' then raise exception 'TEL_INVALIDE'; end if;
  if v_whatsapp is not null then
    if v_whatsapp_country is null or v_whatsapp_country !~ '^[A-Z]{2}$' then raise exception 'INDICATIF_WHATSAPP_MANQUANT'; end if;
    if v_whatsapp !~ '^\+[1-9][0-9]{6,14}$' then raise exception 'WHATSAPP_INVALIDE'; end if;
  else
    v_whatsapp_country := null;
  end if;

  -- 2c) Date de naissance : réelle, pas future, âge ≥ minimum du parcours
  begin
    v_birth_date := nullif(p_payload->'identity'->>'birth_date','')::date;
  exception when others then raise exception 'DATE_INVALIDE'; end;
  if v_birth_date is null then raise exception 'DATE_NAISSANCE_MANQUANTE'; end if;
  if v_birth_date > current_date then raise exception 'DATE_FUTURE'; end if;
  v_min_age := case v_universe
    when 'professionnel'  then 18
    when 'ultraboost'     then 25
    when 'gouvernance'    then 25
    when 'ultraexecutive' then 25
    when 'seniorshub'     then 40
    else 16 end;
  v_age := date_part('year', age(current_date, v_birth_date))::int;
  if v_age < v_min_age then raise exception 'AGE_INSUFFISANT'; end if;

  -- 2d) Mode : validé ; obligatoire pour Campus ET Pro
  if v_mode is not null and v_mode not in ('presentiel','distance','hybride') then raise exception 'MODE_INVALIDE'; end if;
  if v_variant in ('campus','pro','executive','certificat') and v_mode is null then raise exception 'MODE_MANQUANT'; end if;

  -- 2e) Année d'obtention + expérience (facultatifs, jamais bloquants sauf < 0)
  begin v_grad_year := nullif(trim(coalesce(p_payload->'background'->>'graduation_year','')),'')::int; exception when others then v_grad_year := null; end;
  begin v_experience := nullif(trim(coalesce(p_payload->'background'->>'experience_years','')),'')::int; exception when others then v_experience := null; end;
  if v_experience is not null and v_experience < 0 then raise exception 'EXPERIENCE_INVALIDE'; end if;

  -- 2f) Profil professionnel (Pro uniquement)
  if v_variant = 'pro' then
    if v_prof_status is null then raise exception 'STATUT_PRO_MANQUANT'; end if;
    if v_prof_status not in ('salarie','entrepreneur','independant','demandeur_emploi','autre') then raise exception 'STATUT_PRO_INVALIDE'; end if;
    if v_prof_status in ('salarie','entrepreneur','independant') and v_position is null then raise exception 'POSTE_MANQUANT'; end if;
  end if;

  -- 2g) Profil Executive : fonction actuelle obligatoire
  if v_variant = 'executive' and v_situation is null then raise exception 'FONCTION_MANQUANTE'; end if;

  -- 2h) SeniorsHub : champs facultatifs (expertise + objectif). Persistés UNIQUEMENT
  --     pour seniorshub ; ignorés (restent NULL) pour tout autre univers.
  if v_universe = 'seniorshub' then
    v_senior_expertise := nullif(trim(coalesce(p_payload->'background'->>'senior_expertise','')),'');
    v_senior_goal      := nullif(trim(coalesce(p_payload->'background'->>'senior_goal','')),'');
  end if;

  -- 3) Revalidation LIVE du projet + profil documentaire
  if v_variant = 'campus' then
    v_ckey          := p_payload->'project'->>'campus_offering_key';
    v_intake_id     := (p_payload->'project'->>'campus_intake_id')::uuid;
    v_filiere_id    := split_part(v_ckey, '::', 1)::uuid;
    v_offered_level := split_part(v_ckey, '::', 2);
    select i.academic_year into v_academic_year
    from public.intake_offerings io join public.intakes i on i.id = io.intake_id
    where io.intake_id = v_intake_id and io.filiere_id = v_filiere_id and io.level = v_offered_level
      and io.status = 'open' and i.status = 'open';
    if v_academic_year is null then raise exception 'OFFRE_FERMEE'; end if;
    select f.name into v_prog_name from public.filieres f where f.id = v_filiere_id;
    v_program     := trim(coalesce(v_prog_name,'') || ' · ' || v_offered_level);
    v_entry_level := v_offered_level;
    v_doc_profile := 'campus';

  elsif v_variant = 'pro' then
    -- Offre Pro non ambiguë : catalog_offering_id (repli pro_offering_id) ; rechargée serveur.
    v_offering_id := nullif(coalesce(p_payload->'project'->>'catalog_offering_id', p_payload->'project'->>'pro_offering_id'),'')::uuid;
    if v_offering_id is null then raise exception 'OFFRE_FERMEE'; end if;
    select co.level, co.price, i.academic_year, i.id, ci.name, ci.doc_profile, ci.price
      into v_offered_level, v_off_price, v_academic_year, v_intake_id, v_prog_name, v_doc_profile, v_item_price
    from public.catalog_offerings co
    join public.catalog_items ci on ci.id = co.item_id
    join public.intakes i on i.id = co.intake_id
    where co.id = v_offering_id
      and co.status = 'open' and ci.status = 'open'
      and ci.universe = 'professionnel' and i.status = 'open';
    if v_academic_year is null then raise exception 'OFFRE_FERMEE'; end if;
    if v_offered_level is null or v_offered_level not in ('Licence 1','Licence 2','Licence 3','Master 1','Master 2')
      then raise exception 'NIVEAU_INVALIDE'; end if;
    v_price := coalesce(v_off_price, v_item_price);
    if v_price is null then raise exception 'PRIX_MANQUANT'; end if;
    v_doc_profile := coalesce(v_doc_profile, 'pro');
    v_program     := v_prog_name || ' — ' || v_offered_level;
    v_entry_level := v_offered_level;

  elsif v_variant = 'executive' then
    -- Offre Executive non ambiguë : catalog_offering_id (repli exec_offering_id) ; rechargée serveur.
    v_offering_id := nullif(coalesce(p_payload->'project'->>'catalog_offering_id', p_payload->'project'->>'exec_offering_id'),'')::uuid;
    if v_offering_id is null then raise exception 'OFFRE_FERMEE'; end if;
    select co.level, co.price, i.academic_year, i.id, ci.name, ci.doc_profile, ci.price
      into v_offered_level, v_off_price, v_academic_year, v_intake_id, v_prog_name, v_doc_profile, v_item_price
    from public.catalog_offerings co
    join public.catalog_items ci on ci.id = co.item_id
    join public.intakes i on i.id = co.intake_id
    where co.id = v_offering_id
      and co.status = 'open' and ci.status = 'open'
      and ci.universe = 'gouvernance' and i.status = 'open';
    if v_academic_year is null then raise exception 'OFFRE_FERMEE'; end if;
    if v_offered_level is null or v_offered_level not in ('Licence 3','Master 1','Master 2')
      then raise exception 'NIVEAU_INVALIDE'; end if;
    v_price := coalesce(v_off_price, v_item_price);
    if v_price is null then raise exception 'PRIX_MANQUANT'; end if;
    v_doc_profile := coalesce(v_doc_profile, 'executive');
    v_program     := v_prog_name || ' — ' || v_offered_level;
    v_entry_level := v_offered_level;

  else -- certificat (offering-based v6 ; data-driven)
    -- Offre certificat non ambiguë : catalog_offering_id, rechargée serveur.
    v_offering_id := nullif(p_payload->'project'->>'catalog_offering_id','')::uuid;
    if v_offering_id is null then raise exception 'OFFRE_FERMEE'; end if;
    select co.price, i.academic_year, i.id, ci.name, ci.credential, ci.doc_profile, ci.price, ci.cert_tier
      into v_off_price, v_academic_year, v_intake_id, v_prog_name, v_entry_level, v_doc_profile, v_item_price, v_cert_tier
    from public.catalog_offerings co
    join public.catalog_items ci on ci.id = co.item_id
    join public.intakes i on i.id = co.intake_id
    where co.id = v_offering_id
      and co.status = 'open' and ci.status = 'open'
      and ci.universe = v_universe and i.status = 'open';
    if v_academic_year is null then raise exception 'OFFRE_FERMEE'; end if;
    if v_cert_tier is null then raise exception 'CERT_TIER_MANQUANT'; end if;
    v_price := coalesce(v_off_price, v_item_price);
    if v_price is null then raise exception 'PRIX_MANQUANT'; end if;
    v_doc_profile := coalesce(v_doc_profile, 'cert-light');
    v_program := v_prog_name;
  end if;

  -- 4) Chemins non vides
  if exists (select 1 from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text)
             where coalesce(trim(d.path),'') = '') then raise exception 'CHEMIN_VIDE'; end if;

  -- 5) Aucun document hors profil
  if exists (select 1 from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text)
             left join public.document_profiles dp on dp.profile_key = v_doc_profile and dp.doc_key = d.doc_key
             where dp.doc_key is null) then raise exception 'DOC_HORS_PROFIL'; end if;

  -- 5b) Cardinalité max_files
  if exists (
    select 1 from (
      select d.doc_key, count(*) c
      from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text)
      group by d.doc_key) g
    join public.document_types dt on dt.doc_key = g.doc_key
    where g.c > dt.max_files) then raise exception 'PIECE_TROP_NOMBREUSE'; end if;

  -- 6) Pièces required présentes
  if exists (
    select 1 from public.document_profiles dp
    where dp.profile_key = v_doc_profile and dp.requirement = 'required'
      and not exists (select 1 from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text)
                      where d.doc_key = dp.doc_key and coalesce(trim(d.path),'') <> '')
  ) then raise exception 'PIECES_MANQUANTES'; end if;

  -- 7) Création candidature (+ miroir legacy doc_*)
  insert into public.inscription_requests(
    full_name, email, phone, whatsapp, birth_date, birth_place,
    birth_country, phone_country, whatsapp_country,
    universe, last_education, last_diploma, graduation_year, institution,
    professional_status, current_position, organization, sector, experience_years,
    program_interest, entry_level, mode, message,
    senior_expertise, senior_goal,
    academic_year, intake_id, filiere_id, offered_level,
    doc_id, doc_diploma, doc_cv, doc_attestation, doc_bulletins
  )
  select
    v_full, v_email, v_phone, v_whatsapp, v_birth_date, v_birth_place,
    v_birth_country, v_phone_country, v_whatsapp_country,
    v_universe, v_last_level, v_last_diploma, v_grad_year, v_institution,
    v_prof_status, v_position, v_organization, v_sector, v_experience,
    nullif(v_program,''), v_entry_level, v_mode, v_situation,
    v_senior_expertise, v_senior_goal,
    v_academic_year, v_intake_id, v_filiere_id, v_offered_level,
    (select d.path from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text) where d.doc_key='piece_identite' limit 1),
    (select d.path from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text) where d.doc_key='diplome' limit 1),
    (select d.path from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text) where d.doc_key='cv' limit 1),
    (select d.path from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text) where d.doc_key='attestation' limit 1),
    (select string_agg(d.path, ',') from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text) where d.doc_key='bulletins')
  returning id into v_request_id;

  -- 8) Références documentaires (snapshot du profil)
  insert into public.inscription_documents(request_id, doc_key, path, requirement)
  select v_request_id, d.doc_key, d.path, dp.requirement
  from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text)
  join public.document_profiles dp on dp.profile_key = v_doc_profile and dp.doc_key = d.doc_key;

  return v_request_id;
end
$fn$;

revoke all on function public.submit_candidature(jsonb) from public;
grant execute on function public.submit_candidature(jsonb) to anon, authenticated;

-- ------------------------------------------------------------------ CONTRÔLES APRÈS
do $$ declare v int; begin
  select count(*) into v from information_schema.columns
   where table_schema='public' and table_name='inscription_requests'
     and column_name in ('senior_expertise','senior_goal');
  if v <> 2 then raise exception 'CTRL colonnes seniors : %/2', v; end if;
  raise notice 'OK — colonnes senior_expertise/senior_goal + RPC v7 en place.';
end $$;

commit;
