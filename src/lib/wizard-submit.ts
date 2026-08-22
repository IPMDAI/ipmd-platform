"use server";

import { createClient } from "@/lib/supabase/server";

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
  };
  background: {
    last_level: string;
    last_diploma: string;
    graduation_year: string;
    institution: string;
    current_situation: string;
  };
  project: {
    campus_intake_id: string;
    campus_offering_key: string;
    pro_offering_id: string;
    exec_offering_id: string;
    cert_item_id: string;
  };
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
  | "DOC_HORS_PROFIL"
  | "CHEMIN_VIDE"
  | "IDENTITE_INCOMPLETE"
  | "UNIVERS_INVALIDE"
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
    "DOC_HORS_PROFIL",
    "CHEMIN_VIDE",
    "IDENTITE_INCOMPLETE",
    "UNIVERS_INVALIDE",
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
  return { ok: true, requestId: data };
}
