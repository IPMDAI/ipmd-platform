-- ══════════════════════════════════════════════════════════════
-- IPMD — CIEMS apparaît AUSSI dans « Entreprises d'accueil en stage ».
-- 2ᵉ ligne (catégorie 'entreprise') ; la 1ʳᵉ reste 'entreprise_partenaire'.
-- Idempotent (insère si cette combinaison nom+catégorie n'existe pas).
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

insert into public.partners (name, category, logo_url, website, description, status, sort_order)
select 'CIEMS', 'entreprise',
       '/Logo%20-%20Entreprise%20pour%20le%20stage/logo%20CIEMS.png',
       'https://www.ciemstrategies.com',
       null,
       'actif', 25
where not exists (
  select 1 from public.partners where name = 'CIEMS' and category = 'entreprise'
);
