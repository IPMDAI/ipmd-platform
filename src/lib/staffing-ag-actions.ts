"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";
import { notifyStaffing } from "@/lib/staffing-notify";

/**
 * Actions « Besoins en personnel » côté ADMINISTRATEUR GÉNÉRAL (D6-3).
 * L'AG (admin / super_admin) DÉCIDE : valider, refuser (motif), affecter un
 * profil existant ET éligible, clôturer. TOUTES les transitions passent par les
 * RPC D6-1 (staffing_decide / staffing_assign / staffing_close) — JAMAIS d'UPDATE
 * direct de statut. La base (RLS + RPC + triggers) reste l'autorité finale ;
 * aucune création de compte n'est déclenchée ici.
 */

async function requireAG() {
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
  if (me?.role !== "admin" && me?.role !== "super_admin")
    return { error: "Réservé à l'Administrateur Général." as string };
  return { supabase, userId: user.id };
}

function mapRpcError(m: string): string {
  if (m.includes("motif est obligatoire")) return "Un motif est obligatoire pour refuser.";
  if (m.includes("Administrateur Général")) return "Action réservée à l'Administrateur Général.";
  if (m.includes("décision impossible")) return "Décision impossible : le besoin n'est plus en attente (déjà traité).";
  if (m.includes("non éligible")) return "Ce profil n'est pas éligible comme personnel IPMD.";
  if (m.includes("inexistant")) return "Profil introuvable.";
  if (m.includes("affectation impossible")) return "Affectation impossible : le besoin n'est pas au statut « Validée ».";
  if (m.includes("clôture impossible")) return "Clôture impossible depuis ce statut.";
  if (m.includes("droit insuffisant")) return "Droit insuffisant pour cette action.";
  return m || "Action impossible.";
}

/** Valider ou refuser (motif obligatoire si refus) — RPC staffing_decide. */
export async function decideStaffing(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireAG();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };

  const approve = String(formData.get("approve")) === "true";
  const reason = String(formData.get("reason") || "").trim();
  if (!approve && !reason) return { ok: false, message: "Un motif est obligatoire pour refuser." };

  const { error } = await g.supabase.rpc("staffing_decide", {
    p_id: id,
    p_approve: approve,
    p_reason: reason || null,
  });
  if (error) return { ok: false, message: mapRpcError(error.message || "") };

  // Transition réussie → notifier le DÉ demandeur (best-effort).
  await notifyStaffing(id, approve ? "validated" : "refused");
  revalidatePath("/espace/besoins-ag");
  revalidatePath("/espace/besoins");
  return { ok: true, message: approve ? "Besoin validé." : "Besoin refusé." };
}

/** Affecter un profil existant ET éligible (validee → affectee) — RPC staffing_assign. */
export async function assignStaffing(
  id: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const g = await requireAG();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };

  const profileId = String(formData.get("profile_id") || "").trim();
  if (!profileId) return { ok: false, message: "Choisissez un profil à affecter." };

  const { error } = await g.supabase.rpc("staffing_assign", {
    p_id: id,
    p_profile: profileId,
  });
  if (error) return { ok: false, message: mapRpcError(error.message || "") };

  // Transition réussie → notifier le DÉ demandeur (best-effort).
  await notifyStaffing(id, "assigned");
  revalidatePath("/espace/besoins-ag");
  revalidatePath("/espace/besoins");
  return { ok: true, message: "Profil affecté." };
}

/** Clôturer un besoin selon les transitions D6-1 — RPC staffing_close. */
export async function closeStaffing(
  id: string,
  _prev: FormResult | null,
  _formData: FormData
): Promise<FormResult> {
  const g = await requireAG();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };

  const { error } = await g.supabase.rpc("staffing_close", { p_id: id });
  if (error) return { ok: false, message: mapRpcError(error.message || "") };

  // Transition réussie → notifier le DÉ demandeur (best-effort).
  await notifyStaffing(id, "closed");
  revalidatePath("/espace/besoins-ag");
  revalidatePath("/espace/besoins");
  return { ok: true, message: "Besoin clôturé." };
}
