"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

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

/** Crée une séance réalisée (fiche pédagogique) pour un cours. */
export async function createLesson(
  courseId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getTeacher();
  if (!ctx) return { ok: false, message: "Action réservée aux enseignants." };

  const { data: course } = await ctx.supabase
    .from("courses")
    .select("id, teacher_id")
    .eq("id", courseId)
    .single();
  if (!course || course.teacher_id !== ctx.userId) {
    return { ok: false, message: "Cours introuvable." };
  }

  const lessonDate = str(formData, "lesson_date");
  if (!lessonDate) return { ok: false, message: "La date est requise." };

  const hoursRaw = str(formData, "hours").replace(",", ".");
  const hours = hoursRaw ? Number.parseFloat(hoursRaw) : null;

  const { error } = await ctx.supabase.from("course_lessons").insert({
    course_id: courseId,
    lesson_date: lessonDate,
    theme: str(formData, "theme") || null,
    resources: str(formData, "resources") || null,
    hours: hours != null && !Number.isNaN(hours) ? hours : null,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/cours/${courseId}/seances`);
  return { ok: true, message: "Séance enregistrée." };
}

/** Marque la présence d'un étudiant à une séance. */
export async function setAttendance(
  lessonId: string,
  studentId: string,
  present: boolean
): Promise<FormResult> {
  const ctx = await getTeacher();
  if (!ctx) return { ok: false, message: "Action réservée aux enseignants." };

  const { error } = await ctx.supabase
    .from("attendance")
    .upsert(
      { lesson_id: lessonId, student_id: studentId, present },
      { onConflict: "lesson_id,student_id" }
    );
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Présence enregistrée." };
}

/** Supprime une séance (action de formulaire simple). */
export async function deleteLesson(
  courseId: string,
  lessonId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getTeacher();
  if (!ctx) return;
  await ctx.supabase.from("course_lessons").delete().eq("id", lessonId);
  revalidatePath(`/espace/cours/${courseId}/seances`);
}
