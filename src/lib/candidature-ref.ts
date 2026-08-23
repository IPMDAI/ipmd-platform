/**
 * Référence candidat lisible, dérivée de l'UUID de la candidature.
 *
 * Module PUR et client-safe (aucun import serveur) — utilisable côté client
 * (écran de succès du wizard) comme côté serveur (emails). Ex. IPMD-24A46AED.
 */
export function candidatureReference(requestId: string): string {
  return `IPMD-${requestId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
