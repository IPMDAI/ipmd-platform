-- ─────────────────────────────────────────────────────────────────────────
-- Liaison réelle Planning <-> Module officiel de la maquette.
-- Ajoute module_id (FK nullable vers modules.id, ON DELETE SET NULL) sur
-- timetable_slots ET course_sessions. `subject` reste NOT NULL = snapshot
-- historique (rempli depuis module.name quand un module est rattaché).
-- Les 2 tables sont vides (0 ligne) -> migration sûre, rien à casser.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.timetable_slots
  add column if not exists module_id uuid references public.modules(id) on delete set null;

alter table public.course_sessions
  add column if not exists module_id uuid references public.modules(id) on delete set null;
