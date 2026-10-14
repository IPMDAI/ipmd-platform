"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/**
 * D7-3 — Actions d'AFFECTATION PÉDAGOGIQUE (module / créneau / séance). Elles ne
 * font QUE relayer les RPC sécurisées D7-2 (éligibilité + motif + audit + anti-
 * concurrence vérifiés EN BASE). Aucun droit RH. L'UI ne propose que des
 * enseignants éligibles mais la base reste l'autorité finale.
 */

async function requirePedagogue() {
  const supabase = await createClient();
  if (!supabase) return { error: "Service indisponible." as string };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." as string };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "directeur_etudes" && me?.role !== "admin" && me?.role !== "super_admin")
    return { error: "Réservé au Directeur des Études / Administration." as string };
  return { supabase };
}

function mapErr(m: string): string {
  if (m.includes("motif obligatoire")) return "Motif obligatoire.";
  if (m.includes("non éligible")) return "Enseignant non éligible pédagogiquement.";
  if (m.includes("concurrence")) return "L'affectation a changé entre-temps — rechargez la page.";
  if (m.includes("réservé")) return "Action réservée au Directeur des Études / Administration.";
  return m || "Action impossible.";
}

function expectedOrNull(formData: FormData): string | null {
  const v = String(formData.get("expected_teacher") || "").trim();
  return v || null;
}

/** Affecte l'enseignant d'un module (motif obligatoire). RPC D7-2. */
export async function assignModuleTeacher(
  moduleId: string,
  filiereId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requirePedagogue();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const newTeacher = String(formData.get("new_teacher") || "").trim();
  const motif = String(formData.get("motif") || "").trim();
  if (!newTeacher) return { ok: false, message: "Choisissez un enseignant." };
  if (!motif) return { ok: false, message: "Motif obligatoire." };

  const { error } = await g.supabase.rpc("directeur_etudes_assign_module_teacher", {
    p_module: moduleId,
    p_new_teacher: newTeacher,
    p_expected_teacher: expectedOrNull(formData),
    p_reason: motif,
  });
  if (error) return { ok: false, message: mapErr(error.message || "") };
  revalidatePath(`/espace/module/${moduleId}`);
  revalidatePath(`/espace/classes/${filiereId}`);
  return { ok: true, message: "Enseignant affecté au module." };
}

/** Réaffecte l'enseignant d'un créneau (motif obligatoire). RPC D7-2. */
export async function assignSlotTeacher(
  slotId: string,
  classId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requirePedagogue();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const newTeacher = String(formData.get("new_teacher") || "").trim();
  const motif = String(formData.get("motif") || "").trim();
  if (!newTeacher) return { ok: false, message: "Choisissez un enseignant." };
  if (!motif) return { ok: false, message: "Motif obligatoire." };

  const { error } = await g.supabase.rpc("directeur_etudes_assign_slot_teacher", {
    p_slot: slotId,
    p_new_teacher: newTeacher,
    p_expected_teacher: expectedOrNull(formData),
    p_reason: motif,
  });
  if (error) return { ok: false, message: mapErr(error.message || "") };
  revalidatePath(`/espace/planning/${classId}`);
  return { ok: true, message: "Enseignant du créneau réaffecté." };
}

/** Remplace l'enseignant d'UNE séance (substitution, motif obligatoire). RPC D7-2. */
export async function substituteSessionTeacher(
  sessionId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requirePedagogue();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const newTeacher = String(formData.get("new_teacher") || "").trim();
  const motif = String(formData.get("motif") || "").trim();
  if (!newTeacher) return { ok: false, message: "Choisissez un enseignant." };
  if (!motif) return { ok: false, message: "Motif obligatoire." };

  const { error } = await g.supabase.rpc("directeur_etudes_substitute_session_teacher", {
    p_session: sessionId,
    p_new_teacher: newTeacher,
    p_expected_teacher: expectedOrNull(formData),
    p_reason: motif,
  });
  if (error) return { ok: false, message: mapErr(error.message || "") };
  revalidatePath(`/espace/seance/${sessionId}`);
  revalidatePath(`/espace/seances`);
  return { ok: true, message: "Enseignant remplacé pour cette séance." };
}
