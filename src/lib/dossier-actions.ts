"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDossierToken, dossierLinkUrl } from "@/lib/dossier-link";
import { sendEmailTo, emailDocument, escapeHtml, canSendEmail } from "@/lib/email";
import {
  CANDIDATE_DOCS,
  DOC_BY_KEY,
  isDocKey,
  isDocStatus,
  docLabels,
  buildDocsWhatsappText,
} from "@/lib/candidate-docs";
import type { FormResult } from "@/types";

const DOSSIER_REPLY_TO = process.env.RESEND_REPLY_SCOLARITE ?? "scolarite@ipmd.pro";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/** Vérifie que l'appelant est admin/super_admin et renvoie un client service-role + identité. */
async function getAdminCtx(): Promise<
  { admin: AdminClient; userId: string; role: string; name: string | null } | null
> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "super_admin") return null;
  const admin = createAdminClient();
  if (!admin) return null;
  return {
    admin,
    userId: user.id,
    role: me.role as string,
    name: (me.full_name as string) || (me.email as string) || null,
  };
}

type TokenResolution =
  | { ok: true; candidatureId: string; admin: AdminClient }
  | { ok: false; reason: "invalid" | "revoked" | "unavailable" };

/**
 * Résout un jeton de dépôt : signature + EXPIRATION (dans verifyDossierToken) puis
 * RÉVOCATION (version comparée à `dossier_token_version` en base) et ACCÈS LIMITÉ
 * (le jeton ne donne accès qu'à la candidature qu'il encode).
 */
async function resolveToken(token: string): Promise<TokenResolution> {
  const payload = verifyDossierToken(token);
  if (!payload) return { ok: false, reason: "invalid" }; // invalide ou expiré
  const admin = createAdminClient();
  if (!admin) return { ok: false, reason: "unavailable" };
  const { data } = await admin
    .from("inscription_requests")
    .select("id, dossier_token_version")
    .eq("id", payload.candidatureId)
    .maybeSingle();
  if (!data) return { ok: false, reason: "invalid" };
  if (Number(data.dossier_token_version ?? 1) !== payload.version) {
    return { ok: false, reason: "revoked" };
  }
  return { ok: true, candidatureId: data.id as string, admin };
}

// ───────────────────────────── DÉPÔT DES PIÈCES (candidat) ─────────────────────────────

/**
 * Enregistre les pièces déposées par un candidat via le lien signé. Les fichiers
 * sont déjà téléversés (bucket candidature-docs) ; on persiste leurs chemins après
 * vérification du jeton (signature + expiration + révocation + périmètre). Marque
 * `docs_submitted_at` pour signaler à l'équipe un nouveau dépôt.
 */
export async function completeDossier(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const token = str(formData, "token");
  const r = await resolveToken(token);
  if (!r.ok) {
    return {
      ok: false,
      message:
        r.reason === "revoked"
          ? "Ce lien a été remplacé par un nouveau. Merci de demander le lien le plus récent à l'IPMD."
          : r.reason === "unavailable"
            ? "Service indisponible. Réessayez plus tard."
            : "Lien invalide ou expiré. Merci de demander un nouveau lien à l'IPMD.",
    };
  }
  const { admin, candidatureId } = r;

  // Chemins fournis par clé de pièce (path_<key>).
  const update: Record<string, unknown> = {};
  let anyProvided = false;
  for (const d of CANDIDATE_DOCS) {
    const p = str(formData, `path_${d.key}`);
    if (p) {
      update[d.col] = p;
      anyProvided = true;
    }
  }
  if (!anyProvided) {
    return { ok: false, message: "Aucune pièce fournie. Sélectionnez au moins un fichier." };
  }

  update.docs_submitted_at = new Date().toISOString();

  const { error } = await admin
    .from("inscription_requests")
    .update(update)
    .eq("id", candidatureId);
  if (error) {
    return { ok: false, message: "Une erreur est survenue. Merci de réessayer." };
  }

  return {
    ok: true,
    message:
      "Merci ! Vos pièces ont bien été transmises à l'IPMD. Notre équipe reviendra vers vous.",
  };
}

// ───────────────────────────── DEMANDE DE PIÈCES (équipe) ─────────────────────────────

export type RequestDocsResult = FormResult & { link?: string; whatsappText?: string };

/**
 * Enregistre les pièces demandées et renvoie le lien sécurisé + un message WhatsApp
 * pré-rempli (à envoyer manuellement). N'envoie pas d'email ici (voir
 * `sendDossierLinkEmail`). Réservé aux admins.
 */
export async function requestDocuments(
  candidatureId: string,
  docKeys: string[]
): Promise<RequestDocsResult> {
  const ctx = await getAdminCtx();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const keys = docKeys.filter(isDocKey);
  if (keys.length === 0) return { ok: false, message: "Sélectionnez au moins une pièce." };

  const { data: cand } = await ctx.admin
    .from("inscription_requests")
    .select("full_name, program_interest, dossier_token_version")
    .eq("id", candidatureId)
    .maybeSingle();
  if (!cand) return { ok: false, message: "Candidature introuvable." };

  const { error } = await ctx.admin
    .from("inscription_requests")
    .update({ requested_docs: keys })
    .eq("id", candidatureId);
  if (error) return { ok: false, message: error.message };

  const link = dossierLinkUrl(candidatureId, Number(cand.dossier_token_version ?? 1));
  const whatsappText = buildDocsWhatsappText({
    firstName: (cand.full_name as string | null)?.split(" ")[0] ?? "",
    program: cand.program_interest as string | null,
    docKeys: keys,
    link,
  });

  return {
    ok: true,
    message: `Pièces demandées enregistrées (${docLabels(keys).join(", ")}).`,
    link,
    whatsappText,
  };
}

/** Envoie au candidat l'email avec le lien de dépôt + la liste des pièces demandées. */
export async function sendDossierLinkEmail(candidatureId: string): Promise<FormResult> {
  const ctx = await getAdminCtx();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (!canSendEmail) {
    return { ok: false, message: "Envoi d'email non configuré (RESEND_API_KEY manquante)." };
  }

  const { data: cand } = await ctx.admin
    .from("inscription_requests")
    .select("full_name, email, requested_docs, dossier_token_version")
    .eq("id", candidatureId)
    .maybeSingle();
  if (!cand) return { ok: false, message: "Candidature introuvable." };
  if (!cand.email) return { ok: false, message: "Ce candidat n'a pas d'email exploitable." };

  const keys = (cand.requested_docs as string[] | null) ?? [];
  const labels = keys.length ? docLabels(keys) : ["votre dossier"];
  const link = dossierLinkUrl(candidatureId, Number(cand.dossier_token_version ?? 1));
  const prenom = (cand.full_name as string | null)?.split(" ")[0] || "Bonjour";
  const liste = labels
    .map(
      (l) =>
        `<li style="margin:2px 0;color:#374151;font-size:14px">${escapeHtml(l)}</li>`
    )
    .join("");

  const html = emailDocument(
    "Complétez votre dossier d'admission",
    `<p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(prenom)},</p>
     <p style="margin:0 0 10px;color:#374151;font-size:14px;line-height:1.6">
       Pour finaliser l'étude de votre candidature à l'IPMD, merci de nous transmettre :
     </p>
     <ul style="margin:0 0 14px;padding-left:20px">${liste}</ul>
     <p style="margin:0 0 20px">
       <a href="${link}" style="display:inline-block;background:#e01228;color:#fff;
          text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:9999px">
          Compléter mon dossier</a>
     </p>
     <p style="margin:0 0 12px;color:#9ca3af;font-size:12px;line-height:1.5">
       Lien personnel et sécurisé (sans création de compte). Si le bouton ne fonctionne pas,
       copiez cette adresse :<br/>${escapeHtml(link)}
     </p>
     <p style="margin:0;color:#9ca3af;font-size:12px">Vous pouvez répondre directement à cet email.</p>`
  );

  const sent = await sendEmailTo(
    [cand.email as string],
    "IPMD — Complétez votre dossier d'admission",
    html,
    DOSSIER_REPLY_TO
  );
  if (sent < 1) return { ok: false, message: "L'email n'a pas pu être envoyé. Réessayez." };
  return { ok: true, message: `Email envoyé à ${cand.email}.` };
}

/**
 * Pose le statut d'UNE pièce (récapitulatif) : recue / a_verifier / validee / a_remplacer.
 * Protections : admin only ; jamais de suppression/écrasement du fichier (doc_*) ; motif
 * OBLIGATOIRE pour « à remplacer », qui re-demande aussi la pièce (requested_docs) ; valeurs
 * fermées ; traçabilité (qui/quand) ; scopé à la candidature.
 */
export async function setDocStatus(
  candidatureId: string,
  docKey: string,
  status: string,
  reason?: string
): Promise<FormResult> {
  const ctx = await getAdminCtx();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (!isDocKey(docKey)) return { ok: false, message: "Pièce inconnue." };
  if (!isDocStatus(status)) return { ok: false, message: "Statut invalide." };
  const motif = (reason ?? "").trim();
  if (status === "a_remplacer" && !motif) {
    return { ok: false, message: "Indiquez le motif du remplacement (ce que le candidat doit corriger)." };
  }

  const { data: cand } = await ctx.admin
    .from("inscription_requests")
    .select("doc_status, requested_docs")
    .eq("id", candidatureId)
    .maybeSingle();
  if (!cand) return { ok: false, message: "Candidature introuvable." };

  const map = { ...((cand.doc_status as Record<string, unknown>) ?? {}) };
  map[docKey] = {
    status,
    reason: status === "a_remplacer" ? motif : null,
    at: new Date().toISOString(),
    by: ctx.name,
  };

  const update: Record<string, unknown> = { doc_status: map };
  // « À remplacer » → re-demande la pièce pour que le candidat la redépose.
  if (status === "a_remplacer") {
    const req = new Set(((cand.requested_docs as string[] | null) ?? []).filter(isDocKey));
    req.add(docKey);
    update.requested_docs = Array.from(req);
  }

  const { error } = await ctx.admin
    .from("inscription_requests")
    .update(update)
    .eq("id", candidatureId);
  if (error) return { ok: false, message: error.message };

  // Traçabilité best-effort (service-role, append-only).
  try {
    const admin2 = createAdminClient();
    if (admin2) {
      await admin2.from("audit_log").insert({
        actor_id: ctx.userId,
        actor_role: ctx.role,
        action_type: "update",
        action: "candidate_doc_status",
        entity_type: "inscription_request",
        entity_id: candidatureId,
        summary: `Pièce « ${DOC_BY_KEY[docKey].short} » → ${status}${motif ? ` (${motif})` : ""}`,
        new_value: { doc: docKey, status, reason: motif || null },
        actor_name: ctx.name,
      });
    }
  } catch {
    /* audit indisponible */
  }

  return { ok: true, message: `« ${DOC_BY_KEY[docKey].short} » : ${status.replace("_", " ")}.` };
}

/** Marque les pièces comme vérifiées par l'équipe (efface le signal « nouveau dépôt »). */
export async function markDocsReviewed(candidatureId: string): Promise<FormResult> {
  const ctx = await getAdminCtx();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const { error } = await ctx.admin
    .from("inscription_requests")
    .update({ docs_reviewed_at: new Date().toISOString() })
    .eq("id", candidatureId);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Pièces marquées comme vérifiées." };
}

/**
 * Programme (ou efface) un RAPPEL DE RELANCE sur une candidature. `dateISO` null →
 * efface (relance « faite »). Admin only, scopé, aucune autre donnée touchée.
 */
export async function setFollowUp(
  candidatureId: string,
  dateISO: string | null,
  note?: string
): Promise<FormResult> {
  const ctx = await getAdminCtx();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const update: Record<string, unknown> = {
    follow_up_at: dateISO || null,
    follow_up_note: dateISO ? (note ?? "").trim() || null : null,
  };
  const { error } = await ctx.admin
    .from("inscription_requests")
    .update(update)
    .eq("id", candidatureId);
  if (error) return { ok: false, message: error.message };
  return {
    ok: true,
    message: dateISO ? "Relance programmée." : "Relance marquée comme faite.",
  };
}

/** Révoque le lien de dépôt : incrémente la version → tous les anciens liens deviennent invalides. */
export async function revokeDossierLink(candidatureId: string): Promise<FormResult> {
  const ctx = await getAdminCtx();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const { data: cand } = await ctx.admin
    .from("inscription_requests")
    .select("dossier_token_version")
    .eq("id", candidatureId)
    .maybeSingle();
  if (!cand) return { ok: false, message: "Candidature introuvable." };
  const next = Number(cand.dossier_token_version ?? 1) + 1;
  const { error } = await ctx.admin
    .from("inscription_requests")
    .update({ dossier_token_version: next })
    .eq("id", candidatureId);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Lien révoqué. Les anciens liens ne fonctionnent plus." };
}

// ───────────────────────────── CONVERSATION ─────────────────────────────

/** Message posté par l'ÉQUIPE au candidat (+ email best-effort l'invitant à répondre via le lien). */
export async function sendCandidateMessage(
  candidatureId: string,
  body: string,
  opts?: { notifyEmail?: boolean }
): Promise<FormResult> {
  const ctx = await getAdminCtx();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const text = (body ?? "").trim();
  if (!text) return { ok: false, message: "Message vide." };

  const { error } = await ctx.admin.from("candidature_messages").insert({
    candidature_id: candidatureId,
    sender: "admin",
    body: text,
    author_name: ctx.name,
  });
  if (error) return { ok: false, message: error.message };

  // Notification email best-effort (le candidat lit/répond depuis le lien sécurisé).
  if (opts?.notifyEmail !== false && canSendEmail) {
    const { data: cand } = await ctx.admin
      .from("inscription_requests")
      .select("full_name, email, dossier_token_version")
      .eq("id", candidatureId)
      .maybeSingle();
    if (cand?.email) {
      const link = dossierLinkUrl(candidatureId, Number(cand.dossier_token_version ?? 1));
      const prenom = (cand.full_name as string | null)?.split(" ")[0] || "Bonjour";
      const html = emailDocument(
        "Nouveau message de l'IPMD",
        `<p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(prenom)},</p>
         <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6">
           L'équipe Admissions IPMD vous a envoyé un message :</p>
         <blockquote style="margin:0 0 16px;padding:10px 14px;background:#f9fafb;border-left:3px solid #e01228;color:#374151;font-size:14px;white-space:pre-line">${escapeHtml(text)}</blockquote>
         <p style="margin:0 0 18px">
           <a href="${link}" style="display:inline-block;background:#e01228;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:9999px">Lire et répondre</a>
         </p>
         <p style="margin:0;color:#9ca3af;font-size:12px">Vous pouvez aussi répondre directement à cet email.</p>`
      );
      await sendEmailTo([cand.email as string], "IPMD — Nouveau message de l'équipe Admissions", html, DOSSIER_REPLY_TO);
    }
  }

  return { ok: true, message: "Message envoyé." };
}

/** Réponse postée par le CANDIDAT depuis le lien sécurisé (sans compte). Token-gated. */
export async function postCandidateReply(token: string, body: string): Promise<FormResult> {
  const r = await resolveToken(token);
  if (!r.ok) {
    return {
      ok: false,
      message:
        r.reason === "revoked"
          ? "Ce lien a été remplacé. Demandez le lien le plus récent à l'IPMD."
          : "Lien invalide ou expiré.",
    };
  }
  const text = (body ?? "").trim();
  if (!text) return { ok: false, message: "Message vide." };
  if (text.length > 4000) return { ok: false, message: "Message trop long (4000 caractères max)." };

  const { data: cand } = await r.admin
    .from("inscription_requests")
    .select("full_name")
    .eq("id", r.candidatureId)
    .maybeSingle();

  const { error } = await r.admin.from("candidature_messages").insert({
    candidature_id: r.candidatureId,
    sender: "candidate",
    body: text,
    author_name: (cand?.full_name as string | null) ?? null,
  });
  if (error) return { ok: false, message: "Une erreur est survenue. Réessayez." };
  return { ok: true, message: "Message envoyé à l'IPMD." };
}

/** L'équipe marque les messages du candidat comme lus (efface le compteur non-lus). */
export async function markCandidateMessagesRead(candidatureId: string): Promise<FormResult> {
  const ctx = await getAdminCtx();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const { error } = await ctx.admin
    .from("candidature_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("candidature_id", candidatureId)
    .eq("sender", "candidate")
    .is("read_at", null);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Conversation marquée comme lue." };
}

export type ThreadMessage = {
  id: string;
  sender: "admin" | "candidate";
  body: string;
  author_name: string | null;
  created_at: string;
  read_at: string | null;
};

/** Charge la conversation pour le lien sécurisé (candidat), et marque les messages IPMD comme lus. */
export async function loadCandidateThread(
  token: string
): Promise<{ ok: true; messages: ThreadMessage[] } | { ok: false; reason: string }> {
  const r = await resolveToken(token);
  if (!r.ok) return { ok: false, reason: r.reason };
  const { data } = await r.admin
    .from("candidature_messages")
    .select("id, sender, body, author_name, created_at, read_at")
    .eq("candidature_id", r.candidatureId)
    .order("created_at", { ascending: true });
  // Les messages de l'équipe sont marqués lus (le candidat vient de les ouvrir).
  await r.admin
    .from("candidature_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("candidature_id", r.candidatureId)
    .eq("sender", "admin")
    .is("read_at", null);
  return { ok: true, messages: (data ?? []) as ThreadMessage[] };
}
