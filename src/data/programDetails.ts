/**
 * Détail des programmes par niveau (Bac+1 → Bac+5), organisés en 2 semestres
 * (système LMD), + thème, objectif et débouchés.
 *
 * 👉 POUR REMPLIR / MODIFIER UN PROGRAMME :
 *   - La clé est l'`id` de la formation (voir src/data/programs.ts), ex. "campus-marketing".
 *   - Chaque niveau : `title` (année), `theme` (spécialisation, optionnel),
 *     `objective` (objectif pédagogique, optionnel) et 2 semestres.
 *   - Chaque semestre : `name` ("Semestre 1"), `title` (thème) et la liste des matières.
 *   - `outcomes` = la liste des débouchés (métiers, postes).
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
  /** Thème / spécialisation de l'année (optionnel). */
  theme?: string;
  /** Objectif pédagogique de l'année (optionnel). */
  objective?: string;
  /** Les 2 semestres (LMD). */
  semesters: Semester[];
}

export interface ProgramDetail {
  levels: ProgramLevel[];
  /** Débouchés (métiers, postes). */
  outcomes: string[];
}

export const programDetails: Record<string, ProgramDetail> = {
  // ── Marketing digital (IPMD Campus) ────────────────────────
  "campus-marketing": {
    levels: [
      {
        level: "Bac+1",
        title: "Licence 1",
        objective:
          "Apprendre les bases du digital, du marketing, de la communication, des réseaux sociaux, de l'e-commerce, de l'IA et des outils professionnels.",
        semesters: [
          {
            name: "Semestre 1",
            title:
              "Fondamentaux du marketing digital, IA et création de contenu",
            courses: [
              "Écosystème et culture digitale",
              "Dactylographie",
              "Anglais du digital et professionnel",
              "Outils bureautiques et collaboratifs",
              "Fondamentaux du marketing digital",
              "Fondamentaux de la communication digitale",
              "Fondamentaux du e-commerce",
              "Fondamentaux des réseaux sociaux",
              "Fondamentaux du design graphique",
              "Fondamentaux du développement d'applications",
              "Fondamentaux de l'intelligence artificielle",
              "Fondamentaux de la FinTech et des services financiers digitaux",
            ],
          },
          {
            name: "Semestre 2",
            title: "Stratégie, projets et immersion professionnelle",
            courses: [
              "Stratégie marketing digital",
              "Fondamentaux de la gestion de projets digitaux",
              "Projet collectif",
              "Projet individuel",
              "Stage",
            ],
          },
        ],
      },
      {
        level: "Bac+2",
        title: "Licence 2",
        theme: "Marketing digital avancé, IA et performance",
        objective:
          "Approfondir les compétences, gérer des campagnes digitales, analyser les performances, utiliser l'IA et développer des projets digitaux plus avancés.",
        semesters: [
          {
            name: "Semestre 3",
            title: "Approfondissement du marketing digital, IA et performance",
            courses: [
              "Marketing digital avancé",
              "Communication digitale avancée",
              "E-commerce avancé",
              "Réseaux sociaux et community management",
              "Design graphique appliqué au marketing digital",
              "Développement d'applications appliqué au digital",
              "Intelligence artificielle appliquée au marketing digital",
              "FinTech et services financiers digitaux",
              "Data marketing et analyse de performance",
              "Publicité digitale et acquisition client",
            ],
          },
          {
            name: "Semestre 4",
            title: "Stratégie, projets et immersion professionnelle",
            courses: [
              "Stratégie marketing digital avancée",
              "Gestion de projets digitaux",
              "Intelligence artificielle appliquée aux campagnes digitales",
              "Projet collectif",
              "Projet individuel",
              "Stage",
            ],
          },
        ],
      },
      {
        level: "Bac+3",
        title: "Licence 3",
        theme: "Spécialisation en marketing digital, IA et stratégie de marque",
        objective:
          "Se spécialiser, piloter une stratégie digitale, travailler sur la marque, le contenu, la performance, l'e-commerce, la data et les projets professionnels.",
        semesters: [
          {
            name: "Semestre 5",
            title:
              "Spécialisation en marketing digital, IA et stratégie de marque",
            courses: [
              "Stratégie marketing digital",
              "Communication digitale stratégique",
              "E-commerce et business en ligne",
              "Social media management",
              "Brand content et stratégie de marque",
              "Data marketing et pilotage de performance",
              "Intelligence artificielle appliquée au marketing digital",
              "Marketing automation",
              "FinTech et marketing des services financiers digitaux",
              "Projet professionnel digital",
            ],
          },
          {
            name: "Semestre 6",
            title: "Stratégie, projets et immersion professionnelle",
            courses: [
              "Stratégie marketing digital avancée",
              "Gestion de projets digitaux",
              "Intelligence artificielle appliquée aux stratégies marketing",
              "Projet collectif",
              "Projet individuel",
              "Stage ou mémoire de fin de cycle",
            ],
          },
        ],
      },
      {
        level: "Bac+4",
        title: "Master 1",
        theme: "Expertise en marketing digital, IA et transformation digitale",
        objective:
          "Développer une expertise avancée en stratégie digitale, transformation numérique, automatisation marketing, data, CRM, IA et management de projets digitaux.",
        semesters: [
          {
            name: "Semestre 7",
            title:
              "Expertise en marketing digital, IA et transformation digitale",
            courses: [
              "Stratégie digitale avancée",
              "Communication digitale et influence",
              "E-commerce avancé et business model digital",
              "Data marketing et analytics",
              "Intelligence artificielle appliquée au marketing et à la décision",
              "Marketing automation et CRM",
              "FinTech, paiement digital et innovation financière",
              "Management de projets digitaux",
              "Transformation digitale des organisations",
              "Projet professionnel avancé",
            ],
          },
          {
            name: "Semestre 8",
            title: "Stratégie, projets et immersion professionnelle",
            courses: [
              "Stratégie digitale et pilotage de performance",
              "Management de projets digitaux",
              "Intelligence artificielle appliquée à la transformation digitale",
              "Projet collectif",
              "Projet individuel",
              "Stage ou mission professionnelle",
            ],
          },
        ],
      },
      {
        level: "Bac+5",
        title: "Master 2",
        theme: "Direction marketing digital, IA et gouvernance numérique",
        objective:
          "Former des profils capables de diriger une stratégie marketing digitale, piloter la performance, manager des équipes, accompagner la transformation digitale et la gouvernance numérique des organisations.",
        semesters: [
          {
            name: "Semestre 9",
            title: "Direction marketing digital, IA et gouvernance numérique",
            courses: [
              "Direction marketing digital",
              "Stratégie de marque et leadership digital",
              "Growth marketing et acquisition avancée",
              "Data, analytics et pilotage stratégique",
              "Intelligence artificielle appliquée au business digital",
              "Gouvernance numérique",
              "Innovation, FinTech et transformation des services",
              "Management d'équipes et leadership",
              "Stratégie omnicanale",
              "Projet de consulting digital",
            ],
          },
          {
            name: "Semestre 10",
            title: "Stratégie, projets et insertion professionnelle",
            courses: [
              "Stratégie digitale de haut niveau",
              "Gouvernance de projets digitaux",
              "Intelligence artificielle appliquée à la performance des organisations",
              "Projet collectif",
              "Projet individuel",
              "Stage, mémoire ou projet professionnel de fin d'études",
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
