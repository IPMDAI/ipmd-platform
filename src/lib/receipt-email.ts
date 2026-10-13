import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canSendEmail,
  emailDocument,
  sendScolariteEmail,
  type EmailAttachment,
} from "@/lib/email";
import { formatFCFA } from "@/lib/finance";
import { receiptRecipients } from "@/lib/payment-payer";
import { getReceiptModel } from "@/lib/receipt";
import { renderReceiptPdf } from "@/components/espace/documents/ReceiptPdf";

/**
 * Envoi du reçu : étudiant + copie payeur tiers, MÊME PDF (même numéro).
 * Snapshot payeur lu sur le paiement (indépendant de parent_links). Best-effort.
 * Partagé par la saisie manuelle (`addPayment`), l'encaissement W4 et le renvoi.
 * `only` restreint les destinataires ('student' | 'payer') pour le renvoi ciblé.
 */
export async function autoSendReceipt(
  supabase: SupabaseClient,
  paymentId: string,
  only?: "student" | "payer"
): Promise<{ sent: number }> {
  if (!canSendEmail) return { sent: 0 };
  const m = await getReceiptModel(supabase, paymentId);
  if (!m) return { sent: 0 };

  const r = receiptRecipients({
    studentEmail: m.studentEmail,
    payerEmail: m.payerEmail,
    payerRelationship: m.payerRelationship,
  });
  let targets = [r.student, r.payer].filter(Boolean) as string[];
  if (only === "student") targets = [r.student].filter(Boolean) as string[];
  if (only === "payer") targets = [r.payer].filter(Boolean) as string[];
  if (targets.length === 0) return { sent: 0 };

  let attachments: EmailAttachment[] | undefined;
  try {
    const pdf = await renderReceiptPdf(m);
    attachments = [
      { filename: `Recu-IPMD-${m.receiptNumber}.pdf`, content: pdf.toString("base64") },
    ];
  } catch {
    attachments = undefined; // envoi sans PJ si le rendu PDF échoue
  }

  const html = emailDocument(
    "Reçu de paiement IPMD",
    `<p>Bonjour,</p><p>Veuillez trouver ci-joint le reçu officiel <strong>N° ${m.receiptNumber}</strong> du paiement de <strong>${formatFCFA(m.amount)}</strong> (${m.natureLabel}) concernant l'étudiant <strong>${m.studentName}</strong>.</p><p>Ce reçu unique est adressé à l'étudiant et, le cas échéant, au payeur.</p><p>Merci de votre confiance.<br/>IPMD — scolarite@ipmd.pro</p>`
  );
  const n = await sendScolariteEmail(
    targets,
    `IPMD — Reçu de paiement N° ${m.receiptNumber}`,
    html,
    attachments
  );
  return { sent: n };
}

/**
 * Envoie le reçu (même PDF, même numéro) à UNE adresse précise — utilisé quand
 * l'email du payeur n'était pas disponible au moment du paiement et est ajouté
 * après coup. Envoi explicite (ne dépend pas de la règle « tiers »).
 */
export async function sendReceiptToEmail(
  supabase: SupabaseClient,
  paymentId: string,
  email: string
): Promise<{ sent: number }> {
  if (!canSendEmail) return { sent: 0 };
  const to = (email ?? "").trim();
  if (!to.includes("@")) return { sent: 0 };
  const m = await getReceiptModel(supabase, paymentId);
  if (!m) return { sent: 0 };

  let attachments: EmailAttachment[] | undefined;
  try {
    const pdf = await renderReceiptPdf(m);
    attachments = [
      { filename: `Recu-IPMD-${m.receiptNumber}.pdf`, content: pdf.toString("base64") },
    ];
  } catch {
    attachments = undefined;
  }
  const html = emailDocument(
    "Reçu de paiement IPMD",
    `<p>Bonjour,</p><p>Veuillez trouver ci-joint le reçu officiel <strong>N° ${m.receiptNumber}</strong> du paiement de <strong>${formatFCFA(m.amount)}</strong> (${m.natureLabel}) concernant l'étudiant <strong>${m.studentName}</strong>.</p><p>Merci de votre confiance.<br/>IPMD — scolarite@ipmd.pro</p>`
  );
  const n = await sendScolariteEmail(
    [to],
    `IPMD — Reçu de paiement N° ${m.receiptNumber}`,
    html,
    attachments
  );
  return { sent: n };
}
