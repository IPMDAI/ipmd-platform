"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACADEMIC_STAFF_ROLES } from "@/lib/academic";
import {
  canSendEmail,
  emailDocument,
  escapeHtml,
  sendEmailTo,
} from "@/lib/email";
import type { FormResult } from "@/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function staffCtx() {
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
  if (!ACADEMIC_STAFF_ROLES.includes(me?.role ?? "")) return null;
  return { supabase, userId: user.id };
}

/** Emails de l'étudiant + de ses parents (best-effort, service-role pour lookup). */
async function recipientsFor(studentId: string): Promise<string[]> {
  const lookup = createAdminClient();
  if (!lookup) return [];
  const emails: string[] = [];
  const { data: stu } = await lookup
    .from("profiles")
    .select("email")
    .eq("id", studentId)
    .single();
  if (stu?.email) emails.push(stu.email);
  const { data: links } = await lookup
    .from("parent_links")
    .select("parent_id")
    .eq("student_id", studentId);
  const ids = (links ?? []).map((l) => l.parent_id);
  if (ids.length > 0) {
    const { data: parents } = await lookup
      .from("profiles")
      .select("email")
      .in("id", ids);
    for (const p of parents ?? []) if (p.email) emails.push(p.email);
  }
  return emails;
}

async function notify(studentId: string, subject: string, bodyHtml: string) {
  if (!canSendEmail) return;
  try {
    const to = await recipientsFor(studentId);
    if (to.length > 0) await sendEmailTo(to, subject, emailDocument(subject, bodyHtml));
  } catch {
    // Un échec email n'annule jamais l'écriture.
  }
}

/** Staff : ajoute un document requis à un étudiant (état initial 'a_fournir'). */
export async function addRequiredDocument(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await staffCtx();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };

  const studentId = str(formData, "student_id");
  const label = str(formData, "label");
  const docKey = str(formData, "doc_key");
  if (!studentId || !label) {
    return { ok: false, message: "Étudiant et libellé requis." };
  }

  const { error } = await ctx.supabase.from("student_documents").insert({
    student_id: studentId,
    label,
    doc_key: docKey || null,
    requested_by: ctx.userId,
  });
  if (error) return { ok: false, message: error.message };

  await notify(
    studentId,
    "IPMD — Nouvelle pièce à fournir",
    `<p style="font-size:14px;color:#374151">Une nouvelle pièce vous est demandée : <strong>${escapeHtml(
      label
    )}</strong>.</p><p style="font-size:13px;color:#6b7280">Connectez-vous à votre espace IPMD pour la déposer.</p>`
  );

  revalidatePath("/espace/documents-a-fournir");
  return { ok: true, message: "Document demandé et notifié." };
}

/**
 * Parent / étudiant : enregistre une NOUVELLE version déposée (fichier déjà
 * téléversé côté client au chemin fourni). Ne remplace jamais une version.
 */
export async function submitDocument(
  studentDocumentId: string,
  submissionId: string,
  path: string,
  originalName: string
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };
  if (!studentDocumentId || !submissionId || !path) {
    return { ok: false, message: "Soumission invalide." };
  }

  const { error } = await supabase.from("student_document_submissions").insert({
    id: submissionId,
    student_document_id: studentDocumentId,
    path,
    original_name: originalName || null,
    uploaded_by: user.id,
    status: "fourni",
  });
  if (error) return { ok: false, message: error.message };

  // Synchronise l'état courant de la demande (RLS autorise 'fourni').
  await supabase
    .from("student_documents")
    .update({ status: "fourni" })
    .eq("id", studentDocumentId);

  revalidatePath("/espace/mon-enfant");
  revalidatePath("/espace/documents-a-fournir");
  return { ok: true, message: "Document déposé." };
}

/** Staff : valide ou refuse une soumission (motif obligatoire si refus). */
export async function reviewDocument(
  submissionId: string,
  decision: "valide" | "refuse",
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await staffCtx();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };
  const note = str(formData, "note");
  if (decision === "refuse" && !note) {
    return { ok: false, message: "Motif de refus requis." };
  }

  const { data: sub } = await ctx.supabase
    .from("student_document_submissions")
    .select("student_document_id")
    .eq("id", submissionId)
    .single();
  if (!sub) return { ok: false, message: "Soumission introuvable." };

  const now = new Date().toISOString();
  const { error } = await ctx.supabase
    .from("student_document_submissions")
    .update({
      status: decision,
      reviewed_by: ctx.userId,
      reviewed_at: now,
      review_note: note || null,
    })
    .eq("id", submissionId);
  if (error) return { ok: false, message: error.message };

  // État courant de la demande + libellé + étudiant pour la notification.
  const { data: doc } = await ctx.supabase
    .from("student_documents")
    .select("student_id, label")
    .eq("id", sub.student_document_id)
    .single();
  await ctx.supabase
    .from("student_documents")
    .update({ status: decision })
    .eq("id", sub.student_document_id);

  if (doc) {
    if (decision === "valide") {
      await notify(
        doc.student_id,
        "IPMD — Pièce validée",
        `<p style="font-size:14px;color:#374151">Votre pièce <strong>${escapeHtml(
          doc.label
        )}</strong> a été <strong>validée</strong>. Merci.</p>`
      );
    } else {
      await notify(
        doc.student_id,
        "IPMD — Pièce refusée",
        `<p style="font-size:14px;color:#374151">Votre pièce <strong>${escapeHtml(
          doc.label
        )}</strong> a été <strong>refusée</strong>.</p>
         <p style="font-size:14px;line-height:1.7;color:#374151;white-space:pre-line;background:#f6f7f9;border-radius:12px;padding:12px">Motif : ${escapeHtml(
           note
         )}</p>
         <p style="font-size:13px;color:#6b7280">Merci de déposer une nouvelle version depuis votre espace IPMD.</p>`
      );
    }
  }

  revalidatePath("/espace/documents-a-fournir");
  revalidatePath("/espace/mon-enfant");
  return { ok: true, message: decision === "valide" ? "Pièce validée." : "Pièce refusée." };
}
