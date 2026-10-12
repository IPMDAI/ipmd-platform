/** Jours de la semaine pour l'emploi du temps (1 = Lundi). */
export const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

export const DAY_LABELS: Record<number, string> = Object.fromEntries(
  DAY_OPTIONS.map((d) => [d.value, d.label])
);

/** "08:00:00" → "08:00" */
export function formatTime(t: string | null): string {
  return t ? t.slice(0, 5) : "";
}

/** Statuts d'un créneau d'emploi du temps. */
export const SLOT_STATUSES = [
  { value: "prevu", label: "Prévu" },
  { value: "reporte", label: "Reporté" },
  { value: "annule", label: "Annulé" },
  { value: "termine", label: "Terminé" },
] as const;

export const SLOT_STATUS_VALUES: string[] = SLOT_STATUSES.map((s) => s.value);

export const SLOT_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  SLOT_STATUSES.map((s) => [s.value, s.label])
);

export function slotStatusClass(status: string): string {
  switch (status) {
    case "reporte":
      return "bg-amber-50 text-amber-700";
    case "annule":
      return "bg-ipmd-red/10 text-ipmd-red";
    case "termine":
      return "bg-green-50 text-green-700";
    default:
      return "bg-black/5 text-black/50"; // prévu
  }
}

/** Types de séance (nomenclature — miroir de la table session_types). */
export const SESSION_TYPES = [
  { value: "cours", label: "Cours" },
  { value: "td", label: "TD" },
  { value: "tp", label: "TP" },
  { value: "devoir_surveille", label: "Devoir surveillé" },
  { value: "controle_continu", label: "Contrôle continu" },
  { value: "examen", label: "Examen" },
  { value: "rattrapage", label: "Rattrapage" },
  { value: "atelier", label: "Atelier" },
  { value: "hackathon", label: "Hackathon" },
  { value: "journee_ipmd", label: "Journée IPMD" },
  { value: "recherche_terrain", label: "Recherche terrain" },
  { value: "projet", label: "Projet" },
  { value: "presentation", label: "Présentation" },
  { value: "soutenance", label: "Soutenance" },
] as const;
export const SESSION_TYPE_VALUES: string[] = SESSION_TYPES.map((t) => t.value);
export const SESSION_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  SESSION_TYPES.map((t) => [t.value, t.label])
);

/** Modalités (présentiel / distanciel). Obligatoire, pas de défaut. */
export const MODALITIES = [
  { value: "presentiel", label: "Présentiel" },
  { value: "distanciel", label: "Distanciel" },
] as const;
export const MODALITY_VALUES: string[] = MODALITIES.map((m) => m.value);
export const MODALITY_LABEL: Record<string, string> = Object.fromEntries(
  MODALITIES.map((m) => [m.value, m.label])
);
