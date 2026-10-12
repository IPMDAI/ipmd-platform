-- ─────────────────────────────────────────────────────────────────────────
-- Maquette pédagogique — volumes horaires structurés + nouveaux modules.
-- ADDITIF : ne supprime rien, ne modifie aucun volume existant.
--   • 4 colonnes d'heures par module (Cours / TD / TP / Projet).
--     Les totaux (encadré = Cours+TD+TP ; total = +Projet) sont CALCULÉS
--     côté app, PAS stockés. L'ancien champ `hours` est conservé.
--   • 96 nouveaux modules transversaux (L1-S1, L2-S3, L3-S5), tronc commun
--     8 filières, avec garde anti-doublon (NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────
begin;

-- 1) Colonnes d'heures structurées (additives, nullable).
alter table public.modules add column if not exists heures_cours   integer;
alter table public.modules add column if not exists heures_td      integer;
alter table public.modules add column if not exists heures_tp      integer;
alter table public.modules add column if not exists heures_projet  integer;

-- 2) Nouveaux modules (noms seulement ; heures/coef remplis après validation).
insert into public.modules (filiere_id, name, level, semester, status)
select fl.filiere_id, nm.name, nm.lvl, nm.sem, 'actif'
from (values
    ('Techniques d''expression – Français Niveau C','Licence 1','Semestre 1'),
    ('Art Oratoire','Licence 1','Semestre 1'),
    ('Rédaction Web','Licence 1','Semestre 1'),
    ('Fondamentaux de droit numérique','Licence 1','Semestre 1'),
    ('Techniques d''expression – Français Niveau C','Licence 2','Semestre 3'),
    ('Art Oratoire','Licence 2','Semestre 3'),
    ('Rédaction Web','Licence 2','Semestre 3'),
    ('Fondamentaux de droit numérique','Licence 2','Semestre 3'),
    ('Art Oratoire','Licence 3','Semestre 5'),
    ('Pitch','Licence 3','Semestre 5'),
    ('Rédaction Web','Licence 3','Semestre 5'),
    ('Droit numérique & Règles de l''intelligence artificielle','Licence 3','Semestre 5')
  ) as nm(name, lvl, sem)
join (select distinct filiere_id, level from public.modules) fl on fl.level = nm.lvl
where not exists (
  select 1 from public.modules m
  where m.filiere_id = fl.filiere_id and m.level = nm.lvl
    and m.semester = nm.sem and m.name = nm.name
);

commit;
