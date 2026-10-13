-- P4b — Invitation parent + suivi d'activation.
-- Additif, nullable : invited_at = date d'invitation ; activated_at = date à laquelle
-- le parent a défini son mot de passe (compte activé). Les comptes auto-inscrits
-- gardent les deux à NULL.
alter table public.profiles add column if not exists invited_at timestamptz;
alter table public.profiles add column if not exists activated_at timestamptz;
