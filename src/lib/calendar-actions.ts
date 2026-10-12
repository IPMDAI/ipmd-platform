"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CALENDAR_KIND_VALUES } from "@/lib/schedule";
import type { FormResult } from "@/types";

/** Contexte staff autorisé à gérer le calendrier (admin / super_admin / pédagogie). */
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

function str(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/** Valide + construit un jalon depuis le formulaire. */
function parse(fd: FormData):
  | { ok: true; row: Record<string, unknown>; year: string }
  | { ok: false; message: string } {
  const academic_year = str(fd, "academic_year");
  const kind = str(fd, "kind");
  const label = str(fd, "label");
  const start_date = str(fd, "start_date");
  const end_date = str(fd, "end_date");
  const level = str(fd, "level") || null;
  const blocks_regular = fd.get("blocks_regular") === "on";
  const blocks_all = fd.get("blocks_all") === "on";

  if (!/^\d{4}-\d{4}$/.test(academic_year)) return { ok: false, message: "Année académique invalide (AAAA-AAAA)." };
  if (!CALENDAR_KIND_VALUES.includes(kind)) return { ok: false, message: "Type de jalon invalide." };
  if (!label) return { ok: false, message: "L'intitulé est requis." };
  if (!start_date || !end_date) return { ok: false, message: "Dates de début et de fin requises." };
  if (end_date < start_date) return { ok: false, message: "La date de fin doit suivre le début." };

  return {
    ok: true,
    year: academic_year,
    row: { academic_year, kind, label, start_date, end_date, level, blocks_regular, blocks_all },
  };
}

export async function addCalendarMilestone(
  _prev: FormResult | null,
  fd: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };
  const p = parse(fd);
  if (!p.ok) return { ok: false, message: p.message };
  const { error } = await ctx.supabase.from("academic_calendar").insert(p.row);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/calendrier");
  return { ok: true, message: "Jalon ajouté." };
}

export async function updateCalendarMilestone(
  id: string,
  _prev: FormResult | null,
  fd: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };
  const p = parse(fd);
  if (!p.ok) return { ok: false, message: p.message };
  const { error } = await ctx.supabase.from("academic_calendar").update(p.row).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/calendrier");
  return { ok: true, message: "Jalon mis à jour." };
}

/** Suppression protégée : exige la confirmation explicite (champ confirm=oui). */
export async function deleteCalendarMilestone(
  id: string,
  _prev: FormResult | null,
  fd: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };
  if (str(fd, "confirm") !== "oui") {
    return { ok: false, message: "Suppression non confirmée." };
  }
  const { error } = await ctx.supabase.from("academic_calendar").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/calendrier");
  return { ok: true, message: "Jalon supprimé." };
}
