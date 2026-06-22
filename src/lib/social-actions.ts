"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

async function me() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

/** Envoie une demande d'ami. */
export async function sendFriendRequest(
  addresseeId: string
): Promise<FormResult> {
  const ctx = await me();
  if (!ctx) return { ok: false, message: "Veuillez vous connecter." };
  if (addresseeId === ctx.userId) {
    return { ok: false, message: "Action impossible." };
  }
  const { error } = await ctx.supabase.from("friendships").insert({
    requester_id: ctx.userId,
    addressee_id: addresseeId,
    status: "pending",
  });
  if (error) {
    return { ok: false, message: "Demande déjà existante." };
  }
  revalidatePath("/espace/amis");
  return { ok: true, message: "Demande envoyée." };
}

/** Accepte une demande d'ami reçue. */
export async function acceptFriend(id: string): Promise<void> {
  const ctx = await me();
  if (!ctx) return;
  await ctx.supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", id);
  revalidatePath("/espace/amis");
}

/** Refuse / annule / retire une amitié. */
export async function removeFriend(id: string): Promise<void> {
  const ctx = await me();
  if (!ctx) return;
  await ctx.supabase.from("friendships").delete().eq("id", id);
  revalidatePath("/espace/amis");
}

/** Envoie un message privé à un ami. */
export async function sendDirectMessage(
  recipientId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await me();
  if (!ctx) return { ok: false, message: "Veuillez vous connecter." };
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  if (!body) return { ok: false, message: "Message vide." };

  const { error } = await ctx.supabase.from("direct_messages").insert({
    sender_id: ctx.userId,
    recipient_id: recipientId,
    body,
  });
  if (error) {
    return { ok: false, message: "Vous devez être amis pour discuter." };
  }
  revalidatePath(`/espace/discussion/${recipientId}`);
  return { ok: true, message: "" };
}
