-- ══════════════════════════════════════════════════════════════
-- IPMD — Nouveau partenaire entreprise : ADEC (Institution financière)
-- Catégorie « Entreprises ayant accueilli nos étudiants en stage ».
-- Logo dans public/Logo - Entreprise pour le stage/logo ADEC.png
-- Idempotent (insère si absent, puis met à jour). À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

insert into public.partners (name, category, logo_url, description, status, sort_order)
select 'ADEC', 'entreprise',
       '/Logo%20-%20Entreprise%20pour%20le%20stage/logo%20ADEC.png',
       'Institution financière — Finance Digitale', 'actif', 5
where not exists (select 1 from public.partners where name = 'ADEC');

update public.partners
set category = 'entreprise',
    logo_url = '/Logo%20-%20Entreprise%20pour%20le%20stage/logo%20ADEC.png',
    description = 'Institution financière — Finance Digitale',
    status = 'actif'
where name = 'ADEC';
