-- ──────────────────────────────────────────────────────────────
-- IPMD — Le parent peut lire les séances datées de la classe de son enfant
-- (pour afficher le suivi des présences côté parent).
-- À exécuter dans Supabase > SQL Editor APRÈS course-sessions.sql + session-attendance.sql.
-- 1 seule policy. Idempotent.
-- ──────────────────────────────────────────────────────────────

drop policy if exists "Parent reads child sessions" on public.course_sessions;
create policy "Parent reads child sessions" on public.course_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.class_members m
      where m.class_id = course_sessions.class_id
        and public.is_parent_of(m.student_id)
    )
  );
