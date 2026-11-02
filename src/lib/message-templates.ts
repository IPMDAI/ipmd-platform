/**
 * Modèles de messages (pur, client-safe) pour l'équipe Admissions — insérés en 1 clic
 * dans le composer, auto-remplis avec le prénom + la filière, puis éditables.
 */
export type MessageTemplate = { label: string; text: string };

export function teamMessageTemplates(ctx: {
  firstName?: string | null;
  program?: string | null;
}): MessageTemplate[] {
  const p = (ctx.firstName || "").trim() || "Bonjour";
  const prog = ctx.program ? ` en ${ctx.program}` : "";
  const sign = "Cordialement,\nÉquipe Admissions — IPMD";
  return [
    {
      label: "Accusé de réception",
      text: `Bonjour ${p},\n\nNous confirmons la bonne réception de votre candidature${prog}. Notre équipe l'étudie et revient vers vous très rapidement.\n\n${sign}`,
    },
    {
      label: "Dossier incomplet",
      text: `Bonjour ${p},\n\nVotre dossier est presque complet. Merci de nous transmettre les pièces demandées via le lien sécurisé afin que nous puissions poursuivre l'étude de votre demande${prog}.\n\n${sign}`,
    },
    {
      label: "Relance",
      text: `Bonjour ${p},\n\nNous revenons vers vous concernant votre candidature${prog}. Pourriez-vous nous transmettre les éléments manquants pour finaliser l'étude de votre dossier ?\n\nMerci d'avance,\nÉquipe Admissions — IPMD`,
    },
    {
      label: "Invitation entretien",
      text: `Bonjour ${p},\n\nVotre dossier${prog} a retenu notre attention. Nous souhaiterions convenir d'un court entretien. Quelles seraient vos disponibilités cette semaine ?\n\nÀ très bientôt,\nÉquipe Admissions — IPMD`,
    },
    {
      label: "Félicitations 🎉",
      text: `Bonjour ${p},\n\nFélicitations 🎉 ! Nous avons le plaisir de vous informer que votre candidature${prog} a été retenue. Vous recevrez prochainement les étapes suivantes de votre inscription.\n\nBienvenue à l'IPMD,\nÉquipe Admissions`,
    },
  ];
}
