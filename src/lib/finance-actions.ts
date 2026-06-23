"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeFinance, formatFCFA } from "@/lib/finance";
import {
  canSendEmail,
  emailDocument,
  sendScolariteEmail,
  buildRows,
} from "@/lib/email";
import type { FormResult } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ipmd.pro";

/** Emails de l'étudiant + de ses parents/garants. */
async function recipientsFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<{ name: string; emails: string[] }> {
  if (!supabase) return { name: "", emails: [] };
  const [{ data: student }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", studentId).single(),
    supabase.from("parent_links").select("parent_id").eq("student_id", studentId),
  ]);
  const parentIds = (links ?? []).map((l) => l.parent_id);
  let parentEmails: string[] = [];
  if (parentIds.length > 0) {
    const { data: pe } = await supabase
      .from("profiles")
      .select("email")
      .in("id", parentIds);
    parentEmails = (pe ?? []).map((x) => x.email).filter(Boolean) as string[];
  }
  const emails = [student?.email, ...parentEmails].filter(Boolean) as string[];
  return { name: student?.full_name || student?.email || "Étudiant", emails };
}

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

  const { data: inserted, error } = await ctx.supabase
    .from("payments")
    .insert({
      student_id: studentId,
      amount,
      kind,
      method: str(formData, "method") || null,
      reference: str(formData, "reference") || null,
      label: str(formData, "label") || null,
      observation: str(formData, "observation") || null,
      recorded_by: ctx.userId,
      paid_at: str(formData, "paid_at") || undefined,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  // Reçu par email (best-effort, ne bloque jamais).
  let emailed = 0;
  try {
    if (canSendEmail) {
      const { name, emails } = await recipientsFor(ctx.supabase, studentId);
      if (emails.length > 0) {
        const [{ data: fin2 }, { data: pays2 }] = await Promise.all([
          ctx.supabase
            .from("student_finance")
            .select("registration_fee, tuition_due, discount_rate, level")
            .eq("student_id", studentId)
            .maybeSingle(),
          ctx.supabase.from("payments").select("amount, kind").eq("student_id", studentId),
        ]);
        const fin = computeFinance(fin2, pays2 ?? []);
        const rows = buildRows([
          ["Étudiant", name],
          ["Nature", kind === "inscription" ? "Frais d'inscription" : "Frais de scolarité"],
          ["Montant payé", formatFCFA(amount)],
          ["Total dû", formatFCFA(fin.totalDue)],
          ["Déjà payé", formatFCFA(fin.totalPaid)],
          ["Reste à payer", fin.balance <= 0 ? "Soldé" : formatFCFA(fin.balance)],
        ]);
        const link = inserted?.id ? `${SITE_URL}/espace/recu/${inserted.id}` : SITE_URL;
        const html = emailDocument(
          "Reçu de paiement",
          `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
           <p style="margin-top:16px"><a href="${link}" style="display:inline-block;background:#e01228;color:#fff;text-decoration:none;padding:10px 18px;border-radius:9999px;font-weight:600">Voir / imprimer le reçu officiel</a></p>
           <p style="color:#9ca3af;font-size:12px;margin-top:8px">Pour toute question : scolarite@ipmd.pro</p>`
        );
        emailed = await sendScolariteEmail(emails, "IPMD — Reçu de paiement", html);
      }
    }
  } catch {
    // best-effort
  }

  revalidatePath(`/espace/finance/${studentId}`);
  revalidatePath("/espace/finance");
  return {
    ok: true,
    message: emailed > 0 ? `Paiement enregistré — reçu envoyé (${emailed}).` : "Paiement enregistré.",
  };
}

/** Envoie la facture proforma par email à l'étudiant et ses parents. */
export async function emailProforma(
  studentId: string,
  _prev: FormResult | null,
  _formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée à la Scolarité." };
  if (!canSendEmail) return { ok: false, message: "Email non configuré (RESEND_API_KEY)." };

  const { name, emails } = await recipientsFor(ctx.supabase, studentId);
  if (emails.length === 0) return { ok: false, message: "Aucune adresse email connue." };

  const { data: fin2 } = await ctx.supabase
    .from("student_finance")
    .select("registration_fee, tuition_due, discount_rate, level, academic_year")
    .eq("student_id", studentId)
    .maybeSingle();
  const fin = computeFinance(fin2, []);
  const discount = fin.tuitionDue - fin.tuitionNet;
  const rows = buildRows([
    ["Étudiant", name],
    ["Niveau / formation", fin2?.level ?? "—"],
    ["Année académique", fin2?.academic_year ?? "2025-2026"],
    ["Frais d'inscription", formatFCFA(fin.registrationFee)],
    ["Frais de scolarité", formatFCFA(fin.tuitionDue)],
    ["Réduction", discount > 0 ? `−${formatFCFA(discount)}` : "—"],
    ["Total à payer", formatFCFA(fin.totalDue)],
  ]);
  const link = `${SITE_URL}/espace/proforma/${studentId}`;
  const html = emailDocument(
    "Facture proforma",
    `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
     <p style="margin-top:16px"><a href="${link}" style="display:inline-block;background:#0b0b0d;color:#fff;text-decoration:none;padding:10px 18px;border-radius:9999px;font-weight:600">Voir / imprimer la proforma</a></p>
     <p style="color:#9ca3af;font-size:12px;margin-top:8px">Document non contractuel — scolarite@ipmd.pro</p>`
  );
  const sent = await sendScolariteEmail(emails, "IPMD — Facture proforma", html);
  return sent > 0
    ? { ok: true, message: `Proforma envoyée (${sent} destinataire·s).` }
    : { ok: false, message: "Échec de l'envoi." };
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
