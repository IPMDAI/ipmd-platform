/**
 * Détail des programmes par niveau (Bac+1 → Bac+5) + débouchés.
 *
 * 👉 POUR REMPLIR / MODIFIER UN PROGRAMME :
 *   - La clé est l'`id` de la formation (voir src/data/programs.ts), ex. "campus-marketing".
 *   - Pour chaque niveau : un titre + la liste des matières/modules.
 *   - `outcomes` = la liste des débouchés (métiers, postes).
 *
 * ⚠️ Le contenu ci-dessous est un EXEMPLE à remplacer par le vrai programme IPMD.
 * Les formations sans entrée ici n'affichent simplement pas les boutons.
 */

export interface ProgramLevel {
  /** Niveau, ex. "Bac+1". */
  level: string;
  /** Intitulé de l'année, ex. "Licence 1 — Fondamentaux". */
  title: string;
  /** Matières / modules du niveau. */
  courses: string[];
}

export interface ProgramDetail {
  levels: ProgramLevel[];
  /** Débouchés (métiers, postes). */
  outcomes: string[];
}

export const programDetails: Record<string, ProgramDetail> = {
  // ── EXEMPLE : Marketing digital (IPMD Campus) ──────────────
  "campus-marketing": {
    levels: [
      {
        level: "Bac+1",
        title: "Licence 1 — Fondamentaux du digital",
        courses: [
          "Introduction au marketing digital",
          "Bases du web et des réseaux sociaux",
          "Communication écrite et orale",
          "Outils bureautiques et collaboratifs",
          "Découverte du e-commerce",
          "Anglais professionnel",
          "Projet pratique : première campagne",
        ],
      },
      {
        level: "Bac+2",
        title: "Licence 2 — Acquisition & contenu",
        courses: [
          "SEO — référencement naturel",
          "SEA — publicité en ligne (Google Ads)",
          "Community management",
          "Création de contenu (rédaction web, visuels)",
          "Email marketing",
          "Analytics & mesure de performance",
          "Projet pratique : gestion de réseaux sociaux",
        ],
      },
      {
        level: "Bac+3",
        title: "Licence 3 / Bachelor — Stratégie",
        courses: [
          "Stratégie de marketing digital",
          "Growth marketing & acquisition",
          "Marketing automation",
          "E-commerce avancé",
          "Data marketing & CRM",
          "Gestion de budget & ROI",
          "Stage / projet professionnel",
        ],
      },
      {
        level: "Bac+4",
        title: "Master 1 — Pilotage & IA",
        courses: [
          "Stratégie omnicanale",
          "Marketing augmenté par l'IA",
          "Brand management",
          "Pilotage d'équipe marketing",
          "Marketing international",
          "Études de marché avancées",
          "Projet d'entreprise",
        ],
      },
      {
        level: "Bac+5",
        title: "Master 2 — Direction & innovation",
        courses: [
          "Direction de la stratégie digitale",
          "Innovation & transformation digitale",
          "Leadership & management d'équipe",
          "Marketing prédictif & data science",
          "Conduite de projet à l'échelle",
          "Mémoire professionnel",
          "Mission longue en entreprise",
        ],
      },
    ],
    outcomes: [
      "Chargé(e) de marketing digital",
      "Traffic manager (SEO / SEA)",
      "Community manager",
      "Growth marketer",
      "Chef(fe) de projet digital",
      "Responsable e-commerce",
      "Brand manager",
      "Consultant(e) en stratégie digitale",
      "Directeur(rice) marketing digital",
      "Entrepreneur(e) / freelance",
    ],
  },
};

export const getProgramDetail = (id: string): ProgramDetail | undefined =>
  programDetails[id];
