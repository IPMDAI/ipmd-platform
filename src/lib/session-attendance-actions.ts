"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
