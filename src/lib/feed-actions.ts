"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FeedKind } from "@/data/feed";
import type { FormResult } from "@/types";

async function getAdmin() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin" && me?.role !== "super_admin") return null;
  return { supabase };
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Liste « a, b, c » → ["a","b","c"]. */
function list(fd: FormData, key: string): string[] {
  return str(fd, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const KINDS: FeedKind[] = ["news", "jobs", "opportunities"];

function revalidateAll(kind: FeedKind) {
  revalidatePath("/");
  revalidatePath(`/${kind === "news" ? "news" : kind === "jobs" ? "jobs" : "opportunities"}`);
  revalidatePath("/espace/contenus");
}

/** Crée ou met à jour un élément (News / Jobs / Opportunities). */
export async function upsertFeedItem(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const kind = str(formData, "kind") as FeedKind;
  if (!KINDS.includes(kind)) return { ok: false, message: "Type invalide." };
  const title = str(formData, "title");
  if (!title) return { ok: false, message: "Le titre est requis." };

  const row = {
    kind,
    title,
    subtitle: str(formData, "subtitle") || null,
    category: str(formData, "category") || null,
    summary: str(formData, "summary") || null,
    icon: str(formData, "icon") || null,
    image_url: str(formData, "image_url") || null,
    href: str(formData, "href") || null,
    date_label: str(formData, "date_label") || null,
    reading_time: str(formData, "reading_time") || null,
    deadline: str(formData, "deadline") || null,
    status: str(formData, "status") || null,
    meta: list(formData, "meta"),
    tags: list(formData, "tags"),
    published: str(formData, "published") === "on",
    featured: str(formData, "featured") === "on",
    sort_order: Number(str(formData, "sort_order")) || 0,
  };

  const id = str(formData, "id");
  if (id) {
    const { error } = await ctx.supabase.from("feed_items").update(row).eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidateAll(kind);
    return { ok: true, message: "Élément mis à jour." };
  }

  const { error } = await ctx.supabase.from("feed_items").insert(row);
  if (error) return { ok: false, message: error.message };
  revalidateAll(kind);
  return { ok: true, message: "Élément ajouté." };
}

/** Supprime un élément. */
export async function deleteFeedItem(id: string): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("feed_items").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/jobs");
  revalidatePath("/opportunities");
  revalidatePath("/espace/contenus");
}

/** Publie / dépublie ou met en avant (toggle d'un booléen). */
export async function toggleFeedFlag(
  id: string,
  field: "published" | "featured",
  value: boolean
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("feed_items").update({ [field]: value }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/jobs");
  revalidatePath("/opportunities");
  revalidatePath("/espace/contenus");
}
