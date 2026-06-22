"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

async function getAdmin() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "super_admin") return null;
  return { supabase };
}

/** Valide les notes « en attente » d'un étudiant (toutes ou un semestre). */
export async function validateStudentGrades(
  studentId: string,
  semester: string
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  let query = ctx.supabase
    .from("grades")
    .update({ status: "valide" })
    .eq("student_id", studentId)
    .eq("status", "en_attente");
  if (semester) query = query.eq("semester", semester);

  const { error } = await query;
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/bulletin/${studentId}`);
  return { ok: true, message: "Notes validées. Le bulletin est officiel." };
}
