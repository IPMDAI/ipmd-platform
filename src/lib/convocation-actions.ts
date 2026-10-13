"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STAFF_ROLES } from "@/lib/messaging";
import {
  canSendEmail,
  emailDocument,
  escapeHtml,
  sendEmailTo,
} from "@/lib/email";
import { convocationWhen } from "@/lib/convocations";
import type { FormResult } from "@/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Contexte staff (admin/scolarité/pédagogie). */
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
  if (!STAFF_ROLES.includes(me?.role ?? "")) return null;
  return { supabase, userId: user.id };
}

/** Un service IPMD convoque un étudiant (notifie l'étudiant + ses parents). */
export async function createConvocation(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await staffCtx();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };

  const studentId = str(formData, "student_id");
  const title = str(formData, "title");
  const reason = str(formData, "reason");
  const location = str(formData, "location");
  const scheduledRaw = str(formData, "scheduled_at");
  if (!studentId || !title) {
    return { ok: false, message: "Étudiant et objet requis." };
  }
  const scheduled_at = scheduledRaw ? new Date(scheduledRaw).toISOString() : null;

  const { error } = await ctx.supabase.from("convocations").insert({
    student_id: studentId,
    title,
    reason: reason || null,
    location: location || null,
    scheduled_at,
    created_by: ctx.userId,
  });
  if (error) return { ok: false, message: error.message };

  // Notifie l'étudiant + ses parents (best-effort).
  if (canSendEmail) {
    const lookup = createAdminClient() ?? ctx.supabase;
    const { data: stu } = await lookup
      .from("profiles")
      .select("email, full_name")
      .eq("id", studentId)
      .single();
    const { data: links } = await lookup
      .from("parent_links")
      .select("parent_id")
      .eq("student_id", studentId);
    const parentIds = (links ?? []).map((l) => l.parent_id);
    const emails: string[] = [];
    if (stu?.email) emails.push(stu.email);
    if (parentIds.length > 0) {
      const { data: parents } = await lookup
        .from("profiles")
        .select("email")
        .in("id", parentIds);
      for (const p of parents ?? []) if (p.email) emails.push(p.email);
    }
    if (emails.length > 0) {
      const whenStr = convocationWhen(scheduled_at);
      await sendEmailTo(
        emails,
        `IPMD — Convocation : ${title}`,
        emailDocument(
          "Convocation IPMD",
          `<p style="font-size:14px;color:#374151">Objet : <strong>${escapeHtml(
            title
          )}</strong></p>
           ${whenStr ? `<p style="font-size:14px;color:#374151">Date : <strong>${escapeHtml(whenStr)}</strong></p>` : ""}
           ${location ? `<p style="font-size:14px;color:#374151">Lieu : <strong>${escapeHtml(location)}</strong></p>` : ""}
           ${reason ? `<p style="font-size:14px;line-height:1.7;color:#374151;white-space:pre-line;background:#f6f7f9;border-radius:12px;padding:12px">${escapeHtml(reason)}</p>` : ""}
           <p style="font-size:14px;color:#374151">Concerne : <strong>${escapeHtml(stu?.full_name ?? "l'étudiant")}</strong></p>
           <p style="font-size:13px;color:#6b7280">Connectez-vous à votre espace IPMD pour accuser réception.</p>`
        )
      );
    }
  }

  revalidatePath("/espace/convocations");
  return { ok: true, message: "Convocation créée et notifiée." };
}

/** Annule une convocation (staff). */
export async function cancelConvocation(
  convocationId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await staffCtx();
  if (!ctx) return;
  await ctx.supabase
    .from("convocations")
    .update({ status: "annulee" })
    .eq("id", convocationId);
  revalidatePath("/espace/convocations");
}

/**
 * Accusé de réception INDIVIDUEL : l'utilisateur connecté (parent OU étudiant)
 * enregistre SON propre accusé. Les autres destinataires gardent leur état.
 * RLS : insert autorisé seulement pour soi, sur une convocation accessible.
 */
export async function acknowledgeConvocation(
  convocationId: string
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const { error } = await supabase
    .from("convocation_acknowledgements")
    .insert({ convocation_id: convocationId, user_id: user.id });
  // 23505 = déjà accusé → on considère l'opération réussie (idempotent).
  if (error && error.code !== "23505") {
    return { ok: false, message: error.message };
  }

  revalidatePath("/espace/mon-enfant");
  return { ok: true, message: "Réception confirmée." };
}
