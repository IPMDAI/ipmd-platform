"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REGLEMENT_VERSION } from "@/data/reglement";
import { AVENANT_VERSION, REENROLL_YEAR } from "@/lib/student-reenrollment";
import type { FormResult } from "@/types";

/**
 * Phase B — l'étudiant CONFIRME sa réinscription : accepte le règlement +
 * l'avenant. Passe `reenrollments.status` de 'prepared' à 'student_confirmed'.
 *
 * ⚠️ AUCUNE validation finale, AUCUNE bascule de classe/finance ici (réservées à
 * `validate_reenrollment`, côté admin). L'intégrité (propriété de la ligne par
 * l'étudiant, statut 'prepared' requis, enregistrement du consentement règlement)
 * est assurée par la RPC transactionnelle `confirm_reenrollment` (SECURITY DEFINER).
 */
export async function confirmMyReenrollment(): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible. Réessayez plus tard." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée — reconnectez-vous." };

  const { error } = await supabase.rpc("confirm_reenrollment", {
    p_academic_year: REENROLL_YEAR,
    p_reglement_version: REGLEMENT_VERSION,
    p_avenant_version: AVENANT_VERSION,
  });
  if (error) {
    const m = error.message;
    if (/AUCUNE_REINSCRIPTION/.test(m)) return { ok: false, message: "Aucune réinscription à confirmer." };
    if (/DEJA_TRAITEE/.test(m)) return { ok: false, message: "Votre réinscription a déjà été confirmée." };
    if (/NON_AUTHENTIFIE/.test(m)) return { ok: false, message: "Session expirée — reconnectez-vous." };
    return { ok: false, message: m };
  }
  revalidatePath("/espace/ma-reinscription");
  revalidatePath("/espace");
  return { ok: true, message: "Réinscription confirmée. L'administration finalisera votre dossier." };
}
