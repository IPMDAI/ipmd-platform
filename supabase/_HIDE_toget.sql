-- ══════════════════════════════════════════════════════════════
-- IPMD — Masquer temporairement le partenaire « ToGet »
-- Réversible : remettre 'actif' pour réafficher.
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners
set status = 'inactif'
where name ilike 'ToGet';
