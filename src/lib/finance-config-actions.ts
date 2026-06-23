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
  if (!["admin", "super_admin", "scolarite"].includes(me?.role ?? "")) return null;
  return { supabase };
}

function num(v: FormDataEntryValue | null): number {
  const x = Number.parseFloat(String(v ?? "").replace(",", "."));
  return Number.isNaN(x) ? 0 : x;
}

/** Met à jour les paramètres globaux (frais d'inscription, réduction, année). */
export async function setFinanceSettings(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée à la Scolarité." };

  const discountPct = num(formData.get("lump_sum_discount")); // saisi en %
  const { error } = await ctx.supabase.from("finance_settings").upsert(
    {
      id: 1,
      registration_fee: num(formData.get("registration_fee")),
      lump_sum_discount: Math.min(Math.max(discountPct / 100, 0), 1),
      academic_year: String(formData.get("academic_year") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/finance/parametres");
  return { ok: true, message: "Paramètres enregistrés." };
}

/** Ajoute ou modifie le montant de scolarité d'un niveau. */
export async function setTuitionLevel(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée à la Scolarité." };

  const level = String(formData.get("level") ?? "").trim();
  if (!level) return { ok: false, message: "Niveau requis." };

  const { error } = await ctx.supabase.from("tuition_levels").upsert(
    {
      level,
      amount: num(formData.get("amount")),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "level" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/finance/parametres");
  return { ok: true, message: `Niveau « ${level} » enregistré.` };
}
