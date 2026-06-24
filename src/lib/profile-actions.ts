"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Met à jour le profil de l'utilisateur connecté (nom). */
export async function updateMyProfile(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const fullName = str(formData, "full_name");
  if (!fullName) return { ok: false, message: "Le nom est requis." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      birth_date: str(formData, "birth_date") || null,
      birth_place: str(formData, "birth_place") || null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/parametres");
  revalidatePath("/espace");
  return { ok: true, message: "Profil mis à jour." };
}

/** Enregistre l'URL de la photo de profil (déjà téléversée dans le bucket avatars). */
export async function setMyAvatar(avatarUrl: string | null): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl || null })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/parametres");
  revalidatePath("/espace");
  return { ok: true, message: avatarUrl ? "Photo mise à jour." : "Photo retirée." };
}

/** Change le mot de passe de l'utilisateur connecté. */
export async function changeMyPassword(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const pwd = str(formData, "password");
  const confirm = str(formData, "confirm");
  if (pwd.length < 8) {
    return { ok: false, message: "8 caractères minimum." };
  }
  if (pwd !== confirm) {
    return { ok: false, message: "Les deux mots de passe ne correspondent pas." };
  }

  const { error } = await supabase.auth.updateUser({ password: pwd });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Mot de passe modifié." };
}
