"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";
import { NEED_TYPES, PRIORITIES } from "@/lib/staffing";
import { notifyStaffing } from "@/lib/staffing-notify";

/**
 * Actions « Besoins en personnel » côté DIRECTEUR DES ÉTUDES (D6-2).
 * Le DÉ EXPRIME/SUIT un besoin : créer/éditer un brouillon, puis soumettre à
 * l'Administrateur Général. Il ne valide/refuse/affecte/recrute JAMAIS — ces
 * pouvoirs sont à l'AG (espace D6-3). La base (RLS + RPC + triggers) est
 * l'autorité finale ; ces actions ne font que relayer et rester lisibles.
 */

const NEED_VALUES = new Set(NEED_TYPES.map((t) => t.value));
const PRIORITY_VALUES = new Set(PRIORITIES.map((p) => p.value));

async function requireDE() {
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
  if (me?.role !== "directeur_etudes")
    return { error: "Réservé au Directeur des Études." as string };
  return { supabase, userId: user.id };
}

/** Lit et valide les champs de contenu communs (création / édition). */
function readContent(formData: FormData):
  | { ok: true; values: Record<string, string | null> }
  | { ok: false; message: string } {
  const need_type = String(formData.get("need_type") || "").trim();
  const position_title = String(formData.get("position_title") || "").trim();
  const justification = String(formData.get("justification") || "").trim();
  const priority = String(formData.get("priority") || "normale").trim();
  const academic_year = String(formData.get("academic_year") || "").trim() || null;
  const class_id = String(formData.get("class_id") || "").trim() || null;
  const module_id = String(formData.get("module_id") || "").trim() || null;
  const proposed_profile = String(formData.get("proposed_profile") || "").trim() || null;

  if (!NEED_VALUES.has(need_type)) return { ok: false, message: "Type de besoin invalide." };
  if (!position_title) return { ok: false, message: "Le poste / intitulé est obligatoire." };
  if (!justification) return { ok: false, message: "La justification est obligatoire." };
  if (!PRIORITY_VALUES.has(priority)) return { ok: false, message: "Priorité invalide." };

  return {
    ok: true,
    values: { need_type, position_title, justification, priority, academic_year, class_id, module_id, proposed_profile },
  };
}

/** Crée un brouillon de besoin (DÉ). requester_id est fixé côté base. */
export async function createStaffingDraft(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireDE();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const parsed = readContent(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { error } = await g.supabase.from("staffing_requests").insert(parsed.values);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/besoins");
  return { ok: true, message: "Brouillon créé." };
}

/** Modifie un brouillon existant (DÉ). La RLS n'autorise que status='brouillon'. */
export async function updateStaffingDraft(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireDE();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const parsed = readContent(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  // La RLS impose requester_id = soi ET status='brouillon' (USING + WITH CHECK)
  // + le guard interdit toute colonne protégée → modif de contenu seulement.
  const { data, error } = await g.supabase
    .from("staffing_requests")
    .update(parsed.values)
    .eq("id", id)
    .eq("status", "brouillon")
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0)
    return { ok: false, message: "Modification impossible : le besoin n'est plus un brouillon." };

  revalidatePath("/espace/besoins");
  return { ok: true, message: "Brouillon mis à jour." };
}

/** Soumet un brouillon à l'AG (brouillon → en_attente) via la RPC atomique. */
export async function submitStaffingRequest(
  id: string,
  _prev: FormResult | null,
  _formData: FormData
): Promise<FormResult> {
  const g = await requireDE();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };

  const { error } = await g.supabase.rpc("staffing_submit", { p_id: id });
  if (error) {
    const m = error.message || "";
    if (m.includes("soumission impossible"))
      return { ok: false, message: "Soumission impossible : besoin inexistant, non vôtre, ou déjà soumis." };
    if (m.includes("seul le DÉ")) return { ok: false, message: "Action réservée au Directeur des Études." };
    return { ok: false, message: m };
  }

  // Transition réussie → notifier l'AG (best-effort, jamais bloquant).
  await notifyStaffing(id, "submitted");
  revalidatePath("/espace/besoins");
  return { ok: true, message: "Besoin soumis à l'Administrateur Général." };
}
