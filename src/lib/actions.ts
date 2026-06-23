"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  buildRows,
  emailLayout,
  sendNotification,
} from "@/lib/email";
import type { FormResult, UniverseId } from "@/types";

/**
 * Server Actions des formulaires publics.
 *
 * Tant que Supabase n'est pas configuré, ces actions valident les données et
 * renvoient un succès « démo » sans rien persister. Une fois les tables créées
 * (voir README), elles écrivent dans `inscription_requests` / `contact_messages`.
 */

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitInscription(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const payload = {
    full_name: getString(formData, "fullName"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    universe: getString(formData, "universe") as UniverseId,
    program_interest: getString(formData, "programInterest"),
    entry_level: getString(formData, "entryLevel") || null,
    desired_role:
      ["etudiant", "professionnel", "dirigeant", "parent"].includes(
        getString(formData, "profile")
      )
        ? getString(formData, "profile")
        : null,
    last_education: getString(formData, "lastEducation") || null,
    last_diploma: getString(formData, "lastDiploma") || null,
    message: getString(formData, "message") || null,
  };

  if (!payload.full_name || !payload.email || !payload.phone) {
    return { ok: false, message: "Merci de renseigner nom, email et téléphone." };
  }
  if (!isValidEmail(payload.email)) {
    return { ok: false, message: "L'adresse email semble invalide." };
  }

  if (!isSupabaseConfigured) {
    return {
      ok: true,
      message:
        "Demande enregistrée (mode démo). Configurez Supabase pour l'envoi réel.",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }

  // Anti-doublon : une demande non traitée existe déjà pour cet email/téléphone ?
  const { data: pending } = await supabase.rpc("has_pending_inscription", {
    p_email: payload.email,
    p_phone: payload.phone,
  });
  if (pending === true) {
    return {
      ok: false,
      code: "duplicate",
      message:
        "Votre demande d'inscription a déjà été enregistrée. Elle est actuellement en cours d'étude. Vous recevrez une réponse dans un délai de 24 heures.",
    };
  }

  const { error } = await supabase.from("inscription_requests").insert(payload);
  if (error) {
    return {
      ok: false,
      message: "Une erreur est survenue. Merci de réessayer.",
    };
  }

  // Notification email (best-effort, ne bloque pas la réponse).
  await sendNotification(
    `Nouvelle inscription — ${payload.full_name}`,
    emailLayout(
      "Nouvelle demande d'inscription",
      buildRows([
        ["Nom", payload.full_name],
        ["Email", payload.email],
        ["Téléphone", payload.phone],
        ["Univers", payload.universe],
        ["Formation", payload.program_interest],
        ["Niveau", payload.entry_level],
        ["Message", payload.message],
      ])
    ),
    payload.email
  );

  return {
    ok: true,
    message:
      "Félicitations, votre demande d'inscription a bien été reçue. Votre dossier sera analysé par notre équipe et vous recevrez une réponse dans un délai de 24 heures.",
  };
}

export async function submitContact(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const payload = {
    full_name: getString(formData, "fullName"),
    email: getString(formData, "email"),
    subject: getString(formData, "subject"),
    message: getString(formData, "message"),
  };

  if (!payload.full_name || !payload.email || !payload.message) {
    return { ok: false, message: "Merci de renseigner nom, email et message." };
  }
  if (!isValidEmail(payload.email)) {
    return { ok: false, message: "L'adresse email semble invalide." };
  }

  if (!isSupabaseConfigured) {
    return {
      ok: true,
      message: "Message envoyé (mode démo). Configurez Supabase pour l'envoi réel.",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }

  const { error } = await supabase.from("contact_messages").insert(payload);
  if (error) {
    return { ok: false, message: "Une erreur est survenue. Merci de réessayer." };
  }

  // Notification email (best-effort, ne bloque pas la réponse).
  await sendNotification(
    `Nouveau message — ${payload.full_name}`,
    emailLayout(
      "Nouveau message de contact",
      buildRows([
        ["Nom", payload.full_name],
        ["Email", payload.email],
        ["Sujet", payload.subject],
        ["Message", payload.message],
      ])
    ),
    payload.email
  );

  return { ok: true, message: "Merci ! Votre message a bien été envoyé." };
}
