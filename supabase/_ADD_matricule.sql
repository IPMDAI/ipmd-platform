-- ==================================================================
-- IPMD — Matricule (sous-lot DB/RPC). REVUE — NE PAS APPLIQUER SANS FEU VERT.
-- Portee : identite structuree + colonne matricule + compteur annuel + fonction
-- atomique d'attribution + RPC v9 (persiste last_name/first_names au depot).
-- N'attribue AUCUN matricule (aucun appel a assign_matricule ici).
-- Ne modifie NI inviteFromCandidature NI les ecrans NI le workflow admission/test-mode.
-- assign_matricule : EXECUTE reserve a service_role (jamais anon/authenticated).
-- ==================================================================

begin;

create extension if not exists unaccent;

-- Identite structuree (additive ; full_name conserve)
alter table public.inscription_requests
  add column if not exists last_name text,
  add column if not exists first_names text;
alter table public.profiles
  add column if not exists last_name text,
  add column if not exists first_names text,
  add column if not exists matricule text;

-- Unicite matricule (partielle : plusieurs NULL autorises pour les historiques)
create unique index if not exists profiles_matricule_uk
  on public.profiles (matricule) where matricule is not null;

-- Compteur annuel (remise a zero par annee via une ligne par annee)
create table if not exists public.matricule_counters (
  academic_year text primary key,
  last_seq int not null default 0
);

-- Seeds (plancher = nb etudiants existants ; 2026-2027 = 0)
insert into public.matricule_counters(academic_year,last_seq) values
  ('2022-2023',20),('2023-2024',32),('2024-2025',22),('2025-2026',20),('2026-2027',0)
  on conflict (academic_year) do update set last_seq = excluded.last_seq;

-- Fonction atomique + idempotente (attribution au passage 'inscrit', appelee ailleurs)
create or replace function public.assign_matricule(
  p_student uuid, p_academic_year text, p_last_name text, p_first_names text
) returns text
language plpgsql security definer set search_path = ''
as $mfn$
declare v_existing text; v_seq int; v_n text; v_p text; v_first_token text; v_yy text; v_mat text;
begin
  if p_student is null then raise exception 'STUDENT_MANQUANT'; end if;
  if coalesce(trim(p_academic_year),'') !~ '^[0-9]{4}-[0-9]{4}$' then raise exception 'ANNEE_INVALIDE'; end if;
  select matricule into v_existing from public.profiles where id = p_student for update;
  if not found then raise exception 'PROFIL_INTROUVABLE'; end if;
  if v_existing is not null then return v_existing; end if;
  v_n := upper(substring(regexp_replace(public.unaccent(coalesce(p_last_name,'')), '[^A-Za-z]', '', 'g') from 1 for 1));
  v_first_token := split_part(regexp_replace(btrim(coalesce(p_first_names,'')), '\s+', ' ', 'g'), ' ', 1);
  v_p := upper(substring(regexp_replace(public.unaccent(v_first_token), '[^A-Za-z]', '', 'g') from 1 for 1));
  if v_n = '' or v_p is null or v_p = '' then raise exception 'NOM_PRENOM_INVALIDE'; end if;
  insert into public.matricule_counters(academic_year, last_seq) values (p_academic_year, 1)
    on conflict (academic_year) do update set last_seq = public.matricule_counters.last_seq + 1
    returning last_seq into v_seq;
  v_yy := right(split_part(p_academic_year,'-',1),2) || '-' || right(split_part(p_academic_year,'-',2),2);
  v_mat := v_yy || 'IPMD-' || v_n || v_p || '-' || lpad(v_seq::text, 5, '0');
  update public.profiles set matricule = v_mat where id = p_student;
  return v_mat;
end
$mfn$;

-- Permissions STRICTES : service_role uniquement.
revoke all on function public.assign_matricule(uuid,text,text,text) from public;
revoke all on function public.assign_matricule(uuid,text,text,text) from anon;
revoke all on function public.assign_matricule(uuid,text,text,text) from authenticated;
grant execute on function public.assign_matricule(uuid,text,text,text) to service_role;

-- RPC v9 (= v8 + persistance last_name/first_names au depot)
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
  v_last_name     text := nullif(trim(coalesce(p_payload->'identity'->>'last_name','')),'');
  v_first_names   text := nullif(trim(coalesce(p_payload->'identity'->>'first_name','')),'');
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
  v_prof_status   text := nullif(trim(coalesce(p_payload->'background'->>'professional_status','')),'');
  v_position      text := nullif(trim(coalesce(p_payload->'background'->>'current_position','')),'');
  v_organization  text := nullif(trim(coalesce(p_payload->'background'->>'organization','')),'');
  v_sector        text := nullif(trim(coalesce(p_payload->'background'->>'sector','')),'');
  v_experience    int;
  v_senior_expertise text := null;
  v_senior_goal      text := null;
  -- Campus (Étape 3 Projet) — persistés uniquement si universe='campus'
  v_c_motiv_form  text := null;
  v_c_referral    text := null;
  v_c_ref_other   text := null;
  v_c_motiv_ipmd  text := null;
  v_c_partner     boolean := null;
  v_c_partner_raw text;
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
  if v_full = '' or v_email = '' or v_phone = '' then raise exception 'IDENTITE_INCOMPLETE'; end if;

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

  if v_birth_country is null or v_birth_country !~ '^[A-Z]{2}$' then raise exception 'PAYS_NAISSANCE_MANQUANT'; end if;
  if v_phone_country is null or v_phone_country !~ '^[A-Z]{2}$' then raise exception 'INDICATIF_TEL_MANQUANT'; end if;
  if v_phone !~ '^\+[1-9][0-9]{6,14}$' then raise exception 'TEL_INVALIDE'; end if;
  if v_whatsapp is not null then
    if v_whatsapp_country is null or v_whatsapp_country !~ '^[A-Z]{2}$' then raise exception 'INDICATIF_WHATSAPP_MANQUANT'; end if;
    if v_whatsapp !~ '^\+[1-9][0-9]{6,14}$' then raise exception 'WHATSAPP_INVALIDE'; end if;
  else
    v_whatsapp_country := null;
  end if;

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

  if v_mode is not null and v_mode not in ('presentiel','distance','hybride') then raise exception 'MODE_INVALIDE'; end if;
  if v_variant in ('campus','pro','executive','certificat') and v_mode is null then raise exception 'MODE_MANQUANT'; end if;

  begin v_grad_year := nullif(trim(coalesce(p_payload->'background'->>'graduation_year','')),'')::int; exception when others then v_grad_year := null; end;
  begin v_experience := nullif(trim(coalesce(p_payload->'background'->>'experience_years','')),'')::int; exception when others then v_experience := null; end;
  if v_experience is not null and v_experience < 0 then raise exception 'EXPERIENCE_INVALIDE'; end if;

  if v_variant = 'pro' then
    if v_prof_status is null then raise exception 'STATUT_PRO_MANQUANT'; end if;
    if v_prof_status not in ('salarie','entrepreneur','independant','demandeur_emploi','autre') then raise exception 'STATUT_PRO_INVALIDE'; end if;
    if v_prof_status in ('salarie','entrepreneur','independant') and v_position is null then raise exception 'POSTE_MANQUANT'; end if;
  end if;

  if v_variant = 'executive' and v_situation is null then raise exception 'FONCTION_MANQUANTE'; end if;

  if v_universe = 'seniorshub' then
    v_senior_expertise := nullif(trim(coalesce(p_payload->'background'->>'senior_expertise','')),'');
    v_senior_goal      := nullif(trim(coalesce(p_payload->'background'->>'senior_goal','')),'');
  end if;

  -- Campus : 4 réponses projet obligatoires (Étape 3), persistées uniquement pour campus.
  if v_universe = 'campus' then
    v_c_motiv_form := nullif(trim(coalesce(p_payload->'project'->>'motivation_formation','')),'');
    v_c_motiv_ipmd := nullif(trim(coalesce(p_payload->'project'->>'motivation_ipmd','')),'');
    v_c_referral   := nullif(trim(coalesce(p_payload->'project'->>'referral_source','')),'');
    v_c_ref_other  := nullif(trim(coalesce(p_payload->'project'->>'referral_other','')),'');
    v_c_partner_raw := lower(nullif(trim(coalesce(p_payload->'project'->>'partner_abroad','')),''));
    if v_c_motiv_form is null then raise exception 'MOTIVATION_FORMATION_MANQUANTE'; end if;
    if char_length(v_c_motiv_form) > 500 then raise exception 'MOTIVATION_FORMATION_TROP_LONGUE'; end if;
    if v_c_motiv_ipmd is null then raise exception 'MOTIVATION_IPMD_MANQUANTE'; end if;
    if char_length(v_c_motiv_ipmd) > 500 then raise exception 'MOTIVATION_IPMD_TROP_LONGUE'; end if;
    if v_c_referral is null then raise exception 'REFERRAL_MANQUANT'; end if;
    if v_c_referral = 'Autre' then
      if v_c_ref_other is null then raise exception 'REFERRAL_AUTRE_MANQUANT'; end if;
      if char_length(v_c_ref_other) > 200 then raise exception 'REFERRAL_AUTRE_TROP_LONG'; end if;
    else
      v_c_ref_other := null; -- pas d'« Autre » → on ignore tout texte libre
    end if;
    if v_c_partner_raw is null or v_c_partner_raw not in ('oui','non') then raise exception 'PARTENAIRE_MANQUANT'; end if;
    v_c_partner := (v_c_partner_raw = 'oui');
  end if;

  -- Revalidation LIVE du projet + profil documentaire
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

  else -- certificat
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

  -- 5b) Cardinalité max_files — override par profil si présent (coalesce), sinon global
  if exists (
    select 1 from (
      select d.doc_key, count(*) c
      from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text)
      group by d.doc_key) g
    join public.document_types dt on dt.doc_key = g.doc_key
    left join public.document_profiles dp on dp.profile_key = v_doc_profile and dp.doc_key = g.doc_key
    where g.c > coalesce(dp.max_files, dt.max_files)) then raise exception 'PIECE_TROP_NOMBREUSE'; end if;

  -- 6) Pièces required présentes
  if exists (
    select 1 from public.document_profiles dp
    where dp.profile_key = v_doc_profile and dp.requirement = 'required'
      and not exists (select 1 from jsonb_to_recordset(coalesce(p_payload->'documents','[]'::jsonb)) as d(doc_key text, path text)
                      where d.doc_key = dp.doc_key and coalesce(trim(d.path),'') <> '')
  ) then raise exception 'PIECES_MANQUANTES'; end if;

  -- 7) Création candidature (+ miroir legacy doc_* + colonnes campus)
  insert into public.inscription_requests(
    full_name, last_name, first_names, email, phone, whatsapp, birth_date, birth_place,
    birth_country, phone_country, whatsapp_country,
    universe, last_education, last_diploma, graduation_year, institution,
    professional_status, current_position, organization, sector, experience_years,
    program_interest, entry_level, mode, message,
    senior_expertise, senior_goal,
    campus_motivation_formation, campus_referral_source, campus_referral_other,
    campus_motivation_ipmd, campus_partner_abroad,
    academic_year, intake_id, filiere_id, offered_level,
    doc_id, doc_diploma, doc_cv, doc_attestation, doc_bulletins
  )
  select
    v_full, v_last_name, v_first_names, v_email, v_phone, v_whatsapp, v_birth_date, v_birth_place,
    v_birth_country, v_phone_country, v_whatsapp_country,
    v_universe, v_last_level, v_last_diploma, v_grad_year, v_institution,
    v_prof_status, v_position, v_organization, v_sector, v_experience,
    nullif(v_program,''), v_entry_level, v_mode, v_situation,
    v_senior_expertise, v_senior_goal,
    v_c_motiv_form, v_c_referral, v_c_ref_other, v_c_motiv_ipmd, v_c_partner,
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

-- ------------------------------------------------------------------ CONTROLES
do $$ declare v int; begin
  select count(*) into v from information_schema.columns
   where table_schema='public' and table_name='inscription_requests' and column_name in ('last_name','first_names');
  if v <> 2 then raise exception 'CTRL inscription_requests cols : %/2', v; end if;
  select count(*) into v from information_schema.columns
   where table_schema='public' and table_name='profiles' and column_name in ('last_name','first_names','matricule');
  if v <> 3 then raise exception 'CTRL profiles cols : %/3', v; end if;
  if not has_function_privilege('service_role','public.assign_matricule(uuid,text,text,text)','execute')
    then raise exception 'CTRL grant service_role manquant'; end if;
  if has_function_privilege('authenticated','public.assign_matricule(uuid,text,text,text)','execute')
    then raise exception 'CTRL authenticated ne doit PAS avoir execute'; end if;
  if has_function_privilege('anon','public.assign_matricule(uuid,text,text,text)','execute')
    then raise exception 'CTRL anon ne doit PAS avoir execute'; end if;
  raise notice 'OK - matricule DB/RPC v9 + assign_matricule + grants + seeds en place.';
end $$;

commit;
