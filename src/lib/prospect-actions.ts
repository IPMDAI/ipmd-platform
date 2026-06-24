"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatFCFA } from "@/lib/finance";
import { canSendEmail, emailDocument, buildRows, sendScolariteEmail } from "@/lib/email";
import { PROSPECT_STATUS, FORMAT_LABEL } from "@/lib/prospect";
import type { FormResult } from "@/types";

const STAFF = ["super_admin", "admin", "scolarite"];
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ipmd.pro";

function str(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

async function getStaff() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!STAFF.includes(me?.role ?? "")) return null;
  return { supabase, userId: user.id };
}

/** Soumission publique (formulaire « Demande d'information » du site). */
export async function submitProspect(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  if (!fullName) return { ok: false, message: "Votre nom est requis." };
  if (!email && !str(formData, "phone")) return { ok: false, message: "Indiquez un email ou un téléphone." };

  const { error } = await supabase.from("prospects").insert({
    full_name: fullName,
    email: email || null,
    phone: str(formData, "phone") || null,
    whatsapp: str(formData, "whatsapp") || str(formData, "phone") || null,
    program_interest: str(formData, "program_interest") || null,
    level_interest: str(formData, "level_interest") || null,
    format: str(formData, "format") || null,
    message: str(formData, "message") || null,
    source: "site",
    status: "nouveau",
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Merci ! Votre demande a bien été reçue. L'équipe des admissions vous recontactera très vite." };
}

/** Ajout manuel d'un prospect (admission). */
export async function addProspect(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  const fullName = str(formData, "full_name");
  if (!fullName) return { ok: false, message: "Le nom est requis." };
  const { error } = await ctx.supabase.from("prospects").insert({
    full_name: fullName,
    email: str(formData, "email") || null,
    phone: str(formData, "phone") || null,
    whatsapp: str(formData, "whatsapp") || str(formData, "phone") || null,
    program_interest: str(formData, "program_interest") || null,
    level_interest: str(formData, "level_interest") || null,
    format: str(formData, "format") || null,
    message: str(formData, "message") || null,
    source: str(formData, "source") || "manuel",
    status: "nouveau",
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/marketing");
  return { ok: true, message: "Prospect ajouté." };
}

async function logEvent(ctx: NonNullable<Awaited<ReturnType<typeof getStaff>>>, prospectId: string, type: string, detail: string) {
  await ctx.supabase.from("prospect_events").insert({ prospect_id: prospectId, type, detail, created_by: ctx.userId });
}

/** Change le statut (pipeline) + journalise. */
export async function setProspectStatus(prospectId: string, status: string): Promise<void> {
  const ctx = await getStaff();
  if (!ctx) return;
  if (!PROSPECT_STATUS[status]) return;
  await ctx.supabase.from("prospects").update({ status, updated_at: new Date().toISOString() }).eq("id", prospectId);
  await logEvent(ctx, prospectId, "statut", PROSPECT_STATUS[status].label);
  revalidatePath("/espace/marketing");
}

/** Modifie les champs d'une fiche prospect (email, tél, programme…). */
export async function updateProspect(
  prospectId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  const fullName = str(formData, "full_name");
  if (!fullName) return { ok: false, message: "Le nom est requis." };
  const { error } = await ctx.supabase
    .from("prospects")
    .update({
      full_name: fullName,
      email: str(formData, "email") || null,
      phone: str(formData, "phone") || null,
      whatsapp: str(formData, "whatsapp") || str(formData, "phone") || null,
      program_interest: str(formData, "program_interest") || null,
      level_interest: str(formData, "level_interest") || null,
      format: str(formData, "format") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospectId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/marketing");
  return { ok: true, message: "Fiche mise à jour." };
}

/** Ajoute une note de suivi. */
export async function addProspectNote(prospectId: string, _prev: FormResult | null, formData: FormData): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  const note = str(formData, "note");
  if (!note) return { ok: false, message: "Note vide." };
  await ctx.supabase.from("prospects").update({ note, updated_at: new Date().toISOString() }).eq("id", prospectId);
  await logEvent(ctx, prospectId, "note", note);
  revalidatePath("/espace/marketing");
  return { ok: true, message: "Note enregistrée." };
}

/** Journalise un contact WhatsApp (clic). */
export async function logProspectWhatsApp(prospectId: string): Promise<void> {
  const ctx = await getStaff();
  if (!ctx) return;
  await ctx.supabase.from("prospects").update({ last_contacted_at: new Date().toISOString() }).eq("id", prospectId);
  await logEvent(ctx, prospectId, "whatsapp", "Message WhatsApp ouvert");
  revalidatePath("/espace/marketing");
}

/** Envoie l'email d'info (programme + frais) au prospect. */
export async function sendProspectInfo(prospectId: string): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  if (!canSendEmail) return { ok: false, message: "Service email non configuré." };
  const { data: p } = await ctx.supabase.from("prospects").select("*").eq("id", prospectId).single();
  if (!p) return { ok: false, message: "Prospect introuvable." };
  if (!p.email) return { ok: false, message: "Ce prospect n'a pas d'email." };

  const { data: settings } = await ctx.supabase.from("finance_settings").select("registration_fee").eq("id", 1).maybeSingle();
  const reg = Number(settings?.registration_fee ?? 300000);
  let tuition: number | null = null;
  if (p.level_interest) {
    const { data: lvl } = await ctx.supabase.from("tuition_levels").select("amount").eq("level", p.level_interest).maybeSingle();
    if (lvl?.amount != null) tuition = Number(lvl.amount);
  }
  const rows = buildRows([
    ["Programme", p.program_interest || "—"],
    ["Niveau", p.level_interest || "—"],
    ["Format", p.format ? FORMAT_LABEL[p.format] ?? p.format : "—"],
    ["Frais d'inscription", formatFCFA(reg)],
    ["Frais de scolarité", tuition != null ? formatFCFA(tuition) : "Sur demande"],
  ]);
  const html = emailDocument(
    "Votre demande d'information — IPMD",
    `<p>Bonjour ${p.full_name},</p>
     <p>Merci de l'intérêt que vous portez à l'IPMD. Voici les informations sur le programme qui vous intéresse :</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
     <p style="margin-top:12px">Les frais d'inscription (uniques) donnent accès à la plateforme, à la carte étudiant et à l'attestation d'inscription. Un <strong>échéancier</strong> de paiement et une <strong>réduction de 15%</strong> (paiement unique) sont possibles.</p>
     <p style="margin-top:12px">Pour candidater : <a href="${SITE}/admission" style="color:#e01228;font-weight:600">${SITE}/admission</a></p>
     <p style="color:#9ca3af;font-size:12px;margin-top:8px">Service des Admissions — admission@ipmd.pro · WhatsApp +225 07 75 75 88 88</p>`
  );
  const sent = await sendScolariteEmail([p.email], "IPMD — Votre demande d'information", html);
  if (sent > 0) {
    await ctx.supabase.from("prospects").update({ status: p.status === "nouveau" ? "contacte" : p.status, last_contacted_at: new Date().toISOString() }).eq("id", prospectId);
    await logEvent(ctx, prospectId, "email", `Email d'info envoyé à ${p.email}`);
  }
  revalidatePath("/espace/marketing");
  return sent > 0 ? { ok: true, message: `Email envoyé à ${p.email}.` } : { ok: false, message: "Échec de l'envoi." };
}

/** Convertit le prospect en candidature (pipeline d'inscription). */
export async function convertProspectToCandidature(prospectId: string): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  const { data: p } = await ctx.supabase.from("prospects").select("*").eq("id", prospectId).single();
  if (!p) return { ok: false, message: "Prospect introuvable." };
  if (!p.email) return { ok: false, message: "Email requis pour créer une candidature." };

  const { error } = await ctx.supabase.from("inscription_requests").insert({
    full_name: p.full_name,
    email: p.email,
    phone: p.phone || p.whatsapp || "—",
    universe: "campus",
    program_interest: p.program_interest || null,
    entry_level: p.level_interest || null,
    message: p.message || null,
    status: "nouveau",
  });
  if (error) return { ok: false, message: error.message };
  await ctx.supabase.from("prospects").update({ status: "candidature", updated_at: new Date().toISOString() }).eq("id", prospectId);
  await logEvent(ctx, prospectId, "statut", "Converti en candidature");
  revalidatePath("/espace/marketing");
  revalidatePath("/espace/candidatures");
  return { ok: true, message: "Candidature créée. Retrouvez-la dans Candidatures." };
}

/** Génère (IA) un brouillon de réponse personnalisé, à relire/modifier avant envoi. */
export async function draftProspectReply(
  prospectId: string
): Promise<{ ok: boolean; draft?: string; message?: string }> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, message: "IA non configurée (clé ANTHROPIC_API_KEY manquante)." };

  const { data: p } = await ctx.supabase.from("prospects").select("*").eq("id", prospectId).single();
  if (!p) return { ok: false, message: "Prospect introuvable." };

  const { data: settings } = await ctx.supabase.from("finance_settings").select("registration_fee").eq("id", 1).maybeSingle();
  const reg = Number(settings?.registration_fee ?? 300000);
  let tuition: number | null = null;
  if (p.level_interest) {
    const { data: lvl } = await ctx.supabase.from("tuition_levels").select("amount").eq("level", p.level_interest).maybeSingle();
    if (lvl?.amount != null) tuition = Number(lvl.amount);
  }

  const facts = {
    prospect: p.full_name,
    programme: p.program_interest || "non précisé",
    niveau: p.level_interest || "non précisé",
    format: p.format ? FORMAT_LABEL[p.format] ?? p.format : "non précisé",
    message_du_prospect: p.message || "",
    frais_inscription_fcfa: reg,
    frais_scolarite_fcfa: tuition,
    site_admission: `${SITE}/admission`,
    whatsapp_admissions: "+225 07 75 75 88 88",
  };

  try {
    const client = new Anthropic({ apiKey });
    const m = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 900,
      system:
        "Tu es le Service des Admissions de l'IPMD (Institut Polytechnique des Métiers du Digital & IA, Abidjan). Rédige en français un email de réponse chaleureux, professionnel et concis à un prospect, en répondant précisément à ses questions. Règles STRICTES : n'utilise QUE les chiffres fournis dans le JSON pour les frais ; pour toute information non fournie (date limite de dépôt, lien plaquette, volume horaire précis, modalités exactes de sélection), insère un placeholder clair entre crochets comme [date limite à préciser] — n'invente JAMAIS de chiffre, de date ou de fait. Mentionne que les frais d'inscription donnent accès à la plateforme/carte/attestation, qu'un échéancier et une réduction de 15% (paiement unique) sont possibles. Termine par l'invitation à candidater sur le site et le contact WhatsApp. Signe « Le Service des Admissions — IPMD ». Renvoie UNIQUEMENT le corps de l'email (sans objet, sans préambule).",
      messages: [
        {
          role: "user",
          content: `Données (JSON) :\n${JSON.stringify(facts, null, 2)}\nRédige la réponse email.`,
        },
      ],
    });
    const draft = m.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return { ok: true, draft };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erreur IA." };
  }
}

/** Envoie un email rédigé/validé par l'admin au prospect. */
export async function sendProspectCustomEmail(
  prospectId: string,
  body: string
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Réservé à l'administration." };
  if (!canSendEmail) return { ok: false, message: "Service email non configuré." };
  const { data: p } = await ctx.supabase.from("prospects").select("full_name, email, status").eq("id", prospectId).single();
  if (!p?.email) return { ok: false, message: "Ce prospect n'a pas d'email." };

  const htmlBody = body
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>").replace(/</g, "&lt;").replace(/&lt;br>/g, "<br>")}</p>`)
    .join("");
  const html = emailDocument("IPMD — Service des Admissions", htmlBody);
  const sent = await sendScolariteEmail([p.email], "IPMD — Votre demande d'information", html);
  if (sent > 0) {
    await ctx.supabase.from("prospects").update({ status: p.status === "nouveau" ? "contacte" : p.status, last_contacted_at: new Date().toISOString() }).eq("id", prospectId);
    await logEvent(ctx, prospectId, "email", "Réponse personnalisée envoyée");
  }
  revalidatePath("/espace/marketing");
  return sent > 0 ? { ok: true, message: `Email envoyé à ${p.email}.` } : { ok: false, message: "Échec de l'envoi." };
}

/** Supprime un prospect. */
export async function deleteProspect(prospectId: string): Promise<void> {
  const ctx = await getStaff();
  if (!ctx) return;
  await ctx.supabase.from("prospects").delete().eq("id", prospectId);
  revalidatePath("/espace/marketing");
}
