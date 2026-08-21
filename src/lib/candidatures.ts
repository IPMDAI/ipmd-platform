/** Statuts du pipeline d'inscription (Lot A — machine à états v2). */
export const CANDIDATURE_STATUSES = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en_etude", label: "En étude" },
  { value: "pieces_a_completer", label: "Pièces à compléter" },
  { value: "entretien", label: "Entretien" },
  { value: "accepte", label: "Accepté" },
  { value: "refuse", label: "Refusé" },
  { value: "en_attente_paiement", label: "En attente de paiement" },
  { value: "inscrit", label: "Inscrit" },
] as const;

export const CANDIDATURE_STATUS_VALUES: string[] = CANDIDATURE_STATUSES.map(
  (s) => s.value
);

export const CANDIDATURE_LABEL: Record<string, string> = Object.fromEntries(
  CANDIDATURE_STATUSES.map((s) => [s.value, s.label])
);

/**
 * Transitions autorisées (machine à états, Lot A v2).
 *
 * Règles clés :
 * - Aucune décision (accepte/refuse) sans passer par `en_etude` (ou `entretien`,
 *   lui-même atteint depuis `en_etude`).
 * - Aucune bascule directe `accepte ↔ refuse` : toute révision repasse par `en_etude`.
 * - `en_attente_paiement` n'est atteint QUE via l'action « Confirmer l'admission »
 *   (transition depuis `accepte`), jamais posé à la main.
 * - `inscrit` n'est posé QUE par « Créer & inviter ».
 * - `refuse` est verrouillé après envoi de la lettre ; réouverture exceptionnelle
 *   vers `en_etude` (confirmation UI + traçabilité conservée).
 */
export const CANDIDATURE_TRANSITIONS: Record<string, string[]> = {
  nouveau: ["en_etude", "pieces_a_completer"],
  pieces_a_completer: ["en_etude"],
  en_etude: ["pieces_a_completer", "entretien", "accepte", "refuse"],
  entretien: ["en_etude", "accepte", "refuse"],
  accepte: ["en_attente_paiement", "en_etude"],
  refuse: ["en_etude"],
  en_attente_paiement: ["inscrit", "en_etude"],
  inscrit: [],
};

/** Statuts posés uniquement par une action dédiée (jamais via les boutons de statut). */
export const RESERVED_TARGETS: string[] = ["en_attente_paiement", "inscrit"];

/** Une transition `from → to` est-elle permise par la machine à états ? */
export function canTransition(from: string, to: string): boolean {
  return (CANDIDATURE_TRANSITIONS[from] ?? []).includes(to);
}

/** Statuts « décision interne » (silencieux : aucun email en y passant). */
export function isDecision(status: string): boolean {
  return status === "accepte" || status === "refuse";
}

/**
 * Candidature « historique » : décidée sous l'ancien système (avant la refonte
 * du pipeline), donc jamais passée par les nouvelles actions d'envoi.
 * Détection : statut de décision + aucune date de décision enregistrée.
 */
export function isHistoricalDecision(
  status: string,
  decidedAt: string | null | undefined
): boolean {
  return isDecision(status) && !decidedAt;
}

export function candidatureBadgeClass(status: string): string {
  switch (status) {
    case "en_etude":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
    case "pieces_a_completer":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "entretien":
      return "bg-purple-50 text-purple-700 ring-1 ring-purple-200";
    case "accepte":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "refuse":
      return "bg-black/5 text-black/50 ring-1 ring-black/10";
    case "en_attente_paiement":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";
    case "inscrit":
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    default: // nouveau
      return "bg-ipmd-red/10 text-ipmd-red ring-1 ring-ipmd-red/20";
  }
}
