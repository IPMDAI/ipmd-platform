import { emailDocument, escapeHtml } from "@/lib/email";

/**
 * Composition PURE de l'email de confirmation d'acceptation du règlement intérieur.
 * Aucun accès réseau/DB — testable isolément. L'envoi et le journal vivent dans
 * `reglement-emails.ts` (server-only).
 */

export type ReglementAcceptanceEmailInput = {
  name: string | null;
  parcours: "diplome" | "bootcamp";
  version: string;
  /** Date + heure d'acceptation, déjà formatées (fr-FR). */
  acceptedAtLabel: string;
};

export function parcoursLabel(parcours: "diplome" | "bootcamp"): string {
  return parcours === "bootcamp" ? "Bootcamps & Certificats" : "Cursus Diplôme (Licence & Master)";
}

/** Sujet + HTML de l'email candidat/étudiant. */
export function buildReglementAcceptanceEmail(
  input: ReglementAcceptanceEmailInput
): { subject: string; html: string } {
  const label = parcoursLabel(input.parcours);
  const body = `
    <p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(
      input.name ?? "",
    )},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.5">Nous confirmons l'enregistrement de votre accusé de lecture du règlement intérieur — <strong>${escapeHtml(
      label,
    )}</strong>, version <strong>${escapeHtml(
      input.version,
    )}</strong>, le <strong>${escapeHtml(
      input.acceptedAtLabel,
    )}</strong>.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.5">Conformément à l'article 23, cet accusé de lecture vaut engagement à respecter le règlement. Un exemplaire reste disponible en consultation et en téléchargement sur votre espace. Aucune action n'est requise de votre part.</p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5">L'équipe des admissions — IPMD</p>`;
  return {
    subject: "IPMD — Acceptation du règlement intérieur enregistrée",
    html: emailDocument("Acceptation du règlement intérieur enregistrée", body),
  };
}
