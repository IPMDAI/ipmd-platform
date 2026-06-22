"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

async function getStaff() {
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
  if (!["admin", "super_admin", "pedagogie"].includes(me?.role ?? "")) return null;
  return { supabase };
}

/** Ajoute un jour férié. */
export async function addHoliday(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const day = ((formData.get("day") as string | null) ?? "").trim();
  const label = ((formData.get("label") as string | null) ?? "").trim();
  if (!day) return { ok: false, message: "La date est requise." };
  if (!label) return { ok: false, message: "Le libellé est requis." };

  const { error } = await ctx.supabase
    .from("holidays")
    .upsert({ day, label }, { onConflict: "day" });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/jours-feries");
  return { ok: true, message: "Jour férié ajouté." };
}

/** Supprime un jour férié. */
export async function deleteHoliday(
  id: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getStaff();
  if (!ctx) return;
  await ctx.supabase.from("holidays").delete().eq("id", id);
  revalidatePath("/espace/jours-feries");
}
