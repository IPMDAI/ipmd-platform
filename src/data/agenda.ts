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

// SeniorsHub — en journée
const FREQ_SH = "Tous les jeudis du mois (entre le 10 et le 20)";
const TIME_SH = "14h à 16h";

// UltraExecutive — en soirée
const FREQ_EX = "Un rendez-vous par mois (entre le 10 et le 20)";
const TIME_EX = "18h à 21h";

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

  ultraboost: {
    eyebrow: "Agenda annuel",
    title: "UltraBoost — temps forts professionnels",
    intro:
      "Chaque mois, des rendez-vous pour les professionnels : masterclass, networking et veille. Horaires indicatifs : 18h – 20h (sous réserve de confirmation).",
    months: [
      { month: "Janvier", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — IA & productivité au travail", "Networking pro — leaders & experts"] },
      { month: "Février", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — data & prise de décision", "Rencontres d'échange — métiers du digital"] },
      { month: "Mars", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — automatisation & no-code", "Afterwork pro — dîner networking"] },
      { month: "Avril", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — marketing & IA", "Veille — outils & innovations"] },
      { month: "Mai", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — gestion de projet agile", "Networking pro — entrepreneuriat"] },
      { month: "Juin", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — leadership & management", "Rencontres d'échange — carrière"] },
      { month: "Juillet", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — finance & pilotage", "Afterwork pro — networking d'été"] },
      { month: "Août", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — IA générative en entreprise", "Veille — tendances du marché"] },
      { month: "Septembre", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — stratégie digitale", "Networking pro — rentrée"] },
      { month: "Octobre", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — personal branding", "Rencontres d'échange — reconversion"] },
      { month: "Novembre", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — cybersécurité pro", "Afterwork pro — networking"] },
      { month: "Décembre", badge: BADGE, frequency: FREQ, time: TIME, events: ["Masterclass — bilan & tendances IA", "Networking pro — fin d'année"] },
    ],
  },

  seniorshub: {
    eyebrow: "Agenda annuel",
    title: "SeniorsHub — rendez-vous & ateliers",
    intro:
      "Chaque mois, des ateliers et des rencontres conviviales pour apprendre à votre rythme. Horaires indicatifs : 14h – 16h (sous réserve de confirmation).",
    months: [
      { month: "Janvier", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier découverte — smartphone & internet", "Rencontre conviviale — café numérique"] },
      { month: "Février", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — messagerie & WhatsApp", "Rencontre — partage d'expérience"] },
      { month: "Mars", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — l'IA expliquée simplement", "Conférence — sécurité numérique"] },
      { month: "Avril", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — démarches administratives en ligne", "Rencontre conviviale — entraide"] },
      { month: "Mai", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — photos & souvenirs numériques", "Rencontre — transmission intergénérationnelle"] },
      { month: "Juin", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — réseaux sociaux en confiance", "Conférence — bien vivre le numérique"] },
      { month: "Juillet", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — voyages & services en ligne", "Rencontre conviviale — café d'été"] },
      { month: "Août", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — bureautique essentielle", "Rencontre — partage d'expérience"] },
      { month: "Septembre", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — l'IA au quotidien", "Rencontre conviviale — rentrée"] },
      { month: "Octobre", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — protéger ses comptes & arnaques", "Conférence — culture digitale"] },
      { month: "Novembre", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — créer & partager du contenu", "Rencontre — entraide & mentorat"] },
      { month: "Décembre", badge: BADGE, frequency: FREQ_SH, time: TIME_SH, events: ["Atelier — bilan & nouveautés", "Rencontre conviviale — fin d'année"] },
    ],
  },

  ultraexecutive: {
    eyebrow: "Agenda annuel",
    title: "UltraExecutive — agenda des dirigeants",
    intro:
      "Chaque mois, des rendez-vous d'exception pour dirigeants : cercles, keynotes et veille stratégique. Horaires indicatifs : 18h – 21h (sous réserve de confirmation).",
    months: [
      { month: "Janvier", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Cercle de dirigeants — vision & stratégie IA", "Keynote — prospective annuelle"] },
      { month: "Février", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Cercle de dirigeants — gouvernance des données", "Dîner C-level — networking"] },
      { month: "Mars", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Masterclass — transformation digitale", "Think tank — co-développement"] },
      { month: "Avril", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Cercle de dirigeants — leadership augmenté", "Keynote — innovation & marché"] },
      { month: "Mai", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Masterclass — IA & création de valeur", "Dîner C-level — networking"] },
      { month: "Juin", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Cercle de dirigeants — conduite du changement", "Think tank — défis sectoriels"] },
      { month: "Juillet", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Immersion résidentielle — stratégie & croissance", "Dîner C-level — networking d'été"] },
      { month: "Août", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Masterclass — IA générative & gouvernance", "Veille stratégique — tendances"] },
      { month: "Septembre", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Cercle de dirigeants — rentrée stratégique", "Keynote — cap sur l'année"] },
      { month: "Octobre", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Masterclass — finance & pilotage", "Think tank — co-développement"] },
      { month: "Novembre", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Cercle de dirigeants — cybersécurité & risques", "Dîner C-level — networking"] },
      { month: "Décembre", badge: BADGE, frequency: FREQ_EX, time: TIME_EX, events: ["Bilan stratégique & perspectives", "Gala de fin d'année — dirigeants"] },
    ],
  },
};

/** Renvoie l'agenda d'un univers (null si aucun). */
export function getAgenda(universeId: string): Agenda | null {
  return AGENDA_BY_UNIVERSE[universeId] ?? null;
}
