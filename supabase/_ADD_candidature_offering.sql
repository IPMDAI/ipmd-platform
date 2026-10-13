-- Lot 2.5 : la candidature diplôme capture la FILIÈRE et le NIVEAU de l'offre
-- réellement choisie (cohérence académique), en plus de program_interest (libellé).
-- Additif, idempotent, non destructif. NULL pour bootcamp / candidatures legacy.
alter table inscription_requests
  add column if not exists filiere_id uuid references filieres(id) on delete restrict,
  add column if not exists offered_level text;

comment on column inscription_requests.filiere_id is
  'Filière de l''offre choisie (intake_offerings). NULL pour bootcamp/legacy.';
comment on column inscription_requests.offered_level is
  'Niveau de programme de l''offre choisie (ex. « Licence 1 »). NULL pour bootcamp/legacy.';
