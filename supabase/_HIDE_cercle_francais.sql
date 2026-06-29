-- ══════════════════════════════════════════════════════════════
-- IPMD — Masquer temporairement le partenaire « Cercle Français »
-- (non officiel pour le moment). Réversible : remettre 'actif' pour réafficher.
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners
set status = 'inactif'
where name ilike '%Cercle Fran%';
