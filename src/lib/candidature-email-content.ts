import { emailDocument, emailLayout, buildRows, escapeHtml } from "@/lib/email";
import { getUniverse } from "@/data/universes";
import { candidatureReference } from "@/lib/candidature-ref";

export { candidatureReference };

/**
 * Composition des emails de confirmation de candidature (Lot 1).
 *
 * Module PUR (aucun accès réseau / DB / service-role) : il ne fait que construire
 * la référence et le HTML à partir d'une ligne `inscription_requests` déjà
 * rechargée côté serveur. Testable isolément. L'envoi réel et le rechargement de
 * la ligne persistée vivent dans `candidature-emails.ts` (server-only).
 */

/** Ligne minimale rechargée depuis `inscription_requests` (données persistées). */
export type CandidatureRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  universe: string | null;
  program_interest: string | null;
  entry_level: string | null;
  academic_year: string | null;
  mode: string | null;
};

const MODE_LABEL: Record<string, string> = {
  presentiel: "Présentiel",
  distance: "À distance",
  hybride: "Hybride",
};

export type BuiltCandidatureEmails = {
  reference: string;
  candidate: { to: string; subject: string; html: string } | null;
  staff: { subject: string; html: string; replyTo?: string };
};

/** Construit les emails candidat + staff à partir de la ligne persistée. */
export function buildCandidatureEmails(row: CandidatureRow): BuiltCandidatureEmails {
  const reference = candidatureReference(row.id);
  const universeLabel = (row.universe ? getUniverse(row.universe)?.name : null) ?? row.universe ?? "—";
  const programme = row.program_interest ?? null;
  const modeLabel = row.mode ? MODE_LABEL[row.mode] ?? row.mode : null;

  // ── Email candidat ──
  const infoRows = buildRows([
    ["Référence", reference],
    ["Univers", universeLabel],
    ["Programme", programme],
    ["Année académique", row.academic_year],
  ]);
  const body = `
    <p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(
      row.full_name ?? "",
    )},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.5">Nous confirmons la bonne réception de votre candidature à l'IPMD. Aucune action n'est requise de votre part pour le moment.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">${infoRows}</table>
    <p style="margin:0;color:#374151;font-size:14px;line-height:1.5"><strong>Prochaine étape :</strong> notre équipe étudie votre dossier et vous recontactera par email. Conservez votre référence <strong>${escapeHtml(
      reference,
    )}</strong> pour tout échange.</p>`;
  const candidateHtml = emailDocument("Votre candidature a bien été reçue", body);
  const candidateEmail = (row.email ?? "").trim();

  // ── Notification staff ──
  const staffRows = buildRows([
    ["Référence", reference],
    ["Nom", row.full_name],
    ["Email", row.email],
    ["Univers", universeLabel],
    ["Programme", programme],
    ["Niveau / Certificat", row.entry_level],
    ["Mode", modeLabel],
    ["Année académique", row.academic_year],
  ]);
  const staffHtml = emailLayout("Nouvelle candidature", staffRows);
  const staffSubject = `Nouvelle candidature — ${universeLabel}${programme ? ` — ${programme}` : ""}`;

  return {
    reference,
    candidate: candidateEmail
      ? {
          to: candidateEmail,
          subject: `IPMD — Candidature reçue (réf. ${reference})`,
          html: candidateHtml,
        }
      : null,
    staff: {
      subject: staffSubject,
      html: staffHtml,
      replyTo: candidateEmail || undefined,
    },
  };
}
