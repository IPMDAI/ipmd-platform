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

const ORDINALS: Record<number, string> = {
  1: "première",
  2: "deuxième",
  3: "troisième",
  4: "quatrième",
  5: "cinquième",
  6: "sixième",
};

/**
 * Décompose un niveau (« Licence 3 ») en formulations officielles :
 * - `annee` : « troisième année de Licence (L3) »
 * - `court` : « Licence 3 (L3) »
 * Renvoie null si le niveau n'est pas de la forme « <Cycle> <chiffre> ».
 */
export function levelPhrases(
  level: string | null
): { annee: string; court: string } | null {
  if (!level) return null;
  const m = stripYear(level).match(/^([A-Za-zÀ-ÿ]+)\s*(\d)/);
  if (!m) return null;
  const cycle = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const num = parseInt(m[2], 10);
  const code = `${cycle.charAt(0).toUpperCase()}${num}`;
  const ord = ORDINALS[num] ?? `${num}e`;
  return {
    annee: `${ord} année de ${cycle} (${code})`,
    court: `${cycle} ${num} (${code})`,
  };
}

// ── Attestation de RÉUSSITE — format officiel (en-tête ministériel) ──────────

/** En-tête d'État (haut du document officiel). */
export const MINISTRY_HEADER = {
  left: "MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR\nET DE LA RECHERCHE SCIENTIFIQUE",
  right: "RÉPUBLIQUE DE CÔTE D'IVOIRE",
  motto: "Union – Discipline – Travail",
  estab: "Établissement privé d'enseignement supérieur",
};

/** « Le Directeur des Études » → « Directeur des Études » (retire l'article). */
export function stripArticle(title: string): string {
  return title.replace(/^\s*(l['’]|le\s+|la\s+)/i, "").trim();
}

/** Accord « soussigné(e) » d'après le genre grammatical de la fonction. */
export function soussigneWord(title: string): string {
  return /directrice/i.test(title) || /^\s*la\s/i.test(title) ? "soussignée" : "soussigné";
}

/** Introduction « Je soussigné(e), <fonction> de l'IPMD, atteste par la présente que : ». */
export function soussigneIntro(signatoryTitle: string): string {
  return `Je ${soussigneWord(signatoryTitle)}, ${stripArticle(
    signatoryTitle
  )} de l'Institut Polytechnique des Métiers du Digital (IPMD), atteste par la présente que :`;
}

/** Fin de cycle (L3 / M2 / Master Pro) → clause soutenance de projet de fin de formation. */
export function isEndOfCycle(level: string | null): boolean {
  const l = (level ?? "").toLowerCase();
  return (
    /licence\s*3|\bl3\b/.test(l) ||
    /master\s*2|\bm2\b/.test(l) ||
    (/master/.test(l) && /(pro|unique|intensif)/.test(l))
  );
}

/** Formule d'admission/obtention selon le niveau validé. */
export function admissionPhrase(level: string | null, fem?: boolean | null): string {
  const admis = fem === true ? "admise" : fem === false ? "admis" : "admis(e)";
  const l = (level ?? "").toLowerCase();
  if (/master/.test(l)) {
    if (/master\s*1|\bm1\b/.test(l)) return `${admis} en Master 2 (M2)`;
    return "titulaire du Master professionnel";
  }
  if (/licence/.test(l)) {
    const m = l.match(/licence\s*(\d)|\bl(\d)\b/);
    const n = m ? parseInt(m[1] ?? m[2], 10) : NaN;
    if (n === 1) return `${admis} en deuxième année de Licence (L2)`;
    if (n === 2) return `${admis} en troisième année de Licence (L3)`;
    return `titulaire de la Licence professionnelle et ${admis} en Master 1 (M1)`;
  }
  return `${admis} à l'année supérieure`;
}

/**
 * Corps officiel de l'attestation de RÉUSSITE (sans moyenne ni mention).
 * « <sujet> a validé avec succès l'ensemble de ses semestres[ + soutenance],
 *  … En conséquence, il/elle est déclaré(e) <admission>, filière …, … ».
 */
export function reussiteOfficialParagraphs(opts: {
  name: string;
  program: string;
  level: string | null;
  year: string;
  civilite: { label: string; fem: boolean } | null;
  /** Libellé d'admission/titre CONFIRMÉ par l'admin (ex. « admis en Licence 3 »).
   * À défaut, repli sur admissionPhrase (à faire valider avant émission). */
  admission?: string | null;
  /** Clause soutenance CONFIRMÉE par l'admin. undefined → repli sur isEndOfCycle. */
  soutenance?: boolean;
}): string[] {
  const fem = opts.civilite?.fem ?? null;
  const sujet = opts.civilite ? `${opts.civilite.label} ${opts.name}` : opts.name;
  const ilelle = fem === true ? "elle" : fem === false ? "il" : "il/elle";
  const declare = fem === true ? "déclarée" : fem === false ? "déclaré" : "déclaré(e)";
  const dashIdx = opts.program.indexOf(" — ");
  const filiere = dashIdx >= 0 ? opts.program.slice(dashIdx + 3) : null;
  const withSoutenance = opts.soutenance ?? isEndOfCycle(opts.level);
  const soutenance = withSoutenance
    ? ", présenté ses projets digitaux et soutenu avec succès son projet de fin de formation"
    : "";
  const admission = (opts.admission && opts.admission.trim()) || admissionPhrase(opts.level, fem);
  return [
    `${sujet} a validé avec succès l'ensemble de ses semestres${soutenance}, conformément aux exigences académiques de l'Institut, au titre de l'année académique ${opts.year}.`,
    `En conséquence, ${ilelle} est ${declare} ${admission}${
      filiere ? `, filière ${filiere}` : ""
    }, ayant satisfait à l'ensemble des exigences académiques requises pour la validation de son parcours de formation.`,
    "La présente attestation lui est délivrée pour servir et valoir ce que de droit.",
  ];
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

/** Ligne de naissance « Né(e) le : … à … ». `fem` accorde (Née / Né). */
export function birthLine(
  d: Dossier,
  fem?: boolean | null
): string | null {
  if (!d.birthDate && !d.birthPlace) return null;
  const ne = fem === true ? "Née" : fem === false ? "Né" : "Né(e)";
  const datePart = d.birthDate ? `${ne} le : ${frBirth(d.birthDate)}` : ne;
  const placePart = d.birthPlace ? ` à ${d.birthPlace}` : "";
  return `${datePart}${placePart}`;
}

/** Civilité choisie (pilote l'accord Madame/Mademoiselle/Monsieur). */
export function parseCivilite(
  s?: string | null
): { label: string; fem: boolean } | null {
  const v = (s ?? "").trim().toLowerCase();
  if (v === "m" || v === "mr" || v === "monsieur") return { label: "Monsieur", fem: false };
  if (v === "mme" || v === "madame") return { label: "Madame", fem: true };
  if (v === "mlle" || v === "mademoiselle") return { label: "Mademoiselle", fem: true };
  return null;
}
