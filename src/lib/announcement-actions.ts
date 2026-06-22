"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUDIENCE_VALUES } from "@/lib/announcements";
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
  return { supabase, userId: user.id };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Publie une annonce (admin). */
export async function createAnnouncement(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const title = str(formData, "title");
  const body = str(formData, "body");
  if (!title || !body) {
    return { ok: false, message: "Titre et message requis." };
  }
  let audience = str(formData, "audience");
  if (!AUDIENCE_VALUES.includes(audience)) audience = "all";

  const { error } = await ctx.supabase.from("announcements").insert({
    title,
    body,
    audience,
    author_id: ctx.userId,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/annonces");
  revalidatePath("/espace");
  return { ok: true, message: "Annonce publiée." };
}

/** Supprime une annonce (action de formulaire simple). */
export async function deleteAnnouncement(
  id: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/espace/annonces");
  revalidatePath("/espace");
}
