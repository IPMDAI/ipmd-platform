"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

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

/** Deux créneaux se chevauchent-ils ? (heures "HH:MM"). */
function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

/** Ajoute un créneau au planning d'une classe, avec détection de conflit. */
export async function addTimetableSlot(
  classId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const subject = str(formData, "subject");
  const teacherId = str(formData, "teacher_id") || null;
  const roomId = str(formData, "room_id") || null;
  const day = Number.parseInt(str(formData, "day_of_week"), 10);
  const start = str(formData, "start_time");
  const end = str(formData, "end_time");

  if (!subject) return { ok: false, message: "La matière est requise." };
  if (!day || !start || !end) {
    return { ok: false, message: "Jour et horaires sont requis." };
  }
  if (end <= start) {
    return { ok: false, message: "L'heure de fin doit suivre le début." };
  }

  // Détection de conflit (classe / prof / salle) sur le même jour.
  const { data: existing } = await ctx.supabase
    .from("timetable_slots")
    .select("class_id, teacher_id, room_id, start_time, end_time")
    .eq("day_of_week", day);

  for (const e of existing ?? []) {
    const eStart = (e.start_time as string).slice(0, 5);
    const eEnd = (e.end_time as string).slice(0, 5);
    if (!overlap(start, end, eStart, eEnd)) continue;
    if (e.class_id === classId) {
      return { ok: false, message: "⛔ La classe a déjà cours sur ce créneau." };
    }
    if (teacherId && e.teacher_id === teacherId) {
      return { ok: false, message: "⛔ Ce professeur est déjà occupé sur ce créneau." };
    }
    if (roomId && e.room_id === roomId) {
      return { ok: false, message: "⛔ Cette salle est déjà occupée sur ce créneau." };
    }
  }

  const { error } = await ctx.supabase.from("timetable_slots").insert({
    class_id: classId,
    subject,
    teacher_id: teacherId,
    room_id: roomId,
    day_of_week: day,
    start_time: start,
    end_time: end,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/planning/${classId}`);
  revalidatePath("/espace/mon-emploi-du-temps");
  return { ok: true, message: "Créneau ajouté." };
}

/** Supprime un créneau (action de formulaire simple). */
export async function removeTimetableSlot(
  classId: string,
  slotId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("timetable_slots").delete().eq("id", slotId);
  revalidatePath(`/espace/planning/${classId}`);
}
