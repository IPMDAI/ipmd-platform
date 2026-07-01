-- ══════════════════════════════════════════════════════════════
-- IPMD — Classes 2025-2026 (orthographe corrigée : « Marketing »,
-- « Intelligence Artificielle »). Basé sur l'offre réelle 2024-2025.
-- Idempotent (pas de doublon). Ajoute/retire des lignes selon ton offre.
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

insert into public.classes (name, level, academic_year, intake, class_type)
select v.name, v.level, '2025-2026', '2025-2026', 'initial'
from (values
  -- Marketing Digital
  ('Licence 1 Marketing Digital — 2025-2026',                     'Licence 1'),
  ('Licence 2 Marketing Digital — 2025-2026',                     'Licence 2'),
  ('Licence 3 Marketing Digital — 2025-2026',                     'Licence 3'),
  ('Master 1 Marketing Digital — 2025-2026',                      'Master 1'),
  ('Master 2 Marketing Digital — 2025-2026',                      'Master 2'),
  -- Informatique et Intelligence Artificielle
  ('Licence 1 Informatique et Intelligence Artificielle — 2025-2026', 'Licence 1'),
  ('Licence 2 Informatique et Intelligence Artificielle — 2025-2026', 'Licence 2'),
  ('Licence 3 Informatique et Intelligence Artificielle — 2025-2026', 'Licence 3'),
  -- Graphisme et Design
  ('Licence 1 Graphisme et Design — 2025-2026',                   'Licence 1'),
  ('Licence 2 Graphisme et Design — 2025-2026',                   'Licence 2'),
  ('Licence 3 Graphisme et Design — 2025-2026',                   'Licence 3'),
  -- Communication Digitale
  ('Licence 1 Communication Digitale — 2025-2026',               'Licence 1'),
  ('Licence 2 Communication Digitale — 2025-2026',               'Licence 2'),
  ('Licence 3 Communication Digitale — 2025-2026',               'Licence 3'),
  -- Comptabilité et Finance Digitale
  ('Licence 1 Comptabilité et Finance Digitale — 2025-2026',     'Licence 1'),
  ('Licence 2 Comptabilité et Finance Digitale — 2025-2026',     'Licence 2'),
  ('Licence 3 Comptabilité et Finance Digitale — 2025-2026',     'Licence 3'),
  -- E-Commerce et Commerce International
  ('Licence 1 E-Commerce et Commerce International — 2025-2026',  'Licence 1'),
  ('Licence 2 E-Commerce et Commerce International — 2025-2026',  'Licence 2'),
  ('Licence 3 E-Commerce et Commerce International — 2025-2026',  'Licence 3'),
  -- Management de Projet Digital (Master)
  ('Master 1 Management de Projet Digital — 2025-2026',          'Master 1'),
  ('Master 2 Management de Projet Digital — 2025-2026',          'Master 2')
) as v(name, level)
where not exists (
  select 1 from public.classes c where c.name = v.name
);

-- Vérif : lister les classes 2025-2026 créées
-- select name, level from public.classes where academic_year = '2025-2026' order by name;
