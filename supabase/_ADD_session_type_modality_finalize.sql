-- ─────────────────────────────────────────────────────────────────────────
-- B1 (étape 2/2) : rendre type + modalité OBLIGATOIRES (NOT NULL, SANS défaut).
-- À APPLIQUER APRÈS déploiement du code qui fournit toujours type + modalité.
-- Tables vides → aucun backfill. Un Hackathon/devoir/examen ne pourra jamais
-- être classé silencieusement « cours », ni une séance sans modalité.
-- ─────────────────────────────────────────────────────────────────────────
begin;
alter table public.timetable_slots alter column type set not null, alter column modality set not null;
alter table public.course_sessions alter column type set not null, alter column modality set not null;
commit;
