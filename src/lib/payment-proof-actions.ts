"use server";

import crypto from "crypto";
import { verifyPackToken } from "@/lib/admission-pack-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROOF_METHODS, PROOF_BUCKET, validateProofFile } from "@/lib/payment-proof";
import type { FormResult } from "@/types";

/**
 * DÉPÔT D'UNE PREUVE DE PAIEMENT par le candidat (W2), token-gated, 100 % serveur.
 *
 * Ne crée QU'UNE ligne `payment_proofs` (status='a_verifier'). NE crée AUCUN
 * `payment`, NE modifie NI `student_finance`, NI `access_state`, NI
 * `payment_schedules`, NI le statut de la candidature. Une preuve ≠ paiement.
 *
 * Upload via service-role (le candidat n'écrit jamais dans le bucket) ; path
 * 100 % serveur `<candidature_id>/proofs/<uuid>.<ext>` ; nettoyage de l'orphelin
 * si l'insert DB échoue après un upload réussi.
 */
export async function submitPaymentProof(
  token: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const link = await verifyPackToken(token);
  if (!link) return { ok: false, message: "Lien invalide ou expiré." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service momentanément indisponible." };

  // Le token correspond réellement au pack → candidature.
  const { data: pack } = await admin
    .from("admission_packs")
    .select("id, candidature_id")
    .eq("id", link.packId)
    .maybeSingle();
  if (!pack?.candidature_id) return { ok: false, message: "Dossier introuvable." };
  const candidatureId = pack.candidature_id as string;

  // Garde : une seule preuve `a_verifier` active (kind inscription) — jamais d'écrasement.
  const { data: pending } = await admin
    .from("payment_proofs")
    .select("id")
    .eq("candidature_id", candidatureId)
    .eq("kind", "inscription")
    .eq("status", "a_verifier")
    .maybeSingle();
  if (pending) {
    return {
      ok: false,
      message: "Une preuve est déjà en cours de vérification. Attendez son traitement.",
    };
  }

  // Champs du formulaire.
  const method = String(formData.get("method") ?? "").trim();
  if (!(PROOF_METHODS as readonly string[]).includes(method)) {
    return { ok: false, message: "Moyen de paiement invalide." };
  }
  const amount = Number(String(formData.get("amount") ?? "").replace(/\s/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Montant déclaré invalide." };
  }
  const reference = String(formData.get("reference") ?? "").trim() || null;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Justificatif obligatoire (PDF, JPG ou PNG)." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const check = validateProofFile(file.type, buf.length, Array.from(buf.subarray(0, 8)));
  if (!check.ok) return { ok: false, message: check.reason };

  // Path 100 % serveur (uuid serveur, ext du contenu validé).
  const path = `${candidatureId}/proofs/${crypto.randomUUID()}.${check.ext}`;

  const { error: upErr } = await admin.storage
    .from(PROOF_BUCKET)
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (upErr) return { ok: false, message: "Échec du dépôt du fichier. Réessayez." };

  const { error: insErr } = await admin.from("payment_proofs").insert({
    candidature_id: candidatureId,
    pack_id: pack.id,
    kind: "inscription",
    method,
    amount_declared: amount,
    reference,
    file_path: path,
    status: "a_verifier",
  });
  if (insErr) {
    // Nettoyage de l'orphelin : fichier uploadé mais insert DB échoué.
    await admin.storage.from(PROOF_BUCKET).remove([path]);
    if (/duplicate key|unique/i.test(insErr.message)) {
      return { ok: false, message: "Une preuve est déjà en cours de vérification." };
    }
    return { ok: false, message: "Une erreur est survenue. Réessayez." };
  }

  return {
    ok: true,
    message:
      "Preuve reçue — en cours de vérification par la scolarité. L'envoi d'un justificatif ne signifie pas que le paiement est encore validé.",
  };
}
