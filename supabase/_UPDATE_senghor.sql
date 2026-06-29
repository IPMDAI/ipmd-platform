-- ══════════════════════════════════════════════════════════════
-- IPMD — Partenaire académique Université Senghor
-- Logo + renommage (sans « Alexandrie »).
-- Fichier dans public/Logo Partenaire Accedemique/
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners
set name = 'Université Senghor',
    logo_url = '/Logo%20Partenaire%20Accedemique/logo-Universite%20de%20senghor-.png',
    description = 'Égypte — Opérateur de la Francophonie'
where name ilike '%Senghor%';
