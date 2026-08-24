import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScholarshipEngagement, ScholarshipTerm } from "@/lib/admission-schedule";

/**
 * Charge la bourse ACTIVE (engagement + termes) d'une candidature ou d'un étudiant.
 * Lecture via service-role (RLS `scholarships` = super_admin only). Renvoie `null`
 * si aucune bourse active. Injecté dans buildScheduleSnapshot (résolution par année).
 */
type Loaded = { engagement: ScholarshipEngagement; terms: ScholarshipTerm[] } | null;

async function loadBy(column: "candidature_id" | "student_id", value: string): Promise<Loaded> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: eng } = await admin
    .from("scholarships")
    .select("id, status, start_academic_year, duration_years, plan_discount_cumulable")
    .eq(column, value)
    .eq("status", "active")
    .maybeSingle();
  if (!eng) return null;
  const { data: terms } = await admin
    .from("scholarship_terms")
    .select("id, academic_year, mode, rate, amount, status")
    .eq("scholarship_id", eng.id as string);
  return {
    engagement: {
      id: eng.id as string,
      status: eng.status as "active" | "revoked",
      start_academic_year: eng.start_academic_year as string,
      duration_years: Number(eng.duration_years) as 1 | 2 | 3,
      plan_discount_cumulable: Boolean(eng.plan_discount_cumulable),
    },
    terms: (terms ?? []).map((t) => ({
      id: t.id as string,
      academic_year: t.academic_year as string,
      mode: t.mode as "taux" | "montant",
      rate: t.rate != null ? Number(t.rate) : null,
      amount: t.amount != null ? Number(t.amount) : null,
      status: t.status as "active" | "superseded" | "suspended",
    })),
  };
}

export const loadScholarshipForCandidature = (candidatureId: string) => loadBy("candidature_id", candidatureId);
export const loadScholarshipForStudent = (studentId: string) => loadBy("student_id", studentId);

/**
 * Vue ADMIN (super_admin) d'une bourse : engagement ACTIF + `reason` PRIVÉ + tous
 * les termes (active/suspended/superseded) pour l'historique. Réservé à la fiche
 * candidature côté super_admin (jamais exposé au candidat). Chargement groupé.
 */
export type ScholarshipAdminTerm = {
  id: string;
  academic_year: string;
  mode: "taux" | "montant";
  rate: number | null;
  amount: number | null;
  status: "active" | "superseded" | "suspended";
  superseded_by: string | null;
  created_at: string | null;
};
export type ScholarshipAdmin = {
  id: string;
  kind: string;
  status: "active" | "revoked";
  start_academic_year: string;
  duration_years: 1 | 2 | 3;
  plan_discount_cumulable: boolean;
  reason: string | null;
  terms: ScholarshipAdminTerm[];
};

export async function loadScholarshipsAdminForCandidatures(
  ids: string[]
): Promise<Map<string, ScholarshipAdmin>> {
  const map = new Map<string, ScholarshipAdmin>();
  const admin = createAdminClient();
  if (!admin || ids.length === 0) return map;

  // Après inscription, la bourse est re-rattachée à `student_id` (candidature_id
  // devient NULL). On résout donc les student_id des dossiers INSCRITS via le
  // profil lié (profiles.candidature_id) pour aussi charger la bourse par
  // student_id — sinon le panneau la croit absente sur un inscrit.
  const { data: profs } = await admin
    .from("profiles")
    .select("id, candidature_id")
    .in("candidature_id", ids);
  const studentToCand = new Map<string, string>(); // student_id -> candidature_id
  for (const p of profs ?? []) studentToCand.set(p.id as string, p.candidature_id as string);
  const studentIds = Array.from(studentToCand.keys());

  const cols =
    "id, candidature_id, student_id, kind, status, start_academic_year, duration_years, plan_discount_cumulable, reason";
  const [byCand, byStudent] = await Promise.all([
    admin.from("scholarships").select(cols).in("candidature_id", ids).eq("status", "active"),
    studentIds.length
      ? admin.from("scholarships").select(cols).in("student_id", studentIds).eq("status", "active")
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const engs = [...((byCand.data as Record<string, unknown>[]) ?? []), ...((byStudent.data as Record<string, unknown>[]) ?? [])];
  if (engs.length === 0) return map;

  // scholarship_id -> candidature_id (direct si présent, sinon via le profil rattaché).
  const schToCand = new Map<string, string>();
  for (const e of engs) {
    const cid = (e.candidature_id as string) ?? studentToCand.get(e.student_id as string);
    if (cid) schToCand.set(e.id as string, cid);
  }

  const { data: terms } = await admin
    .from("scholarship_terms")
    .select("id, scholarship_id, academic_year, mode, rate, amount, status, superseded_by, created_at")
    .in("scholarship_id", Array.from(schToCand.keys()));

  const termsBySch = new Map<string, ScholarshipAdminTerm[]>();
  for (const t of terms ?? []) {
    const arr = termsBySch.get(t.scholarship_id as string) ?? [];
    arr.push({
      id: t.id as string,
      academic_year: t.academic_year as string,
      mode: t.mode as "taux" | "montant",
      rate: t.rate != null ? Number(t.rate) : null,
      amount: t.amount != null ? Number(t.amount) : null,
      status: t.status as "active" | "superseded" | "suspended",
      superseded_by: (t.superseded_by as string) ?? null,
      created_at: (t.created_at as string) ?? null,
    });
    termsBySch.set(t.scholarship_id as string, arr);
  }

  for (const e of engs) {
    const cid = schToCand.get(e.id as string);
    if (!cid) continue;
    map.set(cid, {
      id: e.id as string,
      kind: e.kind as string,
      status: e.status as "active" | "revoked",
      start_academic_year: e.start_academic_year as string,
      duration_years: Number(e.duration_years) as 1 | 2 | 3,
      plan_discount_cumulable: Boolean(e.plan_discount_cumulable),
      reason: (e.reason as string) ?? null,
      terms: termsBySch.get(e.id as string) ?? [],
    });
  }
  return map;
}
