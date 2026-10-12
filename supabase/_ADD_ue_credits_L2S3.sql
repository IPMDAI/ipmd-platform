-- ─────────────────────────────────────────────────────────────────────────
-- Maquette LMD L2-S3 2026-2027 : 4 UE · 12 modules · 30 crédits · 366 h.
-- Transversaux progressés L2 (renommés) · 6 modules métier (UE2/UE3) ·
-- Hackathon métier + Projet appliqué (par filière). Marketing : 4 modules
-- déplacés en S4 (ni supprimés ni dupliqués). Les 8 filières (fantômes nettoyés).
-- ─────────────────────────────────────────────────────────────────────────
begin;

-- 1) Marketing : déplacer 4 modules S3 -> S4 (réservés à L2-S4).
update public.modules set semester='Semestre 4'
where level='Licence 2' and semester='Semestre 3' and academic_year='2026-2027'
  and filiere_id=(select id from public.filieres where name='Marketing digital')
  and name in ('Intelligence artificielle appliquée au marketing digital',
               'FinTech et services financiers digitaux',
               'Design graphique appliqué au marketing digital',
               'Développement d''applications appliqué au digital');

-- 2) Transversaux -> niveau L2 (renommage).
update public.modules set name=case name
    when 'Art Oratoire' then 'Prise de parole professionnelle & persuasion'
    when 'Rédaction Web' then 'Rédaction professionnelle & contenus digitaux avancés'
    when 'Techniques d''expression – Français Niveau C' then 'Expression professionnelle, synthèse & argumentation'
    when 'Fondamentaux de droit numérique' then 'Droit du numérique appliqué & protection des données'
    else name end
where level='Licence 2' and semester='Semestre 3' and academic_year='2026-2027'
  and name in ('Art Oratoire','Rédaction Web','Techniques d''expression – Français Niveau C','Fondamentaux de droit numérique');

-- 3) 32 UE (4 × 8 filières).
insert into public.unites_enseignement(code,name,filiere_id,level,semester,academic_year)
select u.code,u.name,fl.filiere_id,'Licence 2','Semestre 3','2026-2027'
from (values
  ('UE-L2S3-1','Compétences professionnelles transversales'),
  ('UE-L2S3-2','Spécialisation métier I'),
  ('UE-L2S3-3','Spécialisation métier II'),
  ('UE-L2S3-4','Pratique professionnelle')
) u(code,name)
cross join (select distinct filiere_id from public.modules
            where level='Licence 2' and semester='Semestre 3' and academic_year='2026-2027') fl
on conflict on constraint ue_uk do nothing;

-- 4) Transversaux -> UE1 (2 cr, 8/8/8/0).
update public.modules m set credits=2,heures_cours=8,heures_td=8,heures_tp=8,heures_projet=0,
  ue_id=(select id from public.unites_enseignement ue where ue.code='UE-L2S3-1' and ue.filiere_id=m.filiere_id and ue.level='Licence 2' and ue.semester='Semestre 3' and ue.academic_year='2026-2027')
where m.level='Licence 2' and m.semester='Semestre 3' and m.academic_year='2026-2027'
  and m.name in ('Prise de parole professionnelle & persuasion','Rédaction professionnelle & contenus digitaux avancés','Expression professionnelle, synthèse & argumentation','Droit du numérique appliqué & protection des données');

-- 5) Modules métier (6 restants) -> 3 UE2 (3 cr, 12/12/12) + 3 UE3 (2 cr, 6/6/12/6).
--    (Hackathon/Projet pas encore insérés : seuls transversaux + métier existent.)
update public.modules m set
  credits = case when s.rn<=3 then 3 else 2 end,
  heures_cours = case when s.rn<=3 then 12 else 6 end,
  heures_td = case when s.rn<=3 then 12 else 6 end,
  heures_tp = 12,
  heures_projet = case when s.rn<=3 then 0 else 6 end,
  ue_id = (select id from public.unites_enseignement ue where ue.code = case when s.rn<=3 then 'UE-L2S3-2' else 'UE-L2S3-3' end and ue.filiere_id=m.filiere_id and ue.level='Licence 2' and ue.semester='Semestre 3' and ue.academic_year='2026-2027')
from (
  select id, row_number() over (partition by filiere_id order by name) rn
  from public.modules
  where level='Licence 2' and semester='Semestre 3' and academic_year='2026-2027'
    and name not in ('Prise de parole professionnelle & persuasion','Rédaction professionnelle & contenus digitaux avancés','Expression professionnelle, synthèse & argumentation','Droit du numérique appliqué & protection des données')
) s where s.id=m.id;

-- 6) Hackathon métier & prototypage digital (tronc commun) -> UE4 (4 cr, 0/0/12/30).
insert into public.modules(filiere_id,name,level,semester,academic_year,heures_cours,heures_td,heures_tp,heures_projet,credits,status,ue_id)
select fl.filiere_id,'Hackathon métier & prototypage digital','Licence 2','Semestre 3','2026-2027',0,0,12,30,4,'actif',
  (select id from public.unites_enseignement ue where ue.code='UE-L2S3-4' and ue.filiere_id=fl.filiere_id and ue.level='Licence 2' and ue.semester='Semestre 3' and ue.academic_year='2026-2027')
from (select distinct filiere_id from public.modules where level='Licence 2' and semester='Semestre 3' and academic_year='2026-2027') fl;

-- 7) Projet appliqué (intitulé propre à chaque filière) -> UE4 (3 cr, 0/0/0/30).
insert into public.modules(filiere_id,name,level,semester,academic_year,heures_cours,heures_td,heures_tp,heures_projet,credits,status,ue_id)
select f.id, p.pname,'Licence 2','Semestre 3','2026-2027',0,0,0,30,3,'actif',
  (select id from public.unites_enseignement ue where ue.code='UE-L2S3-4' and ue.filiere_id=f.id and ue.level='Licence 2' and ue.semester='Semestre 3' and ue.academic_year='2026-2027')
from (values
  ('Développement d''applications','Projet appliqué — développement d''une application digitale'),
  ('Informatique et intelligence artificielle','Projet appliqué — solution data / IA'),
  ('Comptabilité et finance digitale','Projet appliqué — outil de gestion financière digitale'),
  ('E-commerce et commerce international','Projet appliqué — boutique e-commerce opérationnelle'),
  ('Graphisme et Design','Projet appliqué — production graphique & identité visuelle'),
  ('Communication digitale','Projet appliqué — campagne de communication digitale'),
  ('Management de projet digital','Projet appliqué — pilotage d''un projet digital'),
  ('Marketing digital','Projet appliqué — campagne marketing digital')
) p(fil,pname)
join public.filieres f on f.name=p.fil;

commit;
