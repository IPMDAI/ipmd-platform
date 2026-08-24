"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generatePackLink,
  packLinkUrl,
  revokePackLinks,
  verifyPackToken,
} from "@/lib/admission-pack-link";
import { resolveRecipients } from "@/lib/admission-config";
import {
  buildScheduleSnapshot,
  resolvePlanMonths,
  isPlanMonths,
  type PaymentOption,
  type PlanMonths,
  type ScheduleSnapshot,
} from "@/lib/admission-schedule";
import { loadScholarshipForCandidature } from "@/lib/scholarship-data";
import { REGLEMENT_VERSION } from "@/data/reglement";
import {
  sendScolariteEmail,
  canSendEmail,
  emailDocument,
  escapeHtml,
} from "@/lib/email";
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
  return { userId: user.id };
}

async function packIdFor(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  candidatureId: string
): Promise<string | null> {
  const { data } = await admin
    .from("admission_packs")
    .select("id")
    .eq("candidature_id", candidatureId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Génère un NOUVEAU lien du pack (révoque l'ancien) et renvoie l'URL.
 * Sert pour « Copier le lien » et « Régénérer » (le token brut n'étant jamais
 * restocké, obtenir un lien = en créer un nouveau).
 */
export async function createPackLink(
  candidatureId: string
): Promise<FormResult & { url?: string }> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const packId = await packIdFor(admin, candidatureId);
  if (!packId)
    return { ok: false, message: "Aucun pack : confirme d'abord l'admission." };

  const token = await generatePackLink(packId, ctx.userId);
  if (!token) return { ok: false, message: "Échec de génération du lien." };

  revalidatePath("/espace/candidatures");
  return {
    ok: true,
    message: "Nouveau lien généré (l'ancien est révoqué).",
    url: packLinkUrl(token),
  };
}

/** Révoque tous les liens actifs du pack (le candidat n'y accède plus). */
export async function revokePackLink(
  candidatureId: string
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const packId = await packIdFor(admin, candidatureId);
  if (!packId) return { ok: false, message: "Aucun pack." };

  const ok = await revokePackLinks(packId);
  if (!ok) return { ok: false, message: "Échec de la révocation." };

  revalidatePath("/espace/candidatures");
  return { ok: true, message: "Lien révoqué. Le candidat n'y a plus accès." };
}

/**
 * Envoie au candidat le lien de son espace d'admission (nouveau lien généré).
 * ⚠️ Respecte la GARDE MODE TEST : en test, n'envoie qu'à l'adresse de test et
 * uniquement pour la candidature de test.
 */
export async function sendPackLink(
  candidatureId: string
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const { data: cand } = await admin
    .from("inscription_requests")
    .select("full_name, email")
    .eq("id", candidatureId)
    .single();
  if (!cand) return { ok: false, message: "Candidature introuvable." };

  const rr = resolveRecipients((cand.email as string) ?? "");
  if (!rr.ok) return { ok: false, message: rr.reason };
  if (!canSendEmail)
    return { ok: false, message: "Envoi d'email non configuré (RESEND_API_KEY manquante)." };

  const packId = await packIdFor(admin, candidatureId);
  if (!packId)
    return { ok: false, message: "Aucun pack : confirme d'abord l'admission." };

  const token = await generatePackLink(packId, ctx.userId);
  if (!token) return { ok: false, message: "Échec de génération du lien." };
  const url = packLinkUrl(token);

  const prenom = ((cand.full_name as string) || "").split(" ")[0] || "Bonjour";
  const html = emailDocument(
    "Votre espace d'admission",
    `<p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(prenom)},</p>
     <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6">
       Accédez à votre espace d'admission sécurisé pour consulter et télécharger
       votre lettre d'admission et vos documents :
     </p>
     <p style="margin:0 0 20px">
       <a href="${url}" style="display:inline-block;background:#e01228;color:#fff;
          text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;
          border-radius:9999px">Accéder à mon espace d'admission</a>
     </p>
     <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5">
       Ce lien vous est personnel. S'il ne fonctionne pas, copiez cette adresse :<br/>${escapeHtml(url)}
     </p>`
  );

  const sent = await sendScolariteEmail(
    rr.to,
    (rr.testMode ? "[TEST] " : "") + "IPMD — Votre espace d'admission",
    html
  );
  if (sent < 1) return { ok: false, message: "L'email n'a pas pu être envoyé." };

  revalidatePath("/espace/candidatures");
  return {
    ok: true,
    message: rr.testMode
      ? `MODE TEST : lien envoyé à ${rr.to[0]} (aucun vrai candidat).`
      : `Lien envoyé à ${cand.email}.`,
  };
}

/**
 * Recalcule + fige `admission_packs.schedule_json` depuis les sources LIVE (tarif
 * officiel figé du pack + payment_plans + installment_plan filtré sur le plan +
 * finance_settings), en PRÉSERVANT le plan non modifié. Action interne utilisée par
 * `setPlan` (et `setPaymentOption` en compat). Jour d'échéance fixe (30 / février).
 * Gardes : token valide, pack valide, candidature NON `inscrit` (verrou F7).
 * ⚠️ Ne modifie JAMAIS `student_finance`/`payment_schedules`/access/statut ;
 * `tuition_due` (tarif officiel) jamais écrasé.
 */
async function rebuildPackSchedule(
  token: string,
  override: { planMonths?: PlanMonths }
): Promise<{ ok: true; schedule: ScheduleSnapshot } | { ok: false; code?: string; message: string }> {
  const link = await verifyPackToken(token);
  if (!link) return { ok: false, message: "Lien invalide ou expiré." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service momentanément indisponible." };

  const { data: pack } = await admin
    .from("admission_packs")
    .select("candidature_id, academic_year, accepted_level, registration_fee, tuition_due, schedule_json")
    .eq("id", link.packId)
    .maybeSingle();
  if (!pack) return { ok: false, message: "Pack introuvable." };

  // 🔒 VERROU (F7) : inscription finalisée → choix figé (matérialisé).
  const { data: cand } = await admin
    .from("inscription_requests")
    .select("status")
    .eq("id", pack.candidature_id as string)
    .maybeSingle();
  if (cand?.status === "inscrit") {
    return {
      ok: false,
      message:
        "Choix de paiement verrouillé : votre inscription est finalisée. Contactez la scolarité pour toute modification.",
    };
  }

  // Plan courant : depuis le snapshot existant (nouveau plan_months OU ancien
  // payment_option), défaut 10 ; surchargé si un plan est explicitement demandé.
  const sj = (pack.schedule_json ?? {}) as { tuition_official?: number };
  const planMonths: PlanMonths = override.planMonths ?? resolvePlanMonths(pack.schedule_json as Record<string, unknown> ?? {}) ?? 10;
  const tuitionOfficial =
    pack.tuition_due != null ? Number(pack.tuition_due) : sj.tuition_official ?? null;
  const academicYear = (pack.academic_year as string) ?? "";

  const [{ data: planRows }, { data: fsDisc }, { data: planCfg }, scholarship] = await Promise.all([
    admin.from("installment_plan").select("seq, pct, due_date").eq("academic_year", academicYear).eq("plan_months", planMonths),
    admin.from("finance_settings").select("lump_sum_discount").eq("id", 1).maybeSingle(),
    admin.from("payment_plans").select("discount_rate").eq("academic_year", academicYear).eq("plan_months", planMonths).maybeSingle(),
    loadScholarshipForCandidature(pack.candidature_id as string),
  ]);

  const snap = buildScheduleSnapshot({
    academicYear,
    level: (pack.accepted_level as string) ?? null,
    registrationFee: Number(pack.registration_fee ?? 0),
    tuitionOfficial,
    planMonths,
    discountRate: Number(planCfg?.discount_rate ?? 0),
    lumpSumDiscount: Number(fsDisc?.lump_sum_discount ?? 0.15),
    planRows: (planRows ?? []).map((r) => ({
      seq: Number(r.seq),
      pct: Number(r.pct),
      due_date: String(r.due_date),
    })),
    scholarshipEngagement: scholarship?.engagement ?? null,
    scholarshipTerms: scholarship?.terms ?? [],
  });
  if (!snap.ok) return { ok: false, code: snap.code, message: snap.message };

  const { error } = await admin
    .from("admission_packs")
    .update({ schedule_json: snap.schedule, updated_at: new Date().toISOString() })
    .eq("id", link.packId);
  if (error) return { ok: false, message: "Une erreur est survenue. Réessayez." };
  return { ok: true, schedule: snap.schedule };
}

/**
 * CHOIX du plan de paiement par le candidat : nb de mensualités ∈ {1,2,3,6,8,10}.
 * Action PUBLIQUE token-gated. Jour d'échéance fixe (30 / février dernier jour).
 */
export async function setPlan(token: string, months: number): Promise<FormResult> {
  if (!isPlanMonths(months)) {
    return { ok: false, message: "Plan de paiement invalide (1, 2, 3, 6, 8 ou 10 mensualités)." };
  }
  const res = await rebuildPackSchedule(token, { planMonths: months });
  if (!res.ok) return { ok: false, code: res.code, message: res.message };
  const disc = Math.round(res.schedule.discount_rate * 100);
  return {
    ok: true,
    message:
      months === 1
        ? `Paiement en 1 fois enregistré : remise de ${disc} % sur la scolarité (frais d'inscription inchangés).`
        : `Paiement en ${months} mensualités enregistré${disc > 0 ? ` : remise de ${disc} %` : ""}.`,
  };
}

/**
 * COMPAT : ancien choix binaire « echelonne » / « comptant ». Mappe vers le plan
 * (echelonne → 10 mensualités, comptant → 1 fois). Conservé pour l'UI existante
 * jusqu'à la bascule vers `setPlan` (6 plans).
 */
export async function setPaymentOption(
  token: string,
  option: PaymentOption
): Promise<FormResult> {
  if (option !== "echelonne" && option !== "comptant") {
    return { ok: false, message: "Option de paiement invalide." };
  }
  const res = await rebuildPackSchedule(token, { planMonths: option === "comptant" ? 1 : 10 });
  if (!res.ok) return { ok: false, code: res.code, message: res.message };
  return {
    ok: true,
    message:
      option === "comptant"
        ? "Paiement comptant enregistré : remise de 15 % sur la scolarité (frais d'inscription inchangés)."
        : "Paiement échelonné enregistré : 10 tranches.",
  };
}

/**
 * ACCEPTATION électronique du règlement intérieur par le candidat (C3).
 * Action PUBLIQUE token-gated (candidat non connecté) : vérifie le lien, puis
 * enregistre le consentement (date + version) sur le pack via service-role.
 * C'est un CONSENTEMENT (case + horodatage + version) — pas une signature.
 */
export async function acceptPackReglement(token: string): Promise<FormResult> {
  const link = await verifyPackToken(token);
  if (!link) return { ok: false, message: "Lien invalide ou expiré." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service momentanément indisponible." };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("admission_packs")
    .update({
      reglement_accepted_at: now,
      reglement_version: REGLEMENT_VERSION,
      updated_at: now,
    })
    .eq("id", link.packId);
  if (error) return { ok: false, message: "Une erreur est survenue. Réessayez." };

  return { ok: true, message: "Règlement intérieur accepté. Merci !" };
}

/**
 * ACCORD DE PRINCIPE sur la convention (C4) — NON CONTRAIGNANT.
 * ⚠️ Ce n'est PAS une signature juridique. Le statut reste « en_attente_signature ».
 * La signature réelle = dépôt d'un scan signé (ci-dessous) ou prestataire externe.
 */
export async function recordConventionPrinciple(token: string): Promise<FormResult> {
  const link = await verifyPackToken(token);
  if (!link) return { ok: false, message: "Lien invalide ou expiré." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service momentanément indisponible." };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("admission_packs")
    .update({
      convention_status: "en_attente_signature",
      signature_method: "accord_principe_non_contraignant",
      updated_at: now,
    })
    .eq("id", link.packId);
  if (error) return { ok: false, message: "Une erreur est survenue. Réessayez." };

  return {
    ok: true,
    message:
      "Accord de principe enregistré (non contraignant). La convention reste à signer officiellement.",
  };
}

/**
 * Dépôt d'une CONVENTION SIGNÉE (scan) par le candidat (C4). Le fichier a déjà
 * été téléversé (bucket candidature-docs, ticket signé) au chemin `<packId>/…`.
 * On enregistre la référence → convention « signee » (méthode scan manuscrit).
 */
export async function uploadConventionScan(
  token: string,
  filePath: string
): Promise<FormResult> {
  const link = await verifyPackToken(token);
  if (!link) return { ok: false, message: "Lien invalide ou expiré." };
  // Le fichier doit appartenir au dossier du pack (anti-abus).
  if (!filePath || !filePath.startsWith(`${link.packId}/`)) {
    return { ok: false, message: "Fichier invalide." };
  }
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service momentanément indisponible." };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("admission_packs")
    .update({
      convention_status: "signee",
      signature_method: "scan_manuscrit",
      signature_evidence_url: filePath,
      convention_signed_at: now,
      updated_at: now,
    })
    .eq("id", link.packId);
  if (error) return { ok: false, message: "Une erreur est survenue. Réessayez." };

  return { ok: true, message: "Convention signée reçue. Merci !" };
}
