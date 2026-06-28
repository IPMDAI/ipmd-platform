/**
 * Agenda annuel — temps forts mensuels (gratuit & payant) par univers.
 * Chaque mois : un badge période, des événements, une fréquence et un horaire.
 *
 * 👉 Pour gérer l'agenda : modifier les tableaux ci-dessous.
 */
export type AgendaMonth = {
  month: string;
  /** Badge période, ex. « 10 au 20 ». */
  badge: string;
  /** Événements du mois (1 à 3 lignes). */
  events: string[];
  frequency: string;
  time: string;
};

export type Agenda = {
  eyebrow: string;
  title: string;
  intro: string;
  months: AgendaMonth[];
};

const FREQ = "Tous les mercredis du mois (entre le 10 et le 20)";
const TIME = "18h à 20h";
const BADGE = "10 au 20";

export const AGENDA_BY_UNIVERSE: Record<string, Agenda> = {
  ultrajobs: {
    eyebrow: "Agenda annuel",
    title: "UltraJobs — gratuit & payant",
    intro:
      "Chaque mois, deux temps forts entre le 10 et le 20, avec une récurrence hebdomadaire sur les mercredis. Horaires indicatifs : 18h – 20h (sous réserve de confirmation).",
    months: [
      { month: "Janvier", badge: BADGE, frequency: FREQ, time: TIME, events: ["Journée portes ouvertes — activités UltraJobs & partenaires", "Apéro Sip & Meet — transformation digitale & stratégie IA"] },
      { month: "Février", badge: BADGE, frequency: FREQ, time: TIME, events: ["Rencontres d'échange — business digital & IA", "Networking — entrepreneuriat"] },
      { month: "Mars", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — innovations digitales & IA", "Apéro Sip & Meet — droit numérique"] },
      { month: "Avril", badge: BADGE, frequency: FREQ, time: TIME, events: ["Hackathon — projets d'innovation", "Rencontres d'échange — nouvelles technologies"] },
      { month: "Mai", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — stratégie, IA & vente", "Afterwork — dîner d'affaires"] },
      { month: "Juin", badge: BADGE, frequency: FREQ, time: TIME, events: ["Networking — entrepreneuriat", "Rencontres d'échange — business digital"] },
      { month: "Juillet", badge: BADGE, frequency: FREQ, time: TIME, events: ["Hackathon — innovation & projets tech", "Apéro Sip & Meet — freelancing & IA"] },
      { month: "Août", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — digital & IA", "Networking — entrepreneuriat"] },
      { month: "Septembre", badge: BADGE, frequency: FREQ, time: TIME, events: ["Journée portes ouvertes — rentrée UltraJobs", "Rencontres d'échange — emploi & freelance"] },
      { month: "Octobre", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — personal branding & IA", "Afterwork — dîner d'affaires"] },
      { month: "Novembre", badge: BADGE, frequency: FREQ, time: TIME, events: ["Hackathon — projets d'innovation", "Networking — entrepreneuriat"] },
      { month: "Décembre", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — bilan & tendances IA", "Apéro Sip & Meet — networking de fin d'année"] },
    ],
  },
};

/** Renvoie l'agenda d'un univers (null si aucun). */
export function getAgenda(universeId: string): Agenda | null {
  return AGENDA_BY_UNIVERSE[universeId] ?? null;
}
