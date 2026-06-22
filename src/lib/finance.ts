/** Moyens de paiement proposés. */
export const PAYMENT_METHODS = [
  "Espèces",
  "Virement",
  "Mobile Money",
  "Chèque",
  "Carte",
];

/** Formate un montant en FCFA (XOF). */
export function formatFCFA(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `${v.toLocaleString("fr-FR")} FCFA`;
}
