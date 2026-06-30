import type { Dossier } from "@/lib/documents";

/** Mentions légales du pied de page officiel (sans Facebook). */
export const OFFICIAL_LEGAL_LINES = [
  "IPMD SA — Siège social : Cocody, Angré — 01 BP 13662 Abidjan 01",
  "RCCM : CI-ABJ-03-2024-M-35856 — CC : 1948221 E — CNPS : 352039",
  "Aut. création : Décision N°1207/MESRS/DGES/DESUP/Kkj du 24 AVR. 2020",
  "Aut. ouverture : Arrêté N°1208/MESRS/DGES/DESUP/Kkj du 24 AVR. 2020",
  "Tél. : (+225) 05 75 75 88 88 / 05 66 05 14 14",
  "Email : info@ipmd.pro — Site : www.ipmd.pro",
];

export const NB_LONG =
  "Le présent document est délivré en version originale vérifiable par QR code. Toute reproduction doit conserver le QR code et le numéro unique du document. Pour toute vérification de l'authenticité de ce document, veuillez scanner le QR code ou contacter : audit@ipmd.pro.";

export const NB_SHORT =
  "Document officiel vérifiable par QR code. Pour toute vérification : audit@ipmd.pro.";

/** Date de naissance au format JJ/MM/AAAA (sans décalage de fuseau). */
export function frBirth(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      });
}

/** Retire un éventuel suffixe d'année (« — 2022-2023 », « 2022/2023 »…). */
function stripYear(s: string): string {
  return s
    .replace(/\b\d{4}\s*[-/–]\s*\d{4}\b/g, "")
    .replace(/\s*[—–-]\s*$/, "")
    .trim();
}

/**
 * Casse française propre pour un libellé de filière (acronymes préservés).
 * « Informatique Et Intelligence Artificielle » → « Informatique et
 * intelligence artificielle ».
 */
function frProperCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w, i) => {
      if (w.length >= 2 && w === w.toUpperCase() && /[A-ZÀ-Ÿ]/.test(w)) return w;
      const lower = w.toLowerCase();
      return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

/** Ligne « Niveau — Filière » nettoyée (année parasite retirée). */
export function programLine(d: Dossier): string {
  const level = d.level ? stripYear(d.level) : null;
  let filiere = d.filiereName ? stripYear(d.filiereName) : null;

  if (!filiere && d.className) {
    let c = stripYear(d.className);
    if (level && c.toLowerCase().startsWith(level.toLowerCase())) {
      c = c.slice(level.length).replace(/^\s*[—–-]?\s*/, "").trim();
    }
    filiere = c || null;
  }

  if (filiere) filiere = frProperCase(filiere);

  if (level && filiere) return `${level} — ${filiere}`;
  return filiere || level || "Formation IPMD";
}

export type DocKind = "scolarite" | "certificat" | "reussite";

/** Intitulé officiel du document selon le type (diplôme vs bootcamp). */
export function documentTitle(kind: DocKind, isBootcamp: boolean): string {
  const diplome: Record<DocKind, string> = {
    scolarite: "Attestation de scolarité",
    certificat: "Certificat de scolarité",
    reussite: "Attestation de réussite",
  };
  const bootcamp: Record<DocKind, string> = {
    scolarite: "Attestation d'inscription",
    certificat: "Certificat de formation",
    reussite: "Certificat de fin de bootcamp",
  };
  return (isBootcamp ? bootcamp : diplome)[kind];
}

/** Ligne de naissance « Né(e) le : … à … » ou null si aucune info. */
export function birthLine(d: Dossier): string | null {
  if (!d.birthDate && !d.birthPlace) return null;
  const datePart = d.birthDate ? `Né(e) le : ${frBirth(d.birthDate)}` : "Né(e)";
  const placePart = d.birthPlace ? ` à ${d.birthPlace}` : "";
  return `${datePart}${placePart}`;
}
