/**
 * Payeur d'un paiement (snapshot stocké sur `payments`) + détails techniques par
 * moyen. Fonctions PURES (testables) partagées par la saisie manuelle
 * (`addPayment`) ET l'encaissement W4, pour garantir des règles identiques.
 */

export const PAYER_RELATIONSHIPS: { value: string; label: string }[] = [
  { value: "etudiant", label: "L'étudiant lui-même" },
  { value: "pere", label: "Père" },
  { value: "mere", label: "Mère" },
  { value: "tuteur", label: "Tuteur" },
  { value: "tutrice", label: "Tutrice" },
  { value: "entreprise", label: "Entreprise / employeur" },
  { value: "autre", label: "Autre" },
];
export const PAYER_RELATIONSHIP_VALUES = PAYER_RELATIONSHIPS.map((r) => r.value);
export const PAYER_RELATIONSHIP_LABEL: Record<string, string> = Object.fromEntries(
  PAYER_RELATIONSHIPS.map((r) => [r.value, r.label])
);

export type PayerValues = {
  payer_name: string | null;
  payer_relationship: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  cheque_drawer: string | null;
  cheque_bank: string | null;
  cheque_number: string | null;
  wave_payer_number: string | null;
  wave_transaction_id: string | null;
  wave_merchant: string | null;
};

export type PayerResolution =
  | { ok: true; values: PayerValues }
  | { ok: false; message: string };

/**
 * Valide + normalise le payeur et les détails techniques selon le moyen.
 *  - Bloc payeur (nom + qualité) OBLIGATOIRE pour Chèque et Wave ; optionnel sinon.
 *  - Chèque → `cheque_drawer` + `cheque_bank` requis ; `cheque_number` optionnel.
 *  - Wave → `wave_payer_number` + `wave_transaction_id` requis ; `wave_merchant` optionnel.
 *  - Les champs techniques de l'autre moyen sont forcés à NULL (pas de fuite).
 */
export function resolvePaymentPayer(input: {
  method: string;
  payer_name?: string;
  payer_relationship?: string;
  payer_email?: string;
  payer_phone?: string;
  cheque_drawer?: string;
  cheque_bank?: string;
  cheque_number?: string;
  wave_payer_number?: string;
  wave_transaction_id?: string;
  wave_merchant?: string;
}): PayerResolution {
  const t = (v?: string) => (v ?? "").trim();
  const nz = (v?: string) => {
    const s = t(v);
    return s === "" ? null : s;
  };
  const method = t(input.method);

  const payerName = nz(input.payer_name);
  const rel = nz(input.payer_relationship);
  if (rel && !PAYER_RELATIONSHIP_VALUES.includes(rel)) {
    return { ok: false, message: "Qualité du payeur invalide." };
  }

  const isCheque = method === "Chèque";
  const isWave = method === "Wave";

  if (isCheque || isWave) {
    if (!payerName) return { ok: false, message: "Le nom du payeur est requis." };
    if (!rel) return { ok: false, message: "La qualité du payeur est requise." };
  }

  const values: PayerValues = {
    payer_name: payerName,
    payer_relationship: rel,
    payer_email: nz(input.payer_email),
    payer_phone: nz(input.payer_phone),
    cheque_drawer: null,
    cheque_bank: null,
    cheque_number: null,
    wave_payer_number: null,
    wave_transaction_id: null,
    wave_merchant: null,
  };

  if (isCheque) {
    const drawer = nz(input.cheque_drawer);
    const bank = nz(input.cheque_bank);
    if (!drawer) return { ok: false, message: "« Chèque émis par » est requis." };
    if (!bank) return { ok: false, message: "La banque / établissement payeur est requis." };
    values.cheque_drawer = drawer;
    values.cheque_bank = bank;
    values.cheque_number = nz(input.cheque_number);
  } else if (isWave) {
    const num = nz(input.wave_payer_number);
    const tx = nz(input.wave_transaction_id);
    if (!num) return { ok: false, message: "Le numéro Wave du payeur est requis." };
    if (!tx) return { ok: false, message: "L'ID / référence de transaction Wave est requis." };
    values.wave_payer_number = num;
    values.wave_transaction_id = tx;
    values.wave_merchant = nz(input.wave_merchant);
  }

  return { ok: true, values };
}

/**
 * Décide les destinataires du reçu, en snapshot (jamais dépendant de parent_links
 * au moment de l'envoi). Renvoie l'email étudiant + éventuel email payeur, dédupliqués.
 */
export function receiptRecipients(opts: {
  studentEmail: string | null;
  payerEmail: string | null;
  payerRelationship: string | null;
}): { student: string | null; payer: string | null } {
  const se = (opts.studentEmail ?? "").trim().toLowerCase();
  const pe = (opts.payerEmail ?? "").trim();
  const student = se || null;
  // Copie payeur seulement si tiers (≠ étudiant) ET email présent ET différent de l'étudiant.
  const isThirdParty = !!opts.payerRelationship && opts.payerRelationship !== "etudiant";
  const payer =
    isThirdParty && pe && pe.toLowerCase() !== se ? pe : null;
  return { student, payer };
}
