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

/**
 * Rattachement à un module officiel de la maquette, selon le type de séance :
 *  - "required"  : un module actif DOIT être sélectionné (cours, td, examens…) ;
 *  - "optional"  : module possible (si choisi → liaison réelle), sinon intitulé libre ;
 *  - "none"      : hors module (ex. Journée IPMD) → intitulé libre, module_id NULL.
 */
export const MODULE_REQUIRED_TYPES: string[] = [
  "cours", "td", "tp", "devoir_surveille", "controle_continu", "examen",
  "rattrapage", "hackathon", "projet", "presentation", "soutenance",
];
export const MODULE_OPTIONAL_TYPES: string[] = ["atelier", "recherche_terrain"];
export function moduleRequirement(type: string): "required" | "optional" | "none" {
  if (MODULE_REQUIRED_TYPES.includes(type)) return "required";
  if (MODULE_OPTIONAL_TYPES.includes(type)) return "optional";
  return "none";
}

/** Modalités (présentiel / distanciel). Obligatoire, pas de défaut. */
export const MODALITIES = [
  { value: "presentiel", label: "Présentiel" },
  { value: "distanciel", label: "Distanciel" },
] as const;
export const MODALITY_VALUES: string[] = MODALITIES.map((m) => m.value);
export const MODALITY_LABEL: Record<string, string> = Object.fromEntries(
  MODALITIES.map((m) => [m.value, m.label])
);

/** Catégorie d'un type de séance (pour la couleur du badge). */
export const SESSION_TYPE_CATEGORY: Record<string, string> = {
  cours: "enseignement", td: "enseignement", tp: "enseignement",
  devoir_surveille: "evaluation", controle_continu: "evaluation", examen: "evaluation",
  rattrapage: "evaluation", presentation: "evaluation", soutenance: "evaluation",
  atelier: "pratique", hackathon: "pratique", recherche_terrain: "pratique", projet: "pratique",
  journee_ipmd: "evenement",
};

/** Classe de badge par catégorie (couleur + anneau ; le libellé reste affiché). */
export function typeBadgeClass(type: string): string {
  switch (SESSION_TYPE_CATEGORY[type]) {
    case "enseignement": return "bg-blue-50 text-blue-700 ring-blue-200";
    case "evaluation": return "bg-amber-50 text-amber-800 ring-amber-200";
    case "pratique": return "bg-green-50 text-green-700 ring-green-200";
    case "evenement": return "bg-purple-50 text-purple-700 ring-purple-200";
    default: return "bg-black/5 text-black/60 ring-black/10";
  }
}

/** Icône de modalité (en complément du libellé, jamais seule). */
export const MODALITY_ICON: Record<string, string> = {
  presentiel: "🏫",
  distanciel: "💻",
};

/** Types de jalons du calendrier académique (academic_calendar.kind). */
export const CALENDAR_KINDS = [
  { value: "rentree", label: "Rentrée" },
  { value: "examens_s1", label: "Examens S1" },
  { value: "examens_s2", label: "Examens S2" },
  { value: "presentations", label: "Présentations de projets" },
  { value: "soutenances", label: "Soutenances" },
  { value: "vacances", label: "Vacances" },
  { value: "stage_l2", label: "Stage L2" },
  { value: "stage_l3", label: "Stage L3" },
  { value: "hackathon", label: "Hackathon" },
  { value: "journee_ipmd", label: "Journée IPMD" },
] as const;
export const CALENDAR_KIND_VALUES: string[] = CALENDAR_KINDS.map((k) => k.value);
export const CALENDAR_KIND_LABEL: Record<string, string> = Object.fromEntries(
  CALENDAR_KINDS.map((k) => [k.value, k.label])
);
