-- ══════════════════════════════════════════════════════════════
-- IPMD — Localisation des partenaires académiques (pays / villes)
-- Affichée sous le nom sur la page /partenaires (carte vedette 📍).
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners
set description = 'France — Montpellier, Paris & à l''international'
where name ilike '%MBS%';

update public.partners
set description = 'Alexandrie, Égypte — Opérateur de la Francophonie'
where name ilike '%Senghor%';
