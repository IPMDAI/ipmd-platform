"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/** Publie une annonce à une classe (enseignant / pédagogie / admin). */
export async function postClassAnnouncement(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const classId = str(formData, "class_id");
  const body = str(formData, "body");
  if (!classId) return { ok: false, message: "Choisissez une classe." };
  if (!body) return { ok: false, message: "Le message est requis." };

  const { error } = await supabase.from("class_announcements").insert({
    class_id: classId,
    author_id: user.id,
    title: str(formData, "title") || null,
    body,
  });
  if (error) {
    return { ok: false, message: "Publication refusée (classe non autorisée)." };
  }

  // Notifie les élèves de la classe par email (best-effort, via service role).
  let emailNote = "";
  if (canSendEmail) {
    const admin = createAdminClient();
    if (admin) {
      const { data: members } = await admin
        .from("class_members")
        .select("student_id")
        .eq("class_id", classId);
      const ids = (members ?? []).map((m) => m.student_id);
      if (ids.length > 0) {
        const { data: people } = await admin
          .from("profiles")
          .select("email")
          .in("id", ids);
        const emails = (people ?? [])
          .map((p) => p.email)
          .filter((e): e is string => Boolean(e));
        if (emails.length > 0) {
          const title = str(formData, "title");
          const sent = await sendEmailTo(
            emails,
            `IPMD — Annonce de votre classe${title ? ` : ${title}` : ""}`,
            emailDocument(
              title || "Annonce de votre classe",
              `<p style="font-size:14px;line-height:1.7;color:#374151;white-space:pre-line">${escapeHtml(
                body
              )}</p>`
            )
          );
          emailNote = ` ${sent} email(s) envoyé(s).`;
        }
      }
    }
  }

  revalidatePath("/espace/ma-classe");
  revalidatePath("/espace");
  return { ok: true, message: `Annonce publiée à la classe.${emailNote}` };
}

/** Supprime une annonce de classe (auteur ou admin). */
export async function deleteClassAnnouncement(
  id: string,
  _formData?: FormData
): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.from("class_announcements").delete().eq("id", id);
  revalidatePath("/espace/ma-classe");
  revalidatePath("/espace");
}
