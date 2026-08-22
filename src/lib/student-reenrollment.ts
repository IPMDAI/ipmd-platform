import { requireUser } from "@/lib/require-user";
import { REGLEMENT_VERSION } from "@/data/reglement";

/**
 * Phase B — chargement READ-ONLY du dossier de réinscription de l'étudiant
 * connecté (status 'prepared' pour 2026-2027). Renvoie null si aucun dossier
 * à confirmer. Aucune écriture. RLS : l'étudiant lit sa propre ligne.
 */

export const REENROLL_YEAR = "2026-2027";
export const AVENANT_VERSION = "avenant-2026-2027";

export type StudentReenrollmentView = {
  id: string;
  academicYear: string;
  status: string;
  identity: {
    fullName: string;
    email: string;
    phone: string | null;
    whatsapp: string | null;
    birthDate: string | null;
    birthPlace: string | null;
  };
  fromClassName: string | null;
  fromLevel: string | null;
  toClassName: string | null;
  toLevel: string | null;
  filiereName: string | null;
  registrationFee: number | null;
  tuitionDue: number | null;
  totalDue: number | null;
  reglementVersion: string;
  avenantVersion: string;
};

export async function loadStudentReenrollment(): Promise<StudentReenrollmentView | null> {
  const { supabase, userId } = await requireUser();
  if (!supabase) return null;

  const { data: r } = await supabase
    .from("reenrollments")
    .select(
      "id, academic_year, status, from_class_id, from_level, to_class_id, to_level, registration_fee, tuition_due, total_due",
    )
    .eq("student_id", userId)
    .eq("academic_year", REENROLL_YEAR)
    .eq("status", "prepared")
    .maybeSingle();
  if (!r) return null;

  const [{ data: prof }, { data: fromC }, { data: toC }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone, whatsapp, birth_date, birth_place")
      .eq("id", userId)
      .single(),
    r.from_class_id
      ? supabase.from("classes").select("name, level").eq("id", r.from_class_id).maybeSingle()
      : Promise.resolve({ data: null }),
    r.to_class_id
      ? supabase.from("classes").select("name, level, filiere_id").eq("id", r.to_class_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let filiereName: string | null = null;
  const toClass = toC as { name?: string; level?: string; filiere_id?: string } | null;
  if (toClass?.filiere_id) {
    const { data: f } = await supabase.from("filieres").select("name").eq("id", toClass.filiere_id).maybeSingle();
    filiereName = (f?.name as string) ?? null;
  }
  const fromClass = fromC as { name?: string; level?: string } | null;

  const num = (v: unknown) => (v == null ? null : Number(v));

  return {
    id: r.id as string,
    academicYear: r.academic_year as string,
    status: r.status as string,
    identity: {
      fullName: (prof?.full_name as string) ?? "—",
      email: (prof?.email as string) ?? "",
      phone: (prof?.phone as string) ?? null,
      whatsapp: (prof?.whatsapp as string) ?? null,
      birthDate: (prof?.birth_date as string) ?? null,
      birthPlace: (prof?.birth_place as string) ?? null,
    },
    fromClassName: fromClass?.name ?? null,
    fromLevel: (r.from_level as string) ?? fromClass?.level ?? null,
    toClassName: toClass?.name ?? null,
    toLevel: (r.to_level as string) ?? toClass?.level ?? null,
    filiereName,
    registrationFee: num(r.registration_fee),
    tuitionDue: num(r.tuition_due),
    totalDue: num(r.total_due),
    reglementVersion: REGLEMENT_VERSION,
    avenantVersion: AVENANT_VERSION,
  };
}
