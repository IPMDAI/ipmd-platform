"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/** Récupère le contexte enseignant (ou super_admin), sinon null. */
async function getTeacher() {
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
  if (me?.role !== "enseignant" && me?.role !== "super_admin") return null;
  return { supabase, userId: user.id };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Crée un cours appartenant à l'enseignant courant. */
export async function createCourse(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getTeacher();
  if (!ctx) return { ok: false, message: "Action réservée aux enseignants." };

  const title = str(formData, "title");
  if (!title) return { ok: false, message: "Le titre du cours est requis." };

  const { error } = await ctx.supabase.from("courses").insert({
    teacher_id: ctx.userId,
    title,
    field: str(formData, "field") || null,
    description: str(formData, "description") || null,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/cours");
  return { ok: true, message: "Cours créé." };
}

/** Ajoute un devoir à un cours de l'enseignant courant. */
export async function createAssignment(
  courseId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getTeacher();
  if (!ctx) return { ok: false, message: "Action réservée aux enseignants." };

  // Vérifie que le cours appartient bien à l'enseignant.
  const { data: course } = await ctx.supabase
    .from("courses")
    .select("id, teacher_id")
    .eq("id", courseId)
    .single();
  if (!course || course.teacher_id !== ctx.userId) {
    return { ok: false, message: "Cours introuvable." };
  }

  const title = str(formData, "title");
  if (!title) return { ok: false, message: "Le titre du devoir est requis." };

  const { error } = await ctx.supabase.from("assignments").insert({
    course_id: courseId,
    title,
    description: str(formData, "description") || null,
    due_date: str(formData, "due_date") || null,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/cours/${courseId}`);
  return { ok: true, message: "Devoir ajouté." };
}
