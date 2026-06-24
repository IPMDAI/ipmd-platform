"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

const STAFF = ["super_admin", "admin"];

function str(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

async function getStaff() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!STAFF.includes(me?.role ?? "")) return null;
  return { supabase };
}

function reval() {
  revalidatePath("/espace/partenaires");
  revalidatePath("/partenaires");
  revalidatePath("/");
}

export async function createPartner(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom du partenaire est requis." };
  const { error } = await ctx.supabase.from("partners").insert({
    name,
    category: str(formData, "category") || "entreprise",
    website: str(formData, "website") || null,
    description: str(formData, "description") || null,
    logo_url: str(formData, "logo_url") || null,
    status: "actif",
  });
  if (error) return { ok: false, message: error.message };
  reval();
  return { ok: true, message: "Partenaire ajouté." };
}

export async function updatePartner(id: string, _prev: FormResult | null, formData: FormData): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom est requis." };
  const { error } = await ctx.supabase
    .from("partners")
    .update({
      name,
      category: str(formData, "category") || "entreprise",
      website: str(formData, "website") || null,
      description: str(formData, "description") || null,
      status: str(formData, "status") || "actif",
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  reval();
  return { ok: true, message: "Partenaire mis à jour." };
}

/** Enregistre l'URL du logo (déjà téléversé dans le bucket partner-logos). */
export async function setPartnerLogo(id: string, logoUrl: string | null): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  const { error } = await ctx.supabase.from("partners").update({ logo_url: logoUrl || null }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  reval();
  return { ok: true, message: logoUrl ? "Logo enregistré." : "Logo retiré." };
}

export async function deletePartner(id: string): Promise<void> {
  const ctx = await getStaff();
  if (!ctx) return;
  await ctx.supabase.from("partners").delete().eq("id", id);
  reval();
}
