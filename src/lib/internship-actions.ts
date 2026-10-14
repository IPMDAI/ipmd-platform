"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/**
 * Actions « Stages / entreprises / encadreurs » (D8-UI-1), côté DÉ / Administration.
 *
 * Règles de ce module :
 * - Toutes les créations passent par ces Server Actions (aucun INSERT navigateur).
 * - Toutes les TRANSITIONS passent par les RPC D8-1 déjà sécurisées.
 * - Aucune règle métier recalculée ici : la base (RLS + RPC + triggers) est
 *   l'autorité finale ; ces actions ne font que relayer et rester lisibles.
 * - Les snapshots (student_name, created_by…) sont posés par la base.
 * - Aucun pouvoir juridique/signature : la convention signée relève de l'AG (D8-UI-4).
 */

async function requireStaff() {
  const supabase = await createClient();
  if (!supabase) return { error: "Service indisponible." as string };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["directeur_etudes", "admin", "super_admin"].includes(me?.role ?? ""))
    return { error: "Réservé au Directeur des Études / à l'Administration." };
  return { supabase, userId: user.id };
}

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function orNull(v: string): string | null {
  return v === "" ? null : v;
}

/** Traduit l'erreur Postgres (déjà en français) en message lisible. */
function rpcError(error: { message?: string } | null, fallback: string): string {
  const m = error?.message || "";
  return m || fallback;
}

// ────────────────────────────────────────────────────────────────────────────
// Entreprises d'accueil
// ────────────────────────────────────────────────────────────────────────────

/** Crée une entreprise d'accueil (fiche opérationnelle, status 'actif'). */
export async function createHostCompany(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };

  const name = s(formData, "name");
  if (!name) return { ok: false, message: "Le nom de l'entreprise est obligatoire." };

  const { error } = await g.supabase.from("host_companies").insert({
    name,
    sector: orNull(s(formData, "sector")),
    city: orNull(s(formData, "city")),
    country: orNull(s(formData, "country")),
    address: orNull(s(formData, "address")),
    website: orNull(s(formData, "website")),
    notes: orNull(s(formData, "notes")),
    created_by: g.userId,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/entreprises");
  return { ok: true, message: "Entreprise d'accueil créée." };
}

/** Archive / réactive une entreprise (RPC gardée + CHECK de cohérence D8-1). */
export async function setHostCompanyArchived(
  id: string,
  archived: boolean,
  _prev: FormResult | null,
  _formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };

  const { error } = await g.supabase.rpc("host_company_set_archived", {
    p_id: id,
    p_archived: archived,
  });
  if (error)
    return { ok: false, message: rpcError(error, "Changement d'état impossible.") };

  revalidatePath("/espace/entreprises");
  return {
    ok: true,
    message: archived ? "Entreprise archivée." : "Entreprise réactivée.",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Stages
// ────────────────────────────────────────────────────────────────────────────

/** Crée un stage au statut 'brouillon'. Le snapshot student_name est posé par la base. */
export async function createInternship(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };

  const student_id = s(formData, "student_id");
  const host_company_id = s(formData, "host_company_id");
  const title = s(formData, "title");
  if (!student_id) return { ok: false, message: "L'étudiant est obligatoire." };
  if (!host_company_id) return { ok: false, message: "L'entreprise d'accueil est obligatoire." };
  if (!title) return { ok: false, message: "L'intitulé du stage est obligatoire." };

  // INSERT gardé par la RLS (status='brouillon', student_id non nul, validated null)
  // et par le trigger guard_internship_company_active (entreprise active obligatoire).
  const { error } = await g.supabase.from("internships").insert({
    student_id,
    host_company_id,
    title,
    academic_year: orNull(s(formData, "academic_year")),
    start_date: orNull(s(formData, "start_date")),
    end_date: orNull(s(formData, "end_date")),
    mission: orNull(s(formData, "mission")),
    supervisor_name: orNull(s(formData, "supervisor_name")),
    supervisor_function: orNull(s(formData, "supervisor_function")),
    supervisor_email: orNull(s(formData, "supervisor_email")),
    supervisor_phone: orNull(s(formData, "supervisor_phone")),
    module_id: orNull(s(formData, "module_id")),
    status: "brouillon",
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("entreprise") || m.includes("active"))
      return { ok: false, message: "Entreprise d'accueil archivée : non sélectionnable pour un nouveau stage." };
    return { ok: false, message: m };
  }

  revalidatePath("/espace/stages");
  return { ok: true, message: "Stage créé en brouillon." };
}

/** Transition simple sans paramètre (submit / validate / start / finish). */
async function simpleTransition(
  id: string,
  rpc: "internship_submit" | "internship_validate" | "internship_start" | "internship_finish",
  okMsg: string
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const { error } = await g.supabase.rpc(rpc, { p_id: id });
  if (error) return { ok: false, message: rpcError(error, "Action impossible.") };
  revalidatePath(`/espace/stage/${id}`);
  revalidatePath("/espace/stages");
  return { ok: true, message: okMsg };
}

export async function submitInternship(id: string, _p: FormResult | null, _f: FormData) {
  return simpleTransition(id, "internship_submit", "Stage soumis pour validation.");
}
export async function validateInternship(id: string, _p: FormResult | null, _f: FormData) {
  return simpleTransition(id, "internship_validate", "Stage validé.");
}
export async function startInternship(id: string, _p: FormResult | null, _f: FormData) {
  return simpleTransition(id, "internship_start", "Stage démarré.");
}
export async function finishInternship(id: string, _p: FormResult | null, _f: FormData) {
  return simpleTransition(id, "internship_finish", "Stage terminé.");
}

/** Annule le stage (motif obligatoire). */
export async function cancelInternship(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const reason = s(formData, "reason");
  if (!reason) return { ok: false, message: "Le motif d'annulation est obligatoire." };
  const { error } = await g.supabase.rpc("internship_cancel", { p_id: id, p_reason: reason });
  if (error) return { ok: false, message: rpcError(error, "Annulation impossible.") };
  revalidatePath(`/espace/stage/${id}`);
  revalidatePath("/espace/stages");
  return { ok: true, message: "Stage annulé." };
}

/** Change l'entreprise d'accueil (motif + concurrence via valeur attendue). */
export async function changeInternshipCompany(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const company = s(formData, "host_company_id");
  const reason = s(formData, "reason");
  if (!company) return { ok: false, message: "La nouvelle entreprise est obligatoire." };
  if (!reason) return { ok: false, message: "Le motif est obligatoire." };
  const { error } = await g.supabase.rpc("internship_change_company", {
    p_id: id,
    p_company: company,
    p_expected_company: orNull(s(formData, "expected_company")),
    p_reason: reason,
  });
  if (error) return { ok: false, message: rpcError(error, "Changement d'entreprise impossible.") };
  revalidatePath(`/espace/stage/${id}`);
  revalidatePath("/espace/stages");
  return { ok: true, message: "Entreprise du stage modifiée." };
}

/** Change les dates (motif + concurrence via valeurs attendues). */
export async function changeInternshipDates(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const reason = s(formData, "reason");
  if (!reason) return { ok: false, message: "Le motif est obligatoire." };
  const { error } = await g.supabase.rpc("internship_change_dates", {
    p_id: id,
    p_start: orNull(s(formData, "start_date")),
    p_end: orNull(s(formData, "end_date")),
    p_expected_start: orNull(s(formData, "expected_start")),
    p_expected_end: orNull(s(formData, "expected_end")),
    p_reason: reason,
  });
  if (error) return { ok: false, message: rpcError(error, "Changement de dates impossible.") };
  revalidatePath(`/espace/stage/${id}`);
  revalidatePath("/espace/stages");
  return { ok: true, message: "Dates du stage modifiées." };
}

/** Affecte / change l'encadreur académique (éligibilité + motif gardés par la RPC). */
export async function assignInternshipAdvisor(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const advisor = s(formData, "advisor_id");
  const reason = s(formData, "reason");
  if (!advisor) return { ok: false, message: "L'encadreur est obligatoire." };
  if (!reason) return { ok: false, message: "Le motif est obligatoire." };
  const { error } = await g.supabase.rpc("internship_assign_advisor", {
    p_id: id,
    p_advisor: advisor,
    p_expected_advisor: orNull(s(formData, "expected_advisor")),
    p_reason: reason,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("non éligible"))
      return { ok: false, message: "Encadreur non éligible pédagogiquement (enseignant ou DÉ avec profil enseignant valide/actif requis)." };
    return { ok: false, message: rpcError(error, "Affectation impossible.") };
  }
  revalidatePath(`/espace/stage/${id}`);
  revalidatePath("/espace/stages");
  return { ok: true, message: "Encadreur académique affecté." };
}
