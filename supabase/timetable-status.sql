-- ──────────────────────────────────────────────────────────────
-- IPMD — Statut des créneaux d'emploi du temps
-- Marqueur posé par l'administration sur un créneau : prévu / reporté /
-- annulé / terminé (outil de communication rapide vers les étudiants).
-- À exécuter dans Supabase > SQL Editor APRÈS planning.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.timetable_slots
  add column if not exists status text not null default 'prevu';
