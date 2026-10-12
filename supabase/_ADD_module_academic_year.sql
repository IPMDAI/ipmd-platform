-- ─────────────────────────────────────────────────────────────────────────
-- Maquettes pédagogiques VERSIONNÉES PAR ANNÉE — PHASE 1 (additive, sûre).
-- Pas de DEFAULT : la colonne est posée nullable, puis les 632 modules actuels
-- (= référentiel vérifié, aucune ligne pré-attachée à une année) sont backfillés
-- en '2026-2027'. Le code est ensuite adapté (écritures posent l'année, lectures
-- filtrent par année). La PHASE 2 (_finalize) imposera NOT NULL + contraintes.
-- Aucune maquette 2025-2026 n'est inventée, aucune donnée supprimée.
-- ─────────────────────────────────────────────────────────────────────────
begin;

-- 1) Colonne année, SANS valeur par défaut.
alter table public.modules add column if not exists academic_year text;

-- 2) Backfill : la maquette actuelle devient celle de 2026-2027 (632 lignes).
update public.modules set academic_year = '2026-2027' where academic_year is null;

commit;
