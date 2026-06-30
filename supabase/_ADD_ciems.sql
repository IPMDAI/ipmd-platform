-- ══════════════════════════════════════════════════════════════
-- IPMD — Nouveau partenaire : CIEMS (Entreprise partenaire).
-- Spécialiste de la formation en gestion de projet.
-- Logo : public/Logo - Entreprise pour le stage/logo CIEMS.png
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

insert into public.partners (name, category, logo_url, website, description, status, sort_order)
select 'CIEMS', 'entreprise_partenaire',
       '/Logo%20-%20Entreprise%20pour%20le%20stage/logo%20CIEMS.png',
       'https://www.ciemstrategies.com',
       'Formation en gestion de projet',
       'actif', 10
where not exists (select 1 from public.partners where name = 'CIEMS');

-- Mise à jour si déjà présent
update public.partners
set category    = 'entreprise_partenaire',
    logo_url    = '/Logo%20-%20Entreprise%20pour%20le%20stage/logo%20CIEMS.png',
    website     = 'https://www.ciemstrategies.com',
    description = 'Formation en gestion de projet',
    status      = 'actif'
where name = 'CIEMS';
