import "server-only";

/**
 * Adaptateur de signature électronique de la convention.
 *
 * ⚠️ Architecture PRÊTE pour un prestataire externe (Yousign, DocuSign…), mais
 * NON configurée pour l'instant. Le Lot C ne prétend PAS fournir une signature
 * juridiquement suffisante via « nom + case + date » : la signature réelle se
 * fait par document signé (scan) ou, plus tard, via ce prestataire.
 *
 * Champs du pack prévus à cet effet :
 *   convention_status, signature_method, signature_provider,
 *   signature_envelope_id, signature_evidence_url, convention_signed_at.
 */

export type SignatureProvider = "yousign" | "docusign" | "none";

export type SignatureInit =
  | { ok: false; reason: string }
  | { ok: true; provider: SignatureProvider; url: string; envelopeId: string };

/** Un prestataire de signature est-il branché ? (false tant que non intégré). */
export function signatureProviderConfigured(): boolean {
  return false;
}

/**
 * Lance une procédure de signature chez le prestataire (à implémenter quand un
 * prestataire sera choisi). Renvoie l'URL de signature + l'id d'enveloppe.
 * Pour l'instant : non configuré.
 */
export async function initExternalSignature(_input: {
  packId: string;
  signerName: string;
  signerEmail: string | null;
}): Promise<SignatureInit> {
  if (!signatureProviderConfigured()) {
    return {
      ok: false,
      reason:
        "Aucun prestataire de signature électronique n'est configuré. Utilisez le dépôt d'une convention signée (scan) en attendant.",
    };
  }
  // TODO : brancher ici l'API du prestataire (créer l'enveloppe, retourner l'URL).
  return { ok: false, reason: "Non implémenté." };
}
