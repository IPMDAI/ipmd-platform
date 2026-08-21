import "server-only";

/**
 * Configuration d'envoi des lettres d'admission/refus (Lot C1).
 *
 * ⚠️ GARDE DE SÉCURITÉ OBLIGATOIRE :
 * Tant que le modèle n'est pas validé (`TEMPLATE_VALIDATED = false`), on reste
 * en MODE TEST : un email ne peut partir QUE vers l'adresse de test autorisée
 * (`ADMISSION_TEST_EMAIL`), et UNIQUEMENT pour la candidature dont l'email EST
 * cette adresse de test. Résultat : pendant les tests, **aucun vrai candidat
 * n'est contacté ni modifié**.
 */

// L'action d'envoi est branchée (Lot C1). La garde mode-test ci-dessous
// contrôle qui reçoit réellement.
export const LETTERS_ENABLED = true;

// ⛔ Rester à false tant que le modèle admission/refus n'a pas été validé.
export const TEMPLATE_VALIDATED = false;

export const TEST_MODE = !TEMPLATE_VALIDATED;

// Adresse de test autorisée (à définir dans .env.local en local ET dans Vercel
// pour tester en production). Vide => aucun envoi possible en mode test.
export const TEST_EMAIL = (process.env.ADMISSION_TEST_EMAIL ?? "")
  .trim()
  .toLowerCase();

function norm(e: string): string {
  return (e ?? "").trim().toLowerCase();
}

export type RecipientResolution =
  | { ok: true; to: string[]; testMode: boolean }
  | { ok: false; reason: string };

/**
 * Résout les destinataires réels d'une lettre selon le mode.
 * - Mode RÉEL (modèle validé) : le candidat.
 * - Mode TEST : uniquement l'adresse de test, ET seulement si la candidature
 *   ciblée EST la candidature de test → jamais un vrai candidat.
 */
export function resolveRecipients(candidateEmail: string): RecipientResolution {
  const email = norm(candidateEmail);

  if (!TEST_MODE) {
    if (!email.includes("@")) {
      return { ok: false, reason: "Email du candidat invalide." };
    }
    return { ok: true, to: [candidateEmail], testMode: false };
  }

  // ── MODE TEST ──────────────────────────────────────────────────────────
  if (!TEST_EMAIL) {
    return {
      ok: false,
      reason:
        "Mode test actif mais aucune adresse de test configurée (ADMISSION_TEST_EMAIL). Aucun email envoyé.",
    };
  }
  if (email !== TEST_EMAIL) {
    return {
      ok: false,
      reason: `Mode test : l'envoi est autorisé uniquement vers la candidature de test (${TEST_EMAIL}). Aucun vrai candidat n'est contacté ni modifié.`,
    };
  }
  return { ok: true, to: [TEST_EMAIL], testMode: true };
}
