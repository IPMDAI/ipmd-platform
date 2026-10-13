"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/**
 * Correction exceptionnelle d'une note par le Directeur des Études (Cas B).
 * Passe par la RPC atomique `directeur_etudes_update_grade` : motif obligatoire,
 * ancienne→nouvelle valeur + enseignant propriétaire tracés dans `audit_log`
 * DANS LA MÊME TRANSACTION (si le log échoue, la note n'est pas modifiée).
 */
export async function correctGrade(
  gradeId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non connecté." };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "directeur_etudes") {
    return { ok: false, message: "Réservé au Directeur des Études." };
  }

  const score = Number(formData.get("score"));
  const reason = String(formData.get("reason") || "").trim();
  if (!reason) return { ok: false, message: "Motif obligatoire." };
  if (!Number.isFinite(score) || score < 0) {
    return { ok: false, message: "Note invalide." };
  }

  const { error } = await supabase.rpc("directeur_etudes_update_grade", {
    p_grade_id: gradeId,
    p_new_score: score,
    p_reason: reason,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("reason_required")) return { ok: false, message: "Motif obligatoire." };
    if (m.includes("grade_not_found")) return { ok: false, message: "Note introuvable." };
    if (m.includes("score_invalid")) return { ok: false, message: "Note hors barème." };
    if (m.includes("forbidden")) return { ok: false, message: "Action non autorisée." };
    return { ok: false, message: m };
  }

  revalidatePath("/espace/correction-notes");
  return { ok: true, message: "Note corrigée et tracée dans le journal d'audit." };
}
