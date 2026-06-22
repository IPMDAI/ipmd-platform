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

/** Crée un examen pour un cours. */
export async function createExam(
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

  const title = str(formData, "title");
  if (!title) return { ok: false, message: "Le titre est requis." };

  const { error } = await ctx.supabase
    .from("exams")
    .insert({ course_id: courseId, title });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/cours/${courseId}/examens`);
  return { ok: true, message: "Examen créé." };
}

/** Ajoute une question (QCM) à un examen. */
export async function addQuestion(
  courseId: string,
  examId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getTeacher();
  if (!ctx) return { ok: false, message: "Action réservée aux enseignants." };

  const question = str(formData, "question");
  if (!question) return { ok: false, message: "La question est requise." };

  const raw = [0, 1, 2, 3].map((i) => str(formData, `option_${i}`));
  const filled = raw
    .map((o, i) => ({ o, i }))
    .filter((x) => x.o.length > 0);
  if (filled.length < 2) {
    return { ok: false, message: "Renseignez au moins 2 options." };
  }

  const correctRaw = Number.parseInt(str(formData, "correct"), 10);
  const correctPos = filled.findIndex((x) => x.i === correctRaw);
  if (correctPos < 0) {
    return { ok: false, message: "L'option correcte choisie est vide." };
  }

  const pointsRaw = str(formData, "points").replace(",", ".");
  const points = pointsRaw ? Number.parseFloat(pointsRaw) : 1;

  const { error } = await ctx.supabase.from("exam_questions").insert({
    exam_id: examId,
    question,
    options: filled.map((x) => x.o),
    correct_index: correctPos,
    points: !Number.isNaN(points) && points > 0 ? points : 1,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/cours/${courseId}/examens/${examId}`);
  return { ok: true, message: "Question ajoutée." };
}

/** Publie / dépublie un examen (action simple). */
export async function toggleExamPublish(
  courseId: string,
  examId: string,
  publish: boolean,
  _formData?: FormData
): Promise<void> {
  const ctx = await getTeacher();
  if (!ctx) return;
  await ctx.supabase
    .from("exams")
    .update({ published: publish })
    .eq("id", examId);
  revalidatePath(`/espace/cours/${courseId}/examens/${examId}`);
  revalidatePath(`/espace/cours/${courseId}/examens`);
}

export async function deleteExam(
  courseId: string,
  examId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getTeacher();
  if (!ctx) return;
  await ctx.supabase.from("exams").delete().eq("id", examId);
  revalidatePath(`/espace/cours/${courseId}/examens`);
}

export async function deleteQuestion(
  courseId: string,
  examId: string,
  questionId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getTeacher();
  if (!ctx) return;
  await ctx.supabase.from("exam_questions").delete().eq("id", questionId);
  revalidatePath(`/espace/cours/${courseId}/examens/${examId}`);
}

/** L'étudiant soumet ses réponses → correction automatique (RPC). */
export async function submitExam(
  examId: string,
  answers: Record<string, number>
): Promise<FormResult & { score?: number; max?: number }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const { data, error } = await supabase.rpc("submit_exam", {
    p_exam_id: examId,
    p_answers: answers,
  });
  if (error) {
    return { ok: false, message: error.message.replace(/^.*?:\s*/, "") };
  }

  const result = data as { score: number; max: number };
  revalidatePath(`/espace/examen/${examId}`);
  return {
    ok: true,
    message: "Examen soumis !",
    score: result?.score,
    max: result?.max,
  };
}
