"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { repairPackSchedule } from "@/lib/candidature-actions";
import type { FormResult } from "@/types";

/**
 * B4-2 — Actions d'attribution/gestion de la Bourse IPMD (super_admin uniquement).
 *
 * Sécurité : `requireSuperAdmin()` (autorisation applicative) AVANT tout appel ;
 * les RPC B4-1 sont réservées à service_role et re-vérifient `p_actor` en défense
 * en profondeur. Aucune écriture DB directe depuis le client.
 *
 * Non-rétroactivité : les RPC ne touchent jamais student_finance/payment_schedules.
 * Après un changement autorisé, on reconstruit `admission_packs.schedule_json`
 * UNIQUEMENT si la candidature est `en_attente_paiement` (pack présent, non figé).
 * En `inscrit` (figé) ou `accepte` (pack pas encore créé) : aucun rebuild.
 */
async function requireSuperAdmin(): Promise<{ userId: string } | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "super_admin") return null;
  return { userId: user.id };
}

/** Traduit les exceptions des RPC bourse en messages FR lisibles. */
function mapRpcError(msg: string): string {
  if (/NOT_SUPER_ADMIN/.test(msg)) return "Action réservée au Super Admin.";
  if (/duplicate key|unique/.test(msg)) return "Une bourse active existe déjà pour ce dossier.";
  if (/BAD_KIND/.test(msg)) return "Type de bourse invalide.";
  if (/BAD_DURATION/.test(msg)) return "Durée invalide (1, 2 ou 3 ans).";
  if (/YEAR_OUT_OF_COVERAGE/.test(msg)) return "Année hors de la période couverte par la bourse.";
  if (/SCHOLARSHIP_NOT_ACTIVE/.test(msg)) return "Bourse non active : modification impossible.";
  if (/NO_SCHOLARSHIP/.test(msg)) return "Bourse introuvable.";
  if (/NO_ACTIVE_TERM/.test(msg)) return "Aucun terme actif à suspendre pour cette année.";
  if (/NO_SUSPENDED_TERM/.test(msg)) return "Aucun terme suspendu à reprendre pour cette année.";
  if (/NO_ACTIVE_SCHOLARSHIP/.test(msg)) return "Aucune bourse active à révoquer.";
  if (/term_mode_value_chk|scholarship_terms_(rate|amount)_check/.test(msg))
    return "Valeur de bourse invalide (taux dans ]0,1] ou montant > 0).";
  return `Opération refusée : ${msg}`;
}

/**
 * Reconstruit schedule_json APRÈS un changement de bourse, sans jamais recalculer
 * un échéancier figé. Rebuild uniquement en `en_attente_paiement`. Best-effort :
 * un échec de rebuild n'annule pas le changement de bourse déjà validé en base.
 */
async function rebuildIfEditable(candidatureId: string): Promise<string> {
  const admin = createAdminClient();
  if (!admin) return "";
  const { data: cand } = await admin
    .from("inscription_requests")
    .select("status")
    .eq("id", candidatureId)
    .maybeSingle();
  const status = (cand?.status as string) ?? null;
  if (status === "inscrit") return " Échéancier figé (déjà inscrit) : inchangé.";
  if (status !== "en_attente_paiement") return "";
  const res = await repairPackSchedule(candidatureId, { force: true });
  return res.ok ? " Échéancier du pack mis à jour." : ` Échéancier non régénéré : ${res.message}`;
}

export type GrantScholarshipInput = {
  candidatureId: string;
  kind: string;
  cumulable: boolean;
  durationYears: 1 | 2 | 3;
  startYear: string;
  reason: string;
  academicYear: string; // année du 1er terme (= startYear en pratique)
  mode: "taux" | "montant";
  rate: number | null;
  amount: number | null;
};

export async function grantScholarship(input: GrantScholarshipInput): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const { error } = await admin.rpc("grant_scholarship", {
    p_actor: ctx.userId,
    p_candidature_id: input.candidatureId,
    p_kind: input.kind,
    p_cumulable: input.cumulable,
    p_start_year: input.startYear,
    p_duration_years: input.durationYears,
    p_reason: input.reason.trim() || null,
    p_academic_year: input.academicYear,
    p_mode: input.mode,
    p_rate: input.mode === "taux" ? input.rate : null,
    p_amount: input.mode === "montant" ? input.amount : null,
  });
  if (error) return { ok: false, message: mapRpcError(error.message) };

  const note = await rebuildIfEditable(input.candidatureId);
  revalidatePath("/espace/candidatures");
  return { ok: true, message: `Bourse attribuée.${note}` };
}

export type SetTermInput = {
  candidatureId: string;
  scholarshipId: string;
  academicYear: string;
  mode: "taux" | "montant";
  rate: number | null;
  amount: number | null;
};

export async function setScholarshipTerm(input: SetTermInput): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const { error } = await admin.rpc("set_scholarship_term", {
    p_actor: ctx.userId,
    p_scholarship_id: input.scholarshipId,
    p_academic_year: input.academicYear,
    p_mode: input.mode,
    p_rate: input.mode === "taux" ? input.rate : null,
    p_amount: input.mode === "montant" ? input.amount : null,
  });
  if (error) return { ok: false, message: mapRpcError(error.message) };

  const note = await rebuildIfEditable(input.candidatureId);
  revalidatePath("/espace/candidatures");
  return { ok: true, message: `Terme ${input.academicYear} mis à jour (historique conservé).${note}` };
}

export async function suspendScholarshipTerm(
  candidatureId: string,
  scholarshipId: string,
  academicYear: string
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const { error } = await admin.rpc("suspend_scholarship_term", {
    p_actor: ctx.userId,
    p_scholarship_id: scholarshipId,
    p_academic_year: academicYear,
  });
  if (error) return { ok: false, message: mapRpcError(error.message) };

  const note = await rebuildIfEditable(candidatureId);
  revalidatePath("/espace/candidatures");
  return { ok: true, message: `Bourse suspendue pour ${academicYear}.${note}` };
}

export async function resumeScholarshipTerm(
  candidatureId: string,
  scholarshipId: string,
  academicYear: string
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const { error } = await admin.rpc("resume_scholarship_term", {
    p_actor: ctx.userId,
    p_scholarship_id: scholarshipId,
    p_academic_year: academicYear,
  });
  if (error) return { ok: false, message: mapRpcError(error.message) };

  const note = await rebuildIfEditable(candidatureId);
  revalidatePath("/espace/candidatures");
  return { ok: true, message: `Bourse reprise pour ${academicYear}.${note}` };
}

export async function revokeScholarship(
  candidatureId: string,
  scholarshipId: string,
  reason: string
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const { error } = await admin.rpc("revoke_scholarship", {
    p_actor: ctx.userId,
    p_scholarship_id: scholarshipId,
    p_reason: reason.trim() || null,
  });
  if (error) return { ok: false, message: mapRpcError(error.message) };

  const note = await rebuildIfEditable(candidatureId);
  revalidatePath("/espace/candidatures");
  return { ok: true, message: `Bourse révoquée (années futures).${note}` };
}
