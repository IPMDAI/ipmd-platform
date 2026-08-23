/**
 * Preuve de paiement (W2) — constantes + validateur PURS (aucun "use server",
 * aucun accès DB) → réutilisables client (formulaire) ET serveur (action) et
 * testables isolément.
 */

/** Moyens de paiement proposés au CANDIDAT (Espèces exclu → encaissement admin). */
export const PROOF_METHODS = [
  "Wave",
  "Orange Money",
  "Versement AFG Bank",
  "Virement AFG Bank",
] as const;

export const PROOF_BUCKET = "candidature-docs";
export const MAX_PROOF_BYTES = 8 * 1024 * 1024; // 8 Mo

/** MIME autorisés → extension normalisée (déduite du contenu, jamais du nom). */
export const ALLOWED_PROOF_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** `accept` pour l'input fichier candidat. */
export const PROOF_ACCEPT = ".pdf,.jpg,.jpeg,.png";

/**
 * Valide un justificatif : MIME déclaré autorisé ET magic-bytes cohérents
 * (aucune confiance dans le nom/type envoyé), taille OK. Renvoie l'extension à
 * utiliser (déduite du CONTENU), ou une erreur.
 */
export function validateProofFile(
  declaredMime: string,
  size: number,
  head: number[]
): { ok: true; ext: string } | { ok: false; reason: string } {
  const ext = ALLOWED_PROOF_MIME[declaredMime];
  if (!ext) return { ok: false, reason: "Format non accepté (PDF, JPG ou PNG uniquement)." };
  if (!(size > 0)) return { ok: false, reason: "Fichier vide." };
  if (size > MAX_PROOF_BYTES) return { ok: false, reason: "Fichier trop volumineux (max 8 Mo)." };
  const b = head;
  const isPdf = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
  const isJpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff; // JPEG
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47; // PNG
  const magicOk =
    (ext === "pdf" && isPdf) || (ext === "jpg" && isJpg) || (ext === "png" && isPng);
  if (!magicOk) {
    return { ok: false, reason: "Le contenu du fichier ne correspond pas à un PDF/JPG/PNG valide." };
  }
  return { ok: true, ext };
}
