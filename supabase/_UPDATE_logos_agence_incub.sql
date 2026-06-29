-- ══════════════════════════════════════════════════════════════
-- IPMD — Logos Agence web créative & Incub'Ivoir
-- Fichiers (noms simplifiés) dans public/Logo - Entreprise pour le stage/
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners
set logo_url = '/Logo%20-%20Entreprise%20pour%20le%20stage/agence-web-creative.png'
where name ilike '%Agence web%';

update public.partners
set logo_url = '/Logo%20-%20Entreprise%20pour%20le%20stage/incub-ivoir.png'
where name ilike '%Incub%';
