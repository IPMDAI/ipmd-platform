import type { UniverseId } from "@/types";
import type { BackgroundVariant } from "./background";

/**
 * Étape 3 — « Votre projet à l'IPMD ».
 *
 * ⚠️ 100 % DATA-DRIVEN : aucune formation, aucun MBA/DBA/certificat n'est codé
 * en dur. Les options proviennent uniquement de la base (offres réellement
 * ouvertes) via `WizardCatalog`, chargé côté serveur.
 *
 *  - campus     : rentrée ouverte → offre Campus (intake_offerings open) →
 *                 Filière · Niveau ; diplôme visé DÉRIVÉ du niveau, jamais saisi.
 *  - pro        : programme = catalog_offerings open (univers professionnel).
 *  - executive  : programme = catalog_offerings open (univers gouvernance).
 *  - certificat : catalog_items.status='open' de l'univers concerné, sans rentrée.
 *
 * Si aucun programme n'est ouvert pour un parcours → message clair + Suivant
 * bloqué. On n'invente jamais d'option.
 */

export type CampusOffering = { filiereId: string; filiereName: string; level: string };
export type CampusIntake = {
  id: string;
  label: string;
  academicYear: string;
  startDate: string | null;
  offerings: CampusOffering[];
};
export type CatalogProgram = {
  offeringId: string;
  intakeId: string;
  intakeLabel: string;
  academicYear: string;
  itemId: string;
  name: string;
  credential: string | null;
  docProfile: string | null;
};
export type CertificatItem = {
  id: string;
  name: string;
  credential: string | null;
  docProfile: string | null;
};

// ── Étape 4 : profils documentaires (data-driven) ──
export type DocRequirement = "required" | "optional" | "conditional";
export type DocProfileRow = { docKey: string; requirement: DocRequirement; sortOrder: number };
export type DocLine = {
  docKey: string;
  label: string;
  requirement: DocRequirement;
};

export type WizardCatalog = {
  campusIntakes: CampusIntake[];
  proPrograms: CatalogProgram[];
  execPrograms: CatalogProgram[];
  /** Items certifiants ouverts, groupés par univers (ultrajobs, ultraboost, …). */
  certByUniverse: Record<string, CertificatItem[]>;
  /** doc_key → libellé (document_types). */
  documentTypes: Record<string, string>;
  /** profile_key → lignes (document_profiles). */
  documentProfiles: Record<string, DocProfileRow[]>;
};

export const EMPTY_CATALOG: WizardCatalog = {
  campusIntakes: [],
  proPrograms: [],
  execPrograms: [],
  certByUniverse: {},
  documentTypes: {},
  documentProfiles: {},
};

/** Sélection du projet (persistée dans la coquille). Un seul slot est pertinent
 *  selon la variante — les autres restent vides. */
export type Project = {
  campusIntakeId: string;
  campusOfferingKey: string; // `${filiereId}::${level}`
  proOfferingId: string;
  execOfferingId: string;
  certItemId: string;
};

export const EMPTY_PROJECT: Project = {
  campusIntakeId: "",
  campusOfferingKey: "",
  proOfferingId: "",
  execOfferingId: "",
  certItemId: "",
};

export const offeringKey = (filiereId: string, level: string) => `${filiereId}::${level}`;

/** Rang d'un niveau, robuste aux libellés réels (« Licence 1 » comme « L1 »). */
function levelRank(s: string): number {
  const l = s.trim().toLowerCase();
  const cycle = l.startsWith("master") || l.startsWith("m") ? 1 : l.startsWith("licence") || l.startsWith("l") ? 0 : 2;
  const num = parseInt((l.match(/(\d+)/) ?? [])[1] ?? "0", 10);
  return cycle * 10 + num;
}
export const sortLevels = (a: string, b: string) => levelRank(a) - levelRank(b);

/** Diplôme visé DÉRIVÉ du niveau Campus (pas saisi). L→Licence, M→Master. */
export function campusDiplomaForLevel(level: string): string {
  const l = level.trim().toLowerCase();
  if (l.startsWith("master") || l.startsWith("m")) return "Master";
  if (l.startsWith("licence") || l.startsWith("l")) return "Licence";
  return level;
}

/** Y a-t-il au moins une option ouverte pour ce parcours ? */
export function hasProjectOptions(
  universe: UniverseId | null,
  variant: BackgroundVariant,
  catalog: WizardCatalog,
): boolean {
  if (variant === "campus") return catalog.campusIntakes.some((i) => i.offerings.length > 0);
  if (variant === "pro") return catalog.proPrograms.length > 0;
  if (variant === "executive") return catalog.execPrograms.length > 0;
  return (catalog.certByUniverse[universe ?? ""] ?? []).length > 0;
}

/** La sélection courante est-elle valide (existe réellement dans le catalogue) ? */
export function isProjectValid(
  p: Project,
  universe: UniverseId | null,
  variant: BackgroundVariant,
  catalog: WizardCatalog,
): boolean {
  if (variant === "campus") {
    const intake = catalog.campusIntakes.find((i) => i.id === p.campusIntakeId);
    if (!intake) return false;
    return intake.offerings.some((o) => offeringKey(o.filiereId, o.level) === p.campusOfferingKey);
  }
  if (variant === "pro") return catalog.proPrograms.some((x) => x.offeringId === p.proOfferingId);
  if (variant === "executive")
    return catalog.execPrograms.some((x) => x.offeringId === p.execOfferingId);
  return (catalog.certByUniverse[universe ?? ""] ?? []).some((x) => x.id === p.certItemId);
}

/**
 * Clé de profil documentaire ACTIVE selon le parcours/programme choisi.
 *  - campus   : profil fixe « campus » (pas de catalog_item associé) ;
 *  - pro/exec : `doc_profile` du programme choisi (repli variante si absent) ;
 *  - cert.    : `doc_profile` de l'item choisi — jamais inventé (null si absent).
 */
export function activeDocProfileKey(
  p: Project,
  universe: UniverseId | null,
  variant: BackgroundVariant,
  catalog: WizardCatalog,
): string | null {
  if (variant === "campus") return "campus";
  if (variant === "pro")
    return catalog.proPrograms.find((x) => x.offeringId === p.proOfferingId)?.docProfile ?? "pro";
  if (variant === "executive")
    return (
      catalog.execPrograms.find((x) => x.offeringId === p.execOfferingId)?.docProfile ??
      "executive"
    );
  return (catalog.certByUniverse[universe ?? ""] ?? []).find((x) => x.id === p.certItemId)?.docProfile ?? null;
}

export type ProjectSummary = {
  /** Rentrée (Campus/Pro/Executive) — absent pour les certificats. */
  rentree?: string;
  /** Formation / programme choisi (libellé lisible). */
  formation: string;
  /** Diplôme/credential visé, dérivé de l'offre (jamais saisi). */
  credential?: string;
};

/** Résumé lisible du projet choisi, ou null si la sélection est invalide. */
export function describeProject(
  p: Project,
  universe: UniverseId | null,
  variant: BackgroundVariant,
  catalog: WizardCatalog,
): ProjectSummary | null {
  if (variant === "campus") {
    const intake = catalog.campusIntakes.find((i) => i.id === p.campusIntakeId);
    if (!intake) return null;
    const off = intake.offerings.find((o) => offeringKey(o.filiereId, o.level) === p.campusOfferingKey);
    if (!off) return null;
    return {
      rentree: `${intake.label} — ${intake.academicYear}`,
      formation: `${off.filiereName} · ${off.level}`,
      credential: `Diplôme visé : ${campusDiplomaForLevel(off.level)}`,
    };
  }
  if (variant === "pro" || variant === "executive") {
    const list = variant === "pro" ? catalog.proPrograms : catalog.execPrograms;
    const id = variant === "pro" ? p.proOfferingId : p.execOfferingId;
    const prog = list.find((x) => x.offeringId === id);
    if (!prog) return null;
    return {
      rentree: `${prog.intakeLabel} — ${prog.academicYear}`,
      formation: prog.name,
      credential: prog.credential ?? undefined,
    };
  }
  const it = (catalog.certByUniverse[universe ?? ""] ?? []).find((x) => x.id === p.certItemId);
  if (!it) return null;
  return { formation: it.name, credential: it.credential ?? undefined };
}

/** Lignes documentaires (libellé + exigence) d'un profil, triées. */
export function documentLinesForProfile(
  profileKey: string | null,
  catalog: WizardCatalog,
): DocLine[] {
  if (!profileKey) return [];
  const rows = catalog.documentProfiles[profileKey] ?? [];
  return [...rows]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({
      docKey: r.docKey,
      label: catalog.documentTypes[r.docKey] ?? r.docKey,
      requirement: r.requirement,
    }));
}

// ── Étape 4 : téléversement (état + gating) ──
/** Chemins Storage téléversés, par clé de document. */
export type Uploads = Record<string, string[]>;

/** Slug de `doc_key` pour le chemin Storage (le regex n'autorise pas « _ »). */
export const docSlug = (docKey: string) => docKey.replace(/_/g, "-");

/**
 * Tous les documents `required` du profil ont-ils au moins un fichier ?
 * (optional/conditional ne bloquent jamais.) Data-driven depuis le profil.
 */
export function areRequiredDocsUploaded(
  profileKey: string | null,
  catalog: WizardCatalog,
  uploads: Uploads,
): boolean {
  return documentLinesForProfile(profileKey, catalog)
    .filter((l) => l.requirement === "required")
    .every((l) => (uploads[l.docKey]?.length ?? 0) > 0);
}
