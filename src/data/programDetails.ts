/**
 * Détail des programmes par niveau (Bac+1 → Bac+5), organisés en 2 semestres
 * (système LMD), + thème, objectif, débouchés et conditions d'admission.
 *
 * Chaque domaine (marketing, communication, design…) a UN programme Bac+1→Bac+5,
 * réutilisé par Campus, Pro et Executive (mêmes matières, public différent).
 * Les filières Bachelor / MBA / Executive MBA / DBA seront ajoutées plus tard.
 *
 * 👉 Marketing digital = contenu réel. Les autres = modèles à valider.
 */

export interface Semester {
  name: string;
  title?: string;
  courses: string[];
}

export interface ProgramLevel {
  level: string;
  title: string;
  theme?: string;
  objective?: string;
  semesters: Semester[];
}

export interface AdmissionInfo {
  documents: string[];
  equipment: string[];
  fees: string[];
}

export interface ProgramDetail {
  levels: ProgramLevel[];
  outcomes: string[];
  admission?: AdmissionInfo;
}

// ── Conditions d'admission communes (IPMD Campus) ──────────
export const CAMPUS_ADMISSION: AdmissionInfo = {
  documents: [
    "Relevé de notes du baccalauréat",
    "Relevé de notes de première et terminale (pour nouveaux bacheliers)",
    "Relevé de notes de BAC+1 (entrée directe en L2)",
    "Relevé de notes de BAC+1 et BAC+2 (entrée directe en Licence 3)",
    "Relevé de notes de BAC+1 à BAC+3 (entrée directe en Master 1)",
    "Diplôme(s) obtenu(s)",
    "Attestation de travail et CV (pour les salariés)",
    "Extrait d'acte de naissance et une photo d'identité",
    "CNI, attestation d'identité, carte consulaire ou passeport",
  ],
  equipment: [
    "PC portable : 16 Go RAM, processeur Core i5 ou équivalent, SSD 500 Go – 1 To",
    "Disque dur externe : capacité recommandée 1 To ou plus",
  ],
  fees: [
    "Licence 1 : 1 850 000 FCFA",
    "Possibilité de payer la scolarité en 10 mois",
    "Paiement unique : 15 % de réduction",
    "Frais d'inscription : 300 000 FCFA (non inclus dans la scolarité)",
  ],
};

// ── Tronc commun Licence 1 (toutes formations) ─────────────
const FOUNDATION_S1: Semester = {
  name: "Semestre 1",
  title: "Fondamentaux du digital, de l'IA et des outils professionnels",
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
};

const FOUNDATION_S2: Semester = {
  name: "Semestre 2",
  title: "Stratégie, projets et immersion professionnelle",
  courses: [
    "Stratégie digitale",
    "Fondamentaux de la gestion de projets digitaux",
    "Projet collectif",
    "Projet individuel",
    "Stage",
  ],
};

/** Semestre pair (pratique) commun. */
const practice = (name: string, finalLabel = "Stage"): Semester => ({
  name,
  title: "Stratégie, projets et immersion professionnelle",
  courses: [
    "Stratégie et pilotage de projets",
    "Gestion de projets digitaux",
    "Intelligence artificielle appliquée au métier",
    "Projet collectif",
    "Projet individuel",
    finalLabel,
  ],
});

interface CampusLevelCfg {
  theme: string;
  objective: string;
  courses: string[];
}

/** Construit un programme Bac+1→Bac+5 (L1 commune + spécialisation). */
function buildProgram(
  l1Objective: string,
  levels: [CampusLevelCfg, CampusLevelCfg, CampusLevelCfg, CampusLevelCfg],
  outcomes: string[]
): ProgramDetail {
  const [l2, l3, m1, m2] = levels;
  return {
    levels: [
      {
        level: "Bac+1",
        title: "Licence 1",
        objective: l1Objective,
        semesters: [FOUNDATION_S1, FOUNDATION_S2],
      },
      {
        level: "Bac+2",
        title: "Licence 2",
        theme: l2.theme,
        objective: l2.objective,
        semesters: [
          { name: "Semestre 3", title: l2.theme, courses: l2.courses },
          practice("Semestre 4"),
        ],
      },
      {
        level: "Bac+3",
        title: "Licence 3",
        theme: l3.theme,
        objective: l3.objective,
        semesters: [
          { name: "Semestre 5", title: l3.theme, courses: l3.courses },
          practice("Semestre 6", "Stage ou mémoire de fin de cycle"),
        ],
      },
      {
        level: "Bac+4",
        title: "Master 1",
        theme: m1.theme,
        objective: m1.objective,
        semesters: [
          { name: "Semestre 7", title: m1.theme, courses: m1.courses },
          practice("Semestre 8", "Stage ou mission professionnelle"),
        ],
      },
      {
        level: "Bac+5",
        title: "Master 2",
        theme: m2.theme,
        objective: m2.objective,
        semesters: [
          { name: "Semestre 9", title: m2.theme, courses: m2.courses },
          practice("Semestre 10", "Stage, mémoire ou projet de fin d'études"),
        ],
      },
    ],
    outcomes,
    admission: CAMPUS_ADMISSION,
  };
}

/** Variante Pro / Executive : sans les frais Campus (tarifs différents). */
const withoutFees = (p: ProgramDetail): ProgramDetail => ({
  levels: p.levels,
  outcomes: p.outcomes,
});

// ════════════════ Programmes par domaine ════════════════

// ── Marketing digital (contenu réel) ───────────────────────
const marketingProgram: ProgramDetail = {
  levels: [
    {
      level: "Bac+1",
      title: "Licence 1",
      objective:
        "Apprendre les bases du digital, du marketing, de la communication, des réseaux sociaux, de l'e-commerce, de l'IA et des outils professionnels.",
      semesters: [
        FOUNDATION_S1,
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
  admission: CAMPUS_ADMISSION,
};

// ── Communication digitale (modèle à valider) ──────────────
const communicationProgram = buildProgram(
  "Apprendre les bases du digital, de la communication, du contenu, des réseaux sociaux, de l'IA et des outils professionnels.",
  [
    {
      theme: "Communication digitale avancée et contenu",
      objective:
        "Approfondir la création de contenus, le community management, les relations publiques digitales et la publicité sociale.",
      courses: [
        "Communication digitale avancée",
        "Brand content et storytelling",
        "Community management",
        "Relations publiques digitales",
        "Création de contenus multimédias",
        "Publicité et médias sociaux",
      ],
    },
    {
      theme: "Stratégie de communication et image de marque",
      objective:
        "Piloter une stratégie de communication, construire l'identité de marque et gérer la communication de crise.",
      courses: [
        "Stratégie de communication digitale",
        "Image et identité de marque",
        "Marketing d'influence",
        "Communication de crise",
        "Production audiovisuelle",
        "Data et performance de communication",
      ],
    },
    {
      theme: "Communication, influence et transformation digitale",
      objective:
        "Développer une expertise en communication corporate, influence, e-réputation et IA appliquée.",
      courses: [
        "Communication corporate et influence",
        "Stratégie de marque avancée",
        "Communication internationale",
        "Intelligence artificielle appliquée à la communication",
        "Management d'équipe communication",
        "E-réputation et veille",
      ],
    },
    {
      theme: "Direction de la communication et e-réputation",
      objective:
        "Diriger la communication digitale d'une organisation, piloter la e-réputation et accompagner la gouvernance.",
      courses: [
        "Direction de la communication digitale",
        "Leadership et stratégie de marque",
        "Gouvernance de la communication",
        "Communication et IA générative",
        "Pilotage de la e-réputation",
        "Consulting en communication",
      ],
    },
  ],
  [
    "Chargé(e) de communication digitale",
    "Community manager",
    "Content manager",
    "Brand content manager",
    "Attaché(e) de presse digital",
    "Social media manager",
    "Responsable communication",
    "Consultant(e) en communication",
    "Directeur(rice) de la communication",
    "Entrepreneur(e) / freelance",
  ]
);

// ── Graphisme & Design (modèle à valider) ──────────────────
const designProgram = buildProgram(
  "Apprendre les bases du digital, du design, des outils créatifs, de l'IA et des outils professionnels.",
  [
    {
      theme: "Design graphique, identité visuelle et UI",
      objective:
        "Maîtriser le design graphique, l'identité visuelle, les interfaces et les outils de création.",
      courses: [
        "Design graphique avancé",
        "UI design (interfaces)",
        "Identité visuelle et branding",
        "Illustration et image",
        "Motion design (bases)",
        "Outils de création (Figma, Suite Adobe)",
      ],
    },
    {
      theme: "UX design, motion et direction artistique",
      objective:
        "Se spécialiser en expérience utilisateur, design system, motion design et direction artistique.",
      courses: [
        "UX design et recherche utilisateur",
        "Design system",
        "Motion design avancé",
        "Direction artistique",
        "Design d'interface mobile",
        "Portfolio professionnel",
      ],
    },
    {
      theme: "Direction artistique, design produit et IA",
      objective:
        "Développer une expertise en design produit, UX/UI stratégique et IA appliquée au design.",
      courses: [
        "Direction artistique avancée",
        "Design produit",
        "UX/UI stratégique",
        "Intelligence artificielle appliquée au design",
        "Design d'expérience de marque",
        "Gestion de projets design",
      ],
    },
    {
      theme: "Direction de création et innovation par le design",
      objective:
        "Diriger la création, piloter une stratégie de design et innover avec l'IA générative.",
      courses: [
        "Direction de création",
        "Stratégie de design et innovation",
        "Design thinking et leadership",
        "IA générative et création",
        "Gouvernance du design",
        "Consulting en design",
      ],
    },
  ],
  [
    "Graphiste / designer digital",
    "UI designer",
    "UX designer",
    "Motion designer",
    "Directeur(rice) artistique",
    "Designer produit",
    "Brand designer",
    "Illustrateur(rice)",
    "Consultant(e) en design",
    "Entrepreneur(e) / freelance",
  ]
);

// ── E-commerce & commerce international (modèle à valider) ──
const ecommerceProgram = buildProgram(
  "Apprendre les bases du digital, du commerce en ligne, de la logistique, de l'IA et des outils professionnels.",
  [
    {
      theme: "Fondamentaux du e-commerce et de la logistique",
      objective:
        "Maîtriser les marketplaces, la logistique, le paiement en ligne et la relation client digitale.",
      courses: [
        "Fondamentaux du e-commerce",
        "Marketplaces et plateformes",
        "Logistique et supply chain",
        "Paiement en ligne",
        "Acquisition et conversion",
        "Relation client digitale",
      ],
    },
    {
      theme: "Stratégie e-commerce et commerce international",
      objective:
        "Piloter une boutique en ligne, développer le commerce international et la performance.",
      courses: [
        "Stratégie e-commerce",
        "Commerce international",
        "Marketing e-commerce avancé",
        "Gestion des stocks et logistique",
        "Data et performance e-commerce",
        "Projet boutique en ligne",
      ],
    },
    {
      theme: "Stratégie omnicanale et business model digital",
      objective:
        "Développer une expertise en stratégie omnicanale, business model et IA appliquée au e-commerce.",
      courses: [
        "Stratégie omnicanale",
        "Business model digital",
        "Commerce international avancé",
        "Intelligence artificielle appliquée au e-commerce",
        "Management de projets e-commerce",
        "Croissance et rétention client",
      ],
    },
    {
      theme: "Direction e-commerce et expansion internationale",
      objective:
        "Diriger une activité e-commerce, piloter l'expansion internationale et la personnalisation par l'IA.",
      courses: [
        "Direction e-commerce",
        "Stratégie internationale et expansion",
        "Leadership et pilotage",
        "IA et personnalisation",
        "Gouvernance du commerce digital",
        "Consulting e-commerce",
      ],
    },
  ],
  [
    "Responsable e-commerce",
    "Chef(fe) de projet e-commerce",
    "Category manager",
    "Traffic manager e-commerce",
    "Responsable marketplace",
    "Supply chain manager",
    "Responsable commerce international",
    "Consultant(e) e-commerce",
    "Directeur(rice) e-commerce",
    "Entrepreneur(e) / freelance",
  ]
);

// ── Développement d'applications (modèle à valider) ────────
const devProgram = buildProgram(
  "Apprendre les bases du digital, de la programmation, des bases de données, de l'IA et des outils professionnels.",
  [
    {
      theme: "Programmation et développement front-end",
      objective:
        "Maîtriser la programmation, les bases de données et le développement front-end.",
      courses: [
        "Programmation (HTML, CSS, JavaScript)",
        "Bases de données",
        "Développement front-end (React)",
        "Bases du back-end",
        "Git et travail collaboratif",
        "Algorithmique",
      ],
    },
    {
      theme: "Développement full-stack et mobile",
      objective:
        "Se spécialiser en développement full-stack, API, mobile et bases du DevOps.",
      courses: [
        "Développement full-stack",
        "API REST",
        "Frameworks back-end (Node)",
        "Développement mobile",
        "Bases du DevOps",
        "Projet d'application",
      ],
    },
    {
      theme: "Architecture, cloud et sécurité",
      objective:
        "Développer une expertise en architecture logicielle, cloud, sécurité et IA appliquée au développement.",
      courses: [
        "Architecture logicielle",
        "Cloud et déploiement",
        "Sécurité applicative",
        "Intelligence artificielle appliquée au développement",
        "Tests et qualité logicielle",
        "Management de projets tech",
      ],
    },
    {
      theme: "Direction technique et systèmes intelligents",
      objective:
        "Diriger une équipe technique, concevoir des architectures scalables et intégrer l'IA.",
      courses: [
        "Direction technique",
        "Architecture avancée et scalabilité",
        "Leadership tech",
        "IA et systèmes intelligents",
        "Gouvernance et DevOps",
        "Projet de consulting technique",
      ],
    },
  ],
  [
    "Développeur(se) web / mobile",
    "Développeur(se) front-end",
    "Développeur(se) back-end",
    "Développeur(se) full-stack",
    "Ingénieur(e) logiciel",
    "DevOps",
    "Architecte logiciel",
    "Lead developer / CTO",
    "Consultant(e) technique",
    "Entrepreneur(e) / freelance",
  ]
);

// ── Informatique & intelligence artificielle (modèle) ──────
const iaProgram = buildProgram(
  "Apprendre les bases du digital, de la programmation, des données, de l'IA et des outils professionnels.",
  [
    {
      theme: "Programmation, données et machine learning",
      objective:
        "Maîtriser Python, les mathématiques pour l'IA, les bases de données et l'introduction au machine learning.",
      courses: [
        "Programmation Python",
        "Mathématiques pour l'IA",
        "Bases de données",
        "Statistiques et data",
        "Introduction au machine learning",
        "Outils data",
      ],
    },
    {
      theme: "Machine learning, data science et IA générative",
      objective:
        "Se spécialiser en machine learning, data science, IA générative et MLOps.",
      courses: [
        "Machine learning",
        "Data science",
        "IA générative (LLM)",
        "Visualisation de données",
        "MLOps (bases)",
        "Projet IA",
      ],
    },
    {
      theme: "Deep learning, NLP et IA appliquée",
      objective:
        "Développer une expertise en deep learning, NLP, big data et IA pour la décision.",
      courses: [
        "Deep learning",
        "IA avancée et NLP",
        "Big data",
        "Intelligence artificielle appliquée à la décision",
        "Éthique et gouvernance de l'IA",
        "Management de projets IA",
      ],
    },
    {
      theme: "Direction IA, data et IA responsable",
      objective:
        "Diriger des projets IA et data, concevoir des systèmes IA et garantir une IA responsable.",
      courses: [
        "Direction IA et data",
        "Architecture de systèmes IA",
        "Leadership et stratégie IA",
        "IA générative avancée",
        "Gouvernance et IA responsable",
        "Consulting en IA",
      ],
    },
  ],
  [
    "Data analyst",
    "Data scientist",
    "Ingénieur(e) machine learning",
    "Ingénieur(e) IA",
    "Développeur(se) IA",
    "MLOps engineer",
    "Data engineer",
    "Chef(fe) de projet IA",
    "Consultant(e) IA / data",
    "Entrepreneur(e) / freelance",
  ]
);

// ── Management de projet digital (modèle à valider) ────────
const managementProgram = buildProgram(
  "Apprendre les bases du digital, de la gestion de projet, du management, de l'IA et des outils professionnels.",
  [
    {
      theme: "Gestion de projet et méthodes agiles",
      objective:
        "Maîtriser les fondamentaux de la gestion de projet, les méthodes agiles et la communication d'équipe.",
      courses: [
        "Fondamentaux de la gestion de projet",
        "Méthodes agiles (Scrum)",
        "Outils de gestion de projet",
        "Communication et leadership",
        "Transformation digitale",
        "Gestion d'équipe",
      ],
    },
    {
      theme: "Pilotage de projets et product management",
      objective:
        "Se spécialiser en pilotage de projets digitaux, product management et conduite du changement.",
      courses: [
        "Pilotage de projets digitaux",
        "Product management",
        "Gestion budgétaire et risques",
        "Conduite du changement",
        "Data et KPIs",
        "Projet professionnel",
      ],
    },
    {
      theme: "Management de portefeuille et innovation",
      objective:
        "Développer une expertise en management de portefeuille, stratégie, innovation et IA appliquée.",
      courses: [
        "Management de portefeuille de projets",
        "Stratégie et innovation",
        "Leadership avancé",
        "Intelligence artificielle appliquée au management",
        "Transformation des organisations",
        "Gestion de programmes",
      ],
    },
    {
      theme: "Direction de projets et gouvernance",
      objective:
        "Diriger des projets et programmes, piloter la performance et la gouvernance digitale.",
      courses: [
        "Direction de projets et programmes",
        "Stratégie digitale et gouvernance",
        "Leadership exécutif",
        "IA et pilotage de la performance",
        "Gouvernance de projets",
        "Consulting en management",
      ],
    },
  ],
  [
    "Chef(fe) de projet digital",
    "Product owner",
    "Scrum master",
    "Product manager",
    "Chef(fe) de produit digital",
    "Consultant(e) en transformation digitale",
    "Program manager",
    "Responsable PMO",
    "Directeur(rice) de projets digitaux",
    "Entrepreneur(e) / freelance",
  ]
);

// ── Comptabilité & finance digitale (modèle à valider) ─────
const financeProgram = buildProgram(
  "Apprendre les bases du digital, de la comptabilité, de la finance, de la FinTech, de l'IA et des outils professionnels.",
  [
    {
      theme: "Comptabilité, finance et outils numériques",
      objective:
        "Maîtriser la comptabilité générale, les fondamentaux de la finance et les outils financiers numériques.",
      courses: [
        "Comptabilité générale",
        "Fondamentaux de la finance",
        "Outils financiers numériques",
        "Fiscalité",
        "Gestion budgétaire",
        "Introduction à la FinTech",
      ],
    },
    {
      theme: "Contrôle de gestion et FinTech",
      objective:
        "Se spécialiser en comptabilité analytique, contrôle de gestion, finance d'entreprise et FinTech.",
      courses: [
        "Comptabilité analytique",
        "Contrôle de gestion",
        "Finance d'entreprise",
        "FinTech et paiement digital",
        "Data financière",
        "Projet professionnel",
      ],
    },
    {
      theme: "Finance digitale avancée et innovation",
      objective:
        "Développer une expertise en finance digitale, analyse financière, audit et IA appliquée.",
      courses: [
        "Finance digitale avancée",
        "Analyse financière et reporting",
        "Audit et conformité",
        "Intelligence artificielle appliquée à la finance",
        "Innovation FinTech",
        "Management financier",
      ],
    },
    {
      theme: "Direction financière digitale et gouvernance",
      objective:
        "Diriger la fonction finance digitale, piloter la performance et la conformité avec l'IA.",
      courses: [
        "Direction financière digitale",
        "Stratégie et gouvernance financière",
        "Leadership et pilotage",
        "IA et finance prédictive",
        "Gouvernance et conformité",
        "Consulting en finance digitale",
      ],
    },
  ],
  [
    "Comptable",
    "Contrôleur(se) de gestion",
    "Analyste financier(ère)",
    "Gestionnaire FinTech",
    "Chargé(e) de finance digitale",
    "Auditeur(rice)",
    "Responsable financier",
    "Consultant(e) en finance digitale",
    "Directeur(rice) administratif et financier",
    "Entrepreneur(e) / freelance",
  ]
);

export const programDetails: Record<string, ProgramDetail> = {
  // ── IPMD Campus ──
  "campus-marketing": marketingProgram,
  "campus-communication": communicationProgram,
  "campus-design": designProgram,
  "campus-ecommerce": ecommerceProgram,
  "campus-dev": devProgram,
  "campus-ia": iaProgram,
  "campus-management": managementProgram,
  "campus-finance": financeProgram,

  // ── IPMD Pro (mêmes programmes, sans frais Campus) ──
  "pro-marketing": withoutFees(marketingProgram),
  "pro-communication": withoutFees(communicationProgram),
  "pro-design": withoutFees(designProgram),
  "pro-ecommerce": withoutFees(ecommerceProgram),
  "pro-dev": withoutFees(devProgram),
  "pro-ia": withoutFees(iaProgram),
  "pro-management": withoutFees(managementProgram),
  "pro-finance": withoutFees(financeProgram),

  // ── IPMD Executive ──
  "gov-management": withoutFees(managementProgram),
  "gov-marketing": withoutFees(marketingProgram),
  "gov-finance": withoutFees(financeProgram),
};

export const getProgramDetail = (id: string): ProgramDetail | undefined =>
  programDetails[id];
