-- ─────────────────────────────────────────────────────────────────────────
-- B1 (étape 1/2, SÛRE) : types de séance + modalité.
-- Colonnes ajoutées NULLABLE d'abord (prod non cassée), FK sur le type.
-- Le NOT NULL (sans défaut) sera posé en étape 2, APRÈS déploiement du code
-- qui fournit toujours type + modalité. Tables vides (0 créneau / 0 séance).
-- ─────────────────────────────────────────────────────────────────────────
begin;

create table if not exists public.session_types (
  code text primary key,
  label text not null,
  category text not null,
  is_regular boolean not null default false
);
insert into public.session_types(code,label,category,is_regular) values
  ('cours','Cours','enseignement',true),
  ('td','TD','enseignement',true),
  ('tp','TP','enseignement',true),
  ('devoir_surveille','Devoir surveillé','evaluation',false),
  ('controle_continu','Contrôle continu','evaluation',false),
  ('examen','Examen','evaluation',false),
  ('rattrapage','Rattrapage','evaluation',false),
  ('atelier','Atelier','pratique',false),
  ('hackathon','Hackathon','pratique',false),
  ('journee_ipmd','Journée IPMD','evenement',false),
  ('recherche_terrain','Recherche terrain','pratique',false),
  ('projet','Projet','pratique',false),
  ('presentation','Présentation','evaluation',false),
  ('soutenance','Soutenance','evaluation',false)
on conflict (code) do nothing;

-- Référence lisible par tous (table de nomenclature, non sensible).
alter table public.session_types enable row level security;
drop policy if exists "read session_types" on public.session_types;
create policy "read session_types" on public.session_types for select using (true);

-- Colonnes type + modalité (NULLABLE pour l'instant), FK sur le type.
alter table public.timetable_slots add column if not exists type text references public.session_types(code);
alter table public.timetable_slots add column if not exists modality text check (modality in ('presentiel','distanciel'));
alter table public.course_sessions add column if not exists type text references public.session_types(code);
alter table public.course_sessions add column if not exists modality text check (modality in ('presentiel','distanciel'));

commit;
