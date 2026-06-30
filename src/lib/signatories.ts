/**
 * Politique de signature des documents officiels IPMD.
 *
 * - Documents ACADÉMIQUES (attestation/certificat de scolarité, réussite,
 *   bulletins, relevés) → Directeur des Études.
 * - Documents ADMINISTRATIFS (attestation d'inscription, admission,
 *   courriers, financier) → Administrateur Général.
 * - Délégations : en cas d'absence, un signataire délégué peut signer ;
 *   une mention « par délégation » est alors ajoutée automatiquement.
 *
 * ⚠️ Les images de signature sont déposées par l'administration dans
 *    private/signatures/ (hors public/, jamais accessible par URL) ;
 *    elles ne sont jamais ajoutées par l'assistant.
 */

export type SignatoryKey =
  | "directeur-etudes"
  | "admin-general"
  | "responsable-pedago"
  | "directrice-executive";

export type Signatory = {
  key: SignatoryKey;
  title: string; // fonction
  name: string; // nom affiché
  signature: string; // chemin RELATIF dans private/ (jamais public)
};

export const SIGNATORIES: Record<SignatoryKey, Signatory> = {
  "directeur-etudes": {
    key: "directeur-etudes",
    title: "Le Directeur des Études",
    name: "COFFI KOMENAN EMILE",
    signature: "signatures/directeur-etudes.png",
  },
  "admin-general": {
    key: "admin-general",
    title: "L'Administrateur Général",
    name: "POODA ETTIEN AUBIN",
    signature: "signatures/admin-general.png",
  },
  "responsable-pedago": {
    key: "responsable-pedago",
    title: "Le Responsable pédagogique",
    name: "",
    signature: "signatures/responsable-pedago.png",
  },
  "directrice-executive": {
    key: "directrice-executive",
    title: "La Directrice Exécutive",
    name: "YEBOUE AKISSI ESTELLE SOLANGE",
    signature: "signatures/directrice-executive.png",
  },
};

export type DocCategory = "academique" | "administratif";
export type DocKind = "scolarite" | "certificat" | "reussite";

/** Catégorie d'un document selon son type. */
export function docCategory(kind: DocKind, isBootcamp: boolean): DocCategory {
  // « Attestation d'inscription » (= attestation-scolarité d'un bootcamp) est administrative.
  if (kind === "scolarite" && isBootcamp) return "administratif";
  return "academique";
}

/** Signataire par défaut d'une catégorie. */
export function defaultSignatoryKey(category: DocCategory): SignatoryKey {
  return category === "administratif" ? "admin-general" : "directeur-etudes";
}

/** Signataires autorisés (le 1er = défaut), pour gérer la délégation. */
export function allowedSignatories(category: DocCategory): SignatoryKey[] {
  return category === "academique"
    ? ["directeur-etudes", "responsable-pedago", "admin-general"]
    : ["admin-general", "directrice-executive"];
}

/** Mention « par délégation » à afficher, ou null si signataire titulaire. */
export function delegationMention(
  category: DocCategory,
  key: SignatoryKey
): string | null {
  if (key === defaultSignatoryKey(category)) return null;
  if (key === "directrice-executive")
    return "Pour l'Administrateur Général et par délégation";
  if (category === "academique")
    return "Pour le Directeur des Études et par délégation";
  return "Par délégation";
}

export type ResolvedSignatory = Signatory & {
  mention: string | null;
  category: DocCategory;
  allowed: SignatoryKey[];
};

/** Résout le signataire d'un document (défaut ou délégué via override). */
export function resolveSignatory(
  kind: DocKind,
  isBootcamp: boolean,
  override?: string
): ResolvedSignatory {
  const category = docCategory(kind, isBootcamp);
  const allowed = allowedSignatories(category);
  const key =
    override && (allowed as string[]).includes(override)
      ? (override as SignatoryKey)
      : defaultSignatoryKey(category);
  return {
    ...SIGNATORIES[key],
    mention: delegationMention(category, key),
    category,
    allowed,
  };
}
