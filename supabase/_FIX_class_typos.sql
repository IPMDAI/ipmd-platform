-- ══════════════════════════════════════════════════════════════
-- IPMD — Correction des fautes dans les noms de classes & filières.
-- Sans risque : chaque UPDATE ne touche que les lignes concernées.
-- Idempotent (ré-exécutable). À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

-- ── Classes ─────────────────────────────────────────────────────
update public.classes set name = replace(name, 'Maketing', 'Marketing')
  where name like '%Maketing%';
update public.classes set name = replace(name, 'Intellignece', 'Intelligence')
  where name like '%Intellignece%';
update public.classes set name = replace(name, 'Comptabilite', 'Comptabilité')
  where name like '%Comptabilite%';
update public.classes set name = replace(name, 'Developpement', 'Développement')
  where name like '%Developpement%';
update public.classes set name = replace(name, 'E Commerce', 'E-Commerce')
  where name like '%E Commerce%';
update public.classes set name = replace(name, ' & ', ' et ')
  where name like '% & %';

-- ── Filières (mêmes fautes éventuelles) ─────────────────────────
update public.filieres set name = replace(name, 'Maketing', 'Marketing')
  where name like '%Maketing%';
update public.filieres set name = replace(name, 'Intellignece', 'Intelligence')
  where name like '%Intellignece%';
update public.filieres set name = replace(name, 'Comptabilite', 'Comptabilité')
  where name like '%Comptabilite%';
update public.filieres set name = replace(name, 'Developpement', 'Développement')
  where name like '%Developpement%';
update public.filieres set name = replace(name, 'E Commerce', 'E-Commerce')
  where name like '%E Commerce%';
update public.filieres set name = replace(name, ' & ', ' et ')
  where name like '% & %';

-- ── Contrôle : plus aucune faute ne doit apparaître ─────────────
-- select name from public.classes
-- where name like '%Maketing%' or name like '%Intellignece%'
--    or name like '%Comptabilite%' or name like '%Developpement%'
--    or name like '%E Commerce%' or name like '% & %'
-- order by name;
