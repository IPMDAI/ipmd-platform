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

// ── Statut par pièce (récapitulatif) ───────────────────────────────────────
export type DocStatus = "recue" | "a_verifier" | "validee" | "a_remplacer";

/** Statuts que l'équipe peut poser. */
export const DOC_SETTABLE_STATUSES: DocStatus[] = ["recue", "a_verifier", "validee", "a_remplacer"];

export function isDocStatus(s: unknown): s is DocStatus {
  return typeof s === "string" && (DOC_SETTABLE_STATUSES as string[]).includes(s);
}

/** Métadonnée d'affichage (libellé + classes) — inclut les états dérivés. */
export const DOC_STATUS_META: Record<string, { label: string; cls: string }> = {
  validee: { label: "Validée", cls: "bg-green-50 text-green-700 ring-green-200" },
  a_verifier: { label: "À vérifier", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  a_remplacer: { label: "À remplacer", cls: "bg-ipmd-red/10 text-ipmd-red ring-ipmd-red/20" },
  recue: { label: "Reçue", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  demandee: { label: "Demandée", cls: "bg-black/5 text-black/50 ring-black/10" },
  absente: { label: "Non fournie", cls: "bg-black/5 text-black/40 ring-black/10" },
};

export type DocStatusEntry = { status?: string; reason?: string | null; at?: string; by?: string | null };

/**
 * Statut EFFECTIF d'une pièce : statut explicite s'il existe, sinon dérivé
 * (reçue si fichier présent, demandée si réclamée, non fournie sinon).
 */
export function effectiveDocStatus(input: {
  explicit?: string | null;
  provided: boolean;
  requested: boolean;
}): string {
  if (input.explicit && input.explicit in DOC_STATUS_META) return input.explicit;
  if (input.provided) return "recue";
  if (input.requested) return "demandee";
  return "absente";
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
