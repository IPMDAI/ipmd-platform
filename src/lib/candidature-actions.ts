"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CANDIDATURE_STATUS_VALUES,
  RESERVED_TARGETS,
  canTransition,
} from "@/lib/candidatures";
import { LETTERS_ENABLED, resolveRecipients } from "@/lib/admission-config";
import { buildAdmissionEmail, buildRefusalEmail } from "@/lib/admission-letter";
import { buildAdmissionPdf } from "@/lib/admission-pdf";
import { generatePackLink, packLinkUrl } from "@/lib/admission-pack-link";
import { sendScolariteEmail, canSendEmail, type EmailAttachment } from "@/lib/email";
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
  if (me?.role !== "admin" && me?.role !== "super_admin") return null;
  return { supabase, userId: user.id };
}

type CandRow = {
  status: string | null;
  decided_at: string | null;
  admission_sent_at: string | null;
  refusal_sent_at: string | null;
};

/**
 * Lit l'état de la candidature. `wf` indique si les colonnes de workflow (Lot A)
 * existent déjà en base : si la migration n'a pas encore été exécutée, on retombe
 * sur le seul `status` afin que le changement de statut continue de fonctionner.
 */
async function readCandidature(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  id: string
): Promise<{ row: CandRow; wf: boolean } | null> {
  const full = await supabase
    .from("inscription_requests")
    .select("status, decided_at, admission_sent_at, refusal_sent_at")
    .eq("id", id)
    .maybeSingle();
  if (!full.error && full.data) return { row: full.data as CandRow, wf: true };

  const basic = await supabase
    .from("inscription_requests")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (basic.error || !basic.data) return null;
  return {
    row: {
      status: (basic.data as { status: string | null }).status,
      decided_at: null,
      admission_sent_at: null,
      refusal_sent_at: null,
    },
    wf: false,
  };
}

const MIGRATION_REQUISE =
  "Action indisponible : exécute d'abord la migration candidatures-workflow.sql dans Supabase.";

function revalidate() {
  revalidatePath("/espace/candidatures");
  revalidatePath("/espace");
}

/**
 * Fait évoluer le statut d'une candidature via les boutons de l'interface
 * (transitions « manuelles » de la machine à états). Les statuts réservés
 * (`en_attente_paiement`, `inscrit`) passent par leurs actions dédiées.
 * Aucun email n'est envoyé (décisions accepte/refuse silencieuses).
 */
export async function setCandidatureStatus(
  id: string,
  status: string
): Promise<FormResult> {
  if (!CANDIDATURE_STATUS_VALUES.includes(status)) {
    return { ok: false, message: "Statut invalide." };
  }
  if (RESERVED_TARGETS.includes(status)) {
    return {
      ok: false,
      message:
        "Ce statut est posé par une action dédiée (Confirmer l'admission ou Créer & inviter).",
    };
  }
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const cand = await readCandidature(ctx.supabase, id);
  if (!cand) return { ok: false, message: "Candidature introuvable." };
  const current = cand.row.status ?? "nouveau";
  if (current === status) return { ok: true, message: "Statut inchangé." };

  if (!canTransition(current, status)) {
    return {
      ok: false,
      message: `Transition « ${current} → ${status} » non autorisée.`,
    };
  }

  const update: Record<string, unknown> = { status };
  if (cand.wf && (status === "accepte" || status === "refuse")) {
    update.decided_at = new Date().toISOString();
    update.decided_by = ctx.userId;
  }

  const { error } = await ctx.supabase
    .from("inscription_requests")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidate();
  return { ok: true, message: "Statut mis à jour." };
}

type AcademicResolution =
  | {
      ok: true;
      classId: string | null;
      acceptedLevel: string | null;
      academicYear: string | null;
      registrationFee: number;
      tuitionDue: number | null;
    }
  | { ok: false; code: "CONFIG_MISSING" | "DUPLICATE_CLASS"; message: string };

/**
 * Résolution ACADÉMIQUE automatique (diplôme) : à partir de la filière + du
 * niveau réellement acceptés, l'année active (`finance_settings.academic_year`)
 * détermine la classe et les frais — l'admin ne saisit AUCUN montant.
 *
 *   0 classe  → « Configuration académique manquante »
 *   1 classe  → OK (frais figés)
 *  >1 classe  → « Doublon de classe »
 *
 * Frais d'inscription : `classes.registration_fee` sinon global.
 * Scolarité : `classes.tuition_amount` sinon `tuition_levels.amount` (peut rester null).
 */
async function resolveAcademic(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  opts: { filiereId: string; level: string }
): Promise<AcademicResolution> {
  const { data: settings } = await supabase
    .from("finance_settings")
    .select("registration_fee, academic_year")
    .eq("id", 1)
    .maybeSingle();
  const globalReg = Number(settings?.registration_fee ?? 300000);
  const academicYear = (settings?.academic_year as string) ?? null;

  const { data: rows } = await supabase
    .from("classes")
    .select("id, name, tuition_amount, registration_fee")
    .eq("filiere_id", opts.filiereId)
    .eq("level", opts.level)
    .eq("academic_year", academicYear ?? "")
    .eq("kind", "diplome");
  const list = rows ?? [];

  if (list.length === 0) {
    return {
      ok: false,
      code: "CONFIG_MISSING",
      message: `Configuration académique manquante : aucune classe pour cette filière + « ${opts.level} » en ${academicYear ?? "l'année active"}. Crée-la dans Classes & filières.`,
    };
  }
  if (list.length > 1) {
    return {
      ok: false,
      code: "DUPLICATE_CLASS",
      message: `Doublon de classe : ${list.length} classes pour cette filière + « ${opts.level} » en ${academicYear ?? "l'année active"}. Corrige dans Classes & filières.`,
    };
  }

  const cls = list[0];
  const registrationFee = cls.registration_fee != null ? Number(cls.registration_fee) : globalReg;
  let tuitionDue = cls.tuition_amount != null ? Number(cls.tuition_amount) : null;
  if (tuitionDue == null) {
    const { data: lvl } = await supabase
      .from("tuition_levels")
      .select("amount")
      .eq("level", opts.level)
      .maybeSingle();
    tuitionDue = lvl?.amount != null ? Number(lvl.amount) : null;
  }
  return {
    ok: true,
    classId: cls.id as string,
    acceptedLevel: opts.level,
    academicYear,
    registrationFee,
    tuitionDue,
  };
}

/**
 * « Confirmer l'admission » : envoi officiel (SÉPARÉ de la décision).
 * Envoie la lettre d'admission, crée le pack (snapshot frais), pose
 * `admission_sent_at` et passe `accepte` → `en_attente_paiement`.
 *
 * ⚠️ GARDE MODE TEST : tant que le modèle n'est pas validé, l'email ne part que
 * vers l'adresse de test, UNIQUEMENT si la candidature EST celle de test.
 * Sinon l'action est refusée AVANT toute modification → aucun vrai candidat
 * contacté ni modifié.
 */
export async function sendAdmission(
  id: string,
  opts: { filiereId?: string; level?: string; force?: boolean } = {}
): Promise<FormResult> {
  const force = opts.force ?? false;
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (!LETTERS_ENABLED) return { ok: false, message: "Envoi des lettres désactivé." };

  const cand = await readCandidature(ctx.supabase, id);
  if (!cand) return { ok: false, message: "Candidature introuvable." };
  if (!cand.wf) return { ok: false, message: MIGRATION_REQUISE };
  if (cand.row.status !== "accepte") {
    return {
      ok: false,
      message: "L'admission ne peut être envoyée que sur une candidature acceptée.",
    };
  }
  if (!cand.row.decided_at && !force) {
    return {
      ok: false,
      code: "historical",
      message:
        "Candidature traitée avant la refonte : une notification a peut-être déjà été envoyée manuellement. Confirmer l'envoi ?",
    };
  }

  const { data: c } = await ctx.supabase
    .from("inscription_requests")
    .select("full_name, email, program_interest, entry_level")
    .eq("id", id)
    .single();
  if (!c) return { ok: false, message: "Candidature introuvable." };

  // ⚠️ GARDE MODE TEST — refuse AVANT toute modification si non autorisé.
  const rr = resolveRecipients(c.email ?? "");
  if (!rr.ok) return { ok: false, message: rr.reason };
  if (!canSendEmail) {
    return { ok: false, message: "Envoi d'email non configuré (RESEND_API_KEY manquante)." };
  }

  // Résolution ACADÉMIQUE : filière + niveau accepté → classe + frais (année active
  // automatique). Jamais depuis entry_level (diplôme antérieur). Pour un parcours
  // sans filière (bootcamp / cas manuel), pas de résolution : frais globaux + tarif
  // du niveau si fourni.
  let classId: string | null = null;
  let acceptedLevel: string | null = opts.level ?? null;
  let academicYear: string | null = null;
  let registrationFee: number;
  let tuitionDue: number | null = null;

  if (opts.filiereId && opts.level) {
    const r = await resolveAcademic(ctx.supabase, { filiereId: opts.filiereId, level: opts.level });
    if (!r.ok) return { ok: false, code: r.code, message: r.message };
    classId = r.classId;
    acceptedLevel = r.acceptedLevel;
    academicYear = r.academicYear;
    registrationFee = r.registrationFee;
    tuitionDue = r.tuitionDue;
  } else {
    const { data: fs } = await ctx.supabase
      .from("finance_settings")
      .select("registration_fee, academic_year")
      .eq("id", 1)
      .maybeSingle();
    registrationFee = Number(fs?.registration_fee ?? 300000);
    academicYear = (fs?.academic_year as string) ?? null;
    if (opts.level) {
      const { data: lvl } = await ctx.supabase
        .from("tuition_levels")
        .select("amount")
        .eq("level", opts.level)
        .maybeSingle();
      tuitionDue = lvl?.amount != null ? Number(lvl.amount) : null;
    }
  }

  // 🔒 MODE RÉEL — bloquer l'envoi si la scolarité requise est absente.
  if (!rr.testMode && tuitionDue == null) {
    return {
      ok: false,
      message:
        "Scolarité inconnue pour cette filière/niveau : renseigne le tarif dans Classes & filières avant d'envoyer l'admission (mode réel).",
    };
  }

  const now = new Date().toISOString();

  // 1. Pack d'admission (upsert, 1 par candidature) → id, puis lien de l'espace
  //    sécurisé. Best-effort : si la table n'existe pas, on continue sans lien.
  let packUrl: string | undefined;
  try {
    const { data: packRow } = await ctx.supabase
      .from("admission_packs")
      .upsert(
        {
          candidature_id: id,
          status: "sent",
          class_id: classId,
          accepted_level: acceptedLevel,
          registration_fee: registrationFee,
          tuition_due: tuitionDue,
          academic_year: academicYear,
          sent_at: now,
          sent_count: 1,
          updated_at: now,
          created_by: ctx.userId,
        },
        { onConflict: "candidature_id" }
      )
      .select("id")
      .single();
    if (packRow?.id) {
      const token = await generatePackLink(packRow.id as string, ctx.userId);
      if (token) packUrl = packLinkUrl(token);
    }
  } catch {
    // table admission_packs pas encore créée : on continue sans lien
  }

  // 2. Email (avec lien de l'espace) + PDF signé joint (best-effort).
  const { subject, html } = buildAdmissionEmail({
    name: (c.full_name as string) ?? "",
    program: (c.program_interest as string) ?? null,
    level: acceptedLevel,
    academicYear: academicYear,
    registrationFee: registrationFee,
    tuitionDue: tuitionDue,
    testMode: rr.testMode,
    packUrl,
  });

  let attachments: EmailAttachment[] | undefined;
  try {
    const pdf = await buildAdmissionPdf({
      name: (c.full_name as string) ?? "",
      program: (c.program_interest as string) ?? null,
      level: acceptedLevel,
      academicYear: academicYear,
      registrationFee: registrationFee,
      tuitionDue: tuitionDue,
      testMode: rr.testMode,
    });
    attachments = [
      {
        filename: rr.testMode
          ? "TEST-lettre-admission-ipmd.pdf"
          : "lettre-admission-ipmd.pdf",
        content: pdf.toString("base64"),
      },
    ];
  } catch {
    // génération PDF échouée : on enverra au moins l'email HTML
  }

  const sent = await sendScolariteEmail(rr.to, subject, html, attachments);
  if (sent < 1) {
    return { ok: false, message: "L'email n'a pas pu être envoyé. Réessayez." };
  }

  // 3. Statut → en attente de paiement.
  const update: Record<string, unknown> = {
    status: "en_attente_paiement",
    admission_sent_at: now,
  };
  if (!cand.row.decided_at) update.decided_at = now;
  await ctx.supabase.from("inscription_requests").update(update).eq("id", id);

  revalidate();
  return {
    ok: true,
    message: rr.testMode
      ? `MODE TEST : lettre d'admission envoyée à ${rr.to[0]} (aucun vrai candidat contacté). Statut → en attente de paiement.`
      : "Admission envoyée → en attente de paiement.",
  };
}

/**
 * « Confirmer le refus » : envoi officiel (SÉPARÉ de la décision).
 * Envoie la lettre de refus et pose `refusal_sent_at` (verrouillage).
 * Même GARDE MODE TEST que l'admission.
 */
export async function sendRefusal(
  id: string,
  force = false
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (!LETTERS_ENABLED) return { ok: false, message: "Envoi des lettres désactivé." };

  const cand = await readCandidature(ctx.supabase, id);
  if (!cand) return { ok: false, message: "Candidature introuvable." };
  if (!cand.wf) return { ok: false, message: MIGRATION_REQUISE };
  if (cand.row.status !== "refuse") {
    return {
      ok: false,
      message: "Le refus ne peut être envoyé que sur une candidature refusée.",
    };
  }
  if (!cand.row.decided_at && !force) {
    return {
      ok: false,
      code: "historical",
      message:
        "Candidature traitée avant la refonte : une notification a peut-être déjà été envoyée manuellement. Confirmer l'envoi ?",
    };
  }

  const { data: c } = await ctx.supabase
    .from("inscription_requests")
    .select("full_name, email, program_interest, refusal_reason")
    .eq("id", id)
    .single();
  if (!c) return { ok: false, message: "Candidature introuvable." };

  const rr = resolveRecipients(c.email ?? "");
  if (!rr.ok) return { ok: false, message: rr.reason };
  if (!canSendEmail) {
    return { ok: false, message: "Envoi d'email non configuré (RESEND_API_KEY manquante)." };
  }

  const { subject, html } = buildRefusalEmail({
    name: (c.full_name as string) ?? "",
    program: (c.program_interest as string) ?? null,
    reason: (c.refusal_reason as string) ?? null,
    testMode: rr.testMode,
  });

  const sent = await sendScolariteEmail(rr.to, subject, html);
  if (sent < 1) {
    return { ok: false, message: "L'email n'a pas pu être envoyé. Réessayez." };
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { refusal_sent_at: now };
  if (!cand.row.decided_at) update.decided_at = now;
  await ctx.supabase.from("inscription_requests").update(update).eq("id", id);

  revalidate();
  return {
    ok: true,
    message: rr.testMode
      ? `MODE TEST : lettre de refus envoyée à ${rr.to[0]} (aucun vrai candidat contacté).`
      : "Refus confirmé (verrouillé).",
  };
}

/**
 * « Marquer comme déjà notifiée » (assainissement des candidatures historiques) :
 * pose l'horodatage d'envoi SANS email et SANS changer le statut.
 */
export async function markAsNotified(
  id: string,
  kind: "admission" | "refus"
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const cand = await readCandidature(ctx.supabase, id);
  if (!cand) return { ok: false, message: "Candidature introuvable." };
  if (!cand.wf) return { ok: false, message: MIGRATION_REQUISE };

  const expected = kind === "admission" ? "accepte" : "refuse";
  if (cand.row.status !== expected) {
    return { ok: false, message: "Statut incompatible avec cette action." };
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> =
    kind === "admission" ? { admission_sent_at: now } : { refusal_sent_at: now };
  if (!cand.row.decided_at) update.decided_at = now;

  const { error } = await ctx.supabase
    .from("inscription_requests")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidate();
  return { ok: true, message: "Marquée comme déjà notifiée (aucun email envoyé)." };
}

/**
 * Supprime définitivement une candidature (réservé au super admin).
 */
export async function deleteCandidature(id: string): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non connecté." };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "super_admin") {
    return { ok: false, message: "Suppression réservée au super admin." };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };
  const { error } = await admin
    .from("inscription_requests")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidate();
  return { ok: true, message: "Candidature supprimée." };
}
