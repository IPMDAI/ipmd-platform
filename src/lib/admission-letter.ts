import { emailDocument, buildRows, escapeHtml } from "@/lib/email";
import { formatFCFA } from "@/lib/finance";

/** Mention obligatoire sur tout élément financier du Lot C. */
export const SCHEDULE_DISCLAIMER =
  "Prévisionnel — non contractuel tant que le plan de paiement n'est pas confirmé.";

/**
 * Intitulé du signataire des lettres.
 * ⚠️ À CONFIRMER par l'IPMD avant de figer définitivement les modèles.
 * (Un seul endroit à changer si l'intitulé officiel diffère.)
 */
export const SIGNATORY = {
  title: "L'Administrateur Général",
  name: "POODA ETTIEN AUBIN",
};

function signatureBlock(): string {
  return `<p style="margin:0 0 4px;color:#0b0b0d;font-size:14px">Bien cordialement,</p>
    <p style="margin:0;color:#0b0b0d;font-size:14px"><strong>${escapeHtml(SIGNATORY.title)}</strong><br/>${escapeHtml(SIGNATORY.name)}</p>`;
}

export type AdmissionLetterData = {
  name: string;
  program: string | null;
  level: string | null;
  academicYear: string | null;
  registrationFee: number;
  tuitionDue: number | null;
  testMode: boolean;
  packUrl?: string | null;
};

const TEST_BANNER = `<p style="margin:16px 0 0;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#b91c1c;font-size:12px;font-weight:600">— EMAIL DE TEST — modèle en cours de validation, ne pas tenir compte. —</p>`;

/** Lettre d'ADMISSION (email HTML). */
export function buildAdmissionEmail(d: AdmissionLetterData): {
  subject: string;
  html: string;
} {
  const total = d.registrationFee + (d.tuitionDue ?? 0);
  const rows = buildRows([
    ["Formation", d.program],
    ["Niveau", d.level],
    ["Année académique", d.academicYear],
    ["Frais d'inscription", formatFCFA(d.registrationFee)],
    [
      "Frais de scolarité (prévisionnel)",
      d.tuitionDue != null ? formatFCFA(d.tuitionDue) : "à préciser",
    ],
    ["Total prévisionnel", formatFCFA(total)],
  ]);

  const body = `
    <p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(d.name)},</p>
    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6">
      Nous avons le plaisir de vous informer que votre candidature à l'Institut
      Polytechnique des Métiers du Digital (IPMD) a été <strong>acceptée</strong>.
      Félicitations et bienvenue !
    </p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">Récapitulatif prévisionnel de votre admission :</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    <p style="margin:12px 0 0;padding:8px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;color:#9a3412;font-size:12px">
      ⚠️ ${SCHEDULE_DISCLAIMER}
    </p>
    <p style="margin:18px 0 12px;color:#374151;font-size:14px;line-height:1.6">
      <strong>Prochaine étape :</strong> vous recevrez ensuite votre pack
      d'admission complet, avec les documents à consulter/valider et les
      modalités de paiement.
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:14px">Votre lettre d'admission officielle est jointe à cet email (PDF).</p>
    ${
      d.packUrl
        ? `<p style="margin:0 0 16px"><a href="${escapeHtml(d.packUrl)}" style="display:inline-block;background:#e01228;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:9999px">Accéder à mon espace d'admission</a></p>`
        : ""
    }
    <p style="margin:0 0 6px;color:#6b7280;font-size:12px;line-height:1.5">
      Documents d'admission : lettre d'admission, proforma/frais et échéancier,
      règlement intérieur, convention de formation, conditions financières,
      politique de remboursement et confidentialité ; documents complémentaires
      selon le parcours ou la situation du candidat.
    </p>
    <p style="margin:0 0 14px;color:#9ca3af;font-size:11px;font-style:italic;line-height:1.5">
      Ces documents font partie de votre dossier d'admission et doivent être
      consultés avant l'inscription définitive. Si l'un d'eux est indisponible dans
      votre espace, contactez l'IPMD avant de finaliser votre inscription.
    </p>
    ${signatureBlock()}
    <p style="margin:8px 0 0;color:#9ca3af;font-size:12px">scolarite@ipmd.pro · www.ipmd.pro</p>
    ${d.testMode ? TEST_BANNER : ""}
  `;

  return {
    subject: (d.testMode ? "[TEST] " : "") + "IPMD — Votre dossier est accepté 🎉",
    html: emailDocument("Votre admission à l'IPMD", body),
  };
}

export type RefusalLetterData = {
  name: string;
  program: string | null;
  reason: string | null;
  testMode: boolean;
};

/** Lettre de REFUS (email HTML). */
export function buildRefusalEmail(d: RefusalLetterData): {
  subject: string;
  html: string;
} {
  const body = `
    <p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(d.name)},</p>
    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6">
      Nous vous remercions de l'intérêt que vous portez à l'IPMD et du temps
      consacré à votre candidature${d.program ? ` en ${escapeHtml(d.program)}` : ""}.
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6">
      Après étude attentive de votre dossier, nous ne sommes pas en mesure d'y
      donner une suite favorable pour le moment.
    </p>
    ${
      d.reason
        ? `<p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6"><strong>Motif :</strong> ${escapeHtml(d.reason)}</p>`
        : ""
    }
    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6">
      Cette décision ne préjuge pas de vos qualités ; nous vous encourageons à
      renouveler votre candidature lors d'une prochaine session, ou à découvrir
      nos autres parcours.
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:14px">Nous vous souhaitons pleine réussite dans vos projets.</p>
    ${signatureBlock()}
    <p style="margin:8px 0 0;color:#9ca3af;font-size:12px">admission@ipmd.pro · www.ipmd.pro</p>
    ${d.testMode ? TEST_BANNER : ""}
  `;

  return {
    subject: (d.testMode ? "[TEST] " : "") + "IPMD — Suite à votre candidature",
    html: emailDocument("Suite à votre candidature", body),
  };
}
