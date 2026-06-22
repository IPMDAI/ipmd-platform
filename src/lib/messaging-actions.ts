"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  MESSAGE_CATEGORY_VALUES,
  servicesForRole,
  STAFF_ROLES,
} from "@/lib/messaging";
import type { FormResult } from "@/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Un utilisateur connecté envoie un message à l'administration. */
export async function sendInternalMessage(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const subject = str(formData, "subject");
  const body = str(formData, "body");
  let category = str(formData, "category");
  if (!subject || !body) {
    return { ok: false, message: "Objet et message requis." };
  }
  if (!MESSAGE_CATEGORY_VALUES.includes(category)) category = "question";

  // Service destinataire, validé selon le rôle de l'expéditeur.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const allowed = servicesForRole(me?.role ?? "etudiant").map((s) => s.value);
  let recipientRole = str(formData, "recipient_role");
  if (!allowed.includes(recipientRole)) recipientRole = allowed[0] ?? "admin";

  const { error } = await supabase.from("internal_messages").insert({
    sender_id: user.id,
    category,
    subject,
    body,
    recipient_role: recipientRole,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/messagerie");
  return { ok: true, message: "Message envoyé à l'administration." };
}

/** L'administration répond à un message. */
export async function replyInternalMessage(
  messageId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!STAFF_ROLES.includes(me?.role ?? "")) {
    return { ok: false, message: "Action réservée aux services IPMD." };
  }

  const reply = str(formData, "reply");
  if (!reply) return { ok: false, message: "La réponse est vide." };

  const { error } = await supabase
    .from("internal_messages")
    .update({
      admin_reply: reply,
      status: "repondu",
      replied_at: new Date().toISOString(),
    })
    .eq("id", messageId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/messagerie");
  revalidatePath("/espace");
  return { ok: true, message: "Réponse envoyée." };
}
