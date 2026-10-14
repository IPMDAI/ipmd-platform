"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/**
 * Actions « Travaux académiques » (D8-UI-2), côté DÉ / Administration.
 * - Création et transitions EXCLUSIVEMENT via les RPC D8-2 déjà sécurisées.
 * - Aucune modification directe de statut, aucune logique métier recalculée.
 * - Le dépôt du FICHIER passe par le système documentaire existant
 *   (student_documents + submitDocument) — jamais un 2e système ici.
 * - Les états depose / a_corriger / valide viennent de la base.
 */

async function requireStaff() {
  const supabase = await createClient();
  if (!supabase) return { error: "Service indisponible." as string };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." as string };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["directeur_etudes", "admin", "super_admin"].includes(me?.role ?? ""))
    return { error: "Réservé au Directeur des Études / à l'Administration." as string };
  return { supabase, userId: user.id };
}

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function orNull(v: string): string | null {
  return v === "" ? null : v;
}

/** Crée un travail via la RPC academic_work_create (toutes validations en base). */
export async function createAcademicWork(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };

  const student = s(formData, "student_id");
  const year = s(formData, "academic_year");
  const workType = s(formData, "work_type");
  const title = s(formData, "title");
  if (!student) return { ok: false, message: "L'étudiant est obligatoire." };
  if (!year) return { ok: false, message: "L'année académique est obligatoire." };
  if (!workType) return { ok: false, message: "Le type de travail est obligatoire." };
  if (!title) return { ok: false, message: "Le titre / sujet est obligatoire." };

  const { error } = await g.supabase.rpc("academic_work_create", {
    p_student: student,
    p_year: year,
    p_work_type: workType,
    p_title: title,
    p_internship: orNull(s(formData, "internship_id")),
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("n'appartenant pas") || m.includes("stage inexistant"))
      return { ok: false, message: "Stage inexistant ou n'appartenant pas à cet étudiant." };
    return { ok: false, message: m };
  }

  revalidatePath("/espace/travaux");
  return { ok: true, message: "Travail créé." };
}

async function rpcOnWork(
  id: string,
  rpc: "academic_work_open" | "academic_work_validate",
  okMsg: string
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const { error } = await g.supabase.rpc(rpc, { p_id: id });
  if (error) return { ok: false, message: error.message || "Action impossible." };
  revalidatePath(`/espace/travail/${id}`);
  revalidatePath("/espace/travaux");
  return { ok: true, message: okMsg };
}

/** Ouvre le dépôt documentaire (brouillon → a_deposer), idempotent côté base. */
export async function openAcademicWork(id: string, _p: FormResult | null, _f: FormData) {
  return rpcOnWork(id, "academic_work_open", "Dépôt ouvert pour l'étudiant.");
}
/** Valide le travail (depose → valide) + synchronise le document. */
export async function validateAcademicWork(id: string, _p: FormResult | null, _f: FormData) {
  return rpcOnWork(id, "academic_work_validate", "Travail validé.");
}

/** Demande une correction (depose → a_corriger) + motif ; l'étudiant redépose. */
export async function requestCorrection(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const reason = s(formData, "reason");
  if (!reason) return { ok: false, message: "Le motif de correction est obligatoire." };
  const { error } = await g.supabase.rpc("academic_work_request_correction", {
    p_id: id,
    p_reason: reason,
  });
  if (error) return { ok: false, message: error.message || "Renvoi en correction impossible." };
  revalidatePath(`/espace/travail/${id}`);
  revalidatePath("/espace/travaux");
  return { ok: true, message: "Correction demandée." };
}

/** Annule le travail (motif obligatoire). */
export async function cancelAcademicWork(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireStaff();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const reason = s(formData, "reason");
  if (!reason) return { ok: false, message: "Le motif d'annulation est obligatoire." };
  const { error } = await g.supabase.rpc("academic_work_cancel", { p_id: id, p_reason: reason });
  if (error) return { ok: false, message: error.message || "Annulation impossible." };
  revalidatePath(`/espace/travail/${id}`);
  revalidatePath("/espace/travaux");
  return { ok: true, message: "Travail annulé." };
}

/** Affecte / change l'encadreur (éligibilité + motif gardés par la RPC). */
export async function assignWorkAdvisor(
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
  const { error } = await g.supabase.rpc("academic_work_assign_advisor", {
    p_id: id,
    p_advisor: advisor,
    p_expected_advisor: orNull(s(formData, "expected_advisor")),
    p_reason: reason,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("non éligible"))
      return { ok: false, message: "Encadreur non éligible pédagogiquement (enseignant ou DÉ avec profil enseignant valide/actif requis)." };
    return { ok: false, message: m || "Affectation impossible." };
  }
  revalidatePath(`/espace/travail/${id}`);
  revalidatePath("/espace/travaux");
  return { ok: true, message: "Encadreur affecté." };
}
