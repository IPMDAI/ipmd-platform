-- P0 — Socle profil parent & préférences de communication
-- Additif, 100 % nullable / defaults sûrs : les anciens profils passent sans rien changer.
--
-- Profil professionnel du parent (tous nullable, aucune valeur écrite d'office).
alter table public.profiles add column if not exists profession text;
alter table public.profiles add column if not exists fonction   text;
alter table public.profiles add column if not exists entreprise text;
alter table public.profiles add column if not exists ville      text;
alter table public.profiles add column if not exists pays       text;

-- Consentement commercial : OPT-IN volontaire (false par défaut).
-- Les comms scolaires/administratives NE dépendent PAS de ce flag.
alter table public.profiles
  add column if not exists comm_opt_commercial boolean not null default false;

-- Traçabilité du consentement explicite.
alter table public.profiles
  add column if not exists comm_opt_commercial_at timestamptz;      -- date du dernier consentement
alter table public.profiles
  add column if not exists comm_opt_commercial_source text;         -- 'parent_settings' | 'inscription' | 'event' | ...
