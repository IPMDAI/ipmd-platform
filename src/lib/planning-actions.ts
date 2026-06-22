"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  canSendEmail,
  emailDocument,
  escapeHtml,
  sendEmailTo,
} from "@/lib/email";
import { DAY_LABELS, formatTime } from "@/lib/schedule";
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

/** Notifie par email tous les étudiants d'une classe de leur emploi du temps. */
export async function notifyClassPlanning(
  classId: string,
  _prev: FormResult | null,
  _formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (!canSendEmail) {
    return {
      ok: false,
      message:
        "Email non configuré (clé Resend / expéditeur sur domaine vérifié).",
    };
  }

  const { data: klass } = await ctx.supabase
    .from("classes")
    .select("name")
    .eq("id", classId)
    .single();
  if (!klass) return { ok: false, message: "Classe introuvable." };

  // Étudiants de la classe.
  const { data: members } = await ctx.supabase
    .from("class_members")
    .select("student_id")
    .eq("class_id", classId);
  const ids = (members ?? []).map((m) => m.student_id);
  if (ids.length === 0) {
    return { ok: false, message: "Aucun étudiant dans cette classe." };
  }
  const { data: students } = await ctx.supabase
    .from("profiles")
    .select("email")
    .in("id", ids);
  const emails = (students ?? []).map((s) => s.email).filter(Boolean);

  // Créneaux + noms prof/salle.
  const { data: slots } = await ctx.supabase
    .from("timetable_slots")
    .select("subject, teacher_id, room_id, day_of_week, start_time, end_time")
    .eq("class_id", classId)
    .order("day_of_week")
    .order("start_time");

  const tIds = [...new Set((slots ?? []).map((s) => s.teacher_id).filter(Boolean))] as string[];
  const rIds = [...new Set((slots ?? []).map((s) => s.room_id).filter(Boolean))] as string[];
  const tName = new Map<string, string>();
  const rName = new Map<string, string>();
  if (tIds.length) {
    const { data } = await ctx.supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", tIds);
    for (const p of data ?? []) tName.set(p.id, p.full_name || p.email);
  }
  if (rIds.length) {
    const { data } = await ctx.supabase
      .from("rooms")
      .select("id, name")
      .in("id", rIds);
    for (const x of data ?? []) rName.set(x.id, x.name);
  }

  const rows =
    (slots ?? [])
      .map((s) => {
        const extra = [
          s.teacher_id ? tName.get(s.teacher_id) : null,
          s.room_id ? rName.get(s.room_id) : null,
        ]
          .filter(Boolean)
          .map((x) => escapeHtml(String(x)))
          .join(" · ");
        return `<tr>
          <td style="padding:6px 12px;color:#6b7280;font-weight:600;white-space:nowrap">${escapeHtml(
            DAY_LABELS[s.day_of_week] ?? ""
          )}</td>
          <td style="padding:6px 12px;color:#0b0b0d">${formatTime(
            s.start_time
          )}–${formatTime(s.end_time)} · <b>${escapeHtml(s.subject)}</b>${
          extra ? ` · ${extra}` : ""
        }</td>
        </tr>`;
      })
      .join("") ||
    `<tr><td style="padding:6px 12px;color:#6b7280">Aucun créneau planifié.</td></tr>`;

  const body = `<p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Voici l'emploi du temps de ta classe <b>${escapeHtml(
    klass.name
  )}</b> :</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
  <p style="margin:18px 0 0">
    <a href="https://www.ipmd.pro/espace/mon-emploi-du-temps" style="display:inline-block;background:#e01228;color:#fff;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:9999px;font-size:14px">Voir sur mon espace</a>
  </p>`;

  const html = emailDocument(`Ton emploi du temps — ${klass.name}`, body);
  const sent = await sendEmailTo(emails, `IPMD — Emploi du temps ${klass.name}`, html);

  return {
    ok: sent > 0,
    message:
      sent > 0
        ? `📧 ${sent} étudiant(s) notifié(s) par email.`
        : "Aucun email envoyé (vérifie l'expéditeur Resend).",
  };
}
