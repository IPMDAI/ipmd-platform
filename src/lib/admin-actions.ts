"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VALID_ROLES } from "@/lib/dashboards";
import type { FormResult } from "@/types";

/**
 * Change le rôle d'un utilisateur. Réservé au Super Admin.
 * La RLS Supabase applique aussi cette restriction côté base.
 */
export async function updateUserRole(
  userId: string,
  newRole: string
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible." };
  }
  if (!VALID_ROLES.includes(newRole)) {
    return { ok: false, message: "Rôle invalide." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifié." };
  }

  // Vérifie que le demandeur est bien Super Admin.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "super_admin") {
    return { ok: false, message: "Action réservée au Super Admin." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/espace/utilisateurs");
  return { ok: true, message: "Rôle mis à jour." };
}

/** Vérifie que le demandeur est admin ou super_admin. */
async function getAdmin() {
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
  if (me?.role !== "super_admin" && me?.role !== "admin") return null;
  return { supabase };
}

/** Relie un parent à un enfant (réservé aux admins). */
export async function linkParentChild(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const parentId = formData.get("parent_id");
  const studentId = formData.get("student_id");
  if (typeof parentId !== "string" || typeof studentId !== "string" || !parentId || !studentId) {
    return { ok: false, message: "Sélectionnez un parent et un enfant." };
  }

  const relRaw = formData.get("relationship");
  const relationship = typeof relRaw === "string" && relRaw ? relRaw : null;

  const { error } = await ctx.supabase
    .from("parent_links")
    .insert({ parent_id: parentId, student_id: studentId, relationship });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Ce lien existe déjà." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/espace/parents");
  return { ok: true, message: "Lien créé." };
}

/** Met à jour les coordonnées d'un profil (étudiant ou enseignant). */
export async function setProfileContacts(
  userId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const val = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      phone: val("phone"),
      whatsapp: val("whatsapp"),
      personal_email: val("personal_email"),
      school_email: val("school_email"),
    })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/etudiants");
  revalidatePath("/espace/enseignants");
  return { ok: true, message: "Coordonnées enregistrées." };
}

/**
 * Complète l'état civil d'un étudiant (date + lieu de naissance) et,
 * éventuellement, l'affecte à une classe (ce qui définit sa filière).
 * Réservé aux admins.
 */
export async function setStudentCivil(
  userId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const fullName = str("full_name");
  const birthDate = str("birth_date");
  const birthPlace = str("birth_place");
  const classId = str("class_id");

  // On ne met à jour le nom que s'il est fourni (jamais l'effacer).
  const patch: Record<string, unknown> = {
    birth_date: birthDate,
    birth_place: birthPlace,
  };
  if (fullName) patch.full_name = fullName;

  const { error } = await ctx.supabase.from("profiles").update(patch).eq("id", userId);
  if (error) return { ok: false, message: error.message };

  if (classId) {
    const { error: cErr } = await ctx.supabase
      .from("class_members")
      .upsert({ class_id: classId, student_id: userId }, { onConflict: "student_id" });
    if (cErr) return { ok: false, message: `Naissance OK, mais classe : ${cErr.message}` };
  }

  revalidatePath("/espace/etudiants");
  return { ok: true, message: "Enregistré ✅" };
}

/** Supprime un lien parent ↔ enfant (action de formulaire simple). */
export async function unlinkParentChild(
  linkId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("parent_links").delete().eq("id", linkId);
  revalidatePath("/espace/parents");
}
