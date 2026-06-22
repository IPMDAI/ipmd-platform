"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendNotification, emailLayout, buildRows } from "@/lib/email";
import { APPLICATION_STATUS_VALUES } from "@/lib/recruitment";
import type { FormResult } from "@/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

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

/** Candidature enseignant (formulaire public). */
export async function submitTeacherApplication(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible pour le moment." };
  }

  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  if (!fullName || !email) {
    return { ok: false, message: "Nom et email sont requis." };
  }

  const payload = {
    full_name: fullName,
    email,
    phone: str(formData, "phone") || null,
    subject: str(formData, "subject") || null,
    availability: str(formData, "availability") || null,
    syllabus: str(formData, "syllabus") || null,
    cv_url: str(formData, "cv_url") || null,
    diploma_url: str(formData, "diploma_url") || null,
    authorization_url: str(formData, "authorization_url") || null,
    message: str(formData, "message") || null,
  };

  const { error } = await supabase
    .from("teacher_applications")
    .insert(payload);
  if (error) return { ok: false, message: error.message };

  // Notification best-effort à l'école.
  await sendNotification(
    `Candidature enseignant — ${fullName}`,
    emailLayout(
      "Nouvelle candidature enseignant",
      buildRows([
        ["Nom", fullName],
        ["Email", email],
        ["Téléphone", payload.phone],
        ["Matière", payload.subject],
        ["Disponibilités", payload.availability],
      ])
    ),
    email
  );

  return {
    ok: true,
    message:
      "Merci ! Votre candidature a bien été reçue. Nous reviendrons vers vous rapidement.",
  };
}

/** Met à jour le statut d'une candidature (admin). */
export async function updateApplicationStatus(
  appId: string,
  status: string
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (!APPLICATION_STATUS_VALUES.includes(status)) {
    return { ok: false, message: "Statut invalide." };
  }
  const { error } = await ctx.supabase
    .from("teacher_applications")
    .update({ status })
    .eq("id", appId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/recrutement");
  return { ok: true, message: "Statut mis à jour." };
}

/** Attache (ou met à jour) le lien du contrat d'un enseignant. */
export async function updateContractLink(
  appId: string,
  url: string
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const { error } = await ctx.supabase
    .from("teacher_applications")
    .update({ contract_url: url.trim() || null })
    .eq("id", appId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/recrutement");
  return { ok: true, message: "Contrat enregistré." };
}

/** Analyse une candidature avec l'IA (Claude) : résumé + adéquation + 80% pratique. */
export async function analyzeApplication(appId: string): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      message: "IA non configurée (clé ANTHROPIC_API_KEY manquante).",
    };
  }

  const { data: app } = await ctx.supabase
    .from("teacher_applications")
    .select("full_name, subject, availability, syllabus, message")
    .eq("id", appId)
    .single();
  if (!app) return { ok: false, message: "Candidature introuvable." };

  const client = new Anthropic({ apiKey });
  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system:
        "Tu es un assistant RH de l'IPMD (Institut Polytechnique des Métiers du Digital, Abidjan), école dont la pédagogie est orientée à 80 % vers la pratique. Tu aides le recruteur à évaluer une candidature d'enseignant. Sois concis, factuel et utile.",
      messages: [
        {
          role: "user",
          content: `Candidat : ${app.full_name}
Matière / domaine visé : ${app.subject ?? "(non précisé)"}
Disponibilités : ${app.availability ?? "(non précisé)"}
Message : ${app.message ?? "(aucun)"}

Syllabus proposé :
${app.syllabus ?? "(aucun syllabus fourni)"}

Produis une analyse courte et structurée en français :
1. Résumé (2-3 phrases).
2. Score d'adéquation sur 100.
3. Alignement avec la pédagogie « 80 % pratique » : Oui / Partiel / Non, avec une justification en une phrase.
4. 2 à 3 suggestions concrètes pour améliorer le syllabus vers plus de pratique.`,
        },
      ],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const { error } = await ctx.supabase
      .from("teacher_applications")
      .update({ ai_summary: text })
      .eq("id", appId);
    if (error) return { ok: false, message: error.message };

    revalidatePath("/espace/recrutement");
    return { ok: true, message: "Analyse IA générée." };
  } catch {
    return { ok: false, message: "Erreur lors de l'analyse IA. Réessaie." };
  }
}
