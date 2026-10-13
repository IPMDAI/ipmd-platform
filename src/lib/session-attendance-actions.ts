"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifySensitive } from "@/lib/sensitive-notify";
import type { FormResult } from "@/types";

/** Enregistre l'appel (présence par étudiant) d'une séance datée. */
export async function setSessionAttendance(
  sessionId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const { data: session } = await supabase
    .from("course_sessions")
    .select("class_id, teacher_id")
    .eq("id", sessionId)
    .single();
  if (!session) return { ok: false, message: "Séance introuvable." };

  const { data: members } = await supabase
    .from("class_members")
    .select("student_id")
    .eq("class_id", session.class_id);
  const studentIds = (members ?? []).map((m) => m.student_id);
  if (studentIds.length === 0) {
    return { ok: false, message: "Aucun étudiant dans cette classe." };
  }

  // État précédent (pour ne notifier que les NOUVELLES absences, pas à chaque save).
  const { data: prior } = await supabase
    .from("session_attendance")
    .select("student_id, present")
    .eq("session_id", sessionId);
  const priorPresent = new Map<string, boolean>();
  for (const p of prior ?? []) priorPresent.set(p.student_id, p.present);

  // « p_<id> » coché = présent.
  const rows = studentIds.map((sid) => ({
    session_id: sessionId,
    student_id: sid,
    present: formData.get(`p_${sid}`) === "on",
  }));
  const { error } = await supabase
    .from("session_attendance")
    .upsert(rows, { onConflict: "session_id,student_id" });
  if (error) return { ok: false, message: error.message };

  // Notifie (sans donnée en clair) les parents des étudiants NOUVELLEMENT absents.
  const newlyAbsent = rows.filter(
    (r) => !r.present && priorPresent.get(r.student_id) !== false
  );
  if (newlyAbsent.length > 0) {
    await Promise.allSettled(
      newlyAbsent.map((r) => notifySensitive(r.student_id, "absence"))
    );
  }

  // Reporte les compteurs sur la fiche pédagogique.
  const present = rows.filter((r) => r.present).length;
  await supabase.from("session_reports").upsert(
    {
      session_id: sessionId,
      teacher_id: session.teacher_id,
      present_count: present,
      absent_count: rows.length - present,
    },
    { onConflict: "session_id" }
  );

  revalidatePath(`/espace/seance/${sessionId}`);
  revalidatePath("/espace/mes-seances");
  return {
    ok: true,
    message: `Appel enregistré : ${present} présent(s), ${rows.length - present} absent(s).`,
  };
}
