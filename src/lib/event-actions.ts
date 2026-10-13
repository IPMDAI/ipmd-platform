"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STAFF_ROLES } from "@/lib/messaging";
import { EVENT_KIND_VALUES, eventWhen } from "@/lib/events";
import {
  canSendEmail,
  emailDocument,
  escapeHtml,
  sendScolariteEmail,
} from "@/lib/email";
import type { FormResult } from "@/types";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro").replace(/\/$/, "");

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
  const deadlineRaw = str(formData, "registration_deadline");
  const capacityRaw = str(formData, "capacity");
  const capacity = capacityRaw ? Math.max(1, Number.parseInt(capacityRaw, 10)) : null;

  const { error } = await ctx.supabase.from("events").insert({
    title,
    description: str(formData, "description") || null,
    kind,
    starts_at: new Date(startsRaw).toISOString(),
    ends_at: endsRaw ? new Date(endsRaw).toISOString() : null,
    location: str(formData, "location") || null,
    audience,
    status: formData.get("published") === "on" ? "publie" : "brouillon",
    registration_deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
    capacity: capacity && !Number.isNaN(capacity) ? capacity : null,
    created_by: ctx.userId,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/evenements");
  revalidatePath("/espace/vie-ipmd");
  return { ok: true, message: "Événement créé." };
}

/** Staff : change le statut (brouillon/publie/annule). Annuler ≠ supprimer. */
export async function setEventStatus(
  eventId: string,
  status: "brouillon" | "publie" | "annule"
): Promise<void> {
  const ctx = await staffCtx();
  if (!ctx) return;
  if (!["brouillon", "publie", "annule"].includes(status)) return;
  await ctx.supabase.from("events").update({ status }).eq("id", eventId);
  revalidatePath("/espace/evenements");
  revalidatePath("/espace/vie-ipmd");
}

/** Staff : invite (ou ré-invite) un utilisateur précis à un événement (mode ciblé). */
export async function inviteToEvent(
  eventId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await staffCtx();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };
  const userId = str(formData, "user_id");
  if (!userId) return { ok: false, message: "Sélectionnez un destinataire." };

  const { error } = await ctx.supabase
    .from("event_invitations")
    .upsert(
      { event_id: eventId, user_id: userId, invited_by: ctx.userId, invited_at: new Date().toISOString() },
      { onConflict: "event_id,user_id" }
    );
  if (error) return { ok: false, message: error.message };

  // Email d'invitation (best-effort) : ne bloque jamais l'invitation.
  let emailed = false;
  if (canSendEmail) {
    try {
      const [{ data: ev }, { data: person }] = await Promise.all([
        ctx.supabase
          .from("events")
          .select("title, starts_at, ends_at, location, status")
          .eq("id", eventId)
          .maybeSingle(),
        ctx.supabase.from("profiles").select("email, full_name").eq("id", userId).maybeSingle(),
      ]);
      if (ev && ev.status !== "annule" && person?.email) {
        const when = eventWhen(ev.starts_at, ev.ends_at);
        const html = emailDocument(
          "Invitation — Vie IPMD",
          `<p style="font-size:14px;color:#374151">Bonjour${
            person.full_name ? ` ${escapeHtml(person.full_name)}` : ""
          },</p>
           <p style="font-size:14px;color:#374151">Vous êtes invité(e) à l'événement <strong>${escapeHtml(
             ev.title
           )}</strong>.</p>
           <p style="font-size:14px;color:#374151">🗓️ ${escapeHtml(when)}${
             ev.location ? ` · 📍 ${escapeHtml(ev.location)}` : ""
           }</p>
           <p style="text-align:center;margin:24px 0"><a href="${SITE_URL}/espace/vie-ipmd" style="background:#e4002b;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">Voir et répondre dans mon espace</a></p>`
        );
        const n = await sendScolariteEmail([person.email], `IPMD — Invitation : ${ev.title}`, html);
        emailed = n > 0;
      }
    } catch {
      // best-effort
    }
  }

  revalidatePath("/espace/evenements");
  return {
    ok: true,
    message:
      "Invitation enregistrée." +
      (canSendEmail ? (emailed ? " Email envoyé." : " (Email non envoyé.)") : ""),
  };
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

  // Garde : statut publié + avant la date limite.
  const { data: ev } = await supabase
    .from("events")
    .select("status, registration_deadline, capacity")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev || ev.status !== "publie") {
    return { ok: false, message: "Les réponses ne sont pas ouvertes pour cet événement." };
  }
  if (ev.registration_deadline && new Date(ev.registration_deadline) <= new Date()) {
    return { ok: false, message: "La date limite d'inscription est passée." };
  }

  // Garde capacité : on ne bloque que la confirmation « oui » si complet
  // (sauf si l'utilisateur était déjà confirmé). Compte via fonction SECURITY DEFINER.
  if (ev.capacity != null && response === "oui") {
    const [{ data: mine }, { data: count }] = await Promise.all([
      supabase.from("event_rsvps").select("response").eq("event_id", eventId).eq("user_id", user.id).maybeSingle(),
      supabase.rpc("event_oui_count", { p_event: eventId }),
    ]);
    const already = mine?.response === "oui";
    const confirmed = typeof count === "number" ? count : 0;
    if (!already && confirmed >= ev.capacity) {
      return { ok: false, message: "Événement complet : plus de place disponible." };
    }
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
