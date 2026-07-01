-- ══════════════════════════════════════════════════════════════
-- IPMD — Créer la classe « Licence 1 Marketing Digital — 2025-2026 ».
-- Idempotent (ne crée pas de doublon). À exécuter dans Supabase > SQL Editor.
-- (La filière est lue depuis le nom, comme les autres classes.)
-- ══════════════════════════════════════════════════════════════

insert into public.classes (name, level, academic_year, intake, class_type)
select 'Licence 1 Marketing Digital — 2025-2026', 'Licence 1', '2025-2026', '2025-2026', 'initial'
where not exists (
  select 1 from public.classes
  where name = 'Licence 1 Marketing Digital — 2025-2026'
);

-- Vérif : la classe est bien créée
-- select id, name, level, academic_year from public.classes
-- where name = 'Licence 1 Marketing Digital — 2025-2026';
