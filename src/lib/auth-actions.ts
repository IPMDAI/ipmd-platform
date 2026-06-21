"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Création de compte (Supabase Auth). Le profil est créé par trigger. */
export async function signUp(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible pour le moment." };
  }

  const fullName = field(formData, "fullName");
  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!fullName || !email || !password) {
    return { ok: false, message: "Merci de remplir tous les champs." };
  }
  if (password.length < 6) {
    return {
      ok: false,
      message: "Le mot de passe doit contenir au moins 6 caractères.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  // Si l'email de confirmation est désactivé, une session existe déjà.
  if (data.session) {
    redirect("/espace");
  }

  return {
    ok: true,
    message:
      "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.",
  };
}

/** Connexion. */
export async function signIn(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible pour le moment." };
  }

  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!email || !password) {
    return { ok: false, message: "Email et mot de passe requis." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: "Email ou mot de passe incorrect." };
  }

  redirect("/espace");
}

/** Déconnexion. */
export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
