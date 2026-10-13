"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STAFF_ROLES } from "@/lib/messaging";
import { EVENT_KIND_VALUES } from "@/lib/events";
import type { FormResult } from "@/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function staffCtx() {
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
  if (!STAFF_ROLES.includes(me?.role ?? "")) return null;
  return { supabase, userId: user.id };
}

/** Staff : crée un événement (publié ou brouillon). */
export async function createEvent(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await staffCtx();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };

  const title = str(formData, "title");
  const startsRaw = str(formData, "starts_at");
  if (!title) return { ok: false, message: "Titre requis." };
  if (!startsRaw) return { ok: false, message: "Date de début requise." };

  let kind = str(formData, "kind");
  if (!EVENT_KIND_VALUES.includes(kind)) kind = "autre";
  let audience = str(formData, "audience");
  if (!["all", "parent", "etudiant"].includes(audience)) audience = "all";
  const endsRaw = str(formData, "ends_at");

  const { error } = await ctx.supabase.from("events").insert({
    title,
    description: str(formData, "description") || null,
    kind,
    starts_at: new Date(startsRaw).toISOString(),
    ends_at: endsRaw ? new Date(endsRaw).toISOString() : null,
    location: str(formData, "location") || null,
    audience,
    published: formData.get("published") === "on",
    created_by: ctx.userId,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/evenements");
  revalidatePath("/espace/vie-ipmd");
  return { ok: true, message: "Événement créé." };
}

/** Staff : publie / dépublie un événement. */
export async function toggleEventPublished(
  eventId: string,
  published: boolean
): Promise<void> {
  const ctx = await staffCtx();
  if (!ctx) return;
  await ctx.supabase.from("events").update({ published }).eq("id", eventId);
  revalidatePath("/espace/evenements");
  revalidatePath("/espace/vie-ipmd");
}

/** Staff : supprime un événement (et ses RSVP). */
export async function deleteEvent(eventId: string): Promise<void> {
  const ctx = await staffCtx();
  if (!ctx) return;
  await ctx.supabase.from("events").delete().eq("id", eventId);
  revalidatePath("/espace/evenements");
}

/** Utilisateur : répond à un événement (participe / peut-être / non). */
export async function setRsvp(
  eventId: string,
  response: "oui" | "non" | "peut_etre"
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };
  if (!["oui", "non", "peut_etre"].includes(response)) {
    return { ok: false, message: "Réponse invalide." };
  }

  const { error } = await supabase
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, user_id: user.id, response, responded_at: new Date().toISOString() },
      { onConflict: "event_id,user_id" }
    );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/vie-ipmd");
  return { ok: true, message: "Réponse enregistrée." };
}
