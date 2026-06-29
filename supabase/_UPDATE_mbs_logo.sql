-- ══════════════════════════════════════════════════════════════
-- IPMD — Logo du partenaire académique MBS (Montpellier Business School)
-- Le fichier est dans public/partenaire_Logo_MBS.webp
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners
set logo_url = '/partenaire_Logo_MBS.webp'
where name ilike '%MBS%';
