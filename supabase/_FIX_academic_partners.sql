-- ══════════════════════════════════════════════════════════════
-- IPMD — Correction des partenaires académiques (chemins logos déplacés)
-- Les logos sont désormais dans public/Logo Partenaire Accedemique/
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

-- MBS : nouveau chemin du logo
update public.partners
set logo_url = '/Logo%20Partenaire%20Accedemique/partenaire_Logo_MBS.webp'
where name ilike '%MBS%';

-- Université Senghor : logo + renommage (sans « Alexandrie »)
update public.partners
set name = 'Université Senghor',
    logo_url = '/Logo%20Partenaire%20Accedemique/logo-Universite%20de%20senghor-.png',
    description = 'Égypte — Opérateur de la Francophonie'
where name ilike '%Senghor%';
