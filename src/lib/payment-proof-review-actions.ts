"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROOF_BUCKET } from "@/lib/payment-proof";
import type { FormResult } from "@/types";

/**
 * REVIEW d'une preuve de paiement (W3) par un admin/super_admin.
 *
 * ⚠️ W3 ne crée AUCUN `payment` et ne modifie NI `student_finance`, NI
 * `access_state`, NI `payment_schedules`, NI le statut de la candidature (→ W4).
 * Ne modifie QUE `payment_proofs` (status + reviewed_by/at + note). Aucun email.
 *
 * Invariants :
 *  - n'agit que sur une preuve actuellement `a_verifier` (mise à jour
 *    conditionnelle atomique → pas de double review) ;
 *  - rejet SANS motif refusé ;
 *  - `valide` = preuve contrôlée conforme (pas d'encaissement).
 */
export async function reviewPaymentProof(
  proofId: string,
  decision: "valide" | "rejete",
  note?: string
): Promise<FormResult> {
  const ctx = await requireAdmin();
  if (decision !== "valide" && decision !== "rejete") {
    return { ok: false, message: "Décision invalide." };
  }
  const cleanNote = (note ?? "").trim();
  if (decision === "rejete" && !cleanNote) {
    return { ok: false, message: "Un motif est obligatoire pour rejeter une preuve." };
  }

  // Mise à jour CONDITIONNELLE : uniquement si encore `a_verifier` → empêche une
  // 2e review et toute course. Aucune autre table touchée.
  const { data, error } = await ctx.supabase
    .from("payment_proofs")
    .update({
      status: decision,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      review_note: cleanNote || null,
    })
    .eq("id", proofId)
    .eq("status", "a_verifier")
    .select("id, candidature_id");

  if (error) return { ok: false, message: `Échec de l'enregistrement : ${error.message}` };
  if (!data || data.length === 0) {
    return {
      ok: false,
      message: "Preuve introuvable ou déjà traitée (validée/rejetée). Rechargez la liste.",
    };
  }

  revalidatePath("/espace/finance/preuves");
  revalidatePath("/espace/finance");
  revalidatePath("/espace/candidatures");
  return {
    ok: true,
    message: decision === "valide" ? "Preuve validée (contrôlée conforme)." : "Preuve rejetée.",
  };
}

/**
 * URL SIGNÉE (5 min) du justificatif privé, pour consultation admin uniquement.
 * Lecture seule — aucun changement d'état. Bucket privé → service-role.
 */
export async function getProofFileUrl(proofId: string): Promise<FormResult & { url?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service momentanément indisponible." };

  const { data: proof } = await admin
    .from("payment_proofs")
    .select("file_path")
    .eq("id", proofId)
    .maybeSingle();
  if (!proof?.file_path) return { ok: false, message: "Aucun justificatif attaché." };

  const { data, error } = await admin.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(proof.file_path as string, 300); // 5 minutes
  if (error || !data?.signedUrl) {
    return { ok: false, message: "Impossible d'ouvrir le justificatif. Réessayez." };
  }
  return { ok: true, message: "OK", url: data.signedUrl };
}
