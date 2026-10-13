-- Civilité (M./Mme/Dr/Pr/Me/Autre) — distincte de la relation parent/enfant.
-- Nom et prénom(s) réutilisent les colonnes existantes last_name / first_names.
-- Nullable : les profils existants restent compatibles.
alter table public.profiles add column if not exists civility text;
