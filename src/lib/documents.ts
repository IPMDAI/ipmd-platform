import { createClient } from "@/lib/supabase/server";
import { universeNameById, universes } from "@/data/universes";
import { averageValue, mention } from "@/lib/grades";

const universeKindById: Record<string, string> = Object.fromEntries(
  universes.map((u) => [u.id, u.kind])
);

/** Documents officiels délivrés par l'IPMD. */
export const DOCUMENT_TYPES = [
  {
    slug: "attestation-scolarite",
    label: "Attestation de scolarité",
    icon: "📄",
    desc: "Justifie ton inscription pour l'année académique en cours.",
  },
  {
    slug: "certificat-scolarite",
    label: "Certificat de scolarité",
    icon: "🎓",
    desc: "Document officiel certifiant ta scolarité à l'IPMD.",
  },
  {
    slug: "attestation-reussite",
    label: "Attestation de réussite",
    icon: "🏆",
    desc: "Atteste la validation de ton parcours et ta mention.",
  },
  {
    slug: "carte",
    label: "Carte étudiant",
    icon: "🪪",
    desc: "Ta carte étudiant IPMD digitale, prête à imprimer.",
  },
] as const;

/** Documents pour les apprenants bootcamp (mêmes routes/slugs, libellés adaptés). */
export const BOOTCAMP_DOCUMENT_TYPES = [
  {
    slug: "attestation-scolarite",
    label: "Attestation d'inscription",
    icon: "📄",
    desc: "Justifie votre inscription au bootcamp.",
  },
  {
    slug: "certificat-scolarite",
    label: "Certificat de formation",
    icon: "🎓",
    desc: "Atteste votre formation bootcamp à l'IPMD.",
  },
  {
    slug: "attestation-reussite",
    label: "Certificat de fin de bootcamp",
    icon: "🏆",
    desc: "Atteste la complétion de votre bootcamp et votre mention.",
  },
  {
    slug: "carte",
    label: "Carte d'apprenant",
    icon: "🪪",
    desc: "Votre carte d'apprenant IPMD digitale, prête à imprimer.",
  },
] as const;

/** Jeu de documents selon le type d'apprenant (diplôme vs bootcamp). */
export function documentTypesFor(isBootcamp: boolean) {
  return isBootcamp ? BOOTCAMP_DOCUMENT_TYPES : DOCUMENT_TYPES;
}

export type DocumentSlug = (typeof DOCUMENT_TYPES)[number]["slug"];

export function isDocumentSlug(s: string): s is DocumentSlug {
  return DOCUMENT_TYPES.some((d) => d.slug === s);
}

/** Année académique au format « 2025 – 2026 » (bascule en septembre). */
export function academicYear(d = new Date()): string {
  const y = d.getFullYear();
  const start = d.getMonth() >= 8 ? y : y - 1;
  return `${start} – ${start + 1}`;
}

/** Matricule déterministe dérivé de l'identifiant. */
export function matricule(id: string): string {
  return `IPMD-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Date longue en français : « 22 juin 2026 ». */
export function longDate(d = new Date()): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type Dossier = {
  id: string;
  name: string;
  email: string;
  birthDate: string | null;
  birthPlace: string | null;
  className: string | null;
  filiereName: string | null;
  level: string | null;
  universe: string | null;
  isBootcamp: boolean;
  matricule: string;
  year: string;
  average: number | null;
  mention: string;
};

/**
 * Construit le dossier d'un étudiant. La RLS garantit l'accès
 * (l'étudiant lui-même, son parent, ou un admin).
 */
export async function getDossier(studentId: string): Promise<Dossier | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, universe, birth_date, birth_place")
    .eq("id", studentId)
    .single();
  if (!profile) return null;

  let className: string | null = null;
  let filiereName: string | null = null;
  let level: string | null = null;
  const { data: member } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", studentId)
    .maybeSingle();
  if (member?.class_id) {
    const { data: klass } = await supabase
      .from("classes")
      .select("name, level, filiere_id")
      .eq("id", member.class_id)
      .single();
    className = klass?.name ?? null;
    level = klass?.level ?? null;
    if (klass?.filiere_id) {
      const { data: fil } = await supabase
        .from("filieres")
        .select("name")
        .eq("id", klass.filiere_id)
        .single();
      filiereName = fil?.name ?? null;
    }
  }

  const { data: gradeRows } = await supabase
    .from("grades")
    .select("score, max_score, coefficient")
    .eq("student_id", studentId);
  const average = averageValue(gradeRows ?? []);

  return {
    id: studentId,
    name: profile.full_name || profile.email || "—",
    email: profile.email,
    birthDate: profile.birth_date ?? null,
    birthPlace: profile.birth_place ?? null,
    className,
    filiereName,
    level,
    universe: profile.universe ? universeNameById[profile.universe] ?? null : null,
    isBootcamp: profile.universe ? universeKindById[profile.universe] === "certificat" : false,
    matricule: matricule(studentId),
    year: academicYear(),
    average,
    mention: mention(average),
  };
}
