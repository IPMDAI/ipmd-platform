"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { emailDocument, escapeHtml } from "@/lib/email";
import type { FormResult } from "@/types";

/** Supprime un message de contact (réservé aux admins). */
export async function deleteContactMessage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireAdmin();
  await supabase.from("contact_messages").delete().eq("id", id);

  revalidatePath("/espace/messages");
}

/** Marque / démarque un message comme spam (réservé aux admins). */
export async function setContactSpam(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const spam = String(formData.get("spam") ?? "") === "1";
  if (!id) return;

  const { supabase } = await requireAdmin();
  await supabase.from("contact_messages").update({ is_spam: spam }).eq("id", id);

  revalidatePath("/espace/messages");
}

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
// Expéditeur sur le domaine vérifié ; les réponses reviennent vers info@ipmd.pro.
const CONTACT_FROM = process.env.RESEND_FROM_CONTACT ?? "IPMD <contact@send.ipmd.pro>";
const CONTACT_INBOX = "info@ipmd.pro";

/**
 * Répond à un message de contact : envoie la réponse à l'expéditeur, avec une
 * COPIE systématique à info@ipmd.pro (bcc). N'altère PAS le flux d'emails existant
 * (notification de contact) : envoi dédié réutilisant la mise en page IPMD.
 */
export async function replyToContactMessage(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!id) return { ok: false, message: "Message introuvable." };
  if (!body) return { ok: false, message: "Écrivez votre réponse avant d'envoyer." };

  const { supabase } = await requireAdmin();
  const { data: msg } = await supabase
    .from("contact_messages")
    .select("full_name, email, subject")
    .eq("id", id)
    .maybeSingle();
  if (!msg?.email) return { ok: false, message: "Ce message n'a pas d'adresse email valide." };

  if (!RESEND_API_KEY) return { ok: false, message: "Service d'envoi non configuré." };

  const name = (msg.full_name as string) || "";
  const subject = (msg.subject as string) || "votre message";
  const html = emailDocument(
    "Réponse de l'IPMD",
    `<p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(
      name
    )},</p>
     <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;white-space:pre-line">${escapeHtml(
       body
     )}</p>
     <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5">Bien cordialement,<br/>L'équipe IPMD — Institut Polytechnique des Métiers du Digital<br/>info@ipmd.pro · www.ipmd.pro</p>`
  );

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [msg.email],
        bcc: [CONTACT_INBOX], // copie systématique dans la boîte info@ipmd.pro
        reply_to: CONTACT_INBOX,
        subject: `Re : ${subject}`,
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, message: `Échec de l'envoi (${res.status}). ${t.slice(0, 120)}` };
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec de l'envoi." };
  }

  await supabase
    .from("contact_messages")
    .update({ replied_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/espace/messages");

  return { ok: true, message: "Réponse envoyée (copie dans info@ipmd.pro)." };
}
