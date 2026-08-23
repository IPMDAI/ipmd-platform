"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, canAdminUsers } from "@/lib/supabase/admin";
import { VALID_ROLES } from "@/lib/dashboards";
import { formatFCFA } from "@/lib/finance";
import { hasAdmissionSnapshot, validateAdmissionSnapshot } from "@/lib/admission-snapshot";
import { validateScheduleSnapshot } from "@/lib/admission-schedule";
import { officialAssetAttachment } from "@/lib/secure-assets";
import {
  canSendEmail,
  emailDocument,
  buildRows,
  sendScolariteEmail,
} from "@/lib/email";
import type { FormResult } from "@/types";

async function requireSuperAdmin() {
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
  if (me?.role !== "super_admin") return null;
  return { supabase };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Crée un compte utilisateur avec un rôle (Super Admin uniquement). */
export async function createUserAccount(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  if (!canAdminUsers) {
    return {
      ok: false,
      message:
        "Création de comptes non configurée (clé SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel).",
    };
  }

  const email = str(formData, "email").toLowerCase();
  const fullName = str(formData, "full_name");
  const password = str(formData, "password");
  let role = str(formData, "role");
  if (!email.includes("@")) return { ok: false, message: "Email invalide." };
  if (!fullName) return { ok: false, message: "Nom et prénom requis." };
  if (password.length < 8) {
    return { ok: false, message: "Mot de passe : 8 caractères minimum." };
  }
  if (!VALID_ROLES.includes(role)) role = "etudiant";

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service indisponible." };

  // 1. Création du compte (email confirmé d'office).
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) return { ok: false, message: error.message };
  const newId = created.user?.id;
  if (!newId) return { ok: false, message: "Le compte n'a pas pu être créé." };

  // 2. Le trigger a créé le profil (rôle « etudiant »). On applique le rôle
  //    choisi via le client du Super Admin (autorisé par la policy + garde).
  const universe = str(formData, "universe");
  const { error: upErr } = await ctx.supabase
    .from("profiles")
    .update({ role, full_name: fullName, universe: universe || null })
    .eq("id", newId);
  if (upErr) {
    return {
      ok: false,
      message: `Compte créé, mais rôle non appliqué : ${upErr.message}`,
    };
  }

  revalidatePath("/espace/utilisateurs");
  return { ok: true, message: `Compte créé pour ${email} (rôle : ${role}).` };
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro"
).replace(/\/$/, "");

/**
 * Crée le compte d'un candidat accepté et lui envoie un email d'invitation
 * pour définir lui-même son mot de passe. Marque la candidature « inscrit ».
 */
export async function inviteFromCandidature(
  candidatureId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  if (!canAdminUsers) {
    return {
      ok: false,
      message:
        "Création de comptes non configurée (clé SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel).",
    };
  }

  const { data: cand } = await ctx.supabase
    .from("inscription_requests")
    .select("full_name, last_name, first_names, email, universe, program_interest, entry_level, status, academic_year")
    .eq("id", candidatureId)
    .single();
  if (!cand) return { ok: false, message: "Candidature introuvable." };

  // Garde WORKFLOW : le parcours d'invitation n'est valable qu'APRÈS « Confirmer
  // l'admission » (statut « en attente de paiement »). Empêche d'inviter avant
  // qu'un snapshot n'existe (ou après une réouverture qui a changé le statut).
  if (cand.status !== "en_attente_paiement") {
    return {
      ok: false,
      message:
        "Invitation possible uniquement après « Confirmer l'admission » (statut « en attente de paiement »). Aucun compte créé.",
    };
  }

  const email = (cand.email || "").trim().toLowerCase();
  const fullName = (cand.full_name || "").trim();
  if (!email.includes("@")) return { ok: false, message: "Email invalide." };

  let role = str(formData, "role");
  if (!VALID_ROLES.includes(role)) role = "etudiant";

  // Réutilise le SNAPSHOT d'admission (classe + frais figés à « Confirmer l'admission »).
  // S'il existe, on ne redemande NI niveau NI classe NI frais. Sinon (bootcamp/legacy
  // sans snapshot), on retombe sur les valeurs du formulaire.
  const { data: pack } = await ctx.supabase
    .from("admission_packs")
    .select("class_id, accepted_level, registration_fee, tuition_due, academic_year, schedule_json")
    .eq("candidature_id", candidatureId)
    .maybeSingle();
  const snap = hasAdmissionSnapshot(pack) ? pack! : null;

  // 🔒 SNAPSHOT PRÉSENT → validation STRICTE (complétude + cohérence réelle de la
  // classe) AVANT toute création de compte / écriture finance. Aucun fallback.
  if (snap) {
    const { data: snapCls } = await ctx.supabase
      .from("classes")
      .select("id, filiere_id, level, academic_year, kind")
      .eq("id", snap.class_id as string)
      .maybeSingle();
    const check = validateAdmissionSnapshot(snap, snapCls ?? null);
    if (!check.ok) return { ok: false, message: check.message };
  }

  // 🔒 F4 — ÉCHÉANCIER FIGÉ requis pour toute admission DIPLÔMANTE (scolarité
  // connue). Le snapshot financier (admission_packs.schedule_json) est figé à
  // « Confirmer l'admission » (F2/F3). On le valide ICI (fail-fast, avant toute
  // création de compte) : sans échéancier valide, impossible de matérialiser
  // payment_schedules → on N'AVANCE PAS le statut. Réessai possible après avoir
  // reconfirmé l'admission (régénère l'échéancier). Les flux SANS scolarité
  // (bootcamp/certif, tuition_due null) ne sont pas concernés (comportement
  // inchangé, aucune matérialisation d'échéancier).
  const schedCheck = validateScheduleSnapshot(
    (pack as { schedule_json?: unknown } | null)?.schedule_json
  );
  if (snap && snap.tuition_due != null && role === "etudiant" && !schedCheck.ok) {
    return {
      ok: false,
      message: `Échéancier d'admission ${schedCheck.reason}. Reconfirmez l'admission pour régénérer l'échéancier avant de finaliser l'inscription. Statut inchangé.`,
    };
  }
  const sched = schedCheck.ok ? schedCheck.snap : null;

  const classId = snap?.class_id ?? str(formData, "class_id");

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service indisponible." };

  // 1. Crée le compte (sans mot de passe) — ou récupère-le s'il existe déjà.
  let newId: string | undefined;
  const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr) {
    // Probablement déjà créé : on retrouve son id via le profil.
    const { data: existing } = await ctx.supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    newId = existing?.id;
  } else {
    newId = createdUser.user?.id;
  }
  if (!newId) {
    return {
      ok: false,
      message: `Le compte n'a pas pu être créé${createErr ? " : " + createErr.message : ""}.`,
    };
  }

  // 2. Lien « définir mon mot de passe » (envoyé via Resend, pas par Supabase).
  let actionLink = `${SITE_URL}/mot-de-passe-oublie`;
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${SITE_URL}/definir-mot-de-passe` },
  });
  if (linkData?.properties?.action_link) {
    actionLink = linkData.properties.action_link;
  }

  // 2. Rôle + nom + univers (via le client Super Admin, autorisé par la garde).
  const profileUpdate: Record<string, unknown> = {
    role,
    full_name: fullName,
    universe: cand.universe ?? null,
    // Identité structurée recopiée depuis la candidature (jamais de parsing de full_name).
    last_name: cand.last_name ?? null,
    first_names: cand.first_names ?? null,
  };
  // Report de la naissance depuis la candidature → profil, UNIQUEMENT si le
  // profil ne l'a pas déjà (jamais d'écrasement). Best-effort : si les colonnes
  // birth_* n'existent pas encore côté candidature, on ignore proprement.
  try {
    const [{ data: prof }, { data: candBirth }] = await Promise.all([
      ctx.supabase.from("profiles").select("birth_date, birth_place").eq("id", newId).maybeSingle(),
      ctx.supabase
        .from("inscription_requests")
        .select("birth_date, birth_place")
        .eq("id", candidatureId)
        .maybeSingle(),
    ]);
    if (!prof?.birth_date && candBirth?.birth_date) profileUpdate.birth_date = candBirth.birth_date;
    if (!prof?.birth_place && candBirth?.birth_place) profileUpdate.birth_place = candBirth.birth_place;
  } catch {
    // colonnes naissance absentes côté candidature : report ignoré
  }
  await ctx.supabase.from("profiles").update(profileUpdate).eq("id", newId);

  // 2b. MATRICULE — attribué AVANT le passage « inscrit ».
  //  • appel exclusivement serveur, via le client service_role (assign_matricule
  //    n'est exécutable que par service_role) ;
  //  • atomique + idempotent (aucun nouveau numéro si le profil en a déjà un) ;
  //  • jamais de parsing de full_name : on n'utilise que last_name/first_names ;
  //  • sécurité transactionnelle : si l'attribution échoue, on RETOURNE une erreur
  //    SANS marquer la candidature « inscrit » (statut inchangé → réessai possible,
  //    idempotent). L'ordre garantit : status='inscrit' ⟹ matricule attribué.
  let matriculeYear = (cand.academic_year || snap?.academic_year || null) as string | null;
  if (!matriculeYear) {
    const { data: fs } = await ctx.supabase
      .from("finance_settings")
      .select("academic_year")
      .eq("id", 1)
      .maybeSingle();
    matriculeYear = (fs?.academic_year as string) ?? null;
  }
  if (!matriculeYear || !cand.last_name || !cand.first_names) {
    return {
      ok: false,
      message:
        "Matricule impossible : année académique ou identité (nom / prénoms) manquante sur la candidature. Statut inchangé.",
    };
  }
  const { error: matErr } = await admin.rpc("assign_matricule", {
    p_student: newId,
    p_academic_year: matriculeYear,
    p_last_name: cand.last_name,
    p_first_names: cand.first_names,
  });
  if (matErr) {
    return {
      ok: false,
      message: `Matricule non attribué (${matErr.message}). La candidature reste « en attente de paiement » — réessayez.`,
    };
  }

  // 3. Affectation à une classe (optionnelle).
  if (classId) {
    await ctx.supabase
      .from("class_members")
      .upsert(
        { class_id: classId, student_id: newId },
        { onConflict: "student_id" }
      );
  }

  // 4. Frais pré-remplis (étudiants) + email d'acceptation avec lien mot de passe.
  //    Priorité au SNAPSHOT d'admission (figé) ; sinon calcul depuis niveau/classe.
  const level = snap?.accepted_level ?? str(formData, "level");
  const isStudent = role === "etudiant";
  let emailed = 0;
  let proformaBlock = "";

  if (isStudent) {
    const { data: settings } = await ctx.supabase
      .from("finance_settings")
      .select("registration_fee, academic_year")
      .eq("id", 1)
      .maybeSingle();
    const globalReg = Number(settings?.registration_fee ?? 300000);

    let registrationFee: number;
    let tuitionDue: number;
    let academicYear: string | null;
    let installmentsVal: number | null = null;
    let modeVal: string | null = null;
    let discountRate = 0; // F4 : remise figée (0 échelonné ; lump_sum_discount comptant)
    let netToFinance: number | null = null; // F4 : scolarité à financer (= tuition_net du snapshot)

    if (snap) {
      // Montants figés à l'admission — aucun recalcul. Priorité au snapshot
      // financier (schedule_json) figé à « Confirmer l'admission » (F2/F3) :
      // tuition_due = tarif OFFICIEL (jamais le net), discount_rate + net repris tels quels.
      registrationFee = sched
        ? sched.registration_fee
        : snap.registration_fee != null
          ? Number(snap.registration_fee)
          : globalReg;
      tuitionDue = sched
        ? sched.tuition_official
        : snap.tuition_due != null
          ? Number(snap.tuition_due)
          : 0;
      academicYear = sched
        ? sched.academic_year
        : (snap.academic_year as string) ?? (settings?.academic_year ?? null);
      if (sched) {
        discountRate = sched.discount_rate;
        netToFinance = sched.tuition_net;
        installmentsVal = sched.installments.length; // 10 (échelonné) ou 1 (comptant)
      }
      if (classId) {
        const { data: cls } = await ctx.supabase
          .from("classes")
          .select("installments, mode")
          .eq("id", classId)
          .maybeSingle();
        // Le nb de tranches réel vient du snapshot figé (sched) ; la classe ne
        // sert plus qu'au mode. Sans snapshot, on retombe sur la classe.
        if (!sched && cls?.installments != null) installmentsVal = Number(cls.installments);
        modeVal = (cls?.mode as string) ?? null;
      }
    } else {
      // Legacy (bootcamp / cas sans snapshot) : classe prioritaire, sinon niveau.
      const [lvlRes, classRes] = await Promise.all([
        level
          ? ctx.supabase.from("tuition_levels").select("amount").eq("level", level).maybeSingle()
          : Promise.resolve({ data: null }),
        classId
          ? ctx.supabase
              .from("classes")
              .select("tuition_amount, registration_fee, installments, mode")
              .eq("id", classId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const cls = classRes?.data as
        | { tuition_amount: number | null; registration_fee: number | null; installments: number | null; mode: string | null }
        | null;
      registrationFee = cls?.registration_fee != null ? Number(cls.registration_fee) : globalReg;
      tuitionDue = cls?.tuition_amount != null ? Number(cls.tuition_amount) : Number(lvlRes?.data?.amount ?? 0);
      academicYear = settings?.academic_year ?? null;
      installmentsVal = cls?.installments != null ? Number(cls.installments) : null;
      modeVal = (cls?.mode as string) ?? null;
    }
    // total dû = inscription + scolarité À FINANCER (nette, remise comptant incluse).
    // tuition_due reste le tarif OFFICIEL ; discount_rate porte la remise.
    const totalDue = registrationFee + (netToFinance ?? tuitionDue);

    const financeRow: Record<string, unknown> = {
      student_id: newId,
      registration_fee: registrationFee,
      tuition_due: tuitionDue,
      discount_rate: discountRate,
      level: level || null,
      academic_year: academicYear,
      total_due: totalDue,
      // Accès en pause tant que les frais d'inscription ne sont pas réglés.
      access_state: "pause",
      updated_at: new Date().toISOString(),
    };
    if (installmentsVal != null) financeRow.installments = installmentsVal;
    if (modeVal) financeRow.mode = modeVal;

    // 4b. F4 — MATÉRIALISATION FINANCE.
    //  • Admission DIPLÔMANTE (snapshot figé `sched`) → RPC ATOMIQUE
    //    `materialize_student_finance` (SECURITY DEFINER, service_role) : upsert
    //    student_finance + delete/insert payment_schedules + vérif nb/somme, le
    //    tout en UNE transaction DB. Idempotente (10 échelonné / 1 comptant,
    //    jamais de doublon). tuition_due = tarif OFFICIEL ; discount_rate porte la
    //    remise ; total_due = registration_fee + tuition_net ; frais d'inscription
    //    EXCLUS de l'échéancier.
    //  • Sans snapshot (bootcamp / sans scolarité) → upsert student_finance simple,
    //    aucun payment_schedules (comportement inchangé).
    //  Échec → RETURN sans passer « inscrit » (statut inchangé, réessai idempotent).
    //  Garantit : inscrit ⟹ (student_finance ∧ payment_schedules) matérialisés.
    if (sched) {
      const { error: matFinErr } = await admin.rpc("materialize_student_finance", {
        p_student: newId,
        p_academic_year: sched.academic_year || null,
        p_level: sched.level || level || null,
        p_registration_fee: sched.registration_fee,
        p_tuition_official: sched.tuition_official,
        p_discount_rate: sched.discount_rate,
        p_tuition_net: sched.tuition_net,
        p_payment_option: sched.payment_option,
        p_installments: sched.installments,
        p_mode: modeVal,
      });
      if (matFinErr) {
        return {
          ok: false,
          message: `Finance non matérialisée (${matFinErr.message}). La candidature reste « en attente de paiement » — réessayez.`,
        };
      }
    } else {
      const { error: finErr } = await ctx.supabase
        .from("student_finance")
        .upsert(financeRow, { onConflict: "student_id" });
      if (finErr) {
        return {
          ok: false,
          message: `Finance non enregistrée (${finErr.message}). La candidature reste « en attente de paiement » — réessayez.`,
        };
      }
    }

    const proformaLines: Array<[string, string]> = [
      ["Formation", cand.program_interest || "—"],
      ["Niveau accepté", level || cand.entry_level || "—"],
      ["Frais d'inscription", formatFCFA(registrationFee)],
      ["Frais de scolarité", formatFCFA(tuitionDue)],
    ];
    // Remise comptant figée (F4) : ligne dédiée pour que le total s'additionne.
    if (discountRate > 0 && netToFinance != null) {
      proformaLines.push([
        `Remise paiement comptant (−${Math.round(discountRate * 100)} %)`,
        `− ${formatFCFA(tuitionDue - netToFinance)}`,
      ]);
    }
    proformaLines.push(["Total à régler", formatFCFA(totalDue)]);
    const rows = buildRows(proformaLines);
    proformaBlock = `<p style="margin:0 0 12px">Voici votre facture proforma :</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
       <p style="margin:16px 0 0">Veuillez procéder à votre <strong>inscription définitive</strong> en réglant les frais d'inscription de <strong>${formatFCFA(registrationFee)}</strong> via <strong>Wave</strong>, <strong>Orange Money</strong> ou par versement / virement <strong>AFG Bank</strong>. Le RIB officiel AFG Bank de l'IPMD est joint à cet email. Après le paiement, transmettez votre preuve de paiement au service de la scolarité pour validation.</p>`;
  }

  // Email unique (Resend) : acceptation + proforma (étudiants) + lien mot de passe.
  try {
    if (canSendEmail) {
      const html = emailDocument(
        "Votre dossier est accepté 🎉",
        `<p style="margin:0 0 12px">Bonjour ${fullName || ""},</p>
         <p style="margin:0 0 12px">Félicitations, votre dossier de candidature à l'IPMD a été <strong>accepté</strong>.</p>
         ${proformaBlock}
         <p style="margin:18px 0 0"><a href="${actionLink}" style="display:inline-block;background:#e01228;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9999px;font-weight:600">🔑 Définir mon mot de passe & accéder à mon espace</a></p>
         <p style="color:#9ca3af;font-size:12px;margin-top:10px">Ce lien est personnel. S'il a expiré, utilise « Mot de passe oublié » sur ${SITE_URL}/connexion.</p>
         <p style="color:#9ca3af;font-size:12px;margin-top:12px">scolarite@ipmd.pro · ipmd.pro</p>`
      );
      // RIB officiel AFG Bank joint UNIQUEMENT pour les étudiants (contexte paiement
      // de scolarité). Chargé depuis le bucket privé `official-assets`
      // (documents/rib-afg.pdf) — remplaçable sans redéploiement, hors Git.
      // Absent → email envoyé sans pièce jointe (jamais d'échec d'inscription).
      // Aucune coordonnée bancaire recopiée dans le HTML.
      const ribAtt = isStudent
        ? await officialAssetAttachment("documents/rib-afg.pdf", "IPMD-RIB-AFG-Bank.pdf")
        : null;
      const attachments = ribAtt ? [ribAtt] : undefined;
      emailed = await sendScolariteEmail(
        [email],
        "IPMD — Dossier accepté & inscription",
        html,
        attachments
      );
    }
  } catch {
    // best-effort
  }

  // 5. La candidature passe « inscrit » (compte créé).
  await ctx.supabase
    .from("inscription_requests")
    .update({ status: "inscrit" })
    .eq("id", candidatureId);

  revalidatePath("/espace/candidatures");
  revalidatePath("/espace/utilisateurs");
  revalidatePath("/espace/finance");
  return {
    ok: true,
    message:
      `Compte créé pour ${email}.` +
      (emailed > 0
        ? " Email d'acceptation + lien « définir mot de passe » envoyé."
        : " (Email non envoyé — vérifie la config Resend.)"),
  };
}

/**
 * Reprise d'un ancien étudiant : crée (ou retrouve) le compte, l'affecte à une
 * classe, fixe ses frais (niveau ou tarif de classe + réduction éventuelle),
 * enregistre le montant DÉJÀ PAYÉ (report antérieur) et envoie le lien
 * « définir mot de passe ». Tout en un seul formulaire. (Super Admin)
 */
export async function createReturningStudent(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  if (!canAdminUsers) {
    return { ok: false, message: "Création non configurée (SUPABASE_SERVICE_ROLE_KEY manquante)." };
  }

  const email = str(formData, "email").toLowerCase();
  const fullName = str(formData, "full_name");
  const level = str(formData, "level");
  const program = str(formData, "program");
  const classId = str(formData, "class_id");
  const discountPct = Math.min(100, Math.max(0, Number(str(formData, "discount_pct") || "0")));
  const paidAmount = Math.max(0, Number(str(formData, "paid_amount") || "0"));
  const sendEmail = str(formData, "send_mode") === "create_send";
  if (!email.includes("@")) return { ok: false, message: "Email invalide." };
  if (!fullName) return { ok: false, message: "Nom et prénom requis." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service indisponible." };

  // 1. Crée le compte (sans mot de passe) — ou le retrouve s'il existe déjà.
  let newId: string | undefined;
  const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr) {
    const { data: existing } = await ctx.supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    newId = existing?.id;
  } else {
    newId = createdUser.user?.id;
  }
  if (!newId) {
    return { ok: false, message: `Compte impossible${createErr ? " : " + createErr.message : ""}.` };
  }

  // 2. Rôle étudiant + nom + coordonnées.
  await ctx.supabase
    .from("profiles")
    .update({
      role: "etudiant",
      full_name: fullName,
      phone: str(formData, "phone") || null,
      whatsapp: str(formData, "whatsapp") || null,
      personal_email: str(formData, "personal_email") || null,
      school_email: str(formData, "school_email") || null,
    })
    .eq("id", newId);

  // 3. Affectation à une classe (optionnelle).
  if (classId) {
    await ctx.supabase
      .from("class_members")
      .upsert({ class_id: classId, student_id: newId }, { onConflict: "student_id" });
  }

  // 4. Frais : tarif de la classe prioritaire, sinon tarif du niveau.
  const [{ data: settings }, lvlRes, classRes] = await Promise.all([
    ctx.supabase.from("finance_settings").select("registration_fee, academic_year").eq("id", 1).maybeSingle(),
    level
      ? ctx.supabase.from("tuition_levels").select("amount").eq("level", level).maybeSingle()
      : Promise.resolve({ data: null }),
    classId
      ? ctx.supabase.from("classes").select("name, tuition_amount").eq("id", classId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const registrationFee = Number(settings?.registration_fee ?? 300000);
  const classTuition = classRes?.data?.tuition_amount;
  const className = classRes?.data?.name ?? null;
  const tuitionDue = classTuition != null ? Number(classTuition) : Number(lvlRes?.data?.amount ?? 0);
  const discountRate = discountPct / 100; // réduction sur la scolarité uniquement
  const tuitionNet = Math.round(tuitionDue * (1 - discountRate));
  const totalDue = registrationFee + tuitionNet;

  // 5. Report déjà payé : on impute d'abord l'inscription, puis la scolarité.
  const paidInscription = Math.min(paidAmount, registrationFee);
  const paidScolarite = Math.max(0, paidAmount - registrationFee);
  const registrationSettled = registrationFee > 0 ? paidInscription >= registrationFee : true;

  await ctx.supabase.from("student_finance").upsert(
    {
      student_id: newId,
      registration_fee: registrationFee,
      tuition_due: tuitionDue,
      discount_rate: discountRate,
      level: level || null,
      program: program || null,
      academic_year: settings?.academic_year ?? null,
      total_due: totalDue,
      access_state: registrationSettled ? "actif" : "pause",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" }
  );

  if (paidAmount > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const rowsToInsert: Record<string, unknown>[] = [];
    if (paidInscription > 0)
      rowsToInsert.push({
        student_id: newId,
        amount: paidInscription,
        method: "Report",
        kind: "inscription",
        label: "Report antérieur",
        paid_at: today,
      });
    if (paidScolarite > 0)
      rowsToInsert.push({
        student_id: newId,
        amount: paidScolarite,
        method: "Report",
        kind: "scolarite",
        label: "Report antérieur",
        paid_at: today,
      });
    if (rowsToInsert.length) await ctx.supabase.from("payments").insert(rowsToInsert);
  }

  // 6. Lien « définir mon mot de passe » + email (Resend).
  let emailed = 0;
  if (sendEmail && canSendEmail) {
    let actionLink = `${SITE_URL}/mot-de-passe-oublie`;
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/definir-mot-de-passe` },
    });
    if (linkData?.properties?.action_link) actionLink = linkData.properties.action_link;

    const balance = totalDue - paidAmount;
    const rows = buildRows([
      ["Classe / cohorte", className || "—"],
      ["Niveau", level || "—"],
      ["Formation", program || "—"],
      ["Total dû", formatFCFA(totalDue)],
      ["Déjà payé (report antérieur)", formatFCFA(paidAmount)],
      ["Reste à payer", balance <= 0 ? "Soldé" : formatFCFA(balance)],
    ]);
    const html = emailDocument(
      "Votre espace IPMD",
      `<p>Bonjour ${fullName},</p>
       <p>Votre compte étudiant IPMD est prêt. Voici votre situation :</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
       <p style="margin-top:16px"><a href="${actionLink}" style="display:inline-block;background:#e01228;color:#fff;text-decoration:none;padding:10px 18px;border-radius:9999px;font-weight:600">Définir mon mot de passe</a></p>
       <p style="color:#9ca3af;font-size:12px;margin-top:8px">Pour toute question : scolarite@ipmd.pro</p>`
    );
    emailed = await sendScolariteEmail([email], "IPMD — Votre espace étudiant", html);
  }

  revalidatePath("/espace/finance");
  revalidatePath("/espace/utilisateurs");
  const balance = totalDue - paidAmount;
  return {
    ok: true,
    message:
      `Étudiant repris : ${fullName}. Reste à payer ${balance <= 0 ? "0 (soldé)" : formatFCFA(balance)}.` +
      (sendEmail ? (emailed > 0 ? " Email envoyé." : " (Email non envoyé.)") : ""),
  };
}

export type ImportStudent = {
  fullName: string;
  email: string;
  phone?: string;
  level?: string;
  program?: string;
  role?: string; // "etudiant" | "professionnel"
  totalDue?: number; // depuis la facture (montant total)
  paidAmount?: number; // déjà payé = montant − solde
  payments?: {
    amount: number;
    method?: string;
    reference?: string;
    label?: string;
    date?: string; // ISO yyyy-mm-dd
    kind?: "inscription" | "scolarite";
  }[];
};

/**
 * Import en masse d'anciens étudiants (depuis un export type Zoho).
 * Crée/retrouve le compte, applique rôle + coordonnées + niveau/formation,
 * et ouvre un dossier financier (accès en pause, sans paiement). Pas d'email.
 * (Super Admin)
 */
export async function importReturningStudents(
  students: ImportStudent[]
): Promise<{ ok: boolean; message: string; created: number; updated: number; skipped: number; errors: string[] }> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Réservé au Super Admin.", created: 0, updated: 0, skipped: 0, errors: [] };
  if (!canAdminUsers) {
    return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY manquante.", created: 0, updated: 0, skipped: 0, errors: [] };
  }
  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service indisponible.", created: 0, updated: 0, skipped: 0, errors: [] };

  const [{ data: settings }, { data: levels }] = await Promise.all([
    ctx.supabase.from("finance_settings").select("registration_fee, academic_year").eq("id", 1).maybeSingle(),
    ctx.supabase.from("tuition_levels").select("level, amount"),
  ]);
  const registrationFee = Number(settings?.registration_fee ?? 300000);
  const tuitionByLevel = new Map((levels ?? []).map((l) => [l.level as string, Number(l.amount ?? 0)]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of students) {
    const email = (s.email || "").trim().toLowerCase();
    const fullName = (s.fullName || "").trim();
    if (!email || !email.includes("@") || !fullName) {
      skipped++;
      continue;
    }
    const role = s.role === "professionnel" ? "professionnel" : "etudiant";
    try {
      let newId: string | undefined;
      const { error: createErr, data: createdUser } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createErr) {
        const { data: existing } = await ctx.supabase.from("profiles").select("id").eq("email", email).maybeSingle();
        newId = existing?.id;
        if (newId) updated++;
      } else {
        newId = createdUser.user?.id;
        if (newId) created++;
      }
      if (!newId) {
        errors.push(`${fullName} (${email}) : compte impossible`);
        continue;
      }

      await ctx.supabase
        .from("profiles")
        .update({
          role,
          full_name: fullName,
          phone: s.phone || null,
          whatsapp: s.phone || null,
          personal_email: email,
        })
        .eq("id", newId);

      const level = (s.level || "").trim();
      const today = new Date().toISOString().slice(0, 10);
      // Si la facture fournit le montant, il fait foi (= total dû) ; sinon tarif du niveau.
      const hasInvoice = typeof s.totalDue === "number" && s.totalDue > 0;
      const totalDue = hasInvoice
        ? Number(s.totalDue)
        : registrationFee + (level ? tuitionByLevel.get(level) ?? 0 : 0);
      const tuitionDue = Math.max(0, totalDue - registrationFee);

      // Paiements détaillés (vrai journal) si fournis, sinon report global depuis le solde.
      const detailed = s.payments && s.payments.length ? s.payments : null;
      let paidInscription = 0;
      let paidScolarite = 0;
      if (detailed) {
        for (const p of detailed) {
          if (p.kind === "inscription") paidInscription += Number(p.amount) || 0;
          else paidScolarite += Number(p.amount) || 0;
        }
      } else {
        const paid = typeof s.paidAmount === "number" ? Math.max(0, s.paidAmount) : 0;
        paidInscription = Math.min(paid, registrationFee);
        paidScolarite = Math.max(0, paid - registrationFee);
      }
      const paidTotal = paidInscription + paidScolarite;
      const registrationSettled = registrationFee > 0 ? paidInscription >= registrationFee : true;

      await ctx.supabase.from("student_finance").upsert(
        {
          student_id: newId,
          registration_fee: registrationFee,
          tuition_due: tuitionDue,
          discount_rate: 0,
          level: level || null,
          program: s.program || null,
          academic_year: settings?.academic_year ?? null,
          total_due: totalDue,
          access_state: registrationSettled && paidTotal > 0 ? "actif" : "pause",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" }
      );

      // Idempotent : on retire les paiements précédemment importés.
      await ctx.supabase.from("payments").delete().eq("student_id", newId).eq("observation", "Import Zoho");
      await ctx.supabase.from("payments").delete().eq("student_id", newId).eq("label", "Report antérieur");

      if (detailed) {
        const toInsert = detailed
          .filter((p) => Number(p.amount) > 0)
          .map((p) => ({
            student_id: newId,
            amount: Number(p.amount),
            method: p.method || "Report",
            kind: p.kind === "inscription" ? "inscription" : "scolarite",
            reference: p.reference || null,
            label: p.label || null,
            paid_at: p.date || today,
            observation: "Import Zoho",
          }));
        if (toInsert.length) await ctx.supabase.from("payments").insert(toInsert);
      } else if (paidTotal > 0) {
        const toInsert: Record<string, unknown>[] = [];
        if (paidInscription > 0)
          toInsert.push({ student_id: newId, amount: paidInscription, method: "Report", kind: "inscription", label: "Report antérieur", paid_at: today });
        if (paidScolarite > 0)
          toInsert.push({ student_id: newId, amount: paidScolarite, method: "Report", kind: "scolarite", label: "Report antérieur", paid_at: today });
        if (toInsert.length) await ctx.supabase.from("payments").insert(toInsert);
      }
    } catch (e) {
      errors.push(`${fullName} : ${e instanceof Error ? e.message : "erreur"}`);
    }
  }

  revalidatePath("/espace/etudiants");
  revalidatePath("/espace/finance");
  return {
    ok: true,
    message: `${created} créé(s), ${updated} mis à jour, ${skipped} ignoré(s) (sans email).`,
    created,
    updated,
    skipped,
    errors,
  };
}
