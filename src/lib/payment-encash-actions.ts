"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import type { FormResult } from "@/types";

/**
 * ENCAISSEMENT (W4) d'une preuve de paiement VALIDÉE (pré-inscription).
 *
 * Transforme une `payment_proofs.status='valide'` (avec `payment_id IS NULL`) en
 * `payments` réel via la RPC atomique `encash_payment_proof` :
 *  - montant RÉELLEMENT reçu (> 0), méthode, référence, date réelle ;
 *  - `candidature_id` dérivé EXCLUSIVEMENT de la preuve (jamais du client) ;
 *  - `student_id=NULL`, `kind='inscription'`, `status='paye'`, `recorded_by=auth.uid()` ;
 *  - liaison atomique `payment_proofs.payment_id` (idempotent, anti double-clic).
 *
 * ⚠️ N'écrit QUE `payments` + `payment_proofs.payment_id`. Ne touche NI
 * `student_finance`, NI `access_state`, NI `payment_schedules`, NI le statut de
 * la candidature, NI Auth. Aucun email. Le reçu est disponible ensuite à
 * `/espace/recu/{paymentId}`. Réservé `super_admin` + `admin` (garde RPC alignée).
 */
function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(raw: string): number {
  return Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
}

export async function encashPaymentProof(
  proofId: string,
  _prev: (FormResult & { paymentId?: string }) | null,
  formData: FormData
): Promise<FormResult & { paymentId?: string }> {
  const ctx = await requireAdmin();

  const amount = num(str(formData, "amount"));
  if (Number.isNaN(amount) || amount <= 0) {
    return { ok: false, message: "Montant réellement reçu invalide (doit être > 0)." };
  }
  const method = str(formData, "method");
  if (!method) return { ok: false, message: "Méthode de paiement requise." };
  const reference = str(formData, "reference") || null;
  const paidAt = str(formData, "paid_at") || null; // défaut côté RPC = current_date

  // Appel via le CLIENT UTILISATEUR (requireAdmin) — jamais service-role — pour que
  // auth.uid() (recorded_by) et current_user_role() (garde) soient peuplés.
  const { data, error } = await ctx.supabase.rpc("encash_payment_proof", {
    p_proof_id: proofId,
    p_amount: amount,
    p_method: method,
    p_reference: reference,
    p_paid_at: paidAt,
  });

  if (error) {
    const m = error.message || "";
    const friendly = m.includes("DEJA_ENCAISSEE")
      ? "Cette preuve a déjà été encaissée."
      : m.includes("PREUVE_NON_VALIDE")
        ? "La preuve doit d'abord être validée avant encaissement."
        : m.includes("MONTANT_INVALIDE")
          ? "Montant réellement reçu invalide."
          : m.includes("KIND_NON_SUPPORTE")
            ? "Type non pris en charge (frais d'inscription uniquement en v1)."
            : m.includes("PREUVE_INTROUVABLE")
              ? "Preuve introuvable. Rechargez la liste."
              : m.includes("NON_AUTORISE")
                ? "Action réservée à l'administration."
                : `Échec de l'encaissement : ${m}`;
    return { ok: false, message: friendly };
  }

  revalidatePath("/espace/finance/preuves");
  revalidatePath("/espace/finance");
  revalidatePath("/espace/finance/paiements");
  return {
    ok: true,
    message: "Encaissement enregistré. Le reçu est disponible.",
    paymentId: (data as string) ?? undefined,
  };
}
