import type { SupabaseClient } from "@supabase/supabase-js";
import { PAYER_RELATIONSHIP_LABEL } from "@/lib/payment-payer";

/** Modèle de reçu — SOURCE UNIQUE partagée par le reçu HTML, le PDF et l'email. */
export type ReceiptModel = {
  receiptNumber: string; // numéro officiel = 8 premiers car. de l'id (un seul par paiement)
  date: string; // paid_at (YYYY-MM-DD)
  studentName: string;
  studentEmail: string | null;
  natureLabel: string;
  amount: number;
  method: string | null;
  label: string | null;
  reference: string | null;
  payerName: string | null;
  payerRelationship: string | null; // slug (etudiant/pere/mere/…)
  payerRelationshipLabel: string | null;
  payerEmail: string | null;
  chequeDrawer: string | null;
  chequeBank: string | null;
  chequeNumber: string | null;
  wavePayerNumber: string | null;
  waveTransactionId: string | null;
  waveMerchant: string | null;
};

type Row = { label: string; value: string };
const frDate = (d: string): string => {
  const [y, m, j] = (d ?? "").split("-");
  return j && m && y ? `${j}/${m}/${y}` : d;
};

/**
 * Lignes de détail du reçu — LOGIQUE DE PRÉSENTATION UNIQUE : le reçu HTML et le
 * PDF itèrent exactement cette liste, impossible qu'ils divergent.
 */
export function receiptDetailRows(m: ReceiptModel): Row[] {
  const rows: Row[] = [
    { label: "Étudiant", value: m.studentName },
    { label: "Nature", value: m.natureLabel + (m.label ? ` · ${m.label}` : "") },
    { label: "Moyen", value: m.method || "—" },
  ];
  if (m.payerName) {
    rows.push({
      label: "Payeur",
      value:
        m.payerName +
        (m.payerRelationshipLabel ? ` (${m.payerRelationshipLabel})` : ""),
    });
  }
  if (m.method === "Chèque") {
    if (m.chequeBank) rows.push({ label: "Banque", value: m.chequeBank });
    if (m.chequeDrawer) rows.push({ label: "Chèque émis par", value: m.chequeDrawer });
    if (m.chequeNumber) rows.push({ label: "N° chèque", value: m.chequeNumber });
  }
  if (m.method === "Wave") {
    if (m.wavePayerNumber) rows.push({ label: "N° Wave", value: m.wavePayerNumber });
    if (m.waveTransactionId) rows.push({ label: "Réf. transaction", value: m.waveTransactionId });
    if (m.waveMerchant) rows.push({ label: "Compte marchand", value: m.waveMerchant });
  }
  if (m.reference) rows.push({ label: "Référence", value: m.reference });
  rows.push({ label: "Date", value: frDate(m.date) });
  return rows;
}

/** Charge le modèle de reçu depuis la base (étudiant inscrit OU candidature W4). */
export async function getReceiptModel(
  supabase: SupabaseClient,
  paymentId: string
): Promise<ReceiptModel | null> {
  const { data: p } = await supabase
    .from("payments")
    .select(
      "id, student_id, candidature_id, amount, method, label, paid_at, kind, reference, payer_name, payer_relationship, payer_email, cheque_drawer, cheque_bank, cheque_number, wave_payer_number, wave_transaction_id, wave_merchant"
    )
    .eq("id", paymentId)
    .single();
  if (!p) return null;

  let studentName = "—";
  let studentEmail: string | null = null;
  if (p.student_id) {
    const { data: s } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", p.student_id)
      .maybeSingle();
    studentName = s?.full_name || s?.email || "—";
    studentEmail = s?.email ?? null;
  } else if (p.candidature_id) {
    const { data: c } = await supabase
      .from("inscription_requests")
      .select("full_name, email")
      .eq("id", p.candidature_id)
      .maybeSingle();
    studentName = c?.full_name || "—";
    studentEmail = c?.email ?? null;
  }

  return {
    receiptNumber: (p.id as string).slice(0, 8).toUpperCase(),
    date: p.paid_at as string,
    studentName,
    studentEmail,
    natureLabel: p.kind === "inscription" ? "Frais d'inscription" : "Frais de scolarité",
    amount: Number(p.amount),
    method: p.method ?? null,
    label: p.label ?? null,
    reference: p.reference ?? null,
    payerName: p.payer_name ?? null,
    payerRelationship: p.payer_relationship ?? null,
    payerRelationshipLabel: p.payer_relationship
      ? PAYER_RELATIONSHIP_LABEL[p.payer_relationship] ?? p.payer_relationship
      : null,
    payerEmail: p.payer_email ?? null,
    chequeDrawer: p.cheque_drawer ?? null,
    chequeBank: p.cheque_bank ?? null,
    chequeNumber: p.cheque_number ?? null,
    wavePayerNumber: p.wave_payer_number ?? null,
    waveTransactionId: p.wave_transaction_id ?? null,
    waveMerchant: p.wave_merchant ?? null,
  };
}
