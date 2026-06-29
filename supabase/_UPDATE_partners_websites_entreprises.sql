-- ══════════════════════════════════════════════════════════════
-- IPMD — Sites web des entreprises d'accueil (logo cliquable).
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners set website = 'https://www.librairiedefrance.net'
where name ilike '%Librairie de France%';

update public.partners set website = 'https://www.decathlon.ci'
where name ilike '%cathlon%';

update public.partners set website = 'https://ci-adec.com'
where name = 'ADEC';

update public.partners set website = 'https://www.goafricaonline.com/ci'
where name ilike '%GO Africa%';

-- Comfordev = « Agence web créative »
update public.partners set website = 'https://comfordev.com'
where name ilike '%Agence web%';
