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
  return { supabase, userId: user.id };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(raw: string): number {
  return Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
}

/** Définit les frais (inscription + scolarité par niveau + réduction paiement unique). */
export async function setStudentFinance(
  studentId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée à la Scolarité." };

  const registrationFee = num(str(formData, "registration_fee") || "0");
  const tuitionDue = num(str(formData, "tuition_due") || "0");
  if (Number.isNaN(registrationFee) || Number.isNaN(tuitionDue)) {
    return { ok: false, message: "Montant invalide." };
  }

  let discountRate = 0;
  if (formData.get("lump_sum") === "on") {
    const { data: s } = await ctx.supabase
      .from("finance_settings")
      .select("lump_sum_discount")
      .eq("id", 1)
      .maybeSingle();
    discountRate = Number(s?.lump_sum_discount ?? 0.15);
  }

  const tuitionNet = Math.round(tuitionDue * (1 - discountRate));
  const totalDue = registrationFee + tuitionNet;

  const { error } = await ctx.supabase.from("student_finance").upsert(
    {
      student_id: studentId,
      registration_fee: registrationFee,
      tuition_due: tuitionDue,
      discount_rate: discountRate,
      level: str(formData, "level") || null,
      total_due: totalDue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/finance/${studentId}`);
  revalidatePath("/espace/finance");
  return { ok: true, message: "Frais enregistrés." };
}

/** Met à jour le statut financier et l'état d'accès plateforme. */
export async function setStudentAccess(
  studentId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée à la Scolarité." };

  const { error } = await ctx.supabase.from("student_finance").upsert(
    {
      student_id: studentId,
      status: str(formData, "status") || null,
      access_state: str(formData, "access_state") || "actif",
      negotiated: formData.get("negotiated") === "on",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/finance/${studentId}`);
  return { ok: true, message: "Statut / accès mis à jour." };
}

/** Enregistre un paiement (inscription ou scolarité) avec référence et traçabilité. */
export async function addPayment(
  studentId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée à la Scolarité." };

  const amount = num(str(formData, "amount"));
  if (Number.isNaN(amount) || amount <= 0) {
    return { ok: false, message: "Montant du paiement invalide." };
  }
  const kind = str(formData, "kind") === "inscription" ? "inscription" : "scolarite";

  const { error } = await ctx.supabase.from("payments").insert({
    student_id: studentId,
    amount,
    kind,
    method: str(formData, "method") || null,
    reference: str(formData, "reference") || null,
    label: str(formData, "label") || null,
    observation: str(formData, "observation") || null,
    recorded_by: ctx.userId,
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
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée à la Scolarité." };

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
  const ctx = await getStaff();
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
  const ctx = await getStaff();
  if (!ctx) return;
  await ctx.supabase.from("payments").delete().eq("id", paymentId);
  revalidatePath(`/espace/finance/${studentId}`);
  revalidatePath("/espace/finance");
}
