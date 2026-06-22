import { createClient } from "@/lib/supabase/server";
import { averageValue, mention } from "@/lib/grades";

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
  className: string | null;
  filiereName: string | null;
  level: string | null;
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
    .select("full_name, email")
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
    className,
    filiereName,
    level,
    matricule: matricule(studentId),
    year: academicYear(),
    average,
    mention: mention(average),
  };
}
