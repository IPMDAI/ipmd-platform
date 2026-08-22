"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Préparation EN LOT des réinscriptions (admin/scolarité).
 *
 * Appelle la RPC transactionnelle `prepare_reenrollments` avec UNIQUEMENT les
 * étudiants sélectionnés. La RPC ne crée des lignes `reenrollments` (status
 * 'prepared') que pour les éligibles, ne touche NI `class_members` NI
 * `student_finance`, et renvoie un rapport détaillé. Cette action ne fait que
 * garder l'accès + transmettre.
 */

export type PrepareCounters = {
  created: number;
  already_prepared: number;
  end_of_cycle: number;
  missing_filiere: number;
  missing_target_class: number;
  special_case: number;
  errors: number;
};

export type PrepareDetail = {
  student_id: string;
  outcome: string;
  to_class_id: string | null;
  to_level: string | null;
  message: string | null;
};

export type PrepareReport = {
  academic_year: string;
  source_year: string;
  counters: PrepareCounters;
  details: PrepareDetail[];
};

export type PrepareResult = { ok: true; report: PrepareReport } | { ok: false; message: string };

const ALLOWED = ["super_admin", "admin", "scolarite"];

export async function prepareReenrollments(
  studentIds: string[],
  academicYear: string,
): Promise<PrepareResult> {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return { ok: false, message: "Aucun étudiant sélectionné." };
  }
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible. Réessayez plus tard." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée — reconnectez-vous." };

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !ALLOWED.includes(me.role as string)) {
    return { ok: false, message: "Action réservée à l'administration / scolarité." };
  }

  const { data, error } = await supabase.rpc("prepare_reenrollments", {
    p_student_ids: studentIds,
    p_academic_year: academicYear,
  });
  if (error) {
    const msg = /NON_AUTORISE/.test(error.message)
      ? "Action réservée à l'administration / scolarité."
      : error.message;
    return { ok: false, message: msg };
  }
  revalidatePath("/espace/reinscriptions");
  return { ok: true, report: data as PrepareReport };
}
