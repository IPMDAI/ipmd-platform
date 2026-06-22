"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, canAdminUsers } from "@/lib/supabase/admin";
import { VALID_ROLES } from "@/lib/dashboards";
import type { FormResult } from "@/types";

async function requireSuperAdmin() {
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
  if (me?.role !== "super_admin") return null;
  return { supabase };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Crée un compte utilisateur avec un rôle (Super Admin uniquement). */
export async function createUserAccount(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  if (!canAdminUsers) {
    return {
      ok: false,
      message:
        "Création de comptes non configurée (clé SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel).",
    };
  }

  const email = str(formData, "email").toLowerCase();
  const fullName = str(formData, "full_name");
  const password = str(formData, "password");
  let role = str(formData, "role");
  if (!email.includes("@")) return { ok: false, message: "Email invalide." };
  if (!fullName) return { ok: false, message: "Nom et prénom requis." };
  if (password.length < 8) {
    return { ok: false, message: "Mot de passe : 8 caractères minimum." };
  }
  if (!VALID_ROLES.includes(role)) role = "etudiant";

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service indisponible." };

  // 1. Création du compte (email confirmé d'office).
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) return { ok: false, message: error.message };
  const newId = created.user?.id;
  if (!newId) return { ok: false, message: "Le compte n'a pas pu être créé." };

  // 2. Le trigger a créé le profil (rôle « etudiant »). On applique le rôle
  //    choisi via le client du Super Admin (autorisé par la policy + garde).
  const { error: upErr } = await ctx.supabase
    .from("profiles")
    .update({ role, full_name: fullName })
    .eq("id", newId);
  if (upErr) {
    return {
      ok: false,
      message: `Compte créé, mais rôle non appliqué : ${upErr.message}`,
    };
  }

  revalidatePath("/espace/utilisateurs");
  return { ok: true, message: `Compte créé pour ${email} (rôle : ${role}).` };
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro"
).replace(/\/$/, "");

/**
 * Crée le compte d'un candidat accepté et lui envoie un email d'invitation
 * pour définir lui-même son mot de passe. Marque la candidature « inscrit ».
 */
export async function inviteFromCandidature(
  candidatureId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  if (!canAdminUsers) {
    return {
      ok: false,
      message:
        "Création de comptes non configurée (clé SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel).",
    };
  }

  const { data: cand } = await ctx.supabase
    .from("inscription_requests")
    .select("full_name, email")
    .eq("id", candidatureId)
    .single();
  if (!cand) return { ok: false, message: "Candidature introuvable." };

  const email = (cand.email || "").trim().toLowerCase();
  const fullName = (cand.full_name || "").trim();
  if (!email.includes("@")) return { ok: false, message: "Email invalide." };

  let role = str(formData, "role");
  if (!VALID_ROLES.includes(role)) role = "etudiant";
  const classId = str(formData, "class_id");

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service indisponible." };

  // 1. Invitation (crée le compte + envoie l'email « définir mot de passe »).
  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName },
      redirectTo: `${SITE_URL}/definir-mot-de-passe`,
    }
  );
  if (error) return { ok: false, message: error.message };
  const newId = invited.user?.id;
  if (!newId) return { ok: false, message: "Le compte n'a pas pu être créé." };

  // 2. Rôle + nom (via le client Super Admin, autorisé par la garde).
  await ctx.supabase
    .from("profiles")
    .update({ role, full_name: fullName })
    .eq("id", newId);

  // 3. Affectation à une classe (optionnelle).
  if (classId) {
    await ctx.supabase
      .from("class_members")
      .upsert(
        { class_id: classId, student_id: newId },
        { onConflict: "student_id" }
      );
  }

  // 4. La candidature passe « inscrit ».
  await ctx.supabase
    .from("inscription_requests")
    .update({ status: "inscrit" })
    .eq("id", candidatureId);

  revalidatePath("/espace/candidatures");
  revalidatePath("/espace/utilisateurs");
  return {
    ok: true,
    message: `Invitation envoyée à ${email}. Le candidat va définir son mot de passe.`,
  };
}
