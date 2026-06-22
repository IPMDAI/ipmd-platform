"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SESSION_STATUS_VALUES } from "@/lib/sessions";
import type { FormResult } from "@/types";

async function getStaff() {
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
  if (!["admin", "super_admin", "pedagogie"].includes(me?.role ?? "")) return null;
  return { supabase, userId: user.id, role: me!.role as string };
}

function ourDow(iso: string): number {
  const js = new Date(iso + "T00:00:00Z").getUTCDay();
  return js === 0 ? 7 : js;
}

/** Génère les séances datées d'une classe sur une période (fériés exclus). */
export async function generateSessions(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };

  const classId = ((formData.get("class_id") as string) ?? "").trim();
  if (!classId) return { ok: false, message: "Choisissez une classe." };
  const start = ((formData.get("start") as string) ?? "").trim();
  const end = ((formData.get("end") as string) ?? "").trim();
  const semester = ((formData.get("semester") as string) ?? "").trim() || null;
  if (!start || !end || start > end) {
    return { ok: false, message: "Période invalide." };
  }
  // Garde-fou : 120 jours max.
  const days =
    (new Date(end + "T00:00:00Z").getTime() -
      new Date(start + "T00:00:00Z").getTime()) /
    86400000;
  if (days > 120) return { ok: false, message: "Période trop longue (max ~4 mois)." };

  const [{ data: slots }, { data: holidays }] = await Promise.all([
    ctx.supabase
      .from("timetable_slots")
      .select("day_of_week, start_time, end_time, subject, teacher_id, room_id")
      .eq("class_id", classId),
    ctx.supabase
      .from("holidays")
      .select("day")
      .gte("day", start)
      .lte("day", end),
  ]);
  if (!slots || slots.length === 0) {
    return { ok: false, message: "Aucun créneau au planning de cette classe." };
  }
  const holiSet = new Set((holidays ?? []).map((h) => h.day));

  // Instantané nom / fonction / salle (le staff peut lire ces données).
  const teacherIds = [...new Set(slots.map((s) => s.teacher_id).filter(Boolean))] as string[];
  const roomIds = [...new Set(slots.map((s) => s.room_id).filter(Boolean))] as string[];
  const tName = new Map<string, string>();
  const tFn = new Map<string, string>();
  const rName = new Map<string, string>();
  if (teacherIds.length > 0) {
    const [{ data: profs }, { data: sheets }] = await Promise.all([
      ctx.supabase.from("profiles").select("id, full_name").in("id", teacherIds),
      ctx.supabase.from("teacher_profiles").select("teacher_id, function").in("teacher_id", teacherIds),
    ]);
    for (const p of profs ?? []) tName.set(p.id, p.full_name || "—");
    for (const s of sheets ?? []) if (s.function) tFn.set(s.teacher_id, s.function);
  }
  if (roomIds.length > 0) {
    const { data: rooms } = await ctx.supabase.from("rooms").select("id, name").in("id", roomIds);
    for (const r of rooms ?? []) rName.set(r.id, r.name);
  }

  const rows: Record<string, unknown>[] = [];
  const cur = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (cur.getTime() <= last.getTime()) {
    const iso = cur.toISOString().slice(0, 10);
    const dow = ourDow(iso);
    for (const s of slots) {
      if (s.day_of_week !== dow) continue;
      rows.push({
        class_id: classId,
        teacher_id: s.teacher_id,
        subject: s.subject,
        room_id: s.room_id,
        teacher_name: s.teacher_id ? tName.get(s.teacher_id) ?? null : null,
        teacher_function: s.teacher_id ? tFn.get(s.teacher_id) ?? null : null,
        room_name: s.room_id ? rName.get(s.room_id) ?? null : null,
        session_date: iso,
        start_time: s.start_time,
        end_time: s.end_time,
        semester,
        status: holiSet.has(iso) ? "ferie" : "prevue",
      });
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  if (rows.length === 0) {
    return { ok: false, message: "Aucune séance sur cette période." };
  }

  const { error } = await ctx.supabase
    .from("course_sessions")
    .upsert(rows, { onConflict: "class_id,session_date,start_time", ignoreDuplicates: true });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/seances");
  return { ok: true, message: `${rows.length} séance(s) générée(s).` };
}

/** Reprogramme une séance (rattrapage) : crée une nouvelle séance datée et
 *  marque l'originale « remplacée ». */
export async function rescheduleSession(
  originalId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };

  const newDate = ((formData.get("new_date") as string) ?? "").trim();
  if (!newDate) return { ok: false, message: "Date de rattrapage requise." };

  const { data: orig } = await ctx.supabase
    .from("course_sessions")
    .select(
      "class_id, teacher_id, subject, room_id, teacher_name, teacher_function, room_name, start_time, end_time, semester"
    )
    .eq("id", originalId)
    .single();
  if (!orig) return { ok: false, message: "Séance introuvable." };

  const start = ((formData.get("new_start") as string) ?? "").trim() || orig.start_time;
  const end = ((formData.get("new_end") as string) ?? "").trim() || orig.end_time;

  const { error } = await ctx.supabase.from("course_sessions").upsert(
    {
      class_id: orig.class_id,
      teacher_id: orig.teacher_id,
      subject: orig.subject,
      room_id: orig.room_id,
      teacher_name: orig.teacher_name,
      teacher_function: orig.teacher_function,
      room_name: orig.room_name,
      session_date: newDate,
      start_time: start,
      end_time: end,
      semester: orig.semester,
      status: "prevue",
    },
    { onConflict: "class_id,session_date,start_time", ignoreDuplicates: true }
  );
  if (error) return { ok: false, message: error.message };

  await ctx.supabase
    .from("course_sessions")
    .update({ status: "remplacee" })
    .eq("id", originalId);

  revalidatePath("/espace/seances");
  return { ok: true, message: "Rattrapage programmé." };
}

/** Change le statut d'une séance (staff ou enseignant de la séance). */
export async function setSessionStatus(
  sessionId: string,
  status: string,
  _formData?: FormData
): Promise<void> {
  if (!SESSION_STATUS_VALUES.includes(status)) return;
  const supabase = await createClient();
  if (!supabase) return;
  await supabase
    .from("course_sessions")
    .update({ status })
    .eq("id", sessionId);
  revalidatePath("/espace/seances");
}
