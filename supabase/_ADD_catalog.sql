-- ============================================================================
-- Catalogue générique et extensible (Pro/Executive/certificats… et futurs services)
-- REVUE UNIQUEMENT — NE PAS APPLIQUER SANS FEU VERT. Campus (filieres/offerings/classes) NON touché.
-- ============================================================================
begin;

-- ============ 1. RÉFÉRENTIELS (data-driven) ============
create table if not exists catalog_types (
  type_key text primary key,
  label text not null,
  needs_intake boolean not null default false,
  requires_documents boolean not null default false,
  sort_order int not null default 0
);
create table if not exists document_types (
  doc_key text primary key,
  label text not null,
  sort_order int not null default 0
);
create table if not exists document_profiles (
  profile_key text not null,
  doc_key text not null references document_types(doc_key) on delete restrict,
  requirement text not null check (requirement in ('required','optional','conditional')),
  sort_order int not null default 0,
  primary key (profile_key, doc_key)
);

-- ============ 2. CATALOGUE + OFFRES ============
create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),
  universe text not null,
  type text not null references catalog_types(type_key) on delete restrict,
  name text not null,
  description text,
  credential text,
  price numeric,
  registration_fee numeric,
  doc_profile text,
  status text not null default 'draft' check (status in ('draft','open','closed','archived')),
  start_date date,
  end_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists catalog_items_unique
  on catalog_items (universe, type, name, coalesce(credential,''));

create table if not exists catalog_offerings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references catalog_items(id) on delete restrict,
  intake_id uuid not null references intakes(id) on delete restrict,
  status text not null default 'planned' check (status in ('planned','open','closed')),
  price numeric,
  created_at timestamptz not null default now(),
  constraint catalog_offerings_unique unique (item_id, intake_id)
);

-- ============ 3. TRIGGERS D'INTÉGRITÉ ============
-- (a) Publication d'un item : prix requis ; docs requis si le type l'exige.
create or replace function trg_catalog_item_publishable() returns trigger language plpgsql as $fn$
declare v_reqdoc boolean; v_reqn int;
begin
  if new.status = 'open' then
    if new.price is null then raise exception 'Item non publiable : prix (price) manquant.'; end if;
    select requires_documents into v_reqdoc from catalog_types where type_key = new.type;
    if v_reqdoc then
      if new.doc_profile is null then raise exception 'Item non publiable : profil documentaire manquant.'; end if;
      select count(*) into v_reqn from document_profiles where profile_key = new.doc_profile and requirement = 'required';
      if v_reqn = 0 then raise exception 'Item non publiable : aucun document requis pour le profil %.', new.doc_profile; end if;
    end if;
  end if;
  return new;
end $fn$;
drop trigger if exists catalog_item_publishable on catalog_items;
create trigger catalog_item_publishable before insert or update on catalog_items
  for each row execute function trg_catalog_item_publishable();

-- (b) Offering : interdit pour un type SANS rentrée ; ouverture => item configuré + rentrée OUVERTE.
create or replace function trg_catalog_offering_guard() returns trigger language plpgsql as $fn$
declare v_needs boolean; v_reqdoc boolean; v_price numeric; v_prof text; v_status text; v_reqn int; v_ins text;
begin
  select ct.needs_intake, ct.requires_documents, ci.price, ci.doc_profile, ci.status
    into v_needs, v_reqdoc, v_price, v_prof, v_status
    from catalog_items ci join catalog_types ct on ct.type_key = ci.type where ci.id = new.item_id;
  if v_needs is null then raise exception 'Offering : item introuvable.'; end if;
  if not v_needs then raise exception 'Offering interdit : le type de cet item n''exige pas de rentrée.'; end if;
  if new.status = 'open' then
    if coalesce(new.price, v_price) is null then raise exception 'Offering non ouvrable : prix manquant (offering ni item).'; end if;
    if v_status = 'archived' then raise exception 'Offering non ouvrable : item archivé.'; end if;
    if v_reqdoc then
      if v_prof is null then raise exception 'Offering non ouvrable : profil documentaire manquant.'; end if;
      select count(*) into v_reqn from document_profiles where profile_key = v_prof and requirement = 'required';
      if v_reqn = 0 then raise exception 'Offering non ouvrable : aucun document requis configuré.'; end if;
    end if;
    select status into v_ins from intakes where id = new.intake_id;
    if v_ins is distinct from 'open' then raise exception 'Offering non ouvrable : la rentrée parente n''est pas ouverte.'; end if;
  end if;
  return new;
end $fn$;
drop trigger if exists catalog_offering_guard on catalog_offerings;
create trigger catalog_offering_guard before insert or update on catalog_offerings
  for each row execute function trg_catalog_offering_guard();

-- ============ 4. RLS ============
alter table catalog_types enable row level security;
alter table document_types enable row level security;
alter table document_profiles enable row level security;
alter table catalog_items enable row level security;
alter table catalog_offerings enable row level security;

drop policy if exists "Read catalog_types" on catalog_types;
create policy "Read catalog_types" on catalog_types for select using (true);
drop policy if exists "Admins manage catalog_types" on catalog_types;
create policy "Admins manage catalog_types" on catalog_types for all to authenticated
  using (current_user_role() = any (array['super_admin','admin']::user_role[]))
  with check (current_user_role() = any (array['super_admin','admin']::user_role[]));

drop policy if exists "Read document_types" on document_types;
create policy "Read document_types" on document_types for select using (true);
drop policy if exists "Admins manage document_types" on document_types;
create policy "Admins manage document_types" on document_types for all to authenticated
  using (current_user_role() = any (array['super_admin','admin']::user_role[]))
  with check (current_user_role() = any (array['super_admin','admin']::user_role[]));

drop policy if exists "Read document_profiles" on document_profiles;
create policy "Read document_profiles" on document_profiles for select using (true);
drop policy if exists "Admins manage document_profiles" on document_profiles;
create policy "Admins manage document_profiles" on document_profiles for all to authenticated
  using (current_user_role() = any (array['super_admin','admin']::user_role[]))
  with check (current_user_role() = any (array['super_admin','admin']::user_role[]));

drop policy if exists "Read catalog_items" on catalog_items;
create policy "Read catalog_items" on catalog_items for select to authenticated using (true);
drop policy if exists "Public read open items" on catalog_items;
create policy "Public read open items" on catalog_items for select to anon
  using (status = 'open' and type in (select type_key from catalog_types where needs_intake = false));
drop policy if exists "Admins manage catalog_items" on catalog_items;
create policy "Admins manage catalog_items" on catalog_items for all to authenticated
  using (current_user_role() = any (array['super_admin','admin']::user_role[]))
  with check (current_user_role() = any (array['super_admin','admin']::user_role[]));

drop policy if exists "Read catalog_offerings" on catalog_offerings;
create policy "Read catalog_offerings" on catalog_offerings for select to authenticated using (true);
drop policy if exists "Public read open offerings" on catalog_offerings;
create policy "Public read open offerings" on catalog_offerings for select to anon
  using (status = 'open' and exists (select 1 from intakes i where i.id = intake_id and i.status = 'open'));
drop policy if exists "Admins manage catalog_offerings" on catalog_offerings;
create policy "Admins manage catalog_offerings" on catalog_offerings for all to authenticated
  using (current_user_role() = any (array['super_admin','admin']::user_role[]))
  with check (current_user_role() = any (array['super_admin','admin']::user_role[]));

-- ============ 5. SEED (idempotent) ============
insert into catalog_types (type_key, label, needs_intake, requires_documents, sort_order) values
  ('diplome','Diplôme',true,true,1),
  ('certificat','Certificat',false,true,2),
  ('service','Service',false,false,3),
  ('coaching','Coaching',false,false,4),
  ('atelier','Atelier',false,false,5),
  ('formation_courte','Formation courte',false,false,6),
  ('prestation_entreprise','Prestation entreprise',false,false,7),
  ('evenement','Événement',false,false,8),
  ('other','Autre',false,false,99)
on conflict (type_key) do nothing;

insert into document_types (doc_key, label, sort_order) values
  ('piece_identite','Pièce d''identité',1),
  ('diplome','Dernier diplôme',2),
  ('bulletins','Bulletins / relevés',3),
  ('cv','CV',4),
  ('justificatif_professionnel','Justificatif professionnel',5),
  ('justificatif_academique','Justificatif académique',6),
  ('attestation','Attestation',7)
on conflict (doc_key) do nothing;

insert into document_profiles (profile_key, doc_key, requirement, sort_order) values
  ('campus','piece_identite','required',1),('campus','diplome','required',2),('campus','bulletins','conditional',3),
  ('pro','piece_identite','required',1),('pro','diplome','required',2),('pro','cv','required',3),('pro','justificatif_professionnel','optional',4),
  ('executive','piece_identite','required',1),('executive','cv','required',2),('executive','justificatif_academique','required',3),('executive','justificatif_professionnel','optional',4),
  ('cert-light','piece_identite','required',1),('cert-light','cv','optional',2),
  ('cert-cv','piece_identite','required',1),('cert-cv','cv','required',2)
on conflict (profile_key, doc_key) do nothing;

insert into catalog_items (universe, type, name, credential, doc_profile, sort_order) values
  ('professionnel','diplome','Marketing digital',null,'pro',0),
  ('professionnel','diplome','Communication digitale',null,'pro',1),
  ('professionnel','diplome','Graphisme & Design',null,'pro',2),
  ('professionnel','diplome','E-commerce & commerce international',null,'pro',3),
  ('professionnel','diplome','Développement d''applications',null,'pro',4),
  ('professionnel','diplome','Intelligence artificielle',null,'pro',5),
  ('professionnel','diplome','Management de projet digital',null,'pro',6),
  ('professionnel','diplome','Finance digitale',null,'pro',7),
  ('gouvernance','diplome','Management de projet digital',null,'executive',8),
  ('gouvernance','diplome','Marketing digital & stratégie IA',null,'executive',9),
  ('gouvernance','diplome','Finance digitale & stratégie IA',null,'executive',10),
  ('ultrajobs','certificat','Design graphique & UI à l''ère de l''IA','Certificat','cert-light',11),
  ('ultrajobs','certificat','Développement web à l''ère de l''IA','Certificat','cert-light',12),
  ('ultrajobs','certificat','Data, No-code & Automatisation IA','Certificat','cert-light',13),
  ('ultrajobs','certificat','IA générative & Prompting professionnel','Certificat','cert-light',14),
  ('ultrajobs','certificat','E-commerce & Business en ligne à l''ère de l''IA','Certificat','cert-light',15),
  ('ultrajobs','certificat','Montage vidéo & Motion Design avec IA','Certificat','cert-light',16),
  ('ultrajobs','certificat','Bureautique digitale & Productivité avec IA','Certificat','cert-light',17),
  ('ultrajobs','certificat','Employabilité, Télétravail & IA','Certificat','cert-light',18),
  ('ultrajobs','certificat','Cybersécurité & Protection numérique à l''ère de l''IA','Certificat','cert-light',19),
  ('ultrajobs','certificat','Data Analytics & Power BI à l''ère de l''IA','Certificat','cert-light',20),
  ('ultrajobs','certificat','Freelance digital & Télétravail avec IA','Certificat','cert-light',21),
  ('ultrajobs','certificat','Assistant virtuel & Support client avec IA','Certificat','cert-light',22),
  ('ultrajobs','certificat','Automatisation No-code & Agents IA','Certificat','cert-light',23),
  ('ultrajobs','certificat','Community Manager & Créateur de contenu IA','Certificat','cert-light',24),
  ('ultrajobs','certificat','Publicité digitale : Meta Ads, Google Ads & Traffic','Certificat','cert-light',25),
  ('ultrajobs','certificat','Growth Marketing & Tunnel de vente','Certificat','cert-light',26),
  ('ultrajobs','certificat','Marketing Automation, CRM & Chatbots IA','Certificat','cert-light',27),
  ('ultrajobs','certificat','SEO, contenu web & analyse de performance','Certificat','cert-light',28),
  ('ultrajobs','certificat','Designer graphique & identité visuelle','Certificat','cert-light',29),
  ('ultrajobs','certificat','UI/UX Designer pour applications et sites web','Certificat','cert-light',30),
  ('ultrajobs','certificat','Social Media Designer & contenu visuel IA','Certificat','cert-light',31),
  ('ultrajobs','certificat','Motion Designer pour réseaux sociaux','Certificat','cert-light',32),
  ('ultrajobs','certificat','Product Designer junior avec Figma & IA','Certificat','cert-light',33),
  ('ultrajobs','certificat','Développement d''applications mobiles','Certificat','cert-light',34),
  ('ultraboost','certificat','Growth marketing avancé','Certificat','cert-cv',35),
  ('ultraboost','certificat','Stratégie de marque','Certificat','cert-cv',36),
  ('ultraboost','certificat','UX/UI Design produit','Certificat','cert-cv',37),
  ('ultraboost','certificat','Développement full-stack','Certificat','cert-cv',38),
  ('ultraboost','certificat','Cloud & DevOps','Certificat','cert-cv',39),
  ('ultraboost','certificat','Data analytics','Certificat','cert-cv',40),
  ('ultraboost','certificat','Machine learning appliqué','Certificat','cert-cv',41),
  ('ultraboost','certificat','IA générative en entreprise','Certificat','cert-cv',42),
  ('ultraboost','certificat','Product management','Certificat','cert-cv',43),
  ('ultraboost','certificat','Agile & gestion de projet','Certificat','cert-cv',44),
  ('ultraboost','certificat','Cybersécurité essentielle','Certificat','cert-cv',45),
  ('ultraboost','certificat','Finance digitale & fintech','Certificat','cert-cv',46),
  ('ultraboost','certificat','Sales & business development','Certificat','cert-cv',47),
  ('ultraboost','certificat','E-commerce avancé','Certificat','cert-cv',48),
  ('ultraboost','certificat','Automatisation & no-code pro','Certificat','cert-cv',49),
  ('ultraexecutive','certificat','Transformation digitale','Certificat','cert-cv',50),
  ('ultraexecutive','certificat','Stratégie IA pour dirigeants','Certificat','cert-cv',51),
  ('ultraexecutive','certificat','Gouvernance digitale & IA','Certificat','cert-cv',52),
  ('ultraexecutive','certificat','Leadership & disruption','Certificat','cert-cv',53),
  ('ultraexecutive','certificat','Direction data-driven','Certificat','cert-cv',54),
  ('ultraexecutive','certificat','Finance stratégique & IA','Certificat','cert-cv',55),
  ('ultraexecutive','certificat','Expérience client augmentée','Certificat','cert-cv',56),
  ('ultraexecutive','certificat','Cyber-résilience pour dirigeants','Certificat','cert-cv',57),
  ('ultraexecutive','certificat','Innovation & nouveaux modèles','Certificat','cert-cv',58),
  ('ultraexecutive','certificat','Conseil d''administration & digital','Certificat','cert-cv',59)
on conflict do nothing;

commit;

-- ROLLBACK (bloc de secours, non exécuté) :
-- drop table if exists catalog_offerings; drop table if exists catalog_items;
-- drop function if exists trg_catalog_offering_guard(); drop function if exists trg_catalog_item_publishable();
-- drop table if exists document_profiles; drop table if exists document_types; drop table if exists catalog_types;
