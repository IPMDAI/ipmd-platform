/**
 * Détail des programmes par niveau (Bac+1 → Bac+5), organisés en 2 semestres
 * (système LMD), + débouchés.
 *
 * 👉 POUR REMPLIR / MODIFIER UN PROGRAMME :
 *   - La clé est l'`id` de la formation (voir src/data/programs.ts), ex. "campus-marketing".
 *   - Chaque niveau a 2 semestres ; chaque semestre a un `name` ("Semestre 1"),
 *     un `title` optionnel (thème de l'année) et la liste des matières.
 *   - `outcomes` = la liste des débouchés (métiers, postes).
 *
 * Convention IPMD : le 1er semestre de chaque niveau porte les enseignements
 * théoriques ; le 2e semestre est consacré à la stratégie, aux projets et au stage.
 */

export interface Semester {
  /** Nom, ex. "Semestre 1". */
  name: string;
  /** Intitulé / thème du semestre (optionnel). */
  title?: string;
  /** Matières / modules du semestre. */
  courses: string[];
}

export interface ProgramLevel {
  /** Niveau, ex. "Bac+1". */
  level: string;
  /** Intitulé de l'année, ex. "Licence 1". */
  title: string;
  /** Les 2 semestres (LMD). */
  semesters: Semester[];
}

export interface ProgramDetail {
  levels: ProgramLevel[];
  /** Débouchés (métiers, postes). */
  outcomes: string[];
}

/** Semestre « pratique » commun (stratégie, projets, stage). */
const practice = (courses: string[]): Semester => ({
  name: "",
  courses,
});

export const programDetails: Record<string, ProgramDetail> = {
  // ── Marketing digital (IPMD Campus) ────────────────────────
  "campus-marketing": {
    levels: [
      {
        level: "Bac+1",
        title: "Licence 1",
        semesters: [
          {
            name: "Semestre 1",
            title:
              "Fondamentaux & Introduction du marketing digital et création de contenu",
            courses: [
              "Introduction au marketing digital",
              "Bases du web et d'Internet",
              "Communication écrite et orale",
              "Outils bureautiques et collaboratifs",
              "Anglais professionnel 1",
              "Fondamentaux des réseaux sociaux",
              "Découverte du e-commerce",
              "Initiation au design graphique",
              "Culture digitale & veille",
              "Projet pratique : première campagne",
            ],
          },
          {
            ...practice([
              "Stratégie",
              "Projet collectif",
              "Projet individuel",
            ]),
            name: "Semestre 2",
          },
        ],
      },
      {
        level: "Bac+2",
        title: "Licence 2",
        semesters: [
          {
            name: "Semestre 3",
            title: "Acquisition, contenu et publicité en ligne",
            courses: [
              "SEO — référencement naturel",
              "Création de contenu (rédaction web)",
              "Community management",
              "Email marketing",
              "Anglais professionnel 2",
              "SEA — publicité en ligne (Google Ads)",
              "Visuels & création graphique",
              "Analytics & mesure de performance",
              "Bases du marketing mobile",
              "Projet pratique : gestion de réseaux sociaux",
            ],
          },
          {
            ...practice([
              "Stratégie",
              "Projet collectif",
              "Projet individuel",
              "Stage",
            ]),
            name: "Semestre 4",
          },
        ],
      },
      {
        level: "Bac+3",
        title: "Licence 3",
        semesters: [
          {
            name: "Semestre 5",
            title: "Stratégie, growth et data marketing",
            courses: [
              "Stratégie de marketing digital",
              "Growth marketing & acquisition",
              "Marketing automation",
              "Data marketing & CRM",
              "E-commerce avancé",
              "Gestion de budget & ROI",
              "Marketing d'influence",
              "Stratégie social media",
            ],
          },
          {
            ...practice([
              "Stratégie",
              "Projet collectif",
              "Projet individuel",
              "Stage & rapport de stage",
              "Mémoire",
            ]),
            name: "Semestre 6",
          },
        ],
      },
      {
        level: "Bac+4",
        title: "Master 1",
        semesters: [
          {
            name: "Semestre 7",
            title: "Stratégie avancée, IA et pilotage marketing",
            courses: [
              "Stratégie omnicanale",
              "Marketing augmenté par l'IA",
              "Brand management",
              "Études de marché avancées",
              "Pilotage d'équipe marketing",
              "Marketing international",
              "Marketing automation avancé",
            ],
          },
          {
            ...practice([
              "Stratégie",
              "Projet collectif",
              "Projet individuel",
              "Stage",
            ]),
            name: "Semestre 8",
          },
        ],
      },
      {
        level: "Bac+5",
        title: "Master 2",
        semesters: [
          {
            name: "Semestre 9",
            title: "Direction, innovation et gouvernance digitale",
            courses: [
              "Direction de la stratégie digitale",
              "Innovation & transformation digitale",
              "Marketing prédictif & data science",
              "Leadership & management d'équipe",
              "Conduite de projet à l'échelle",
              "Stratégie & gouvernance digitale",
            ],
          },
          {
            ...practice([
              "Stratégie",
              "Projet collectif",
              "Projet individuel",
              "Stage / mémoire professionnel",
            ]),
            name: "Semestre 10",
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
