"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

function num(raw: string): number {
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

/** Définit la rémunération d'un enseignant (taux horaire ou forfait projet). */
export async function setTeacherPay(
  teacherId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const payType = formData.get("pay_type") === "projet" ? "projet" : "horaire";
  const hourly = num((formData.get("hourly_rate") as string) ?? "0");
  const fee = num((formData.get("project_fee") as string) ?? "0");

  const { error } = await ctx.supabase.from("teacher_pay").upsert(
    {
      teacher_id: teacherId,
      pay_type: payType,
      hourly_rate: hourly,
      project_fee: fee,
      note: ((formData.get("note") as string) ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "teacher_id" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/paie");
  return { ok: true, message: "Rémunération enregistrée." };
}
