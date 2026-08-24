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
