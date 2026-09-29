import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildReglementAcceptanceEmail } from "@/lib/reglement-email-content";
import type { FormResult } from "@/types";

// ── Mode de diffusion ──────────────────────────────────────────────────────
// 'test' : n'envoie QU'À l'adresse de test (ADMISSION_TEST_EMAIL) ; tout autre
// destinataire est journalisé en 'skipped' (aucun email à de vrais étudiants).
// 'live' : envoie à tous. Passer à 'live' après validation de la recette.
const REGLEMENT_EMAIL_MODE: "test" | "live" = "live";
const REGLEMENT_TEST_ADDRESS = (process.env.ADMISSION_TEST_EMAIL ?? "").trim().toLowerCase();

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM_SCOLARITE =
  process.env.RESEND_FROM_SCOLARITE ?? "IPMD Scolarité <scolarite@send.ipmd.pro>";
const SCOLARITE_REPLY_TO = process.env.RESEND_REPLY_SCOLARITE ?? "scolarite@ipmd.pro";

type SendResult = { ok: boolean; id?: string; error?: string };

/** Envoi Resend à UN destinataire, avec capture de l'id fournisseur / de l'erreur. */
async function sendOne(to: string, subject: string, html: string): Promise<SendResult> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY absente (envoi local désactivé)" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM_SCOLARITE,
        to: [to],
        subject,
        html,
        reply_to: SCOLARITE_REPLY_TO,
      }),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status} — ${text.slice(0, 300)}` };
    let id: string | undefined;
    try {
      id = (JSON.parse(text) as { id?: string }).id;
    } catch {
      /* pas de JSON exploitable */
    }
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Adresse sink de Resend (accepte et renvoie un id, sans boîte réelle) — autorisée
// en mode test pour la recette, quelle que soit la config d'environnement.
const RESEND_SINK = "delivered@resend.dev";

/** Le destinataire est-il autorisé à recevoir un envoi réel dans le mode courant ? */
function sendAllowed(recipient: string): boolean {
  if (REGLEMENT_EMAIL_MODE === "live") return true;
  const r = recipient.trim().toLowerCase();
  return r === RESEND_SINK || (!!REGLEMENT_TEST_ADDRESS && r === REGLEMENT_TEST_ADDRESS);
}

export type RecordAndSendParams = {
  scope: "pack" | "espace";
  dedupKey: string;
  candidatureId: string | null;
  userId: string | null;
  recipient: string | null;
  name: string | null;
  parcours: "diplome" | "bootcamp";
  version: string;
  acceptedAt: Date;
};

/**
 * Journalise (copie + statut) et envoie l'email de confirmation d'acceptation.
 * STRICTEMENT best-effort : ne lève JAMAIS, ne bloque jamais l'acceptation.
 * Déduplique par dedupKey : une acceptation d'une version = au plus un email.
 */
export async function recordAndSendReglementAcceptance(p: RecordAndSendParams): Promise<void> {
  try {
    const recipient = (p.recipient ?? "").trim();
    if (!recipient) return; // pas d'email → rien à envoyer
    const admin = createAdminClient();
    if (!admin) return; // local (pas de service-role)

    const acceptedAtLabel = p.acceptedAt.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const { subject, html } = buildReglementAcceptanceEmail({
      name: p.name,
      parcours: p.parcours,
      version: p.version,
      acceptedAtLabel,
    });

    // Insertion idempotente (dédup). Si la ligne existe déjà, on la récupère.
    const { data: inserted } = await admin
      .from("reglement_emails")
      .insert({
        dedup_key: p.dedupKey,
        scope: p.scope,
        candidature_id: p.candidatureId,
        user_id: p.userId,
        recipient,
        parcours: p.parcours,
        version: p.version,
        subject,
        html,
        status: "pending",
      })
      .select("id, status")
      .maybeSingle();

    let rowId = inserted?.id as string | undefined;
    if (!rowId) {
      const { data: existing } = await admin
        .from("reglement_emails")
        .select("id, status")
        .eq("dedup_key", p.dedupKey)
        .maybeSingle();
      if (!existing) return;
      if (existing.status === "sent") return; // déjà envoyé → aucun doublon
      rowId = existing.id as string;
    }

    // Mode test : n'envoyer qu'à l'adresse de test ; sinon journaliser 'skipped'.
    if (!sendAllowed(recipient)) {
      await admin
        .from("reglement_emails")
        .update({ status: "skipped", error: "mode test — envoi réel désactivé", last_attempt_at: new Date().toISOString() })
        .eq("id", rowId);
      return;
    }

    const r = await sendOne(recipient, subject, html);
    const now = new Date().toISOString();
    await admin
      .from("reglement_emails")
      .update(
        r.ok
          ? { status: "sent", provider_message_id: r.id ?? null, sent_at: now, error: null, last_attempt_at: now, attempts: 1 }
          : { status: "failed", error: r.error ?? "échec inconnu", last_attempt_at: now, attempts: 1 }
      )
      .eq("id", rowId);
  } catch {
    // best-effort : jamais d'exception propagée à l'acceptation.
  }
}

/** Contrôle admin (admin/super_admin) pour la relance. */
async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return me?.role === "admin" || me?.role === "super_admin";
}

/**
 * Relance (admin) d'un email en échec : renvoie sur la MÊME ligne (pas de seconde
 * acceptation ni de doublon). Refuse si l'email est déjà 'sent'.
 */
export async function retryReglementEmail(id: string): Promise<FormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Action réservée à l'administration." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service momentanément indisponible." };

  const { data: row } = await admin
    .from("reglement_emails")
    .select("id, recipient, subject, html, status, attempts")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { ok: false, message: "Email introuvable." };
  if (row.status === "sent") return { ok: false, message: "Déjà envoyé — aucun renvoi (pas de doublon)." };

  const recipient = (row.recipient as string) ?? "";
  const now = new Date().toISOString();
  const attempts = (row.attempts as number) ?? 0;

  if (!sendAllowed(recipient)) {
    await admin
      .from("reglement_emails")
      .update({ status: "skipped", error: "mode test — envoi réel désactivé", last_attempt_at: now, attempts: attempts + 1 })
      .eq("id", id);
    return { ok: false, message: "Mode test : envoi réel désactivé pour ce destinataire." };
  }

  const r = await sendOne(recipient, row.subject as string, row.html as string);
  await admin
    .from("reglement_emails")
    .update(
      r.ok
        ? { status: "sent", provider_message_id: r.id ?? null, sent_at: now, error: null, last_attempt_at: now, attempts: attempts + 1 }
        : { status: "failed", error: r.error ?? "échec inconnu", last_attempt_at: now, attempts: attempts + 1 }
    )
    .eq("id", id);

  return r.ok
    ? { ok: true, message: "Email renvoyé." }
    : { ok: false, message: `Échec du renvoi : ${r.error ?? "erreur inconnue"}` };
}
