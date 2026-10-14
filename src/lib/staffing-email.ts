import { emailDocument, escapeHtml, buildRows } from "@/lib/email";

/**
 * Contenu des notifications « Besoins en personnel » (D6-4) — fonction PURE,
 * sans effet de bord ni dépendance serveur (testable isolément). Ne contient
 * jamais de montant ni de donnée sensible. L'envoi et la résolution des
 * destinataires vivent dans staffing-notify.ts (best-effort).
 */

export type StaffingEvent =
  | "submitted" // brouillon → en_attente : notifier l'AG
  | "validated" // en_attente → validee : notifier le DÉ
  | "refused" // en_attente → refusee : notifier le DÉ (+ motif)
  | "assigned" // validee → affectee : notifier le DÉ (+ personne)
  | "closed"; // * → cloturee : notifier le DÉ

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro").replace(/\/$/, "");

export type StaffingEmailData = {
  positionTitle: string | null;
  needTypeLabel: string | null;
  priorityLabel: string | null;
  academicYear: string | null;
  requesterName: string | null;
  reason: string | null;
  assignedName: string | null;
};

function button(href: string, label: string): string {
  return `<p style="text-align:center;margin:24px 0"><a href="${href}" style="background:#e4002b;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">${escapeHtml(
    label
  )}</a></p>`;
}

export function buildStaffingEmail(
  event: StaffingEvent,
  d: StaffingEmailData
): { subject: string; html: string } {
  const agLink = `${SITE}/espace/besoins-ag`;
  const deLink = `${SITE}/espace/besoins`;

  if (event === "submitted") {
    const rows = buildRows([
      ["Demandeur", d.requesterName],
      ["Intitulé", d.positionTitle],
      ["Type", d.needTypeLabel],
      ["Priorité", d.priorityLabel],
      ["Année académique", d.academicYear],
    ]);
    return {
      subject: "IPMD — Nouveau besoin en personnel soumis",
      html: emailDocument(
        "Nouveau besoin en personnel soumis par le Directeur des Études",
        `<p style="font-size:14px;color:#374151">Un nouveau besoin en personnel vient d'être soumis pour décision.</p>
         <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
         ${button(agLink, "Traiter le besoin")}`
      ),
    };
  }

  if (event === "validated") {
    const rows = buildRows([
      ["Intitulé", d.positionTitle],
      ["Type", d.needTypeLabel],
      ["Priorité", d.priorityLabel],
      ["Année académique", d.academicYear],
    ]);
    return {
      subject: "IPMD — Besoin en personnel validé",
      html: emailDocument(
        "Votre besoin en personnel a été validé",
        `<p style="font-size:14px;color:#374151">Bonne nouvelle : votre besoin a été validé par l'Administrateur Général.</p>
         <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
         ${button(deLink, "Voir mes besoins")}`
      ),
    };
  }

  if (event === "refused") {
    const rows = buildRows([
      ["Intitulé", d.positionTitle],
      ["Motif", d.reason],
    ]);
    return {
      subject: "IPMD — Besoin en personnel refusé",
      html: emailDocument(
        "Votre besoin en personnel a été refusé",
        `<p style="font-size:14px;color:#374151">Votre besoin a été refusé par l'Administrateur Général.</p>
         <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
         ${button(deLink, "Voir mes besoins")}`
      ),
    };
  }

  if (event === "assigned") {
    const rows = buildRows([
      ["Intitulé", d.positionTitle],
      ["Personne affectée", d.assignedName],
    ]);
    return {
      subject: "IPMD — Personne affectée à votre besoin",
      html: emailDocument(
        "Une personne a été affectée à votre besoin",
        `<p style="font-size:14px;color:#374151">Une personne a été officiellement affectée à votre besoin par l'Administrateur Général.</p>
         <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
         ${button(deLink, "Voir mes besoins")}`
      ),
    };
  }

  // closed
  const rows = buildRows([
    ["Intitulé", d.positionTitle],
    ["Personne affectée", d.assignedName],
  ]);
  return {
    subject: "IPMD — Besoin en personnel clôturé",
    html: emailDocument(
      "Votre besoin en personnel a été clôturé",
      `<p style="font-size:14px;color:#374151">Votre besoin en personnel a été clôturé.</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
       ${button(deLink, "Voir mes besoins")}`
    ),
  };
}
