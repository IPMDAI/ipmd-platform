"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  revalidatePath("/espace/ma-classe");
  revalidatePath("/espace");
  return { ok: true, message: "Annonce publiée à la classe." };
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
