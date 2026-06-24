"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, canAdminUsers } from "@/lib/supabase/admin";
import { VALID_ROLES } from "@/lib/dashboards";
import { formatFCFA } from "@/lib/finance";
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
    .select("full_name, email, universe, program_interest, entry_level")
    .eq("id", candidatureId)
    .single();
  if (!cand) return { ok: false, message: "Candidature introuvable." };

  const email = (cand.email || "").trim().toLowerCase();
  const fullName = (cand.full_name || "").trim();
  if (!email.includes("@")) return { ok: false, message: "Email invalide." };

  let role = str(formData, "role");
  if (!VALID_ROLES.includes(role)) role = "etudiant";
  const classId = str(formData, "class_id");

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
  await ctx.supabase
    .from("profiles")
    .update({ role, full_name: fullName, universe: cand.universe ?? null })
    .eq("id", newId);

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
  const level = str(formData, "level");
  const isStudent = role === "etudiant";
  let emailed = 0;
  let proformaBlock = "";

  if (isStudent) {
    const [{ data: settings }, lvlRes, classRes] = await Promise.all([
      ctx.supabase
        .from("finance_settings")
        .select("registration_fee, academic_year")
        .eq("id", 1)
        .maybeSingle(),
      level
        ? ctx.supabase.from("tuition_levels").select("amount").eq("level", level).maybeSingle()
        : Promise.resolve({ data: null }),
      classId
        ? ctx.supabase.from("classes").select("tuition_amount").eq("id", classId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const registrationFee = Number(settings?.registration_fee ?? 300000);
    // Tarif de la classe (Pro/Partenaire) prioritaire s'il est défini, sinon tarif du niveau.
    const classTuition = classRes?.data?.tuition_amount;
    const tuitionDue =
      classTuition != null ? Number(classTuition) : Number(lvlRes?.data?.amount ?? 0);
    const totalDue = registrationFee + tuitionDue;

    await ctx.supabase.from("student_finance").upsert(
      {
        student_id: newId,
        registration_fee: registrationFee,
        tuition_due: tuitionDue,
        discount_rate: 0,
        level: level || null,
        academic_year: settings?.academic_year ?? null,
        total_due: totalDue,
        // Accès en pause tant que les frais d'inscription ne sont pas réglés.
        access_state: "pause",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id" }
    );

    const rows = buildRows([
      ["Formation", cand.program_interest || "—"],
      ["Niveau accepté", level || cand.entry_level || "—"],
      ["Frais d'inscription", formatFCFA(registrationFee)],
      ["Frais de scolarité", formatFCFA(tuitionDue)],
      ["Total à régler", formatFCFA(totalDue)],
    ]);
    proformaBlock = `<p style="margin:0 0 12px">Voici votre facture proforma :</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
       <p style="margin:16px 0 0">Veuillez procéder à votre <strong>inscription définitive</strong> en réglant les frais d'inscription de <strong>${formatFCFA(registrationFee)}</strong> via Wave, versement / virement BACI ou AFG, ou chèque. Après le paiement, transmettez votre preuve de paiement au service de la scolarité pour validation.</p>`;
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
      emailed = await sendScolariteEmail([email], "IPMD — Dossier accepté & inscription", html);
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
