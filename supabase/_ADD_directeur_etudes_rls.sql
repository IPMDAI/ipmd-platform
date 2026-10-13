-- D2 — Permissions/RLS académiques du Directeur des Études.
-- ADDITIF : policies SÉPARÉES pour `directeur_etudes` (permissives, OR avec
-- l'existant). On NE touche PAS aux policies admin/pedagogie/scolarite.
-- SELECT + INSERT + UPDATE uniquement : PAS de DELETE (aucune suppression
-- définitive sensible → annulation/archivage via UPDATE).
-- Finance / paie / tarifs / RH / comptes / rôles / sécurité : NON touchés.

-- 1) Ensemble « gestion académique » (create + update + read).
do $$
declare t text;
  tables text[] := array[
    'classes','filieres','modules','academic_years','intakes',
    'academic_calendar','rooms','timetable_slots','course_sessions',
    'session_reports','session_attendance','convocations',
    'student_documents','announcements','class_announcements'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', 'DE read '||t, t);
    execute format(
      'create policy %I on public.%I for select using (public.current_user_role() = ''directeur_etudes''::public.user_role)',
      'DE read '||t, t);

    execute format('drop policy if exists %I on public.%I', 'DE insert '||t, t);
    execute format(
      'create policy %I on public.%I for insert with check (public.current_user_role() = ''directeur_etudes''::public.user_role)',
      'DE insert '||t, t);

    execute format('drop policy if exists %I on public.%I', 'DE update '||t, t);
    execute format(
      'create policy %I on public.%I for update using (public.current_user_role() = ''directeur_etudes''::public.user_role) with check (public.current_user_role() = ''directeur_etudes''::public.user_role)',
      'DE update '||t, t);
  end loop;
end $$;

-- 2) student_document_submissions : REVUE seulement (pas d'INSERT = pas de
--    téléversement par le DÉ). Lecture + mise à jour des champs de revue.
drop policy if exists "DE read student_document_submissions" on public.student_document_submissions;
create policy "DE read student_document_submissions" on public.student_document_submissions
  for select using (public.current_user_role() = 'directeur_etudes'::public.user_role);

drop policy if exists "DE review student_document_submissions" on public.student_document_submissions;
create policy "DE review student_document_submissions" on public.student_document_submissions
  for update using (public.current_user_role() = 'directeur_etudes'::public.user_role)
  with check (public.current_user_role() = 'directeur_etudes'::public.user_role);

-- 3) Immutabilité P3b (défense en profondeur, s'applique à TOUS) : sur UPDATE,
--    interdire toute modification des colonnes de version/historique. Seuls les
--    champs de revue (status/reviewed_by/reviewed_at/review_note) peuvent changer.
create or replace function public.guard_submission_immutable()
returns trigger
language plpgsql
as $$
begin
  if NEW.path is distinct from OLD.path
     or NEW.uploaded_by is distinct from OLD.uploaded_by
     or NEW.uploaded_at is distinct from OLD.uploaded_at
     or NEW.original_name is distinct from OLD.original_name
     or NEW.student_document_id is distinct from OLD.student_document_id then
    raise exception 'student_document_submissions: version immuable (seuls les champs de revue sont modifiables)';
  end if;
  return NEW;
end $$;

drop trigger if exists guard_submission_immutable on public.student_document_submissions;
create trigger guard_submission_immutable
  before update on public.student_document_submissions
  for each row execute function public.guard_submission_immutable();
