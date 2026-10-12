-- ─────────────────────────────────────────────────────────────────────────
-- Maquette LMD L3-S5 2026-2027 (a appliquer en prod APRES deploiement code)
-- 8 filieres x 4 UE / 11 modules actifs / 30 credits / 356 h (240 encadre + 116... voir gabarit).
-- UE 9/6/7/8 : UE1 Expertise metier avancee I (3 mod) · UE2 IA/data/innovation (2 mod)
-- UE3 Professionnalisation/communication/droit (4 transversaux L3) · UE4 Projet + Challenge.
-- 79 modules existants renommes/affectes PAR ID (status->actif) + 9 nouveaux (Challenge x8 + Projet Communication).
-- 5 modules mis en RESERVE : status='reserve', semester=NULL, ue_id=NULL, credits/heures=NULL
--   (4 Marketing: Communication digitale strategique, Marketing automation, E-commerce et business en ligne,
--    FinTech et marketing des services financiers digitaux ; + Communication de crise).
-- Statut: en_attente=a valider / actif=maquette officielle / reserve=conserve non affecte.
-- Faisabilite: S5 22/02... non: S5 = Oct->Fev ~18 sem, Mar/Mer/Jeu 324h cap >= 296 encadre ; 60 projet <= 102.
-- Preuve dry-run: 11 actifs/filiere / 30 cr / 356 h / 4 UE / 9-6-7-8 / 0 sans-UE / 5 reserve / S3/S4 intacts.
-- ─────────────────────────────────────────────────────────────────────────
begin;

  -- 1) 32 UE L3-S5
  insert into public.unites_enseignement(code,name,filiere_id,level,semester,academic_year)
  select u.code,u.name,fl.id,'Licence 3','Semestre 5','2026-2027'
  from (values ('UE-L3S5-1','Expertise métier avancée I'),('UE-L3S5-2','IA, data & innovation métier'),
               ('UE-L3S5-3','Professionnalisation, communication & droit'),('UE-L3S5-4','Projet & innovation professionnelle')) u(code,name)
  cross join (select id from public.filieres where status in ('actif','valide')) fl
  on conflict on constraint ue_uk do nothing;

  -- 2) Mise a jour des modules EXISTANTS mappes, PAR ID (renommage + credits + heures + UE + status actif)
  update public.modules m set name=v.newn, credits=v.cr, status='actif',
    heures_cours=v.c, heures_td=v.td, heures_tp=v.tp, heures_projet=v.pr,
    ue_id=(select id from public.unites_enseignement ue where ue.code=v.ue and ue.filiere_id=m.filiere_id
           and ue.level='Licence 3' and ue.semester='Semestre 5' and ue.academic_year='2026-2027')
  from (values
    ('088cc459-9358-411d-be59-1d67c4fa1311','Art oratoire avancé & communication d''influence','UE-L3S5-3',2,8,8,8,0),
    ('de98a99e-d42c-4d24-9e47-1f860e01e0ab','Data & performance de communication','UE-L3S5-2',3,8,8,20,0),
    ('0f755b91-7770-45b9-bd0a-f23c2b055d9b','Droit du numérique & réglementation de l''intelligence artificielle','UE-L3S5-3',2,12,8,4,0),
    ('15bd919b-7ecd-4a69-a1bf-4610c1e87f4f','Image et identité de marque','UE-L3S5-1',3,10,10,16,0),
    ('380b0eac-c36d-4740-8581-71e80ff3168b','Marketing d''influence','UE-L3S5-1',3,12,12,12,0),
    ('efc0ccc5-adbc-434e-ace9-6c3558e8cd55','Pitch professionnel & présentation de projet','UE-L3S5-3',1,4,4,8,0),
    ('0f719f76-0ca1-42c7-8a9b-ee41c5dc4e7d','Production audiovisuelle & création de contenu','UE-L3S5-2',3,10,8,18,0),
    ('5a8f8798-8203-4fe7-8ea7-43b8e8b4bd6e','Rédaction Web & communication professionnelle avancée','UE-L3S5-3',2,8,8,8,0),
    ('4be43425-dee1-4536-a741-1b1379a7b6c2','Stratégie de communication digitale','UE-L3S5-1',3,12,12,16,0),
    ('6fa36094-cf75-4d3b-a368-928f611d9f15','Art oratoire avancé & communication d''influence','UE-L3S5-3',2,8,8,8,0),
    ('a0feb1f3-d8ac-4675-b3d4-445056b231cd','Comptabilité analytique avancée','UE-L3S5-1',3,12,12,16,0),
    ('1f83ad49-0be6-487a-999a-b888a1c349b1','Contrôle de gestion & pilotage','UE-L3S5-1',3,12,12,12,0),
    ('9a3fe7e2-ff5b-4c57-9b81-ff241763cb43','Data financière & reporting','UE-L3S5-2',3,8,8,20,0),
    ('92b742d3-b055-4c34-8a79-7b38e71b8805','Droit du numérique & réglementation de l''intelligence artificielle','UE-L3S5-3',2,12,8,4,0),
    ('d5142678-158c-424b-96af-96d2b6dea7e1','Finance d''entreprise & évaluation','UE-L3S5-1',3,10,10,16,0),
    ('26553973-6ea1-4a41-9343-2ce8709768ef','FinTech, paiement digital & IA','UE-L3S5-2',3,10,8,18,0),
    ('fb1b8ae0-056a-4145-bba5-286532b91ee0','Pitch professionnel & présentation de projet','UE-L3S5-3',1,4,4,8,0),
    ('00f0ca9a-d508-454c-8a08-cb2a73768243','Projet professionnel intégrateur — finance digitale','UE-L3S5-4',5,0,0,12,42),
    ('85ea09ff-18ea-4079-90aa-caf64f042059','Rédaction Web & communication professionnelle avancée','UE-L3S5-3',2,8,8,8,0),
    ('9b7ad670-51e8-4fcc-940c-7f351b454f7c','Données & API : conception et exploitation','UE-L3S5-2',3,8,8,20,0),
    ('103f135b-2ba5-402f-acc1-26a2fdc4f003','Art oratoire avancé & communication d''influence','UE-L3S5-3',2,8,8,8,0),
    ('2dc52ed0-a7a6-4d8c-a420-0caa78536a9b','DevOps, cloud & intégration de l''IA','UE-L3S5-2',3,10,8,18,0),
    ('ca82f336-8e7e-4ffa-9dc2-d7479f5c0b5d','Développement full-stack avancé','UE-L3S5-1',3,12,12,16,0),
    ('e3052bfc-b8d6-4732-afb7-3888a26d52c2','Développement mobile avancé','UE-L3S5-1',3,12,12,12,0),
    ('307b247c-a268-4f89-a866-994a62b2d5b4','Droit du numérique & réglementation de l''intelligence artificielle','UE-L3S5-3',2,12,8,4,0),
    ('9659ea69-c05d-4e7e-9be4-868ccccebb1b','Frameworks back-end & architecture API','UE-L3S5-1',3,10,10,16,0),
    ('5d49a81f-399e-4e48-9075-b5d46447c97a','Pitch professionnel & présentation de projet','UE-L3S5-3',1,4,4,8,0),
    ('aaf43d6c-c12a-40d9-b132-5a36d100912a','Projet professionnel intégrateur — application métier','UE-L3S5-4',5,0,0,12,42),
    ('7e2fb365-b585-439b-b864-715c1538561c','Rédaction Web & communication professionnelle avancée','UE-L3S5-3',2,8,8,8,0),
    ('921f1c1d-02c7-4c4d-8416-12788545423d','Art oratoire avancé & communication d''influence','UE-L3S5-3',2,8,8,8,0),
    ('c4eef3a8-1385-4a24-9fdd-94029ac0638a','Commerce international & marchés digitaux','UE-L3S5-1',3,12,12,12,0),
    ('b7eb5207-ea32-48eb-a39b-9883d9e4b8b1','Data & performance e-commerce','UE-L3S5-2',3,8,8,20,0),
    ('3d53cc98-2af1-47f9-af96-a731ca6a90d8','Droit du numérique & réglementation de l''intelligence artificielle','UE-L3S5-3',2,12,8,4,0),
    ('2663c2db-8117-49c1-89a8-d0251d2e4f86','Logistique, supply chain & gestion des stocks','UE-L3S5-1',3,10,10,16,0),
    ('f6044f91-7bdc-424b-9892-1e00e5ec1147','Marketing e-commerce avancé & IA','UE-L3S5-2',3,10,8,18,0),
    ('97e5d0c0-e013-4bb9-a70a-249eb9be108f','Pitch professionnel & présentation de projet','UE-L3S5-3',1,4,4,8,0),
    ('b78731e0-7424-4de1-8f21-bbd2bcb5a60c','Projet professionnel intégrateur — boutique en ligne','UE-L3S5-4',5,0,0,12,42),
    ('4225617a-4e8c-4913-948f-026493229247','Rédaction Web & communication professionnelle avancée','UE-L3S5-3',2,8,8,8,0),
    ('ded53e14-693d-458d-a3b1-14867ffa71b7','Stratégie e-commerce avancée','UE-L3S5-1',3,12,12,16,0),
    ('592e9a7c-47f2-4b90-9150-0d3b78a59f1d','Art oratoire avancé & communication d''influence','UE-L3S5-3',2,8,8,8,0),
    ('7d49ee93-98ae-45a8-a3b6-2408be5c7033','Design d''interface mobile & multi-support','UE-L3S5-1',3,10,10,16,0),
    ('2c525f78-0e96-4eb0-8fc6-0baeac0ea289','Design system & cohérence produit','UE-L3S5-1',3,12,12,12,0),
    ('3e53694f-4939-4e57-8e63-b17a87e4cbaa','Direction artistique avancée','UE-L3S5-1',3,12,12,16,0),
    ('04d89b00-d92e-44a2-accc-c369750c5026','Droit du numérique & réglementation de l''intelligence artificielle','UE-L3S5-3',2,12,8,4,0),
    ('e318792e-7804-478d-9dcc-4fea69f2058f','Motion design & création assistée par IA','UE-L3S5-2',3,10,8,18,0),
    ('7e43e45d-8b49-4eb7-bc5a-92df4ad88bc3','Pitch professionnel & présentation de projet','UE-L3S5-3',1,4,4,8,0),
    ('bdb4ffd2-df28-488c-b02d-18f2644f2888','Projet professionnel intégrateur — production graphique','UE-L3S5-4',5,0,0,12,42),
    ('c4027383-545a-4367-99a7-f2135f2ca9ce','Rédaction Web & communication professionnelle avancée','UE-L3S5-3',2,8,8,8,0),
    ('90cd7f7c-137e-49d3-8e8c-86cca9189713','UX design, recherche utilisateur & data','UE-L3S5-2',3,8,8,20,0),
    ('f9064ddc-c284-4698-a306-af2739f0571c','Art oratoire avancé & communication d''influence','UE-L3S5-3',2,8,8,8,0),
    ('54d46788-f388-4add-9a2b-91f5d27f3bb4','Data science','UE-L3S5-2',3,10,8,18,0),
    ('b1c9f6e6-b612-4da4-a605-73163a9f7158','Droit du numérique & réglementation de l''intelligence artificielle','UE-L3S5-3',2,12,8,4,0),
    ('13a20406-fe4f-4712-adc9-29a1fc3dc561','IA générative & LLM','UE-L3S5-1',3,12,12,12,0),
    ('679cde95-1357-418c-b591-384e8ca38c7b','Machine learning avancé','UE-L3S5-1',3,12,12,16,0),
    ('ae11f8ba-7bdc-487a-8df6-48d78efedc61','MLOps & industrialisation','UE-L3S5-1',3,10,10,16,0),
    ('927579f7-3490-40a8-a212-8ba9047371e0','Pitch professionnel & présentation de projet','UE-L3S5-3',1,4,4,8,0),
    ('78168c45-34dc-4325-adbc-12191140e8ae','Projet professionnel intégrateur — solution IA','UE-L3S5-4',5,0,0,12,42),
    ('adb78a91-7c21-40ec-9f46-5a978f545a3f','Rédaction Web & communication professionnelle avancée','UE-L3S5-3',2,8,8,8,0),
    ('95975cf4-a628-45ec-9eca-f3bbd8787f8f','Visualisation & storytelling de données','UE-L3S5-2',3,8,8,20,0),
    ('14156e6b-22fe-4c49-baf3-cb314a58c7dd','Art oratoire avancé & communication d''influence','UE-L3S5-3',2,8,8,8,0),
    ('0cf01081-e5ac-4935-a674-bc87a8fd4c8e','Conduite du changement & transformation digitale','UE-L3S5-2',3,10,8,18,0),
    ('2914c41e-c51b-47ce-9d51-16bd162be5ff','Data & KPIs de projet (PMO)','UE-L3S5-2',3,8,8,20,0),
    ('977437a0-4778-420d-8d3f-fd14ef5db056','Droit du numérique & réglementation de l''intelligence artificielle','UE-L3S5-3',2,12,8,4,0),
    ('87fb3960-86a8-43ec-b770-f4a0c9db5624','Gestion budgétaire & gestion des risques','UE-L3S5-1',3,10,10,16,0),
    ('86f75b90-8d54-4c08-8fe1-ce45b90b7ce2','Pilotage de projets digitaux avancé','UE-L3S5-1',3,12,12,16,0),
    ('8fee4f74-5937-4376-a08a-78b429f71402','Pitch professionnel & présentation de projet','UE-L3S5-3',1,4,4,8,0),
    ('7834dc7a-3428-4f34-b001-e5e48c2f6069','Product management','UE-L3S5-1',3,12,12,12,0),
    ('d39dc87f-fc07-424c-9451-651dc3180d15','Projet professionnel intégrateur — pilotage de projet','UE-L3S5-4',5,0,0,12,42),
    ('0dfba071-5edb-4e58-b303-b4351d51ea4f','Rédaction Web & communication professionnelle avancée','UE-L3S5-3',2,8,8,8,0),
    ('8990eb8e-e2ad-4e86-842f-511efa10c375','Art oratoire avancé & communication d''influence','UE-L3S5-3',2,8,8,8,0),
    ('bc6ea391-1698-4569-ba89-824cbe0231f1','Brand content & stratégie de marque','UE-L3S5-1',3,10,10,16,0),
    ('dcca82a1-e8f6-4f4d-a008-42b80093c372','Data marketing & pilotage de performance','UE-L3S5-2',3,8,8,20,0),
    ('a7b29ec5-99ba-468a-8a0e-34f0c71a0c21','Droit du numérique & réglementation de l''intelligence artificielle','UE-L3S5-3',2,12,8,4,0),
    ('b41859df-5b9c-430a-aa0a-55de966bd1f3','IA appliquée au marketing digital','UE-L3S5-2',3,10,8,18,0),
    ('322a0531-5192-4fa0-b886-210c90c68dba','Pitch professionnel & présentation de projet','UE-L3S5-3',1,4,4,8,0),
    ('42e6e5d9-7017-41f2-a0e2-d0bd60867c48','Projet professionnel intégrateur — marketing digital','UE-L3S5-4',5,0,0,12,42),
    ('47489141-df86-4fa0-9a50-eeb357a6dfe7','Rédaction Web & communication professionnelle avancée','UE-L3S5-3',2,8,8,8,0),
    ('fa1ec5f3-37e0-49dd-ac21-7fc134400da9','Social media management','UE-L3S5-1',3,12,12,12,0),
    ('c1864ed8-737f-49e9-b083-374ec76c77f4','Stratégie marketing digital','UE-L3S5-1',3,12,12,16,0)
  ) v(id,newn,ue,cr,c,td,tp,pr)
  where m.id = v.id::uuid;

  -- 3) Insertion des modules NOUVEAUX (Challenge x8 + Projet Communication) en status actif
  insert into public.modules(filiere_id,name,level,semester,academic_year,heures_cours,heures_td,heures_tp,heures_projet,credits,status,ue_id)
  select f.id, v.newn,'Licence 3','Semestre 5','2026-2027', v.c,v.td,v.tp,v.pr,v.cr,'actif',
    (select id from public.unites_enseignement ue where ue.code=v.ue and ue.filiere_id=f.id
     and ue.level='Licence 3' and ue.semester='Semestre 5' and ue.academic_year='2026-2027')
  from (values
    ('Développement d''applications','Challenge innovation & transformation digitale','UE-L3S5-4',3,0,0,12,18),
    ('Informatique et intelligence artificielle','Challenge innovation & transformation digitale','UE-L3S5-4',3,0,0,12,18),
    ('Comptabilité et finance digitale','Challenge innovation & transformation digitale','UE-L3S5-4',3,0,0,12,18),
    ('E-commerce et commerce international','Challenge innovation & transformation digitale','UE-L3S5-4',3,0,0,12,18),
    ('Graphisme et Design','Challenge innovation & transformation digitale','UE-L3S5-4',3,0,0,12,18),
    ('Communication digitale','Challenge innovation & transformation digitale','UE-L3S5-4',3,0,0,12,18),
    ('Communication digitale','Projet professionnel intégrateur — campagne de communication','UE-L3S5-4',5,0,0,12,42),
    ('Management de projet digital','Challenge innovation & transformation digitale','UE-L3S5-4',3,0,0,12,18),
    ('Marketing digital','Challenge innovation & transformation digitale','UE-L3S5-4',3,0,0,12,18)
  ) v(fil,newn,ue,cr,c,td,tp,pr)
  join public.filieres f on f.name=v.fil;

  -- 4) Mise en RESERVE des 5 modules non affectes (status='reserve', semester=NULL, sans UE/credits/heures)
  update public.modules set status='reserve', semester=NULL, ue_id=NULL, credits=NULL,
    heures_cours=NULL, heures_td=NULL, heures_tp=NULL, heures_projet=NULL
  where id in (
    '4f867a15-90d6-4c30-a9b0-43fbc6c8726b',
    '596ee6ef-7b91-46d5-bd37-4ddbf70ebab7',
    'c49c67a7-61eb-4df9-8088-bdedeac00d2d',
    '00e72b11-f9a5-4e89-9f00-cbf8bef7db2b',
    '03da4532-0ec4-4663-a050-1008dd578c72'
  );
commit;
