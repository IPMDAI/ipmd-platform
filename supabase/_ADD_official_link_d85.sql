-- ============================================================================
-- D8-5 : LIAISON au système officiel existant  (DÉ pédagogique -> AG juridique)
-- ----------------------------------------------------------------------------
-- (1) Signature RÉELLE de la convention par l'AG : a_signer -> signee, atomique,
--     auditée, impossible deux fois / si annulée, liée à la VERSION EXACTE du
--     fichier signé (submission immuable), copie rattachée.
-- (2) « Validation pédagogique de soutenance acquise » exposée comme PRÉREQUIS
--     vérifiable pour l'AG — AUCUN diplôme auto, AUCUNE règle de diplomation.
-- Réutilise : internship_conventions (D8-1), defense_results (D8-4),
--             student_documents + student_document_submissions (dépôt),
--             document_grants (délivrance AG), official-assets, audit_row().
-- Le DÉ ne signe JAMAIS juridiquement. Déposeur du PDF ≠ signataire (audit).
-- ============================================================================


-- 0) Autorité de signature institutionnelle (AJUSTEMENT 4)
--    Réutilise le seul mécanisme institutionnel RÉEL en base : rôle AG/super.
--    Aucune notion de délégation parallèle inventée : la délégation de
--    signatories.ts ne concerne QUE l'image de signature des documents
--    académiques, pas une autorité de compte. scolarite/pedagogie/staff ne
--    suffisent JAMAIS à signer juridiquement une convention.
create or replace function public.has_official_signature_authority()
returns boolean
language sql stable security definer set search_path to 'public'
as $$ select public.current_user_role() = any (array['admin','super_admin']::user_role[]) $$;


-- ============================================================================
-- (1) SIGNATURE DE LA CONVENTION DE STAGE
-- ============================================================================

-- 1.a  Type de dépôt dédié (le scan signé vit dans le système documentaire).
insert into public.document_types (doc_key, label, sort_order, max_files)
values ('convention_stage', 'Convention de stage signée', 23, 3)
on conflict (doc_key) do nothing;

-- 1.b  AJUSTEMENT 1 : pointer le FICHIER EXACT signé, pas seulement le dossier.
--      signed_document_id  = dossier documentaire (student_documents)
--      signed_submission_id = version EXACTE et immuable (submission) RESTRICT
alter table public.internship_conventions
  add column if not exists signed_submission_id uuid;

alter table public.internship_conventions
  drop constraint if exists internship_conventions_signed_document_fk;
alter table public.internship_conventions
  add constraint internship_conventions_signed_document_fk
  foreign key (signed_document_id)
  references public.student_documents(id) on delete restrict;

alter table public.internship_conventions
  drop constraint if exists internship_conventions_signed_submission_fk;
alter table public.internship_conventions
  add constraint internship_conventions_signed_submission_fk
  foreign key (signed_submission_id)
  references public.student_document_submissions(id) on delete restrict;

-- 1.c  Invariant : une convention 'signee' DOIT porter dossier + fichier exact
--      + signataire + date.
alter table public.internship_conventions
  drop constraint if exists internship_conventions_signee_complete_chk;
alter table public.internship_conventions
  add constraint internship_conventions_signee_complete_chk check (
    status <> 'signee'
    or (signed_document_id is not null
        and signed_submission_id is not null
        and signed_at is not null
        and signed_by is not null)
  );

-- 1.d  Guard : protéger AUSSI signed_submission_id (sinon UPDATE direct possible).
create or replace function public.guard_internship_convention()
returns trigger language plpgsql set search_path to 'public'
as $function$
declare v_priv boolean;
begin
  if tg_op = 'UPDATE' then
    if (new.status is distinct from old.status
        or new.signed_at is distinct from old.signed_at
        or new.signed_by is distinct from old.signed_by
        or new.signed_document_id is distinct from old.signed_document_id
        or new.signed_submission_id is distinct from old.signed_submission_id
        or new.version is distinct from old.version
        or new.internship_id is distinct from old.internship_id)
    then
      select coalesce(bool_or(rolsuper or rolbypassrls), false) into v_priv
      from pg_roles where rolname = current_user;
      if current_setting('app.internship_tx', true) is distinct from txid_current()::text
         or not v_priv then
        raise exception 'statut/signature de la convention : uniquement via les RPC dédiées';
      end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $function$;

-- 1.e  RPC de signature — SEUL chemin a_signer -> signee.
create or replace function public.convention_sign(
  p_convention        uuid,
  p_signed_document   uuid,   -- dossier documentaire (student_documents)
  p_signed_submission uuid,   -- fichier EXACT signé (student_document_submissions)
  p_reason            text default null
) returns uuid
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_student uuid;
  v_doc_student uuid;
  v_doc_key text;
  v_sub_doc uuid;
  v_n int;
begin
  -- AJUSTEMENT 4 : AG only.
  if not public.has_official_signature_authority() then
    raise exception 'convention : signature réservée à l''Administrateur Général';
  end if;
  if p_signed_document is null or p_signed_submission is null then
    raise exception 'convention : dossier ET fichier signé obligatoires';
  end if;

  -- Verrou + état attendu : SEULEMENT 'a_signer'
  -- (en_preparation = non soumise ; signee = déjà signée ; annulee = interdit).
  select i.student_id into v_student
  from public.internship_conventions c
  join public.internships i on i.id = c.internship_id
  where c.id = p_convention and c.status = 'a_signer'
  for update of c;
  if not found then
    raise exception 'convention : introuvable, déjà signée, annulée ou non soumise à signature';
  end if;

  -- Cohérence dossier : bon étudiant + bon type.
  select sd.student_id, sd.doc_key into v_doc_student, v_doc_key
  from public.student_documents sd where sd.id = p_signed_document;
  if not found then
    raise exception 'convention : dossier documentaire introuvable';
  end if;
  if v_doc_student is distinct from v_student then
    raise exception 'convention : le dossier n''appartient pas à cet étudiant';
  end if;
  if v_doc_key <> 'convention_stage' then
    raise exception 'convention : dossier de type convention_stage requis';
  end if;

  -- AJUSTEMENT 1 : la submission appartient BIEN à ce dossier (version exacte).
  select s.student_document_id into v_sub_doc
  from public.student_document_submissions s where s.id = p_signed_submission;
  if not found then
    raise exception 'convention : fichier signé introuvable';
  end if;
  if v_sub_doc is distinct from p_signed_document then
    raise exception 'convention : le fichier signé n''appartient pas à ce dossier';
  end if;

  perform set_config('app.internship_tx', txid_current()::text, true);
  perform set_config('app.audit_reason',
    coalesce(nullif(p_reason,''), 'Signature de la convention de stage'), true);

  update public.internship_conventions
     set status = 'signee',
         signed_at = now(),
         signed_by = auth.uid(),
         signed_document_id = p_signed_document,
         signed_submission_id = p_signed_submission
   where id = p_convention and status = 'a_signer';
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'convention : signature concurrente détectée';
  end if;

  return p_convention;
end $$;
revoke all on function public.convention_sign(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.convention_sign(uuid,uuid,uuid,text) to authenticated;


-- 1.f  AJUSTEMENT 2 : l'étudiant/parent ne voit la convention comme OFFICIELLE
--      qu'une fois signee + submission figée. Policies RESTRICTIVES : staff/DÉ
--      exemptés (workflow) ; les autres docs restent inchangés.
--      Helpers SECURITY DEFINER : l'étudiant n'a AUCUNE policy sur
--      internship_conventions, donc un EXISTS inline y serait bloqué par RLS ;
--      la fonction definer contourne cela SANS exposer la table.
create or replace function public.is_signed_convention_document(p_doc uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$ select exists (select 1 from public.internship_conventions c
        where c.signed_document_id = p_doc and c.status = 'signee') $$;

create or replace function public.is_signed_convention_submission(p_sub uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$ select exists (select 1 from public.internship_conventions c
        where c.signed_submission_id = p_sub and c.status = 'signee') $$;

grant execute on function public.is_signed_convention_document(uuid) to authenticated;
grant execute on function public.is_signed_convention_submission(uuid) to authenticated;

drop policy if exists "conv stage dossier hidden until signed" on public.student_documents;
create policy "conv stage dossier hidden until signed" on public.student_documents
  as restrictive for select to authenticated
  using (
    doc_key <> 'convention_stage'
    or public.current_user_role() = any (array['admin','super_admin','scolarite','pedagogie','directeur_etudes']::user_role[])
    or public.is_signed_convention_document(id)
  );

drop policy if exists "conv stage file hidden until signed" on public.student_document_submissions;
create policy "conv stage file hidden until signed" on public.student_document_submissions
  as restrictive for select to authenticated
  using (
    public.current_user_role() = any (array['admin','super_admin','scolarite','pedagogie','directeur_etudes']::user_role[])
    or not exists (select 1 from public.student_documents d
                   where d.id = student_document_submissions.student_document_id
                     and d.doc_key = 'convention_stage')
    -- seule la version EXACTE signée devient visible (et seulement une fois signee)
    or public.is_signed_convention_submission(id)
  );


-- ============================================================================
-- (2) PRÉREQUIS PÉDAGOGIQUE VÉRIFIABLE (lecture seule) — PAS d'auto-diplôme
-- ============================================================================
create or replace function public.student_defense_pedagogical_status(p_student uuid)
returns table (
  defense_id uuid, work_title text, attempt int, final_score numeric,
  mention text, jury_decision text, validated_by uuid, validated_at timestamptz
)
language sql stable security definer set search_path to 'public'
as $$
  select d.id, d.work_title, d.attempt, r.final_score, r.mention,
         r.jury_decision, r.validated_by, r.validated_at
  from public.defenses d
  join public.defense_results r on r.defense_id = d.id
  where d.student_id = p_student
    and r.result_status = 'valide'
    and public.current_user_role() = any (array['admin','super_admin','scolarite','pedagogie','directeur_etudes']::user_role[])
  order by d.attempt desc
$$;
revoke all on function public.student_defense_pedagogical_status(uuid) from public, anon;
grant execute on function public.student_defense_pedagogical_status(uuid) to authenticated;

create or replace function public.student_has_validated_defense(p_student uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from public.defenses d
    join public.defense_results r on r.defense_id = d.id
    where d.student_id = p_student and r.result_status = 'valide'
  ) and public.current_user_role() = any (array['admin','super_admin','scolarite','pedagogie','directeur_etudes']::user_role[])
$$;
revoke all on function public.student_has_validated_defense(uuid) from public, anon;
grant execute on function public.student_has_validated_defense(uuid) to authenticated;


-- ============================================================================
-- (3) AJUSTEMENT 3 : la DÉCISION INSTITUTIONNELLE (document_grants) auditée.
--     Même écrivain unique (audit_row) : 1 mutation = 1 trace immuable.
--     Couvre activation (INSERT/UPDATE active=true), désactivation (active=false)
--     et changement de signataire (UPDATE). Aucun second journal.
-- ============================================================================
drop trigger if exists trg_audit_document_grants on public.document_grants;
create trigger trg_audit_document_grants
  after insert or update on public.document_grants
  for each row execute function public.audit_row();


-- ============================================================================
-- HORS PÉRIMÈTRE (volontaire) : aucune table diplôme, aucun générateur de
-- diplôme, aucune règle de diplomation automatique, aucune auto-activation
-- d'attestation-reussite. L'AG garde toute la décision via document_grants.
-- ============================================================================
