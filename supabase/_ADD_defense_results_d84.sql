-- =============================================================================
-- D8-4 — Résultat de soutenance (v2 — 5 ajustements)   DRY-RUN appliqué après GO
-- =============================================================================
-- Le DÉ ENREGISTRE/VALIDE le résultat du jury sans pouvoir inventer une décision
-- contradictoire : TOUS les membres actifs sont comptabilisés (note OU abstention)
-- avant délibération, et la note finale reste dans l'intervalle des NOTES du jury.
-- La DÉCISION (admis/admis_reserves/ajourne/refuse) est enregistrée SÉPARÉMENT —
-- AUCUN seuil automatique décision↔note (IPMD n'a pas fixé cette règle). La mention
-- est calculée depuis la note. grades/exams (course_id) ne reçoivent RIEN : la
-- soutenance est une section séparée du relevé, alimentée par defense_results validé.
-- Aucun DELETE métier ; mutations via RPC ; audit audit_row = 1/entité.
-- =============================================================================

-- 0) Mention à partir d'une note /20 (miroir de src/lib/grades.ts).
create or replace function public.defense_mention(p_score numeric)
returns text language sql immutable set search_path to 'public' as $$
  select case when p_score is null then null
              when p_score >= 16 then 'Très bien' when p_score >= 14 then 'Bien'
              when p_score >= 12 then 'Assez bien' when p_score >= 10 then 'Passable'
              else 'Insuffisant' end;
$$;

-- 1) ÉVALUATIONS DES MEMBRES DU JURY (note OU abstention explicite) ------------
-- jury_member_id = QUI a évalué (interne/externe) ; created_by = QUI a saisi dans
-- IPMD (ex. le DÉ qui recopie la fiche d'un expert externe). Jamais confondus.
create table if not exists public.jury_evaluations (
  id             uuid primary key default gen_random_uuid(),
  defense_id     uuid not null references public.defenses(id) on delete restrict,
  jury_member_id uuid not null references public.jury_members(id) on delete restrict,  -- évaluateur
  eval_status    text not null check (eval_status in ('note','abstention')),
  score          numeric(4,2) check (score is null or (score >= 0 and score <= 20)),
  comment        text,
  created_by     uuid references public.profiles(id) on delete set null,              -- saisisseur IPMD
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint jury_evaluations_uq unique (defense_id, jury_member_id),
  constraint jury_evaluations_kind_chk check (
    (eval_status='note' and score is not null) or (eval_status='abstention' and score is null))
);
create index if not exists jury_evaluations_defense_idx on public.jury_evaluations(defense_id);

-- 2) RÉSULTAT DE SOUTENANCE (1:1) — note/mention/décision/délibération/validation.
-- PAS de contrainte décision↔note (règle institutionnelle non fixée).
create table if not exists public.defense_results (
  id             uuid primary key default gen_random_uuid(),
  defense_id     uuid not null unique references public.defenses(id) on delete restrict,
  final_score    numeric(4,2) check (final_score is null or (final_score >= 0 and final_score <= 20)),
  mention        text,
  jury_decision  text check (jury_decision in ('admis','admis_reserves','ajourne','refuse')),
  deliberation   text,
  result_status  text not null default 'en_evaluation'
                 check (result_status in ('en_evaluation','delibere','valide')),
  deliberated_by uuid references public.profiles(id) on delete set null,
  deliberated_at timestamptz,
  validated_by   uuid references public.profiles(id) on delete set null,
  validated_at   timestamptz,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint defense_results_delib_chk check (result_status = 'en_evaluation'
    or (final_score is not null and jury_decision is not null and deliberation is not null and deliberated_at is not null)),
  constraint defense_results_valid_chk check (result_status <> 'valide' or validated_at is not null)
);

-- 3) AUDIT (unique écrivain) ---------------------------------------------------
drop trigger if exists trg_audit_jury_evaluations on public.jury_evaluations;
create trigger trg_audit_jury_evaluations after insert or update on public.jury_evaluations
  for each row execute function public.audit_row();
drop trigger if exists trg_audit_defense_results on public.defense_results;
create trigger trg_audit_defense_results after insert or update on public.defense_results
  for each row execute function public.audit_row();

-- 4) RLS : SELECT staff ; aucune écriture directe (tout via RPC) --------------
alter table public.jury_evaluations enable row level security;
alter table public.defense_results  enable row level security;
drop policy if exists "je staff read" on public.jury_evaluations;
create policy "je staff read" on public.jury_evaluations for select
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin'));
drop policy if exists "dr staff read" on public.defense_results;
create policy "dr staff read" on public.defense_results for select
  using (public.current_user_role() in ('directeur_etudes','admin','super_admin'));
revoke delete on public.jury_evaluations from anon, authenticated;
revoke delete on public.defense_results  from anon, authenticated;

-- 5) RPC ÉTUDIANT : résultat VALIDÉ de SA soutenance (jamais les notes membres).
create or replace function public.student_my_defense_result(p_defense uuid)
returns table(final_score numeric, mention text, jury_decision text)
language sql security definer set search_path to 'public' stable as $$
  select dr.final_score, dr.mention, dr.jury_decision
  from public.defense_results dr join public.defenses d on d.id = dr.defense_id
  where dr.defense_id = p_defense and dr.result_status = 'valide' and d.student_id = auth.uid();
$$;

-- Helper : nb de membres actifs du jury vs nb de membres comptabilisés.
create or replace function public.defense_jury_accounted(p_defense uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select (select count(*) from public.jury_members where defense_id=p_defense and removed_at is null)
       = (select count(*) from public.jury_evaluations je join public.jury_members jm on jm.id=je.jury_member_id
            where je.defense_id=p_defense and jm.removed_at is null)
     and exists (select 1 from public.jury_members where defense_id=p_defense and removed_at is null);
$$;

-- 6) ÉVALUATION D'UN MEMBRE : première saisie (jamais d'écrasement silencieux) --
create or replace function public.jury_evaluation_submit(p_defense uuid, p_member uuid, p_status text, p_score numeric, p_comment text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_status text; v_rstatus text; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if p_status not in ('note','abstention') then raise exception 'statut d''évaluation invalide'; end if;
  if p_status='note' and (p_score is null or p_score < 0 or p_score > 20) then raise exception 'note invalide (0..20)'; end if;
  if p_status='abstention' and p_score is not null then raise exception 'une abstention ne porte pas de note'; end if;
  select status into v_status from public.defenses where id = p_defense;
  if v_status is distinct from 'tenue' then raise exception 'la soutenance doit être tenue'; end if;
  if not exists (select 1 from public.jury_members where id=p_member and defense_id=p_defense and removed_at is null) then
    raise exception 'membre de jury actif introuvable pour cette soutenance'; end if;
  insert into public.defense_results(defense_id, created_by) values (p_defense, auth.uid()) on conflict (defense_id) do nothing;
  select result_status into v_rstatus from public.defense_results where defense_id=p_defense for update;
  if v_rstatus <> 'en_evaluation' then raise exception 'évaluations verrouillées (déjà délibéré/validé)'; end if;
  insert into public.jury_evaluations(defense_id, jury_member_id, eval_status, score, comment, created_by)
  values (p_defense, p_member, p_status, case when p_status='note' then p_score else null end, nullif(btrim(p_comment),''), auth.uid());
exception when unique_violation then
  raise exception 'ce membre a déjà une évaluation : utilisez la révision';
end $$;

-- Révision d'une évaluation existante : motif + ancienne valeur attendue + audit.
create or replace function public.jury_evaluation_revise(p_defense uuid, p_member uuid, p_status text, p_score numeric, p_expected_score numeric, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; v_rstatus text; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  if p_status not in ('note','abstention') then raise exception 'statut invalide'; end if;
  if p_status='note' and (p_score is null or p_score < 0 or p_score > 20) then raise exception 'note invalide (0..20)'; end if;
  if p_status='abstention' and p_score is not null then raise exception 'une abstention ne porte pas de note'; end if;
  select result_status into v_rstatus from public.defense_results where defense_id=p_defense;
  if v_rstatus is distinct from 'en_evaluation' then raise exception 'révision impossible (déjà délibéré/validé)'; end if;
  perform set_config('app.audit_reason', p_reason, true);
  update public.jury_evaluations
     set eval_status=p_status, score=case when p_status='note' then p_score else null end, updated_at=now()
   where defense_id=p_defense and jury_member_id=p_member and score is not distinct from p_expected_score;
  get diagnostics v = row_count; if not v then raise exception 'révision impossible (évaluation introuvable ou valeur modifiée entre-temps)'; end if;
end $$;

-- 7) DÉLIBÉRATION : tous les membres comptabilisés ; note finale dans l'intervalle
-- des NOTES du jury ; décision libre (pas de seuil) ; PV obligatoire.
create or replace function public.defense_record_result(p_defense uuid, p_score numeric, p_decision text, p_deliberation text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_min numeric; v_max numeric; v_notes int; v_status text; v_rstatus text; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if p_score is null or p_score < 0 or p_score > 20 then raise exception 'note finale invalide (0..20)'; end if;
  if p_decision not in ('admis','admis_reserves','ajourne','refuse') then raise exception 'décision invalide'; end if;
  if coalesce(btrim(p_deliberation),'') = '' then raise exception 'délibération / PV obligatoire'; end if;
  select status into v_status from public.defenses where id=p_defense;
  if v_status is distinct from 'tenue' then raise exception 'la soutenance doit être tenue'; end if;
  if not public.defense_jury_accounted(p_defense) then
    raise exception 'tous les membres actifs du jury doivent être comptabilisés (note ou abstention)'; end if;
  select count(*) filter (where eval_status='note'), min(score), max(score)
    into v_notes, v_min, v_max from public.jury_evaluations where defense_id=p_defense;
  if v_notes = 0 then raise exception 'au moins une note de membre est requise (pas uniquement des abstentions)'; end if;
  if p_score < v_min or p_score > v_max then
    raise exception 'note finale hors des notes du jury [%..%]', v_min, v_max; end if;
  select result_status into v_rstatus from public.defense_results where defense_id=p_defense for update;
  if v_rstatus is distinct from 'en_evaluation' then raise exception 'délibération impossible (déjà délibérée/validée)'; end if;
  update public.defense_results
     set final_score=p_score, mention=public.defense_mention(p_score), jury_decision=p_decision,
         deliberation=btrim(p_deliberation), result_status='delibere', deliberated_by=auth.uid(), deliberated_at=now()
   where defense_id=p_defense and result_status='en_evaluation';
end $$;

-- Révision de la délibération (avant validation) — motif + mêmes bornes.
create or replace function public.defense_revise_result(p_defense uuid, p_score numeric, p_decision text, p_deliberation text, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_min numeric; v_max numeric; v boolean; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'motif obligatoire'; end if;
  if p_score is null or p_score < 0 or p_score > 20 then raise exception 'note invalide'; end if;
  if p_decision not in ('admis','admis_reserves','ajourne','refuse') then raise exception 'décision invalide'; end if;
  if coalesce(btrim(p_deliberation),'') = '' then raise exception 'délibération / PV obligatoire'; end if;
  select min(score), max(score) into v_min, v_max from public.jury_evaluations where defense_id=p_defense and eval_status='note';
  if v_min is null or p_score < v_min or p_score > v_max then raise exception 'note hors des notes du jury'; end if;
  perform set_config('app.audit_reason', p_reason, true);
  update public.defense_results
     set final_score=p_score, mention=public.defense_mention(p_score), jury_decision=p_decision,
         deliberation=btrim(p_deliberation), deliberated_by=auth.uid(), deliberated_at=now()
   where defense_id=p_defense and result_status='delibere';
  get diagnostics v = row_count; if not v then raise exception 'révision impossible (statut)'; end if;
end $$;

-- 8) VALIDATION PÉDAGOGIQUE (DÉ) : fige TOTALEMENT le résultat ----------------
create or replace function public.defense_validate_result(p_defense uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v boolean; v_dstatus text; r public.defense_results; begin
  if public.current_user_role() not in ('directeur_etudes','admin','super_admin') then raise exception 'réservé au DÉ / Administration'; end if;
  select status into v_dstatus from public.defenses where id=p_defense;
  if v_dstatus is distinct from 'tenue' then raise exception 'la soutenance doit être tenue'; end if;
  if not public.defense_jury_accounted(p_defense) then raise exception 'tous les membres actifs doivent être comptabilisés'; end if;
  select * into r from public.defense_results where defense_id=p_defense for update;
  if not found or r.result_status <> 'delibere' then raise exception 'validation impossible (statut)'; end if;
  if r.final_score is null or r.jury_decision is null or coalesce(btrim(r.deliberation),'')='' then
    raise exception 'note finale, décision et PV requis avant validation'; end if;
  update public.defense_results set result_status='valide', validated_by=auth.uid(), validated_at=now()
   where defense_id=p_defense and result_status='delibere';
  get diagnostics v = row_count; if not v then raise exception 'validation impossible (concurrence)'; end if;
end $$;

do $$ declare f text; begin
  for f in select unnest(array[
    'student_my_defense_result(uuid)','jury_evaluation_submit(uuid,uuid,text,numeric,text)',
    'jury_evaluation_revise(uuid,uuid,text,numeric,numeric,text)',
    'defense_record_result(uuid,numeric,text,text)','defense_revise_result(uuid,numeric,text,text,text)',
    'defense_validate_result(uuid)'])
  loop
    execute 'revoke execute on function public.'||f||' from public, anon';
    execute 'grant execute on function public.'||f||' to authenticated';
  end loop;
end $$;
revoke execute on function public.defense_jury_accounted(uuid) from public, anon;
