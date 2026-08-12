"use server";

import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDossierToken, dossierLinkUrl } from "@/lib/dossier-link";
import { sendEmailTo, emailDocument, escapeHtml, canSendEmail } from "@/lib/email";
import type { FormResult } from "@/types";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Enregistre les pièces déposées par un candidat via le lien signé
 * « Compléter mon dossier ». Les fichiers ont déjà été téléversés côté
 * navigateur (bucket candidature-docs) ; on ne persiste que leurs chemins,
 * après vérification du jeton. Écriture via service-role (le candidat n'est
 * pas authentifié).
 */
export async function completeDossier(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const token = str(formData, "token");
  const candidatureId = verifyDossierToken(token);
  if (!candidatureId) {
    return {
      ok: false,
      message:
        "Lien invalide ou expiré. Merci de demander un nouveau lien à l'IPMD.",
    };
  }

  const diploma = str(formData, "docDiplomaPath");
  const idDoc = str(formData, "docIdPath");
  const bulletins = str(formData, "docBulletinsPaths");

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }

  // La candidature existe-t-elle ? (et récupère l'état actuel des pièces)
  const { data: cand, error: readErr } = await admin
    .from("inscription_requests")
    .select("id, doc_diploma, doc_id")
    .eq("id", candidatureId)
    .maybeSingle();
  if (readErr || !cand) {
    return {
      ok: false,
      message: "Candidature introuvable. Merci de contacter l'IPMD.",
    };
  }

  // On complète : on n'écrase pas une pièce déjà présente si aucune nouvelle
  // n'est fournie. Au final, diplôme ET pièce d'identité doivent être présents.
  const finalDiploma = diploma || cand.doc_diploma || null;
  const finalId = idDoc || cand.doc_id || null;
  if (!finalDiploma || !finalId) {
    return {
      ok: false,
      message:
        "Le dernier diplôme et la pièce d'identité sont tous les deux obligatoires.",
    };
  }

  const update: Record<string, unknown> = {
    doc_diploma: finalDiploma,
    doc_id: finalId,
  };
  if (bulletins) update.doc_bulletins = bulletins;

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
      "Merci ! Votre dossier a bien été transmis à l'IPMD. Notre équipe reviendra vers vous.",
  };
}

/**
 * Envoie au candidat son lien unique « Compléter mon dossier ». Réservé aux
 * administrateurs. Renvoie un FormResult (affiché dans le tableau Candidatures).
 */
export async function sendDossierLink(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  await requireAdmin(); // redirige si non-admin

  const candidatureId = str(formData, "candidature_id");
  if (!candidatureId) return { ok: false, message: "Candidature manquante." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Service admin non configuré." };

  const { data: cand } = await admin
    .from("inscription_requests")
    .select("full_name, email")
    .eq("id", candidatureId)
    .maybeSingle();
  if (!cand?.email) {
    return { ok: false, message: "Ce candidat n'a pas d'email exploitable." };
  }
  if (!canSendEmail) {
    return {
      ok: false,
      message: "Envoi d'email non configuré (RESEND_API_KEY manquante).",
    };
  }

  const link = dossierLinkUrl(candidatureId);
  const prenom = (cand.full_name || "").split(" ")[0] || "Bonjour";
  const html = emailDocument(
    "Complétez votre dossier d'admission",
    `<p style="margin:0 0 12px;color:#0b0b0d;font-size:14px">Bonjour ${escapeHtml(
      prenom
    )},</p>
     <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6">
       Pour finaliser l'étude de votre demande d'admission à l'IPMD, merci de
       joindre votre <strong>dernier diplôme</strong> et votre
       <strong>pièce d'identité</strong> via le lien sécurisé ci-dessous
       (formats PDF, JPG ou PNG — 15 Mo max par fichier) :
     </p>
     <p style="margin:0 0 20px">
       <a href="${link}" style="display:inline-block;background:#e01228;color:#fff;
          text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;
          border-radius:9999px">Compléter mon dossier</a>
     </p>
     <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5">
       Ce lien vous est personnel. Si le bouton ne fonctionne pas, copiez cette
       adresse dans votre navigateur :<br/>${escapeHtml(link)}
     </p>`
  );

  const sent = await sendEmailTo(
    [cand.email],
    "IPMD — Complétez votre dossier d'admission",
    html
  );
  if (sent < 1) {
    return { ok: false, message: "L'email n'a pas pu être envoyé. Réessayez." };
  }
  return { ok: true, message: `Lien envoyé à ${cand.email}.` };
}
