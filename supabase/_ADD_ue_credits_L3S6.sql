-- ─────────────────────────────────────────────────────────────────────────
-- Maquette LMD L3-S6 2026-2027 (appliquee en prod) — semestre TERMINAL.
-- 8 filieres x 3 UE / 6 modules actifs / 30 cr / 108 h campus + 375 h stage.
-- UE1 Expertise terminale & insertion (6cr) : Projet collectif de fin de cycle,
--   Projet individuel (specialisation+portfolio+CV/insertion), Module metier terminal.
-- UE2 Stage professionnel de fin de Licence (15cr, heures_stage=375, perso=0).
-- UE3 Memoire/Rapport professionnel (6cr) + Soutenance (3cr).
-- 46 modules affectes PAR ID ; 2 reserves REACTIVES via la fonction de maintenance
--   admin_reactivate_reserve_module (Communication de crise & e-reputation ; Marketing
--   automation) ; 2 placeholders IA vides supprimes (deps=0, sans cascade).
-- Prerequis : _ADD_heures_stage.sql + _ADD_admin_reactivate.sql.
-- Preuve prod : 6 mod / 30 cr / 108 campus / 375 stage / UE 6-15-9 / reserve_restants=3 /
--   audit=2 (performed_by=maquette_maintenance) / S3/S4/S5 intacts.
-- ─────────────────────────────────────────────────────────────────────────
do $apply$
declare v_depsup int; v_del int;
begin

  -- 0) Controle deps des 2 placeholders a supprimer (doit etre 0)
  select count(*) into v_depsup from public.module_supports where module_id in ('03a293a8-c10f-4c6a-a040-e06bf8dcbc85',
    'bacd6ed0-634b-43b0-848d-bcfb18f47128');
  if v_depsup <> 0 then raise exception 'ARRET suppression : % dependances sur placeholders', v_depsup; end if;

  -- 1) 24 UE L3-S6
  insert into public.unites_enseignement(code,name,filiere_id,level,semester,academic_year)
  select u.code,u.name,fl.id,'Licence 3','Semestre 6','2026-2027'
  from (values ('UE-L3S6-1','Expertise terminale & insertion professionnelle'),
               ('UE-L3S6-2','Stage professionnel de fin de Licence'),
               ('UE-L3S6-3','Mémoire / rapport professionnel & soutenance')) u(code,name)
  cross join (select id from public.filieres where status in ('actif','valide')) fl
  on conflict on constraint ue_uk do nothing;

  -- 2) Mapping + reactivation (PAR ID) : nom, credits, heures (+stage), UE, status actif, semestre S6
  update public.modules m set name=v.newn, credits=v.cr, status=v.stt, semester=v.sem, level=v.lvl,
    heures_cours=v.c, heures_td=v.td, heures_tp=v.tp, heures_projet=v.pr, heures_stage=v.st,
    ue_id=(select id from public.unites_enseignement ue where ue.code=v.ue and ue.filiere_id=m.filiere_id
           and ue.level='Licence 3' and ue.semester='Semestre 6' and ue.academic_year='2026-2027')
  from (values
    ('76267f72-e706-475b-b536-fa65e179fe0c','Mémoire / Rapport professionnel','UE-L3S6-3',6,0,0,0,20,0,'actif','Semestre 6','Licence 3'),
    ('423d0b5d-efe3-46a6-800b-f63646ff1c6c','Projet collectif de fin de cycle – mission professionnelle','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('1cad92ed-44cf-4923-9478-d26507e43633','Projet individuel de spécialisation & portfolio professionnel','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('650d3a19-9c77-401d-a79d-192bffd4c3aa','Stage professionnel de fin de Licence','UE-L3S6-2',15,0,0,0,0,375,'actif','Semestre 6','Licence 3'),
    ('606ecbcb-aad1-41a0-828f-12c0987824c6','Soutenance devant jury','UE-L3S6-3',3,0,0,0,4,0,'actif','Semestre 6','Licence 3'),
    ('01565393-fd6e-4008-800b-3e66b54515a1','Mémoire / Rapport professionnel','UE-L3S6-3',6,0,0,0,20,0,'actif','Semestre 6','Licence 3'),
    ('7bfd93a8-7ae1-4b48-bebd-a045744ae05c','Soutenance devant jury','UE-L3S6-3',3,0,0,0,4,0,'actif','Semestre 6','Licence 3'),
    ('33a32888-2e2d-4cef-a773-215505ea84be','Projet collectif de fin de cycle – mission professionnelle','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('6a1a39fa-6550-43db-a9fb-59bf7bfcec29','Projet individuel de spécialisation & portfolio professionnel','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('dac9fe7b-0018-42f5-ba09-316ae7ef48ae','Stage professionnel de fin de Licence','UE-L3S6-2',15,0,0,0,0,375,'actif','Semestre 6','Licence 3'),
    ('ab13fbd8-8d66-4081-bd0f-cb482fc49eb1','Audit, conformité & finance digitale avancée','UE-L3S6-1',2,8,8,8,0,0,'actif','Semestre 6','Licence 3'),
    ('3fa4c5e9-2712-41a0-96e8-e29cf994430e','Mémoire / Rapport professionnel','UE-L3S6-3',6,0,0,0,20,0,'actif','Semestre 6','Licence 3'),
    ('8c64fa3e-80fd-42e3-aa20-24bbc439f55c','Soutenance devant jury','UE-L3S6-3',3,0,0,0,4,0,'actif','Semestre 6','Licence 3'),
    ('be09873b-4a7c-423e-a869-485bb31a21b9','Projet collectif de fin de cycle – mission professionnelle','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('90a72ee0-3523-4029-aa33-2ef47572398e','Projet individuel de spécialisation & portfolio professionnel','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('25d8f11b-c35c-4753-8642-91f213376cc7','Stage professionnel de fin de Licence','UE-L3S6-2',15,0,0,0,0,375,'actif','Semestre 6','Licence 3'),
    ('5c87caf5-93bb-41d1-9cca-44f95d14dde4','Mise en production, qualité & maintenance applicative','UE-L3S6-1',2,8,8,8,0,0,'actif','Semestre 6','Licence 3'),
    ('3ad48735-ab84-42da-ace9-e9af11382b5c','Mémoire / Rapport professionnel','UE-L3S6-3',6,0,0,0,20,0,'actif','Semestre 6','Licence 3'),
    ('e4f67bec-aba5-4e44-8cf8-9b91c359d452','Soutenance devant jury','UE-L3S6-3',3,0,0,0,4,0,'actif','Semestre 6','Licence 3'),
    ('690500e8-4657-4b33-bc06-369cba7b2b6c','Projet collectif de fin de cycle – mission professionnelle','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('3e25faa5-de29-402e-96bc-603b36c326ee','Projet individuel de spécialisation & portfolio professionnel','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('2e3b8d65-bf93-4cd0-9295-ea720ade780f','Stage professionnel de fin de Licence','UE-L3S6-2',15,0,0,0,0,375,'actif','Semestre 6','Licence 3'),
    ('13e14f3f-a10a-4523-8be3-6697e34f05be','Pilotage de la performance e-commerce & marketplaces','UE-L3S6-1',2,8,8,8,0,0,'actif','Semestre 6','Licence 3'),
    ('a2d39bee-369f-4d9d-99be-61475728b5e3','Mémoire / Rapport professionnel','UE-L3S6-3',6,0,0,0,20,0,'actif','Semestre 6','Licence 3'),
    ('fe7a974f-54f7-4336-80ef-34a89a0a9b7d','Soutenance devant jury','UE-L3S6-3',3,0,0,0,4,0,'actif','Semestre 6','Licence 3'),
    ('da438522-9c50-4ab3-ac99-76c634c67e0a','Projet collectif de fin de cycle – mission professionnelle','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('9b603ff3-2e65-41de-8559-b666de4ef7c8','Projet individuel de spécialisation & portfolio professionnel','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('d083660f-9326-49c9-8cb7-f5bd5d3267c3','Stage professionnel de fin de Licence','UE-L3S6-2',15,0,0,0,0,375,'actif','Semestre 6','Licence 3'),
    ('a5b3785d-9112-4b40-b049-02f8f41a1e36','Design d''expérience avancé & direction de projet créatif','UE-L3S6-1',2,8,8,8,0,0,'actif','Semestre 6','Licence 3'),
    ('2034508d-9b45-453a-a030-bd4c575f758c','Mémoire / Rapport professionnel','UE-L3S6-3',6,0,0,0,20,0,'actif','Semestre 6','Licence 3'),
    ('2b6c6225-4482-44ec-9e30-0a286836eb44','Soutenance devant jury','UE-L3S6-3',3,0,0,0,4,0,'actif','Semestre 6','Licence 3'),
    ('988eafd5-abd7-4064-a0cb-a9cc3724bf31','Projet collectif de fin de cycle – mission professionnelle','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('0bdeb47c-36e5-4f8d-a46a-d3ce474cf348','Projet individuel de spécialisation & portfolio professionnel','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('5f3a52c2-7207-44b3-bb90-6853b984a875','Stage professionnel de fin de Licence','UE-L3S6-2',15,0,0,0,0,375,'actif','Semestre 6','Licence 3'),
    ('a3dc3e4c-cd42-431b-a286-e990186bfafe','IA en production & cas d''usage sectoriels','UE-L3S6-1',2,8,8,8,0,0,'actif','Semestre 6','Licence 3'),
    ('f8967485-1c9a-4832-aee0-cb605b29f72a','Mémoire / Rapport professionnel','UE-L3S6-3',6,0,0,0,20,0,'actif','Semestre 6','Licence 3'),
    ('5c50a0ba-e3b0-4d6a-b6fc-ea67882e7e62','Soutenance devant jury','UE-L3S6-3',3,0,0,0,4,0,'actif','Semestre 6','Licence 3'),
    ('b0e756b4-87db-4125-8683-5ddbbe0eeb6f','Projet collectif de fin de cycle – mission professionnelle','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('f977175d-72ff-4796-96b8-69572953fad2','Projet individuel de spécialisation & portfolio professionnel','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('aebc2308-e5be-4903-b7de-94d1003bba59','Stage professionnel de fin de Licence','UE-L3S6-2',15,0,0,0,0,375,'actif','Semestre 6','Licence 3'),
    ('8c10637f-610f-4b4f-9599-e87da9c22a8e','Transformation digitale & management de l''innovation','UE-L3S6-1',2,8,8,8,0,0,'actif','Semestre 6','Licence 3'),
    ('0bcce4bd-0ff6-4d05-86fd-5935c6a3f9bc','Mémoire / Rapport professionnel','UE-L3S6-3',6,0,0,0,20,0,'actif','Semestre 6','Licence 3'),
    ('297c14c2-6fee-41d9-88fe-a6a9fd18e69a','Projet collectif de fin de cycle – mission professionnelle','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('a9fd2aea-99ce-4759-b0f0-9c2cc8252183','Projet individuel de spécialisation & portfolio professionnel','UE-L3S6-1',2,0,0,6,24,0,'actif','Semestre 6','Licence 3'),
    ('338f9a70-4284-43b9-8c5c-d7b9bf0f29cf','Stage professionnel de fin de Licence','UE-L3S6-2',15,0,0,0,0,375,'actif','Semestre 6','Licence 3'),
    ('1cd50c7d-2f03-47b4-bce4-e5656616da32','Soutenance devant jury','UE-L3S6-3',3,0,0,0,4,0,'actif','Semestre 6','Licence 3')
  ) v(id,newn,ue,cr,c,td,tp,pr,st,stt,sem,lvl)
  where m.id = v.id::uuid;

  -- 2b) Reactivation des 2 reserves via la fonction de maintenance dediee
  --     (role maquette_maintenance, trigger role-based, audit obligatoire).
  perform public.admin_reactivate_reserve_module('4f867a15-90d6-4c30-a9b0-43fbc6c8726b','Communication de crise & e-réputation','UE-L3S6-1',2,8,8,8,0,0);
  perform public.admin_reactivate_reserve_module('03da4532-0ec4-4663-a050-1008dd578c72','Marketing automation','UE-L3S6-1',2,8,8,8,0,0);

  -- 3) Suppression des 2 placeholders IA (sans cascade)
  delete from public.modules where id in ('03a293a8-c10f-4c6a-a040-e06bf8dcbc85',
    'bacd6ed0-634b-43b0-848d-bcfb18f47128');
  get diagnostics v_del = row_count;
  if v_del <> 2 then raise exception 'ARRET : % supprimes (attendu 2)', v_del; end if;
end $apply$;
