"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CANDIDATURE_STATUS_VALUES } from "@/lib/candidatures";
import type { FormResult } from "@/types";

async function getAdmin() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "super_admin") return null;
  return { supabase };
}

/** Fait évoluer le statut d'une candidature (admin). */
export async function setCandidatureStatus(
  id: string,
  status: string
): Promise<FormResult> {
  if (!CANDIDATURE_STATUS_VALUES.includes(status)) {
    return { ok: false, message: "Statut invalide." };
  }
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const { error } = await ctx.supabase
    .from("inscription_requests")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/candidatures");
  revalidatePath("/espace");
  return { ok: true, message: "Statut mis à jour." };
}
