/**
 * Catalogue des pièces d'une candidature — module PUR (client + serveur).
 * Chaque pièce a une clé stable (`key`), la colonne `inscription_requests`
 * correspondante (`col`) et un libellé. Sert au formulaire de dépôt, aux
 * actions serveur (demande de pièces) et à la fiche admin.
 */
export type DocKey = "diploma" | "id" | "cv" | "bulletins" | "attestation";

export type CandidateDoc = { key: DocKey; col: string; label: string; short: string };

export const CANDIDATE_DOCS: CandidateDoc[] = [
  { key: "diploma", col: "doc_diploma", label: "Dernier diplôme", short: "Diplôme" },
  { key: "id", col: "doc_id", label: "Pièce d'identité / passeport", short: "Pièce d'identité" },
  { key: "cv", col: "doc_cv", label: "CV", short: "CV" },
  { key: "bulletins", col: "doc_bulletins", label: "Bulletins / relevés de notes", short: "Bulletins" },
  { key: "attestation", col: "doc_attestation", label: "Attestation", short: "Attestation" },
];

export const DOC_BY_KEY: Record<string, CandidateDoc> = Object.fromEntries(
  CANDIDATE_DOCS.map((d) => [d.key, d])
);

export function isDocKey(k: unknown): k is DocKey {
  return typeof k === "string" && k in DOC_BY_KEY;
}

/** Libellés lisibles d'une liste de clés (ignore les clés inconnues). */
export function docLabels(keys: string[] | null | undefined): string[] {
  return (keys ?? []).filter(isDocKey).map((k) => DOC_BY_KEY[k].label);
}

/** Construit un lien WhatsApp pré-rempli (le message s'ouvre, l'équipe l'envoie). */
export function waLink(phone: string | null | undefined, text: string): string | null {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Message WhatsApp de demande de pièces (avec le lien de dépôt). */
export function buildDocsWhatsappText(input: {
  firstName: string;
  program?: string | null;
  docKeys: string[];
  link: string;
}): string {
  const prenom = input.firstName || "Bonjour";
  const liste = docLabels(input.docKeys)
    .map((l) => `• ${l}`)
    .join("\n");
  const prog = input.program ? ` en ${input.program}` : "";
  return (
    `Bonjour ${prenom}, ici l'équipe Admissions IPMD.\n\n` +
    `Pour finaliser l'étude de votre candidature${prog}, merci de nous transmettre :\n` +
    `${liste}\n\n` +
    `Déposez vos pièces en quelques clics via ce lien sécurisé (sans compte) :\n${input.link}\n\n` +
    `Merci et à très vite !`
  );
}

/** Message WhatsApp d'échange simple (sans pièces). */
export function buildHelloWhatsappText(input: {
  firstName: string;
  program?: string | null;
}): string {
  const prenom = input.firstName || "Bonjour";
  const prog = input.program ? ` au sujet de votre candidature en ${input.program}` : "";
  return `Bonjour ${prenom}, ici l'équipe Admissions IPMD. Nous revenons vers vous${prog}. Comment pouvons-nous vous aider ?`;
}
