"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, canAdminUsers } from "@/lib/supabase/admin";
import {
  canSendEmail,
  emailDocument,
  escapeHtml,
  sendScolariteEmail,
} from "@/lib/email";
import type { FormResult } from "@/types";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro").replace(/\/$/, "");

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function requireSuperAdmin() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "super_admin") return null;
  return { supabase, userId: user.id };
}

/**
 * Donne l'accès à un ANCIEN (compte existant) : met son vrai email sur le MÊME
 * user_id, répare l'identité de connexion si absente, et envoie un lien sécurisé
 * « définir mon mot de passe ». Ne crée aucun compte, ne touche ni scolarité ni
 * finance ni matricule. Pas de mot de passe provisoire affiché.
 */
export async function grantFormerAccess(
  profileId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  if (!canAdminUsers) {
    return { ok: false, message: "Non configuré (clé SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel)." };
  }

  const email = str(formData, "email").toLowerCase();
  if (!profileId) return { ok: false, message: "Dossier manquant." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Email invalide (ex. nom@domaine.com)." };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service indisponible." };

  // 1) Email Auth + profil + identité, sur le MÊME utilisateur (fonction définie côté DB).
  const { data, error } = await admin.rpc("grant_former_access", {
    p_user_id: profileId,
    p_new_email: email,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("email_taken"))
      return { ok: false, message: "Cet email est déjà utilisé par un autre compte." };
    if (m.includes("user_not_found")) return { ok: false, message: "Compte introuvable." };
    return { ok: false, message: m };
  }
  const info = (data ?? {}) as { old_email?: string; identity_repaired?: boolean };

  // 2) Lien sécurisé « définir mon mot de passe » (pas de mot de passe provisoire).
  let emailed = false;
  if (canSendEmail) {
    const { data: link } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/definir-mot-de-passe` },
    });
    const actionLink = link?.properties?.action_link;
    if (actionLink) {
      const n = await sendScolariteEmail(
        [email],
        "IPMD — Activez votre accès",
        emailDocument(
          "Votre accès à l'espace IPMD",
          `<p style="font-size:14px;color:#374151">Bonjour,</p>
           <p style="font-size:14px;color:#374151">Votre accès à votre espace IPMD a été réactivé. Définissez votre mot de passe pour vous connecter :</p>
           <p style="text-align:center;margin:24px 0"><a href="${actionLink}" style="background:#e4002b;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">Définir mon mot de passe</a></p>
           <p style="font-size:12px;color:#6b7280;word-break:break-all">Si le bouton ne fonctionne pas : ${escapeHtml(actionLink)}</p>`
        )
      );
      emailed = n > 0;
    }
  }

  // 3) Audit.
  await admin.from("former_access_grants").insert({
    profile_id: profileId,
    old_email: info.old_email ?? null,
    new_email: email,
    granted_by: ctx.userId,
    identity_repaired: !!info.identity_repaired,
  });

  revalidatePath("/espace/acces-ancien");
  return {
    ok: true,
    message:
      `Accès donné à ${email}.` +
      (info.identity_repaired ? " Identité de connexion réparée." : "") +
      (canSendEmail ? (emailed ? " Lien envoyé." : " (Email non envoyé.)") : ""),
  };
}
