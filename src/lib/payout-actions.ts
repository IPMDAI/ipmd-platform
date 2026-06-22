"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

import { PAYOUT_STATUS_LABEL } from "@/lib/payout";

const STATUSES = ["en_attente", "valide", "paye"];

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

function n(raw: string): number {
  const x = Number.parseFloat(raw);
  return Number.isNaN(x) ? 0 : x;
}

/** Enregistre / met à jour le statut de paie d'un enseignant pour une période. */
export async function setPayout(
  teacherId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const periodStart = (formData.get("period_start") as string) ?? "";
  const periodEnd = (formData.get("period_end") as string) ?? "";
  if (!periodStart || !periodEnd) {
    return { ok: false, message: "Période manquante." };
  }
  let status = (formData.get("status") as string) ?? "en_attente";
  if (!STATUSES.includes(status)) status = "en_attente";

  const { error } = await ctx.supabase.from("teacher_payouts").upsert(
    {
      teacher_id: teacherId,
      period_start: periodStart,
      period_end: periodEnd,
      hours: n((formData.get("hours") as string) ?? "0"),
      amount: n((formData.get("amount") as string) ?? "0"),
      status,
      paid_at: status === "paye" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "teacher_id,period_start,period_end" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/paie");
  return { ok: true, message: `Statut : ${PAYOUT_STATUS_LABEL[status]}.` };
}
