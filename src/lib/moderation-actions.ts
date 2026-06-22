"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

const CONTENT_TYPES = ["class_announcement", "announcement", "internal_message"];

/** Un utilisateur signale un contenu. */
export async function reportContent(
  contentType: string,
  contentId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  if (!CONTENT_TYPES.includes(contentType)) {
    return { ok: false, message: "Type invalide." };
  }
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const reason = ((formData.get("reason") as string | null) ?? "").trim();
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    content_type: contentType,
    content_id: contentId,
    reason: reason || null,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Signalement envoyé à l'administration." };
}

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

/** Marque un signalement comme traité (admin). */
export async function resolveReport(
  id: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase
    .from("content_reports")
    .update({ status: "resolved" })
    .eq("id", id);
  revalidatePath("/espace/moderation");
}

/** Supprime le contenu signalé (admin). */
export async function deleteReportedContent(
  contentType: string,
  contentId: string,
  reportId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  const table =
    contentType === "class_announcement"
      ? "class_announcements"
      : contentType === "announcement"
      ? "announcements"
      : contentType === "internal_message"
      ? "internal_messages"
      : null;
  if (table) await ctx.supabase.from(table).delete().eq("id", contentId);
  await ctx.supabase
    .from("content_reports")
    .update({ status: "resolved" })
    .eq("id", reportId);
  revalidatePath("/espace/moderation");
}
