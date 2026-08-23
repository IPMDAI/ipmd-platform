"use server";

import { createClient } from "@/lib/supabase/server";
import { sendCandidatureConfirmation } from "@/lib/candidature-emails";

/**
 * Envoi réel d'une candidature depuis le wizard /admission/wizard.
 *
 * ⚠️ Toute l'intégrité (revalidation live de l'offre, validation des pièces
 * `required`, création atomique request + documents + miroir legacy) est faite
 * côté base par la RPC transactionnelle `submit_candidature` (SECURITY DEFINER).
 * Cette action ne fait qu'assembler le payload et transmettre le résultat.
 */

export type WizardSubmitPayload = {
  universe: string;
  identity: {
    last_name: string;
    first_name: string;
    email: string;
    phone: string;
    whatsapp: string;
    birth_date: string;
    birth_place: string;
    birth_country: string;
    phone_country: string;
    whatsapp_country: string;
  };
  background: {
    last_level: string;
    last_diploma: string;
    graduation_year: string;
    institution: string;
    current_situation: string;
    /** Profil professionnel (variante « pro »). */
    professional_status: string;
    current_position: string;
    organization: string;
    sector: string;
    experience_years: string;
    /** Champs SeniorsHub (facultatifs) — persistés côté RPC uniquement si universe='seniorshub'. */
    senior_expertise: string;
    senior_goal: string;
  };
  project: {
    campus_intake_id: string;
    campus_offering_key: string;
    /** Offre Pro non ambiguë (session × niveau × filière) → RPC v4. */
    catalog_offering_id: string;
    pro_offering_id: string;
    exec_offering_id: string;
    cert_item_id: string;
    /** Campus (Étape 3) — persistés côté RPC v8 uniquement si universe='campus'. */
    motivation_formation: string;
    referral_source: string;
    referral_other: string;
    motivation_ipmd: string;
    partner_abroad: string;
  };
  /** Mode de formation (FORMATION_MODES) — persisté dans inscription_requests.mode. */
  mode: string;
  /** Aplati depuis `Record<doc_key, path[]>` côté client. */
  documents: { doc_key: string; path: string }[];
};

export type WizardSubmitResult =
  | { ok: true; requestId: string }
  | { ok: false; code: WizardErrorCode; message: string };

export type WizardErrorCode =
  | "OFFRE_FERMEE"
  | "PROGRAMME_FERME"
  | "PIECES_MANQUANTES"
  | "PIECE_TROP_NOMBREUSE"
  | "DOC_HORS_PROFIL"
  | "CHEMIN_VIDE"
  | "IDENTITE_INCOMPLETE"
  | "UNIVERS_INVALIDE"
  | "STATUT_PRO_MANQUANT"
  | "STATUT_PRO_INVALIDE"
  | "POSTE_MANQUANT"
  | "FONCTION_MANQUANTE"
  | "CERT_TIER_MANQUANT"
  | "NIVEAU_INVALIDE"
  | "PRIX_MANQUANT"
  | "EXPERIENCE_INVALIDE"
  | "MOTIVATION_FORMATION_MANQUANTE"
  | "MOTIVATION_FORMATION_TROP_LONGUE"
  | "MOTIVATION_IPMD_MANQUANTE"
  | "MOTIVATION_IPMD_TROP_LONGUE"
  | "REFERRAL_MANQUANT"
  | "REFERRAL_AUTRE_MANQUANT"
  | "REFERRAL_AUTRE_TROP_LONG"
  | "PARTENAIRE_MANQUANT"
  | "SERVICE_INDISPONIBLE"
  | "ERREUR";

// Messages métier lisibles par le candidat (le détail technique reste au log).
const MESSAGES: Record<WizardErrorCode, string> = {
  OFFRE_FERMEE:
    "La formation choisie n'est plus ouverte. Revenez à l'étape « Projet » pour en sélectionner une autre.",
  PROGRAMME_FERME:
    "Le programme choisi n'est plus ouvert. Revenez à l'étape « Projet » pour en sélectionner un autre.",
  PIECES_MANQUANTES:
    "Certaines pièces obligatoires sont manquantes. Revenez à l'étape « Pièces justificatives ».",
  PIECE_TROP_NOMBREUSE:
    "Vous avez joint trop de fichiers pour une pièce. Revenez à l'étape « Pièces justificatives ».",
  STATUT_PRO_MANQUANT:
    "Votre situation professionnelle est obligatoire. Revenez à l'étape « Parcours actuel ».",
  STATUT_PRO_INVALIDE:
    "La situation professionnelle sélectionnée est invalide. Revenez à l'étape « Parcours actuel ».",
  POSTE_MANQUANT:
    "Votre fonction / poste actuel est obligatoire. Revenez à l'étape « Parcours actuel ».",
  FONCTION_MANQUANTE:
    "Votre fonction actuelle / responsabilités est obligatoire. Revenez à l'étape « Parcours actuel ».",
  CERT_TIER_MANQUANT:
    "Cette formation n'est pas encore disponible. Revenez à l'étape « Projet » pour en choisir une autre.",
  NIVEAU_INVALIDE:
    "Le niveau visé est invalide. Revenez à l'étape « Projet » pour le resélectionner.",
  PRIX_MANQUANT:
    "Le tarif de cette offre n'est pas disponible. Réessayez ; si le problème persiste, contactez l'IPMD.",
  EXPERIENCE_INVALIDE:
    "Le nombre d'années d'expérience est invalide. Revenez à l'étape « Parcours actuel ».",
  MOTIVATION_FORMATION_MANQUANTE:
    "Indiquez pourquoi vous avez choisi cette formation. Revenez à l'étape « Projet ».",
  MOTIVATION_FORMATION_TROP_LONGUE:
    "Votre réponse « pourquoi cette formation » dépasse 500 caractères. Revenez à l'étape « Projet ».",
  MOTIVATION_IPMD_MANQUANTE:
    "Indiquez pourquoi vous souhaitez intégrer l'IPMD. Revenez à l'étape « Projet ».",
  MOTIVATION_IPMD_TROP_LONGUE:
    "Votre réponse « pourquoi l'IPMD » dépasse 500 caractères. Revenez à l'étape « Projet ».",
  REFERRAL_MANQUANT:
    "Indiquez comment vous avez connu l'IPMD. Revenez à l'étape « Projet ».",
  REFERRAL_AUTRE_MANQUANT:
    "Précisez comment vous avez connu l'IPMD (« Autre »). Revenez à l'étape « Projet ».",
  REFERRAL_AUTRE_TROP_LONG:
    "Votre précision « Autre » est trop longue. Revenez à l'étape « Projet ».",
  PARTENAIRE_MANQUANT:
    "Indiquez si vous envisagez une poursuite à l'étranger (Oui/Non). Revenez à l'étape « Projet ».",
  DOC_HORS_PROFIL:
    "Un document ne correspond pas au dossier attendu. Revenez à l'étape « Pièces justificatives ».",
  CHEMIN_VIDE: "Un fichier n'a pas été correctement téléversé. Réessayez le dépôt de vos pièces.",
  IDENTITE_INCOMPLETE: "Vos informations d'identité sont incomplètes. Revenez à l'étape « Identité ».",
  UNIVERS_INVALIDE: "Le parcours choisi est invalide. Reprenez depuis l'étape « Parcours IPMD ».",
  SERVICE_INDISPONIBLE: "Service momentanément indisponible. Réessayez dans un instant.",
  ERREUR: "Une erreur est survenue lors de l'envoi. Réessayez ; si le problème persiste, contactez l'IPMD.",
};

/** Extrait un code métier connu depuis le message d'erreur Postgres. */
function codeFromError(msg: string): WizardErrorCode {
  const known: WizardErrorCode[] = [
    "OFFRE_FERMEE",
    "PROGRAMME_FERME",
    "PIECES_MANQUANTES",
    "PIECE_TROP_NOMBREUSE",
    "DOC_HORS_PROFIL",
    "CHEMIN_VIDE",
    "IDENTITE_INCOMPLETE",
    "UNIVERS_INVALIDE",
    "STATUT_PRO_MANQUANT",
    "STATUT_PRO_INVALIDE",
    "POSTE_MANQUANT",
    "FONCTION_MANQUANTE",
    "CERT_TIER_MANQUANT",
    "NIVEAU_INVALIDE",
    "PRIX_MANQUANT",
    "EXPERIENCE_INVALIDE",
    "MOTIVATION_FORMATION_MANQUANTE",
    "MOTIVATION_FORMATION_TROP_LONGUE",
    "MOTIVATION_IPMD_MANQUANTE",
    "MOTIVATION_IPMD_TROP_LONGUE",
    "REFERRAL_MANQUANT",
    "REFERRAL_AUTRE_MANQUANT",
    "REFERRAL_AUTRE_TROP_LONG",
    "PARTENAIRE_MANQUANT",
  ];
  return known.find((c) => msg.includes(c)) ?? "ERREUR";
}

export async function submitWizardCandidature(
  payload: WizardSubmitPayload,
): Promise<WizardSubmitResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, code: "SERVICE_INDISPONIBLE", message: MESSAGES.SERVICE_INDISPONIBLE };
  }

  const { data, error } = await supabase.rpc("submit_candidature", { p_payload: payload });

  if (error) {
    const code = codeFromError(error.message ?? "");
    return { ok: false, code, message: MESSAGES[code] };
  }
  if (!data || typeof data !== "string") {
    return { ok: false, code: "ERREUR", message: MESSAGES.ERREUR };
  }

  // Lot 1 — Confirmation candidat + notification staff (best-effort STRICT :
  // la fonction ne lève jamais ; le `.catch` est une ceinture supplémentaire).
  // La candidature est déjà enregistrée : aucun échec d'email ne doit la
  // transformer en erreur côté candidat.
  await sendCandidatureConfirmation(data).catch(() => {});

  return { ok: true, requestId: data };
}
