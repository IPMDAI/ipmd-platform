import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  findConflicts,
  CONFLICT_LABEL,
  type Slot,
} from "@/lib/planning-conflicts";

export const runtime = "nodejs";

/** Synthèse intelligente du jour pour l'administration (Claude). */
export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Service indisponible." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Veuillez vous reconnecter." }, { status: 401 });
  }
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "super_admin") {
    return Response.json(
      { error: "Action réservée à l'administration." },
      { status: 403 }
    );
  }

  // Rassemble l'état de l'établissement.
  const [cand, msg, fil, mod, students, slotRows, classRows, roomRows, teacherRows] =
    await Promise.all([
      supabase.from("inscription_requests").select("*", { count: "exact", head: true }).eq("status", "nouveau"),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }),
      supabase.from("filieres").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
      supabase.from("modules").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "etudiant"),
      supabase
        .from("timetable_slots")
        .select("id, class_id, subject, teacher_id, room_id, day_of_week, start_time, end_time"),
      supabase.from("classes").select("id, name"),
      supabase.from("rooms").select("id, name"),
      supabase.from("profiles").select("id, full_name").eq("role", "enseignant"),
    ]);

  const slots = (slotRows.data ?? []) as Slot[];
  const conflicts = findConflicts(slots, {
    classes: new Map((classRows.data ?? []).map((c) => [c.id, c.name])),
    rooms: new Map((roomRows.data ?? []).map((r) => [r.id, r.name])),
    teachers: new Map((teacherRows.data ?? []).map((t) => [t.id, t.full_name ?? "?"])),
  });

  const facts = {
    candidatures_nouvelles: cand.count ?? 0,
    messages_contact: msg.count ?? 0,
    filieres_a_valider: fil.count ?? 0,
    modules_a_valider: mod.count ?? 0,
    etudiants: students.count ?? 0,
    creneaux_planning: slots.length,
    conflits_planning: conflicts.map((c) => `${CONFLICT_LABEL[c.kind]} — ${c.detail}`),
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Synthèse IA non configurée (clé ANTHROPIC_API_KEY manquante). Les conflits de planning restent affichés ci-dessous.",
      },
      { status: 503 }
    );
  }

  const client = new Anthropic({ apiKey });
  try {
    const m = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 700,
      system:
        "Tu es l'assistant de pilotage de l'IPMD (Institut Polytechnique des Métiers du Digital & IA, Abidjan). Tu aides l'administration à prioriser sa journée. Réponds en français, de façon concise et actionnable : 3 à 5 puces maximum, commence par le plus urgent (conflits de planning, validations en attente), puis les éléments à traiter. Pas d'introduction ni de conclusion, uniquement les puces.",
      messages: [
        {
          role: "user",
          content: `Voici l'état de l'établissement aujourd'hui (JSON) :\n${JSON.stringify(
            facts,
            null,
            2
          )}\nDonne-moi les priorités du jour.`,
        },
      ],
    });

    const summary = m.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!summary) {
      return Response.json(
        { error: "L'IA n'a pas renvoyé de synthèse. Réessaie." },
        { status: 502 }
      );
    }
    return Response.json({ summary });
  } catch (err) {
    console.error("Synthèse IA error:", err);
    return Response.json(
      { error: "Erreur lors de la génération IA. Réessaie." },
      { status: 502 }
    );
  }
}
