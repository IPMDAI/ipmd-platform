-- ══════════════════════════════════════════════════════════════
-- IPMD — Sites web des partenaires académiques (logo cliquable).
-- À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

update public.partners
set website = 'https://www.mbs-education.com'
where name ilike '%MBS%';

update public.partners
set website = 'https://usenghor-francophonie.org'
where name ilike '%Senghor%';
