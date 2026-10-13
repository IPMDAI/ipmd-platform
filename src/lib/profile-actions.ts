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

  const update: Record<string, string | null> = {
    full_name: fullName,
    birth_date: str(formData, "birth_date") || null,
    birth_place: str(formData, "birth_place") || null,
  };

  // Champs profil professionnel (profil parent) : ne touchés QUE si le formulaire
  // les porte, pour ne pas écraser les autres rôles qui n'affichent pas ces champs.
  if (formData.has("profession")) {
    update.profession = str(formData, "profession") || null;
    update.fonction = str(formData, "fonction") || null;
    update.entreprise = str(formData, "entreprise") || null;
    update.ville = str(formData, "ville") || null;
    update.pays = str(formData, "pays") || null; // jamais de valeur imposée d'office
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/parametres");
  revalidatePath("/espace");
  return { ok: true, message: "Profil mis à jour." };
}

/**
 * Consentement aux communications commerciales / opportunités (OPT-IN volontaire).
 * N'affecte JAMAIS les communications scolaires/administratives sur l'enfant.
 * Trace la date + l'origine du dernier consentement explicite.
 */
export async function setCommercialOptIn(enabled: boolean): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const update: Record<string, string | boolean | null> = {
    comm_opt_commercial: enabled,
  };
  // Consentement : on horodate l'acceptation. Un retrait garde la trace du dernier
  // consentement (flag=false, _at/_source inchangés).
  if (enabled) {
    update.comm_opt_commercial_at = new Date().toISOString();
    update.comm_opt_commercial_source = "parent_settings";
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/parametres");
  return {
    ok: true,
    message: enabled
      ? "Vous recevrez nos offres et opportunités IPMD."
      : "Vous ne recevrez plus les communications commerciales.",
  };
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

/**
 * Marque le compte comme ACTIVÉ (1re définition de mot de passe), une seule fois.
 * Appelé depuis /definir-mot-de-passe. Sert au suivi d'activation des invitations.
 */
export async function markActivated(): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ activated_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("activated_at", null);
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
