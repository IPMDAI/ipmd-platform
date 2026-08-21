"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CANDIDATURE_STATUS_VALUES,
  RESERVED_TARGETS,
  canTransition,
} from "@/lib/candidatures";
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
 * existent déjà en base : si la migration `candidatures-workflow.sql` n'a pas
 * encore été exécutée, on retombe sur le seul `status` (et les horodatages sont
 * traités comme null) afin que le changement de statut continue de fonctionner.
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

// Correction pré-production : tant que le Lot C n'envoie pas réellement les
// lettres/emails, les actions d'envoi sont DÉSACTIVÉES. On ne pose donc PAS
// admission_sent_at / refusal_sent_at et on ne prétend jamais « envoyé ».
// → passer à `true` au Lot C (une fois l'envoi réel branché).
const LOT_C_LETTERS_ENABLED = false;
const LOT_C_PENDING =
  "Disponible après le Lot C (l'envoi des lettres n'est pas encore actif).";

function revalidate() {
  revalidatePath("/espace/candidatures");
  revalidatePath("/espace");
}

/**
 * Fait évoluer le statut d'une candidature via les boutons de l'interface
 * (transitions « manuelles » de la machine à états). Les statuts réservés
 * (`en_attente_paiement`, `inscrit`) NE peuvent PAS être posés ici : ils
 * passent par leurs actions dédiées (Confirmer l'admission / Créer & inviter).
 *
 * Aucun email n'est envoyé (les décisions accepte/refuse restent silencieuses).
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
  // En posant une décision, on horodate qui a décidé et quand (base de la
  // traçabilité — la timeline complète viendra au Lot E). Uniquement si les
  // colonnes de workflow existent (sinon le changement de statut reste possible).
  if (cand.wf && (status === "accepte" || status === "refuse")) {
    update.decided_at = new Date().toISOString();
    update.decided_by = ctx.userId;
  }
  // Réouverture / révision : on repasse par en_etude. On NE touche PAS aux
  // horodatages d'envoi déjà posés (admission_sent_at / refusal_sent_at) →
  // toute la traçabilité est conservée.

  const { error } = await ctx.supabase
    .from("inscription_requests")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidate();
  return { ok: true, message: "Statut mis à jour." };
}

/**
 * « Confirmer l'admission » : envoi officiel de l'admission (action SÉPARÉE de
 * la décision). Enregistre l'envoi (admission_sent_at) et fait passer la
 * candidature de `accepte` → `en_attente_paiement`.
 *
 * ⚠️ Lot A : n'envoie PAS encore l'email. La LETTRE officielle (contenu + PDF)
 * est le Lot C — le point d'insertion est marqué ci-dessous.
 *
 * Sécurité candidatures historiques : si la candidature a été décidée avant la
 * refonte (decided_at NULL), on exige une confirmation explicite (force=true).
 */
export async function sendAdmission(
  id: string,
  force = false
): Promise<FormResult> {
  if (!LOT_C_LETTERS_ENABLED) return { ok: false, message: LOT_C_PENDING };
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

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

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: "en_attente_paiement",
    admission_sent_at: now,
  };
  if (!cand.row.decided_at) update.decided_at = now; // assainit l'historique

  // TODO Lot C : composer et envoyer ici la LETTRE d'admission officielle
  // (email + PDF signé + proforma). Le Lot A ne fait que la transition d'état.

  const { error } = await ctx.supabase
    .from("inscription_requests")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidate();
  return {
    ok: true,
    message: "Admission confirmée → en attente de paiement. (Lettre email : Lot C)",
  };
}

/**
 * « Confirmer le refus » : envoi officiel du refus (action SÉPARÉE de la
 * décision). Enregistre l'envoi (refusal_sent_at). La candidature RESTE
 * `refuse` mais devient VERROUILLÉE (réouverture exceptionnelle via
 * setCandidatureStatus → en_etude, confirmée côté UI, traçabilité conservée).
 *
 * ⚠️ Lot A : n'envoie PAS encore l'email (lettre de refus = Lot C).
 */
export async function sendRefusal(
  id: string,
  force = false
): Promise<FormResult> {
  if (!LOT_C_LETTERS_ENABLED) return { ok: false, message: LOT_C_PENDING };
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

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

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { refusal_sent_at: now };
  if (!cand.row.decided_at) update.decided_at = now;

  // TODO Lot C : composer et envoyer ici la LETTRE de refus officielle.

  const { error } = await ctx.supabase
    .from("inscription_requests")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidate();
  return {
    ok: true,
    message: "Refus confirmé (verrouillé). (Lettre email : Lot C)",
  };
}

/**
 * « Marquer comme déjà notifiée » (assainissement des candidatures historiques) :
 * pose l'horodatage d'envoi SANS envoyer d'email et SANS changer le statut.
 * Permet de faire disparaître le rappel d'envoi sur d'anciens dossiers déjà
 * traités manuellement, sans re-solliciter le candidat.
 */
export async function markAsNotified(
  id: string,
  kind: "admission" | "refus"
): Promise<FormResult> {
  if (!LOT_C_LETTERS_ENABLED) return { ok: false, message: LOT_C_PENDING };
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
 * Utilisé pour retirer les tests / doublons. Suppression via service-role
 * (aucune policy DELETE sur inscription_requests) après vérification du rôle.
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
