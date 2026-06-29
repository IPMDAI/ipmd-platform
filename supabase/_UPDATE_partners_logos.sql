-- ══════════════════════════════════════════════════════════════
-- IPMD — Logos des entreprises (stage) ayant accueilli nos étudiants.
-- Fichiers dans public/Logo - Entreprise pour le stage/
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners
set logo_url = '/Logo%20-%20Entreprise%20pour%20le%20stage/Logo%20Decathlon.jpg'
where name ilike '%cathlon%';

update public.partners
set logo_url = '/Logo%20-%20Entreprise%20pour%20le%20stage/Logo%20Go%20Africa%20Online.jpg'
where name ilike '%africa%';

update public.partners
set logo_url = '/Logo%20-%20Entreprise%20pour%20le%20stage/Logo%20Olivie%20imprimerie.png'
where name ilike '%olive%';

update public.partners
set logo_url = '/Logo%20-%20Entreprise%20pour%20le%20stage/logo-librairie-france.png'
where name ilike '%librairie%';
