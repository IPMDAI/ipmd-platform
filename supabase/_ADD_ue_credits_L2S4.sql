-- ─────────────────────────────────────────────────────────────────────────
-- Maquette LMD L2-S4 2026-2027 (appliquee en prod)
-- 8 filieres x 4 UE / 10 modules credites / 30 credits / 318 h (240 encadre + 78 projet).
-- UE1 Specialisation metier avancee (8cr,3mod) · UE2 IA & donnees (6cr,2mod)
-- UE3 Management/strategie/professionnalisation (7cr,3mod) · UE4 Projets integrateurs (9cr,2mod).
-- Stage HORS maquette creditee (8 lignes Stage supprimees, deps=0, sans cascade ; stage_l2 cote calendrier).
-- Marketing : 4 modules deplaces depuis S3 REUTILISES en place (0 recreation, memes ids).
-- Volume prouve faisable : S2 22/02->28/05/2027 (~14 sem), Mar/Mer/Jeu 252h cap >= 240h encadre, 78h projet <= 14 vendredis.
-- Preuve prod : 10 mod / 30 cr / 318 h / 4 UE / 8-6-7-9 / 0 doublon / 0 sans UE / 0 perso neg / 0 Stage / mkt_moved=4.
-- ─────────────────────────────────────────────────────────────────────────
begin;

  -- 0) Supprimer les 8 Stage (deps=0, sans cascade)
  delete from public.modules where level='Licence 2' and semester='Semestre 4' and academic_year='2026-2027'
    and name='Stage' and filiere_id in (select id from public.filieres where status in ('actif','valide'));

  -- 1) 32 UE L2-S4
  insert into public.unites_enseignement(code,name,filiere_id,level,semester,academic_year)
  select u.code,u.name,fl.id,'Licence 2','Semestre 4','2026-2027'
  from (values ('UE-L2S4-1','Spécialisation métier avancée'),('UE-L2S4-2','IA & données appliquées au métier'),
               ('UE-L2S4-3','Management, stratégie & professionnalisation'),('UE-L2S4-4','Projets intégrateurs & pré-professionnalisation')) u(code,name)
  cross join (select id from public.filieres where status in ('actif','valide')) fl
  on conflict on constraint ue_uk do nothing;

  -- 2) Renommage/affectation des modules EXISTANTS (en place)
  update public.modules m set name=v.newn, credits=v.cr,
    heures_cours=v.c, heures_td=v.td, heures_tp=v.tp, heures_projet=v.pr,
    ue_id=(select id from public.unites_enseignement ue where ue.code=v.ue and ue.filiere_id=m.filiere_id
           and ue.level='Licence 2' and ue.semester='Semestre 4' and ue.academic_year='2026-2027')
  from (values
    ('Développement d''applications','Intelligence artificielle appliquée au métier','IA appliquée au développement logiciel','UE-L2S4-2',3,8,8,16,0),
    ('Développement d''applications','Gestion de projets digitaux','Gestion de projets digitaux','UE-L2S4-3',3,10,8,8,0),
    ('Développement d''applications','Stratégie et pilotage de projets','Stratégie et pilotage de projets','UE-L2S4-3',2,8,6,6,0),
    ('Développement d''applications','Projet collectif','Projet collectif intégrateur — application métier','UE-L2S4-4',5,0,0,12,39),
    ('Développement d''applications','Projet individuel','Projet individuel — module applicatif','UE-L2S4-4',4,0,0,10,39),
    ('Informatique et intelligence artificielle','Intelligence artificielle appliquée au métier','Deep learning (vision & NLP)','UE-L2S4-2',3,8,8,16,0),
    ('Informatique et intelligence artificielle','Gestion de projets digitaux','Gestion de projets digitaux','UE-L2S4-3',3,10,8,8,0),
    ('Informatique et intelligence artificielle','Stratégie et pilotage de projets','Stratégie et pilotage de projets','UE-L2S4-3',2,8,6,6,0),
    ('Informatique et intelligence artificielle','Projet collectif','Projet collectif intégrateur — solution IA','UE-L2S4-4',5,0,0,12,39),
    ('Informatique et intelligence artificielle','Projet individuel','Projet individuel — modèle IA/data','UE-L2S4-4',4,0,0,10,39),
    ('Comptabilité et finance digitale','Intelligence artificielle appliquée au métier','IA appliquée à la finance','UE-L2S4-2',3,8,8,16,0),
    ('Comptabilité et finance digitale','Gestion de projets digitaux','Gestion de projets digitaux','UE-L2S4-3',3,10,8,8,0),
    ('Comptabilité et finance digitale','Stratégie et pilotage de projets','Stratégie et pilotage de projets','UE-L2S4-3',2,8,6,6,0),
    ('Comptabilité et finance digitale','Projet collectif','Projet collectif intégrateur — outil de gestion financière','UE-L2S4-4',5,0,0,12,39),
    ('Comptabilité et finance digitale','Projet individuel','Projet individuel — tableau de bord financier','UE-L2S4-4',4,0,0,10,39),
    ('E-commerce et commerce international','Intelligence artificielle appliquée au métier','IA appliquée au e-commerce (recommandation)','UE-L2S4-2',3,8,8,16,0),
    ('E-commerce et commerce international','Gestion de projets digitaux','Gestion de projets digitaux','UE-L2S4-3',3,10,8,8,0),
    ('E-commerce et commerce international','Stratégie et pilotage de projets','Stratégie et pilotage de projets','UE-L2S4-3',2,8,6,6,0),
    ('E-commerce et commerce international','Projet collectif','Projet collectif intégrateur — boutique e-commerce','UE-L2S4-4',5,0,0,12,39),
    ('E-commerce et commerce international','Projet individuel','Projet individuel — tunnel de conversion','UE-L2S4-4',4,0,0,10,39),
    ('Graphisme et Design','Intelligence artificielle appliquée au métier','IA générative appliquée au design','UE-L2S4-2',3,8,8,16,0),
    ('Graphisme et Design','Gestion de projets digitaux','Gestion de projets digitaux','UE-L2S4-3',3,10,8,8,0),
    ('Graphisme et Design','Stratégie et pilotage de projets','Stratégie et pilotage de projets','UE-L2S4-3',2,8,6,6,0),
    ('Graphisme et Design','Projet collectif','Projet collectif intégrateur — production graphique','UE-L2S4-4',5,0,0,12,39),
    ('Graphisme et Design','Projet individuel','Projet individuel — identité de marque','UE-L2S4-4',4,0,0,10,39),
    ('Communication digitale','Intelligence artificielle appliquée au métier','IA appliquée à la création de contenu','UE-L2S4-2',3,8,8,16,0),
    ('Communication digitale','Gestion de projets digitaux','Gestion de projets digitaux','UE-L2S4-3',3,10,8,8,0),
    ('Communication digitale','Stratégie et pilotage de projets','Stratégie et pilotage de projets','UE-L2S4-3',2,8,6,6,0),
    ('Communication digitale','Projet collectif','Projet collectif intégrateur — campagne de communication','UE-L2S4-4',5,0,0,12,39),
    ('Communication digitale','Projet individuel','Projet individuel — plan de communication','UE-L2S4-4',4,0,0,10,39),
    ('Management de projet digital','Intelligence artificielle appliquée au métier','IA appliquée au pilotage de projet','UE-L2S4-2',3,8,8,16,0),
    ('Management de projet digital','Gestion de projets digitaux','Gestion de projets digitaux','UE-L2S4-3',3,10,8,8,0),
    ('Management de projet digital','Stratégie et pilotage de projets','Stratégie et pilotage de projets','UE-L2S4-3',2,8,6,6,0),
    ('Management de projet digital','Projet collectif','Projet collectif intégrateur — pilotage d''un projet digital','UE-L2S4-4',5,0,0,12,39),
    ('Management de projet digital','Projet individuel','Projet individuel — plan projet','UE-L2S4-4',4,0,0,10,39),
    ('Marketing digital','FinTech et services financiers digitaux','FinTech et services financiers digitaux','UE-L2S4-1',3,12,10,12,0),
    ('Marketing digital','Design graphique appliqué au marketing digital','Design graphique appliqué au marketing digital','UE-L2S4-1',3,10,10,12,0),
    ('Marketing digital','Développement d''applications appliqué au digital','Développement d''applications appliqué au digital','UE-L2S4-1',2,8,6,10,0),
    ('Marketing digital','Intelligence artificielle appliquée au marketing digital','Intelligence artificielle appliquée au marketing digital','UE-L2S4-2',3,8,8,16,0),
    ('Marketing digital','Intelligence artificielle appliquée aux campagnes digitales','Data & analytics marketing','UE-L2S4-2',3,8,8,16,0),
    ('Marketing digital','Gestion de projets digitaux','Gestion de projets digitaux','UE-L2S4-3',3,10,8,8,0),
    ('Marketing digital','Stratégie marketing digital avancée','Stratégie marketing digital avancée','UE-L2S4-3',2,8,6,6,0),
    ('Marketing digital','Projet collectif','Projet collectif intégrateur — campagne marketing','UE-L2S4-4',5,0,0,12,39),
    ('Marketing digital','Projet individuel','Projet individuel — plan marketing digital','UE-L2S4-4',4,0,0,10,39)
  ) v(fil,oldn,newn,ue,cr,c,td,tp,pr)
  join public.filieres f on f.name=v.fil
  where m.filiere_id=f.id and m.name=v.oldn
    and m.level='Licence 2' and m.semester='Semestre 4' and m.academic_year='2026-2027';

  -- 3) Insertion des modules NOUVEAUX
  insert into public.modules(filiere_id,name,level,semester,academic_year,heures_cours,heures_td,heures_tp,heures_projet,credits,status,ue_id)
  select f.id, v.newn,'Licence 2','Semestre 4','2026-2027', v.c,v.td,v.tp,v.pr,v.cr,'actif',
    (select id from public.unites_enseignement ue where ue.code=v.ue and ue.filiere_id=f.id
     and ue.level='Licence 2' and ue.semester='Semestre 4' and ue.academic_year='2026-2027')
  from (values
    ('Développement d''applications','Architecture logicielle & conception d''API','UE-L2S4-1',3,12,10,12,0),
    ('Développement d''applications','Développement mobile avancé','UE-L2S4-1',3,10,10,12,0),
    ('Développement d''applications','Tests, qualité & sécurité applicative','UE-L2S4-1',2,8,6,10,0),
    ('Développement d''applications','Bases de données & exploitation des données','UE-L2S4-2',3,8,8,16,0),
    ('Développement d''applications','Séminaire professionnel — métiers du développement','UE-L2S4-3',2,6,6,6,0),
    ('Informatique et intelligence artificielle','Machine learning appliqué','UE-L2S4-1',3,12,10,12,0),
    ('Informatique et intelligence artificielle','Réseaux & systèmes distribués','UE-L2S4-1',3,10,10,12,0),
    ('Informatique et intelligence artificielle','Programmation avancée & structures de données','UE-L2S4-1',2,8,6,10,0),
    ('Informatique et intelligence artificielle','Ingénierie des données (data engineering)','UE-L2S4-2',3,8,8,16,0),
    ('Informatique et intelligence artificielle','Séminaire professionnel — métiers de l''IA & de la data','UE-L2S4-3',2,6,6,6,0),
    ('Comptabilité et finance digitale','Comptabilité analytique & contrôle de gestion digital','UE-L2S4-1',3,12,10,12,0),
    ('Comptabilité et finance digitale','Finance d''entreprise & analyse financière','UE-L2S4-1',3,10,10,12,0),
    ('Comptabilité et finance digitale','Fiscalité & obligations déclaratives digitales','UE-L2S4-1',2,8,6,10,0),
    ('Comptabilité et finance digitale','Data & reporting financier (BI)','UE-L2S4-2',3,8,8,16,0),
    ('Comptabilité et finance digitale','Séminaire professionnel — métiers de la finance digitale','UE-L2S4-3',2,6,6,6,0),
    ('E-commerce et commerce international','Gestion & optimisation d''une plateforme e-commerce','UE-L2S4-1',3,12,10,12,0),
    ('E-commerce et commerce international','Logistique, supply chain & paiement digital','UE-L2S4-1',3,10,10,12,0),
    ('E-commerce et commerce international','Commerce international & dédouanement digital','UE-L2S4-1',2,8,6,10,0),
    ('E-commerce et commerce international','Data & analytics e-commerce','UE-L2S4-2',3,8,8,16,0),
    ('E-commerce et commerce international','Séminaire professionnel — métiers du e-commerce','UE-L2S4-3',2,6,6,6,0),
    ('Graphisme et Design','Direction artistique & identité visuelle','UE-L2S4-1',3,12,10,12,0),
    ('Graphisme et Design','UI/UX design avancé','UE-L2S4-1',3,10,10,12,0),
    ('Graphisme et Design','Motion design & animation','UE-L2S4-1',2,8,6,10,0),
    ('Graphisme et Design','Data & design (analyse d''usage, A/B testing)','UE-L2S4-2',3,8,8,16,0),
    ('Graphisme et Design','Séminaire professionnel — métiers du design','UE-L2S4-3',2,6,6,6,0),
    ('Communication digitale','Stratégie éditoriale & contenu multicanal','UE-L2S4-1',3,12,10,12,0),
    ('Communication digitale','Community management & réseaux sociaux avancés','UE-L2S4-1',3,10,10,12,0),
    ('Communication digitale','Relations publiques & communication de crise digitale','UE-L2S4-1',2,8,6,10,0),
    ('Communication digitale','Data & analytics des médias sociaux','UE-L2S4-2',3,8,8,16,0),
    ('Communication digitale','Séminaire professionnel — métiers de la communication','UE-L2S4-3',2,6,6,6,0),
    ('Management de projet digital','Méthodes agiles avancées (Scrum / SAFe)','UE-L2S4-1',3,12,10,12,0),
    ('Management de projet digital','Pilotage budgétaire & gestion des risques','UE-L2S4-1',3,10,10,12,0),
    ('Management de projet digital','Management d''équipe & leadership digital','UE-L2S4-1',2,8,6,10,0),
    ('Management de projet digital','Data & indicateurs de performance (KPI / PMO)','UE-L2S4-2',3,8,8,16,0),
    ('Management de projet digital','Séminaire professionnel — métiers du management de projet','UE-L2S4-3',2,6,6,6,0),
    ('Marketing digital','Séminaire professionnel — métiers du marketing digital','UE-L2S4-3',2,6,6,6,0)
  ) v(fil,newn,ue,cr,c,td,tp,pr)
  join public.filieres f on f.name=v.fil;
commit;
