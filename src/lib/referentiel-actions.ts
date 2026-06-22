"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/** Contexte admin (admin ou super_admin), sinon null. */
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

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function createFiliere(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom de la filière est requis." };
  const { error } = await ctx.supabase.from("filieres").insert({ name });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/classes");
  return { ok: true, message: "Filière créée." };
}

export async function createClasse(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom de la classe est requis." };
  const { error } = await ctx.supabase.from("classes").insert({
    name,
    filiere_id: str(formData, "filiere_id") || null,
    level: str(formData, "level") || null,
    academic_year: str(formData, "academic_year") || null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/classes");
  return { ok: true, message: "Classe créée." };
}

export async function createRoom(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom de la salle est requis." };
  const capacityRaw = str(formData, "capacity");
  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
  const { error } = await ctx.supabase.from("rooms").insert({
    name,
    capacity: Number.isNaN(capacity as number) ? null : capacity,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/salles");
  return { ok: true, message: "Salle créée." };
}

/** Affecte (ou réaffecte) un étudiant à une classe. classId vide = retire. */
export async function setStudentClass(
  studentId: string,
  classId: string
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  if (!classId) {
    const { error } = await ctx.supabase
      .from("class_members")
      .delete()
      .eq("student_id", studentId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/espace/classes");
    return { ok: true, message: "Retiré." };
  }

  const { error } = await ctx.supabase
    .from("class_members")
    .upsert(
      { student_id: studentId, class_id: classId },
      { onConflict: "student_id" }
    );
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/classes");
  return { ok: true, message: "Affecté." };
}

/** Suppressions simples (actions de formulaire). */
export async function deleteFiliere(id: string, _formData?: FormData) {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("filieres").delete().eq("id", id);
  revalidatePath("/espace/classes");
}

export async function deleteClasse(id: string, _formData?: FormData) {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("classes").delete().eq("id", id);
  revalidatePath("/espace/classes");
}

export async function deleteRoom(id: string, _formData?: FormData) {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("rooms").delete().eq("id", id);
  revalidatePath("/espace/salles");
}
