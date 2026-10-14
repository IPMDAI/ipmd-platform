"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/**
 * Actions « Soutenances / jurys / résultats » (D8-UI-3), côté DÉ / Administration.
 * TOUT passe par les RPC D8-3 / D8-4 déjà sécurisées : aucun UPDATE direct,
 * aucune décision calculée côté serveur, aucun seuil inventé. La base garde
 * l'éligibilité des jurés, les transitions, la comptabilisation des évaluations,
 * les bornes de note, la mention et le verrouillage après validation.
 */

async function requireStaff() {
  const supabase = await createClient();
  if (!supabase) return { error: "Service indisponible." as string };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." as string };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["directeur_etudes", "admin", "super_admin"].includes(me?.role ?? ""))
    return { error: "Réservé au Directeur des Études / à l'Administration." as string };
  return { supabase, userId: user.id };
}

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function orNull(v: string): string | null {
  return v === "" ? null : v;
}
function numOrNull(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
/** Combine date (YYYY-MM-DD) + heure (HH:MM) en timestamp, ou null. */
function dateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  return `${date}T${time}:00`;
}
function rev(id: string) {
  revalidatePath(`/espace/soutenance/${id}`);
  revalidatePath("/espace/soutenances");
}

// ── Soutenance ──────────────────────────────────────────────────────────────

/** Crée une soutenance depuis un travail (la RPC exige un travail VALIDE). */
export async function createDefense(_p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const work = s(fd, "work_id");
  if (!work) return { ok: false, message: "Le travail est obligatoire." };
  const { error } = await g.supabase.rpc("defense_create", { p_work: work });
  if (error) {
    const m = error.message || "";
    if (m.includes("valide")) return { ok: false, message: "Le travail doit être validé pour être soutenable." };
    if (m.includes("active") || m.includes("déjà")) return { ok: false, message: "Une soutenance active existe déjà pour ce travail." };
    return { ok: false, message: m };
  }
  revalidatePath("/espace/soutenances");
  return { ok: true, message: "Soutenance créée." };
}

export async function scheduleDefense(id: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const at = dateTime(s(fd, "date"), s(fd, "time"));
  const room = orNull(s(fd, "room_id"));
  if (!at) return { ok: false, message: "Date et heure obligatoires." };
  if (!room) return { ok: false, message: "La salle est obligatoire." };
  const { error } = await g.supabase.rpc("defense_schedule", {
    p_id: id, p_at: at, p_room: room, p_session: null,
  });
  if (error) return { ok: false, message: error.message || "Planification impossible." };
  rev(id);
  return { ok: true, message: "Soutenance planifiée." };
}

export async function rescheduleDefense(id: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const at = dateTime(s(fd, "date"), s(fd, "time"));
  const room = orNull(s(fd, "room_id"));
  const reason = s(fd, "reason");
  if (!at) return { ok: false, message: "Date et heure obligatoires." };
  if (!room) return { ok: false, message: "La salle est obligatoire." };
  if (!reason) return { ok: false, message: "Le motif est obligatoire." };
  const { error } = await g.supabase.rpc("defense_reschedule", {
    p_id: id, p_at: at, p_room: room, p_session: null,
    p_expected_at: orNull(s(fd, "expected_at")), p_reason: reason,
  });
  if (error) return { ok: false, message: error.message || "Report impossible." };
  rev(id);
  return { ok: true, message: "Soutenance reportée." };
}

export async function cancelDefense(id: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const reason = s(fd, "reason");
  if (!reason) return { ok: false, message: "Le motif d'annulation est obligatoire." };
  const { error } = await g.supabase.rpc("defense_cancel", { p_id: id, p_reason: reason });
  if (error) return { ok: false, message: error.message || "Annulation impossible." };
  rev(id);
  return { ok: true, message: "Soutenance annulée." };
}

export async function markHeldDefense(id: string, _p: FormResult | null, _fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const { error } = await g.supabase.rpc("defense_mark_held", { p_id: id });
  if (error) {
    const m = error.message || "";
    if (m.includes("président") || m.includes("jur")) return { ok: false, message: "Un président et au moins un juré actif sont requis." };
    return { ok: false, message: m || "Action impossible." };
  }
  rev(id);
  return { ok: true, message: "Soutenance marquée comme tenue." };
}

// ── Jury ────────────────────────────────────────────────────────────────────

export async function addJuryInternal(id: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const profile = s(fd, "profile_id");
  const role = s(fd, "role");
  if (!profile) return { ok: false, message: "Le juré interne est obligatoire." };
  if (!role) return { ok: false, message: "Le rôle est obligatoire." };
  const { error } = await g.supabase.rpc("jury_add_internal", { p_defense: id, p_profile: profile, p_role: role });
  if (error) {
    const m = error.message || "";
    if (m.includes("éligible")) return { ok: false, message: "Juré interne non éligible pédagogiquement." };
    if (m.includes("président") || m.includes("unique") || m.includes("doublon") || m.includes("déjà")) return { ok: false, message: "Rôle/membre en doublon (un seul président, pas de doublon de juré)." };
    return { ok: false, message: m };
  }
  rev(id);
  return { ok: true, message: "Juré interne ajouté." };
}

export async function addJuryExternal(id: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const name = s(fd, "name");
  const role = s(fd, "role");
  if (!name) return { ok: false, message: "Le nom du juré externe est obligatoire." };
  if (!role) return { ok: false, message: "Le rôle est obligatoire." };
  const { error } = await g.supabase.rpc("jury_add_external", {
    p_defense: id, p_name: name, p_function: orNull(s(fd, "function")),
    p_org: orNull(s(fd, "organization")), p_role: role,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("président") || m.includes("doublon") || m.includes("déjà")) return { ok: false, message: "Rôle/membre en doublon (un seul président, pas de doublon)." };
    return { ok: false, message: m };
  }
  rev(id);
  return { ok: true, message: "Juré externe ajouté." };
}

export async function removeJury(memberId: string, defenseId: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const reason = s(fd, "reason");
  if (!reason) return { ok: false, message: "Le motif de retrait est obligatoire." };
  const { error } = await g.supabase.rpc("jury_remove", { p_member: memberId, p_reason: reason });
  if (error) return { ok: false, message: error.message || "Retrait impossible." };
  rev(defenseId);
  return { ok: true, message: "Membre retiré du jury." };
}

// ── Évaluations ─────────────────────────────────────────────────────────────

export async function submitEvaluation(defenseId: string, memberId: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const status = s(fd, "eval_status");
  if (!status) return { ok: false, message: "Note ou abstention requise." };
  const { error } = await g.supabase.rpc("jury_evaluation_submit", {
    p_defense: defenseId, p_member: memberId, p_status: status,
    p_score: status === "note" ? numOrNull(s(fd, "score")) : null,
    p_comment: orNull(s(fd, "comment")),
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("déjà") || m.includes("existe")) return { ok: false, message: "Évaluation déjà saisie — utilisez la révision (avec motif)." };
    return { ok: false, message: m };
  }
  rev(defenseId);
  return { ok: true, message: "Évaluation enregistrée." };
}

export async function reviseEvaluation(defenseId: string, memberId: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const status = s(fd, "eval_status");
  const reason = s(fd, "reason");
  if (!status) return { ok: false, message: "Note ou abstention requise." };
  if (!reason) return { ok: false, message: "Le motif de révision est obligatoire." };
  const { error } = await g.supabase.rpc("jury_evaluation_revise", {
    p_defense: defenseId, p_member: memberId, p_status: status,
    p_score: status === "note" ? numOrNull(s(fd, "score")) : null,
    p_expected_score: numOrNull(s(fd, "expected_score")),
    p_reason: reason,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("concurrence") || m.includes("attendu")) return { ok: false, message: "Valeur attendue périmée (modifiée entre-temps) — rechargez." };
    return { ok: false, message: m };
  }
  rev(defenseId);
  return { ok: true, message: "Évaluation révisée." };
}

// ── Résultat / délibération ──────────────────────────────────────────────────

export async function recordResult(defenseId: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const score = numOrNull(s(fd, "score"));
  const decision = s(fd, "decision");
  const deliberation = s(fd, "deliberation");
  if (score === null) return { ok: false, message: "La note finale est obligatoire." };
  if (!decision) return { ok: false, message: "La décision du jury est obligatoire." };
  if (!deliberation) return { ok: false, message: "Le PV de délibération est obligatoire." };
  const { error } = await g.supabase.rpc("defense_record_result", {
    p_defense: defenseId, p_score: score, p_decision: decision, p_deliberation: deliberation,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("comptabilis")) return { ok: false, message: "Tous les jurés actifs doivent être évalués (note ou abstention), avec au moins une note." };
    if (m.includes("borne") || m.includes("min") || m.includes("max")) return { ok: false, message: "La note finale doit rester dans l'intervalle des notes du jury." };
    return { ok: false, message: m };
  }
  rev(defenseId);
  return { ok: true, message: "Résultat enregistré (délibéré)." };
}

export async function reviseResult(defenseId: string, _p: FormResult | null, fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const score = numOrNull(s(fd, "score"));
  const decision = s(fd, "decision");
  const deliberation = s(fd, "deliberation");
  const reason = s(fd, "reason");
  if (score === null) return { ok: false, message: "La note finale est obligatoire." };
  if (!decision) return { ok: false, message: "La décision est obligatoire." };
  if (!deliberation) return { ok: false, message: "Le PV est obligatoire." };
  if (!reason) return { ok: false, message: "Le motif de révision est obligatoire." };
  const { error } = await g.supabase.rpc("defense_revise_result", {
    p_defense: defenseId, p_score: score, p_decision: decision, p_deliberation: deliberation, p_reason: reason,
  });
  if (error) return { ok: false, message: error.message || "Révision impossible." };
  rev(defenseId);
  return { ok: true, message: "Résultat révisé." };
}

export async function validateResult(defenseId: string, _p: FormResult | null, _fd: FormData): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const { error } = await g.supabase.rpc("defense_validate_result", { p_defense: defenseId });
  if (error) return { ok: false, message: error.message || "Validation impossible." };
  rev(defenseId);
  return { ok: true, message: "Résultat validé (verrouillé)." };
}
