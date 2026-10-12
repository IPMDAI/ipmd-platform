-- ─────────────────────────────────────────────────────────────────────────
-- Sécurité : la lecture de l'emploi du temps (timetable_slots) était OUVERTE
-- (USING true). On la scope désormais comme course_sessions : un étudiant ne
-- lit QUE le planning de sa classe (+ enseignant/parent/staff). Aucune donnée
-- touchée (0 créneau en base). Écriture admin inchangée.
-- ─────────────────────────────────────────────────────────────────────────
begin;

drop policy if exists "Read timetable" on public.timetable_slots;
create policy "Read timetable" on public.timetable_slots for select using (
  in_class(class_id)
  or teacher_id = auth.uid()
  or teaches_class(class_id)
  or (current_user_role())::text = any (array['admin','super_admin','pedagogie','scolarite'])
);

drop policy if exists "Parent reads class timetable" on public.timetable_slots;
create policy "Parent reads class timetable" on public.timetable_slots for select using (
  exists (
    select 1 from public.class_members m
    where m.class_id = timetable_slots.class_id and is_parent_of(m.student_id)
  )
);

commit;
