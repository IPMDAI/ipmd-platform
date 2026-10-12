-- ─────────────────────────────────────────────────────────────────────────
-- LMD : UE + crédits pour L1-S1 2026-2027. Additif.
-- Ne touche AUCUN volume horaire (seulement credits + ue_id). 402 h conservées.
-- 4 UE, 16 modules, 30 crédits par filière.
-- ─────────────────────────────────────────────────────────────────────────
begin;

-- 32 UE (4 × 8 filières).
insert into public.unites_enseignement (code,name,filiere_id,level,semester,academic_year)
select u.code,u.name,fl.filiere_id,'Licence 1','Semestre 1','2026-2027'
from (values
  ('UE-L1S1-1','Technologies, IA & innovation numérique'),
  ('UE-L1S1-2','Marketing, communication & commerce digital'),
  ('UE-L1S1-3','Expression & communication'),
  ('UE-L1S1-4','Outils & culture numérique')
) u(code,name)
cross join (select distinct filiere_id from public.modules
            where level='Licence 1' and semester='Semestre 1' and academic_year='2026-2027') fl
on conflict on constraint ue_uk do nothing;

-- Crédits + rattachement UE sur les 16 modules (heures NON touchées).
update public.modules m set credits=p.cr, ue_id=ue.id
from (values
  ('Fondamentaux de l''intelligence artificielle',2,'UE-L1S1-1'),
  ('Fondamentaux de la FinTech et des services financiers digitaux',2,'UE-L1S1-1'),
  ('Fondamentaux du design graphique',2,'UE-L1S1-1'),
  ('Fondamentaux du développement d''applications',2,'UE-L1S1-1'),
  ('Fondamentaux de la communication digitale',2,'UE-L1S1-2'),
  ('Fondamentaux des réseaux sociaux',2,'UE-L1S1-2'),
  ('Fondamentaux du e-commerce',2,'UE-L1S1-2'),
  ('Fondamentaux du marketing digital',2,'UE-L1S1-2'),
  ('Anglais du digital et professionnel',2,'UE-L1S1-3'),
  ('Techniques d''expression – Français Niveau C',2,'UE-L1S1-3'),
  ('Rédaction Web',2,'UE-L1S1-3'),
  ('Art Oratoire',1,'UE-L1S1-3'),
  ('Outils bureautiques et collaboratifs',2,'UE-L1S1-4'),
  ('Écosystème et culture digitale',2,'UE-L1S1-4'),
  ('Fondamentaux de droit numérique',2,'UE-L1S1-4'),
  ('Dactylographie',1,'UE-L1S1-4')
) p(name,cr,code),
public.unites_enseignement ue
where ue.code=p.code and ue.level='Licence 1' and ue.semester='Semestre 1' and ue.academic_year='2026-2027'
  and ue.filiere_id=m.filiere_id
  and m.level='Licence 1' and m.semester='Semestre 1' and m.academic_year='2026-2027' and m.name=p.name;

commit;
