-- P2 — Accès parent à la classe de son enfant.
-- Les autres tables enfant (payments, payment_schedules, student_finance, grades,
-- timetable_slots, course_sessions, attendance…) ont déjà une policy parent.
-- Seule `class_members` manquait : sans elle, le parent ne peut pas découvrir la
-- classe de l'enfant (donc ni classe/filière/niveau, ni emploi du temps).
-- SELECT uniquement, via le helper is_parent_of (parent_links + auth.uid()).
drop policy if exists "Parents read children class" on public.class_members;
create policy "Parents read children class" on public.class_members
  for select using (public.is_parent_of(student_id));
