-- Snapshot de la classe résolue automatiquement (Filière + Niveau + Année active)
-- au moment de « Confirmer l'admission ». Additif, idempotent, non destructif.
alter table admission_packs
  add column if not exists class_id uuid references classes(id);

comment on column admission_packs.class_id is
  'Classe figée à la confirmation d''admission (résolue via filiere_id + level + academic_year). Réutilisée par Créer & inviter.';
