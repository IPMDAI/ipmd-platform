"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  buildRows,
  emailLayout,
  sendNotification,
} from "@/lib/email";
import type { FormResult, UniverseId } from "@/types";
import { universes } from "@/data/universes";

// Type d'univers (diplome vs certificat/bootcamp) pour n'exiger les pièces
// que sur les demandes diplômantes.
const kindByUniverse: Record<string, string> = Object.fromEntries(
  universes.map((u) => [u.id, u.kind])
);

/**
 * Server Actions des formulaires publics.
 *
 * Tant que Supabase n'est pas configuré, ces actions valident les données et
 * renvoient un succès « démo » sans rien persister. Une fois les tables créées
 * (voir README), elles écrivent dans `inscription_requests` / `contact_messages`.
 */

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitInscription(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const fullName =
    `${getString(formData, "lastName")} ${getString(formData, "firstName")}`.trim() ||
    getString(formData, "fullName");
  const payload = {
    full_name: fullName,
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    whatsapp: getString(formData, "whatsapp") || null,
    universe: getString(formData, "universe") as UniverseId,
    program_interest: getString(formData, "programInterest"),
    entry_level: getString(formData, "entryLevel") || null,
    desired_role:
      ["etudiant", "professionnel", "dirigeant", "parent"].includes(
        getString(formData, "profile")
      )
        ? getString(formData, "profile")
        : null,
    last_education: getString(formData, "lastEducation") || null,
    last_diploma: getString(formData, "lastDiploma") || null,
    message: getString(formData, "message") || null,
    // Pièces : chemins déjà uploadés côté navigateur (Storage direct).
    doc_diploma: getString(formData, "docDiplomaPath") || null,
    doc_bulletins: getString(formData, "docBulletinsPaths") || null,
    doc_id: getString(formData, "docIdPath") || null,
    doc_attestation: getString(formData, "docAttestationPath") || null,
  };

  if (!payload.full_name || !payload.email || !payload.phone) {
    return { ok: false, message: "Merci de renseigner nom, email et téléphone." };
  }
  if (!isValidEmail(payload.email)) {
    return { ok: false, message: "L'adresse email semble invalide." };
  }

  // Demande diplômante : le dernier diplôme ET la pièce d'identité sont
  // obligatoires (double sécurité : le navigateur bloque déjà l'envoi si
  // l'upload d'une pièce obligatoire échoue). Les bootcamps n'en exigent pas.
  if (
    isSupabaseConfigured &&
    kindByUniverse[payload.universe] === "diplome" &&
    (!payload.doc_diploma || !payload.doc_id)
  ) {
    return {
      ok: false,
      message:
        "Le dernier diplôme et la pièce d'identité sont obligatoires. Merci de les joindre (PDF, JPG ou PNG, 15 Mo max par fichier) avant d'envoyer votre demande.",
    };
  }

  if (!isSupabaseConfigured) {
    return {
      ok: true,
      message:
        "Demande enregistrée (mode démo). Configurez Supabase pour l'envoi réel.",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }

  // Anti-doublon : une demande non traitée existe déjà pour cet email/téléphone ?
  const { data: pending } = await supabase.rpc("has_pending_inscription", {
    p_email: payload.email,
    p_phone: payload.phone,
  });
  if (pending === true) {
    return {
      ok: false,
      code: "duplicate",
      message:
        "Votre demande d'inscription a déjà été enregistrée. Elle est actuellement en cours d'étude. Vous recevrez une réponse dans un délai de 24 heures.",
    };
  }

  // RENTRÉE (Lot 2) — les demandes diplômantes se rattachent à une rentrée OUVERTE.
  // L'année académique est DÉRIVÉE de la rentrée (jamais de finance_settings),
  // et la rentrée est revalidée « open » côté serveur (anti-tampering / fraîcheur).
  let intakeId: string | null = null;
  let academicYear: string | null = null;
  let filiereId: string | null = null;
  let offeredLevel: string | null = null;
  if (kindByUniverse[payload.universe] === "diplome") {
    intakeId = getString(formData, "intakeId") || null;
    if (!intakeId) {
      return {
        ok: false,
        message:
          "Veuillez choisir une rentrée pour votre inscription. Si aucune n'est proposée, les inscriptions ne sont pas ouvertes pour le moment.",
      };
    }
    const { data: intake } = await supabase
      .from("intakes")
      .select("academic_year, status")
      .eq("id", intakeId)
      .maybeSingle();
    if (!intake || intake.status !== "open") {
      return {
        ok: false,
        message:
          "La rentrée choisie n'est plus ouverte. Merci de rafraîchir la page et de sélectionner une rentrée disponible.",
      };
    }
    academicYear = intake.academic_year as string;

    // GARDE D'OFFRE (Lot 2.5) : la formation choisie doit être une offre OUVERTE
    // de CETTE rentrée. On ne se fie pas au libellé texte program_interest.
    filiereId = getString(formData, "filiereId") || null;
    offeredLevel = getString(formData, "offeredLevel") || null;
    if (!filiereId || !offeredLevel) {
      return {
        ok: false,
        message: "Veuillez choisir une formation (filière + niveau) proposée pour cette rentrée.",
      };
    }
    const { data: offer } = await supabase
      .from("intake_offerings")
      .select("id")
      .eq("intake_id", intakeId)
      .eq("filiere_id", filiereId)
      .eq("level", offeredLevel)
      .eq("status", "open")
      .maybeSingle();
    if (!offer) {
      return {
        ok: false,
        message:
          "La formation choisie n'est pas ouverte pour cette rentrée. Merci de rafraîchir la page et de sélectionner une formation proposée.",
      };
    }
  }

  // Colonnes optionnelles ajoutées seulement si présentes, pour rester compatible
  // même si les migrations (candidature-cv.sql / candidature-mode.sql) ne sont pas
  // encore exécutées.
  const insertData: Record<string, unknown> = { ...payload };
  // Rentrée + année figées au dépôt (les deux ensemble, jamais l'une sans l'autre).
  if (intakeId && academicYear) {
    insertData.intake_id = intakeId;
    insertData.academic_year = academicYear;
  }
  // Formation figée (filière + niveau de l'offre) → cohérence académique à l'admission.
  if (filiereId && offeredLevel) {
    insertData.filiere_id = filiereId;
    insertData.offered_level = offeredLevel;
  }
  const docCv = getString(formData, "docCvPath");
  if (docCv) insertData.doc_cv = docCv;
  const mode = getString(formData, "mode");
  if (mode) insertData.mode = mode;
  const birthDate = getString(formData, "birthDate");
  if (birthDate) insertData.birth_date = birthDate;
  const birthPlace = getString(formData, "birthPlace");
  if (birthPlace) insertData.birth_place = birthPlace;

  // Insertion (les pièces sont déjà uploadées côté navigateur ; on ne stocke
  // que leurs chemins → corps léger, pas de relecture RLS nécessaire).
  const { error } = await supabase.from("inscription_requests").insert(insertData);
  if (error) {
    return { ok: false, message: "Une erreur est survenue. Merci de réessayer." };
  }

  // Notification email (best-effort, ne bloque pas la réponse).
  await sendNotification(
    `Nouvelle inscription — ${payload.full_name}`,
    emailLayout(
      "Nouvelle demande d'inscription",
      buildRows([
        ["Nom", payload.full_name],
        ["Email", payload.email],
        ["Téléphone", payload.phone],
        ["Univers", payload.universe],
        ["Formation", payload.program_interest],
        ["Niveau", payload.entry_level],
        ["Message", payload.message],
      ])
    ),
    payload.email
  );

  return {
    ok: true,
    message:
      "Félicitations, votre demande d'inscription a bien été reçue. Votre dossier sera analysé par notre équipe et vous recevrez une réponse dans un délai de 24 heures.",
  };
}

export async function submitContact(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  // Honeypot : champ invisible. Rempli => bot. On simule le succès sans rien enregistrer.
  const SPAM_OK = { ok: true, message: "Merci ! Votre message a bien été envoyé." };
  if (getString(formData, "website")) {
    return SPAM_OK;
  }

  const payload = {
    full_name: getString(formData, "fullName"),
    email: getString(formData, "email"),
    subject: getString(formData, "subject"),
    message: getString(formData, "message"),
  };

  if (!payload.full_name || !payload.email || !payload.message) {
    return { ok: false, message: "Merci de renseigner nom, email et message." };
  }
  if (!isValidEmail(payload.email)) {
    return { ok: false, message: "L'adresse email semble invalide." };
  }

  // Garde anti-spam : un message contenant beaucoup de liens est presque toujours du spam.
  const linkCount = (
    `${payload.subject} ${payload.message}`.match(
      /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|cc|ly|biz|info|xyz|shop)\b/gi
    ) ?? []
  ).length;
  if (linkCount >= 3) {
    return SPAM_OK;
  }

  if (!isSupabaseConfigured) {
    return {
      ok: true,
      message: "Message envoyé (mode démo). Configurez Supabase pour l'envoi réel.",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }

  const { error } = await supabase.from("contact_messages").insert(payload);
  if (error) {
    return { ok: false, message: "Une erreur est survenue. Merci de réessayer." };
  }

  // Notification email (best-effort, ne bloque pas la réponse).
  await sendNotification(
    `Nouveau message — ${payload.full_name}`,
    emailLayout(
      "Nouveau message de contact",
      buildRows([
        ["Nom", payload.full_name],
        ["Email", payload.email],
        ["Sujet", payload.subject],
        ["Message", payload.message],
      ])
    ),
    payload.email
  );

  return { ok: true, message: "Merci ! Votre message a bien été envoyé." };
}
