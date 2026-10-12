-- ─────────────────────────────────────────────────────────────────────────
-- B3 : règles hebdo IPMD Campus « cours du jour » 2026-2027.
-- Règles SOUPLES (alertes, pas interdictions). Versionnées (academic_year +
-- program_type). Cible modalité 80/20 calculée EN HEURES.
-- ─────────────────────────────────────────────────────────────────────────
begin;

create table if not exists public.campus_schedule_rules (
  academic_year text not null,
  program_type  text not null,
  rules jsonb not null,
  updated_at timestamptz default now(),
  primary key (academic_year, program_type)
);

alter table public.campus_schedule_rules enable row level security;
drop policy if exists "read rules" on public.campus_schedule_rules;
create policy "read rules" on public.campus_schedule_rules for select using (true);
drop policy if exists "staff manage rules" on public.campus_schedule_rules;
create policy "staff manage rules" on public.campus_schedule_rules for all
  using ((current_user_role())::text = any (array['admin','super_admin','pedagogie']))
  with check ((current_user_role())::text = any (array['admin','super_admin','pedagogie']));

insert into public.campus_schedule_rules(academic_year, program_type, rules) values
('2026-2027','campus_jour', $json${
  "soft_rules": true,
  "pause": ["12:00","13:00"],
  "session_durations_hours": [2,3],
  "modality_target": {"presentiel": 0.8, "distanciel": 0.2, "basis": "hours"},
  "days": {
    "1": {"label":"Lundi","allowed_types":["devoir_surveille","controle_continu","rattrapage"],"blocks":[]},
    "2": {"label":"Mardi","allowed_types":["cours","td","tp"],"blocks":[["09:00","12:00"],["13:00","16:00"]]},
    "3": {"label":"Mercredi","allowed_types":["cours","td","tp"],"blocks":[["09:00","12:00"],["13:00","16:00"]]},
    "4": {"label":"Jeudi","allowed_types":["cours","td","tp"],"blocks":[["09:00","12:00"],["13:00","16:00"]]},
    "5": {"label":"Vendredi","allowed_types":["atelier","hackathon","journee_ipmd","projet","recherche_terrain","rattrapage","presentation"],"blocks":[]},
    "6": {"label":"Samedi","allowed_types":[],"blocks":[]},
    "7": {"label":"Dimanche","allowed_types":[],"blocks":[]}
  }
}$json$::jsonb)
on conflict (academic_year, program_type) do update set rules = excluded.rules, updated_at = now();

commit;
