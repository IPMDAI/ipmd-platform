"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VALID_ROLES } from "@/lib/dashboards";
import type { FormResult } from "@/types";

/**
 * Change le rôle d'un utilisateur. Réservé au Super Admin.
 * La RLS Supabase applique aussi cette restriction côté base.
 */
export async function updateUserRole(
  userId: string,
  newRole: string
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible." };
  }
  if (!VALID_ROLES.includes(newRole)) {
    return { ok: false, message: "Rôle invalide." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifié." };
  }

  // Vérifie que le demandeur est bien Super Admin.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "super_admin") {
    return { ok: false, message: "Action réservée au Super Admin." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/espace/utilisateurs");
  return { ok: true, message: "Rôle mis à jour." };
}
