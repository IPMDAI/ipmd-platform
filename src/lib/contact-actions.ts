"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";

/** Supprime un message de contact (réservé aux admins). */
export async function deleteContactMessage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireAdmin();
  await supabase.from("contact_messages").delete().eq("id", id);

  revalidatePath("/espace/messages");
}
