/**
 * Détail des programmes par niveau (Bac+1 → Bac+5), organisés en 2 semestres
 * (système LMD), + débouchés.
 *
 * 👉 POUR REMPLIR / MODIFIER UN PROGRAMME :
 *   - La clé est l'`id` de la formation (voir src/data/programs.ts), ex. "campus-marketing".
 *   - Chaque niveau a 2 semestres ; chaque semestre a sa liste de matières.
 *   - `outcomes` = la liste des débouchés (métiers, postes).
 *
 * ⚠️ Le contenu ci-dessous est un EXEMPLE à remplacer par le vrai programme IPMD.
 * Les formations sans entrée ici n'affichent simplement pas les boutons.
 */

export interface Semester {
  /** Nom, ex. "Semestre 1". */
  name: string;
  /** Matières / modules du semestre. */
  courses: string[];
}

export interface ProgramLevel {
  /** Niveau, ex. "Bac+1". */
  level: string;
  /** Intitulé de l'année, ex. "Licence 1 — Fondamentaux". */
  title: string;
  /** Les 2 semestres (LMD). */
  semesters: Semester[];
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
        semesters: [
          {
            name: "Semestre 1",
            courses: [
              "Introduction au marketing digital",
              "Bases du web et d'Internet",
              "Communication écrite et orale",
              "Outils bureautiques et collaboratifs",
              "Anglais professionnel 1",
            ],
          },
          {
            name: "Semestre 2",
            courses: [
              "Fondamentaux des réseaux sociaux",
              "Découverte du e-commerce",
              "Initiation au design graphique",
              "Culture digitale & veille",
              "Projet pratique : première campagne",
            ],
          },
        ],
      },
      {
        level: "Bac+2",
        title: "Licence 2 — Acquisition & contenu",
        semesters: [
          {
            name: "Semestre 1",
            courses: [
              "SEO — référencement naturel",
              "Création de contenu (rédaction web)",
              "Community management",
              "Email marketing",
              "Anglais professionnel 2",
            ],
          },
          {
            name: "Semestre 2",
            courses: [
              "SEA — publicité en ligne (Google Ads)",
              "Visuels & création graphique",
              "Analytics & mesure de performance",
              "Bases du marketing mobile",
              "Projet pratique : gestion de réseaux sociaux",
            ],
          },
        ],
      },
      {
        level: "Bac+3",
        title: "Licence 3 / Bachelor — Stratégie",
        semesters: [
          {
            name: "Semestre 1",
            courses: [
              "Stratégie de marketing digital",
              "Growth marketing & acquisition",
              "Marketing automation",
              "Data marketing & CRM",
            ],
          },
          {
            name: "Semestre 2",
            courses: [
              "E-commerce avancé",
              "Gestion de budget & ROI",
              "Marketing d'influence",
              "Stage / projet professionnel",
            ],
          },
        ],
      },
      {
        level: "Bac+4",
        title: "Master 1 — Pilotage & IA",
        semesters: [
          {
            name: "Semestre 1",
            courses: [
              "Stratégie omnicanale",
              "Marketing augmenté par l'IA",
              "Brand management",
              "Études de marché avancées",
            ],
          },
          {
            name: "Semestre 2",
            courses: [
              "Pilotage d'équipe marketing",
              "Marketing international",
              "Marketing automation avancé",
              "Projet d'entreprise",
            ],
          },
        ],
      },
      {
        level: "Bac+5",
        title: "Master 2 — Direction & innovation",
        semesters: [
          {
            name: "Semestre 1",
            courses: [
              "Direction de la stratégie digitale",
              "Innovation & transformation digitale",
              "Marketing prédictif & data science",
              "Leadership & management d'équipe",
            ],
          },
          {
            name: "Semestre 2",
            courses: [
              "Conduite de projet à l'échelle",
              "Stratégie & gouvernance digitale",
              "Mémoire professionnel",
              "Mission longue en entreprise",
            ],
          },
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
