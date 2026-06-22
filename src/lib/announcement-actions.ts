"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUDIENCE_VALUES, TARGET_VALUES } from "@/lib/announcements";
import {
  canSendEmail,
  emailDocument,
  escapeHtml,
  sendEmailTo,
} from "@/lib/email";
import type { FormResult } from "@/types";

/** Rôles ciblés par une audience (pour l'envoi d'emails). */
function rolesForAudience(audience: string): string[] | null {
  if (audience === "etudiant") return ["etudiant", "professionnel", "dirigeant"];
  if (audience === "parent") return ["parent"];
  if (audience === "enseignant") return ["enseignant"];
  return null; // all
}

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
  return { supabase, userId: user.id };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Publie une annonce (admin). */
export async function createAnnouncement(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const title = str(formData, "title");
  const body = str(formData, "body");
  if (!title || !body) {
    return { ok: false, message: "Titre et message requis." };
  }
  let audience = str(formData, "audience");
  if (!AUDIENCE_VALUES.includes(audience)) audience = "all";

  let targetType = str(formData, "target_type");
  if (!TARGET_VALUES.includes(targetType)) targetType = "all";
  const targetValue =
    targetType === "all" ? null : str(formData, `target_${targetType}`) || null;

  const { error } = await ctx.supabase.from("announcements").insert({
    title,
    body,
    audience,
    author_id: ctx.userId,
    target_type: targetType,
    target_value: targetValue,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/annonces");
  revalidatePath("/espace");

  // Notification email (optionnelle) aux destinataires.
  let emailNote = "";
  const notify = str(formData, "notify") === "on";
  if (notify && canSendEmail) {
    let q = ctx.supabase.from("profiles").select("email");
    const roles = rolesForAudience(audience);
    if (roles) q = q.in("role", roles);
    const { data: people } = await q;
    const emails = (people ?? [])
      .map((p) => p.email)
      .filter((e): e is string => Boolean(e));
    if (emails.length > 0) {
      const html = emailDocument(
        title,
        `<p style="font-size:14px;line-height:1.7;color:#374151;white-space:pre-line">${escapeHtml(
          body
        )}</p>`
      );
      const sent = await sendEmailTo(emails, `IPMD — ${title}`, html);
      emailNote = ` ${sent} email(s) envoyé(s).`;
    }
  } else if (notify && !canSendEmail) {
    emailNote = " (email non configuré : RESEND_API_KEY manquante.)";
  }

  return { ok: true, message: `Annonce publiée.${emailNote}` };
}

/** Supprime une annonce (action de formulaire simple). */
export async function deleteAnnouncement(
  id: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/espace/annonces");
  revalidatePath("/espace");
}
