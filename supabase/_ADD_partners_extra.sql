-- ══════════════════════════════════════════════════════════════
-- IPMD — Nouveaux partenaires entreprises (stage)
-- Agence web créative & Incub'Ivoir (sans logo pour le moment).
-- Idempotent (insère si absent). À exécuter dans Supabase > SQL Editor.
-- ══════════════════════════════════════════════════════════════

insert into public.partners (name, category, description, status, sort_order)
select v.name, 'entreprise', v.description, 'actif', v.sort_order
from (values
  ('Agence web créative', 'Agence web créative', 60),
  ('Incub''Ivoir', 'Accompagne les porteurs de projets', 70)
) as v(name, description, sort_order)
where not exists (
  select 1 from public.partners p where p.name = v.name
);
