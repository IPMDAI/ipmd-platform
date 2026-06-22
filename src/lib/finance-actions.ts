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
  if (me?.role !== "super_admin" && me?.role !== "admin") return null;
  return { supabase };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(raw: string): number {
  return Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
}

/** Définit les frais de scolarité dûs par un étudiant. */
export async function setStudentDue(
  studentId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const totalDue = num(str(formData, "total_due") || "0");
  if (Number.isNaN(totalDue) || totalDue < 0) {
    return { ok: false, message: "Montant invalide." };
  }

  const { error } = await ctx.supabase
    .from("student_finance")
    .upsert(
      { student_id: studentId, total_due: totalDue },
      { onConflict: "student_id" }
    );
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/finance/${studentId}`);
  revalidatePath("/espace/finance");
  return { ok: true, message: "Frais enregistrés." };
}

/** Enregistre un paiement pour un étudiant. */
export async function addPayment(
  studentId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const amount = num(str(formData, "amount"));
  if (Number.isNaN(amount) || amount <= 0) {
    return { ok: false, message: "Montant du paiement invalide." };
  }

  const { error } = await ctx.supabase.from("payments").insert({
    student_id: studentId,
    amount,
    method: str(formData, "method") || null,
    label: str(formData, "label") || null,
    paid_at: str(formData, "paid_at") || undefined,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/finance/${studentId}`);
  revalidatePath("/espace/finance");
  return { ok: true, message: "Paiement enregistré." };
}

/** Ajoute une échéance de paiement à un étudiant. */
export async function addSchedule(
  studentId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const amount = num(str(formData, "amount"));
  if (Number.isNaN(amount) || amount <= 0) {
    return { ok: false, message: "Montant invalide." };
  }
  const dueDate = str(formData, "due_date");
  if (!dueDate) return { ok: false, message: "La date d'échéance est requise." };

  const { error } = await ctx.supabase.from("payment_schedules").insert({
    student_id: studentId,
    amount,
    due_date: dueDate,
    label: str(formData, "label") || null,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/finance/${studentId}`);
  return { ok: true, message: "Échéance ajoutée." };
}

/** Supprime une échéance (action de formulaire simple). */
export async function deleteSchedule(
  studentId: string,
  scheduleId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("payment_schedules").delete().eq("id", scheduleId);
  revalidatePath(`/espace/finance/${studentId}`);
}

/** Supprime un paiement (action de formulaire simple). */
export async function deletePayment(
  studentId: string,
  paymentId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("payments").delete().eq("id", paymentId);
  revalidatePath(`/espace/finance/${studentId}`);
  revalidatePath("/espace/finance");
}
