import type { Program } from "@/types";

/**
 * Programmes diplômants par univers (Campus, Professionnel, Gouvernance).
 * Les bootcamps certifiants sont gérés séparément dans `bootcamps.ts`.
 */
export const programs: Program[] = [
  // ── IPMD Campus — Licence, Bachelor, Master ─────────────────
  {
    id: "campus-marketing",
    image: "/IPMD_Campus%20Marketing.png",
    universe: "campus",
    title: "Marketing digital",
    description:
      "Le Marketing digital permet de promouvoir une entreprise, une marque, un produit ou un service à travers les canaux numériques.\n\nTrès demandé sur le marché, il couvre les réseaux sociaux, le e-commerce, la publicité en ligne, le référencement, la création de contenu, l'analyse des données, l'intelligence artificielle et les technologies financières digitales.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, quel que soit le niveau, afin de former des étudiants capables de concevoir, gérer et optimiser des campagnes digitales performantes à l'ère de l'IA.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Marketing",
    icon: "📈",
  },
  {
    id: "campus-communication",
    image: "/IPMD%20Campus%202024-42.png",
    universe: "campus",
    title: "Communication digitale",
    description:
      "La Communication digitale permet de gérer l'image, la visibilité et la relation d'une entreprise, d'une marque ou d'une organisation sur les canaux numériques.\n\nTrès recherchée sur le marché, elle couvre la création de contenu, les réseaux sociaux, l'influence, la gestion de communauté, la communication de marque, la stratégie éditoriale et l'utilisation de l'intelligence artificielle pour produire plus vite et mieux.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des profils capables de concevoir, diffuser et piloter des actions de communication digitale efficaces.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Communication",
    icon: "📣",
  },
  {
    id: "campus-design",
    image: "/IPMD%20Campus%202024-60.png",
    universe: "campus",
    title: "Graphisme & Design",
    description:
      "Le Graphisme & Design permet de créer des visuels, des identités de marque, des supports de communication et des interfaces digitales attractives.\n\nTrès demandé dans les entreprises, agences, médias et projets digitaux, ce domaine couvre le design graphique, la création visuelle, l'UX/UI design, le branding, le motion design et l'utilisation de l'intelligence artificielle générative.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, quel que soit le niveau, afin de former des étudiants capables de concevoir des visuels professionnels, des interfaces modernes et des supports créatifs adaptés aux besoins du marché.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Design",
    icon: "🎨",
  },
  {
    id: "campus-ecommerce",
    universe: "campus",
    title: "E-commerce & commerce international",
    description:
      "Le E-commerce & Commerce international permet de vendre des produits et services en ligne, de gérer une boutique digitale et de développer des activités commerciales sur les marchés locaux et internationaux.\n\nTrès demandé avec la croissance du numérique, ce domaine couvre le commerce en ligne, les marketplaces, la logistique, le paiement digital, le marketing e-commerce, la relation client, l'import-export et les outils d'intelligence artificielle pour améliorer les ventes.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des profils capables de créer, gérer et développer des activités commerciales digitales performantes.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Commerce",
    icon: "🛒",
  },
  {
    id: "campus-dev",
    universe: "campus",
    title: "Développement d'applications",
    description:
      "Le Développement d'applications permet de concevoir des sites web, des applications mobiles, des plateformes digitales et des solutions numériques adaptées aux besoins des entreprises.\n\nTrès demandé dans le monde professionnel, ce domaine couvre la programmation, le développement web et mobile, les bases de données, l'UX/UI, les API, la sécurité, les outils collaboratifs et l'intelligence artificielle appliquée au développement.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, avec des projets concrets, afin de former des étudiants capables de créer, tester et déployer des applications utiles et performantes.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Développement",
    icon: "💻",
  },
  {
    id: "campus-ia",
    image: "/Visuel%20UltraBoost%2C-17.png",
    universe: "campus",
    title: "Informatique & intelligence artificielle",
    description:
      "L'Informatique & Intelligence Artificielle prépare aux métiers du numérique, de la programmation, de la data, de l'automatisation et des technologies intelligentes.\n\nTrès demandée sur le marché, cette formation couvre les bases de l'informatique, le développement logiciel, les bases de données, les systèmes numériques, la cybersécurité, l'analyse de données, le machine learning, l'IA générative et l'automatisation des processus.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des étudiants capables de concevoir, utiliser et développer des solutions numériques et intelligentes adaptées aux besoins des entreprises.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "IA",
    icon: "🤖",
  },
  {
    id: "campus-management",
    image: "/IPMD%20Campus%202024-1%20(4).png",
    universe: "campus",
    title: "Management de projet digital",
    description:
      "Le Management de projet digital permet de planifier, organiser, piloter et suivre des projets numériques au sein des entreprises et organisations.\n\nTrès utile dans tous les secteurs, il couvre la gestion de projet, les méthodes agiles, la coordination d'équipes, les outils collaboratifs, la transformation digitale, le suivi des performances et l'intégration de l'intelligence artificielle dans la gestion des projets.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des profils capables de conduire des projets digitaux de l'idée jusqu'à la réalisation.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Management",
    icon: "🧭",
  },
  {
    id: "campus-finance",
    image: "/IPMD%20Campus%202024-57.png",
    universe: "campus",
    title: "Comptabilité & finance digitale",
    description:
      "La Comptabilité et Finance digitale forme aux nouvelles pratiques de gestion financière, de comptabilité numérique et d'analyse des données financières.\n\nTrès demandée par les entreprises, cabinets, banques, fintechs et organisations, elle couvre la comptabilité, la finance, les outils digitaux de gestion, les tableaux de bord, la digitalisation financière, les paiements numériques, la FinTech et l'intelligence artificielle appliquée à la finance.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des étudiants capables de gérer, analyser et optimiser les opérations financières dans un environnement digitalisé.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Finance",
    icon: "📊",
  },

  // ── IPMD Professionnel — Licence, Bachelor, Master, MBA ──────
  {
    id: "pro-marketing",
    universe: "professionnel",
    title: "Marketing digital",
    description:
      "Le Marketing digital permet de promouvoir une entreprise, une marque, un produit ou un service à travers les canaux numériques.\n\nTrès demandé sur le marché, il couvre les réseaux sociaux, le e-commerce, la publicité en ligne, le référencement, la création de contenu, l'analyse des données, l'intelligence artificielle et les technologies financières digitales.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des professionnels capables de concevoir, gérer et optimiser des campagnes digitales performantes à l'ère de l'IA, tout en restant en activité.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Marketing",
    icon: "📈",
  },
  {
    id: "pro-communication",
    universe: "professionnel",
    image: "/galerie-ipmd-pros/IPMD%20Pro.png",
    title: "Communication digitale",
    description:
      "La Communication digitale permet de gérer l'image, la visibilité et la relation d'une entreprise, d'une marque ou d'une organisation sur les canaux numériques.\n\nTrès recherchée sur le marché, elle couvre la création de contenu, les réseaux sociaux, l'influence, la gestion de communauté, la communication de marque, la stratégie éditoriale et l'utilisation de l'intelligence artificielle pour produire plus vite et mieux.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des professionnels capables de concevoir, diffuser et piloter des actions de communication digitale efficaces.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Communication",
    icon: "📣",
  },
  {
    id: "pro-design",
    universe: "professionnel",
    title: "Graphisme & Design",
    description:
      "Le Graphisme & Design permet de créer des visuels, des identités de marque, des supports de communication et des interfaces digitales attractives.\n\nTrès demandé dans les entreprises, agences, médias et projets digitaux, ce domaine couvre le design graphique, la création visuelle, l'UX/UI design, le branding, le motion design et l'utilisation de l'intelligence artificielle générative.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des professionnels capables de concevoir des visuels professionnels, des interfaces modernes et des supports créatifs adaptés aux besoins du marché.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Design",
    icon: "🎨",
  },
  {
    id: "pro-ecommerce",
    universe: "professionnel",
    title: "E-commerce & commerce international",
    description:
      "Le E-commerce & Commerce international permet de vendre des produits et services en ligne, de gérer une boutique digitale et de développer des activités commerciales sur les marchés locaux et internationaux.\n\nTrès demandé avec la croissance du numérique, ce domaine couvre le commerce en ligne, les marketplaces, la logistique, le paiement digital, le marketing e-commerce, la relation client, l'import-export et les outils d'intelligence artificielle pour améliorer les ventes.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des professionnels capables de créer, gérer et développer des activités commerciales digitales performantes.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Commerce",
    icon: "🛒",
  },
  {
    id: "pro-dev",
    universe: "professionnel",
    title: "Développement d'applications",
    description:
      "Le Développement d'applications permet de concevoir des sites web, des applications mobiles, des plateformes digitales et des solutions numériques adaptées aux besoins des entreprises.\n\nTrès demandé dans le monde professionnel, ce domaine couvre la programmation, le développement web et mobile, les bases de données, l'UX/UI, les API, la sécurité, les outils collaboratifs et l'intelligence artificielle appliquée au développement.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des professionnels capables de créer, tester et déployer des applications utiles et performantes.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Développement",
    icon: "💻",
  },
  {
    id: "pro-ia",
    universe: "professionnel",
    title: "Intelligence artificielle",
    description:
      "L'Informatique & Intelligence Artificielle prépare aux métiers du numérique, de la programmation, de la data, de l'automatisation et des technologies intelligentes.\n\nTrès demandée sur le marché, cette formation couvre les bases de l'informatique, le développement logiciel, les bases de données, les systèmes numériques, la cybersécurité, l'analyse de données, le machine learning, l'IA générative et l'automatisation des processus.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des professionnels capables de concevoir, utiliser et développer des solutions numériques et intelligentes adaptées aux besoins des entreprises.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "IA",
    icon: "🤖",
  },
  {
    id: "pro-management",
    universe: "professionnel",
    image: "/galerie-ipmd-pros/ipmd-pro6.png",
    title: "Management de projet digital",
    description:
      "Le Management de projet digital permet de planifier, organiser, piloter et suivre des projets numériques au sein des entreprises et organisations.\n\nTrès utile dans tous les secteurs, il couvre la gestion de projet, les méthodes agiles, la coordination d'équipes, les outils collaboratifs, la transformation digitale, le suivi des performances et l'intégration de l'intelligence artificielle dans la gestion des projets.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des professionnels capables de conduire des projets digitaux de l'idée jusqu'à la réalisation.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Management",
    icon: "🧭",
  },
  {
    id: "pro-finance",
    universe: "professionnel",
    image: "/galerie-ipmd-pros/ipmd-pro10.png",
    title: "Finance digitale",
    description:
      "La Comptabilité et Finance digitale forme aux nouvelles pratiques de gestion financière, de comptabilité numérique et d'analyse des données financières.\n\nTrès demandée par les entreprises, cabinets, banques, fintechs et organisations, elle couvre la comptabilité, la finance, les outils digitaux de gestion, les tableaux de bord, la digitalisation financière, les paiements numériques, la FinTech et l'intelligence artificielle appliquée à la finance.\n\nÀ l'IPMD, la formation est orientée à 80 % vers la pratique, afin de former des professionnels capables de gérer, analyser et optimiser les opérations financières dans un environnement digitalisé.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Finance",
    icon: "📊",
  },

  // ── IPMD Gouvernance — Master Exécutif, MBA Exécutif, DBA ────
  {
    id: "gov-management",
    universe: "gouvernance",
    title: "Management de projet digital",
    description:
      "Le Management de projet digital permet de planifier, organiser, piloter et suivre des projets numériques au sein des entreprises et organisations.\n\nTrès utile dans tous les secteurs, il couvre la gestion de projet, les méthodes agiles, la coordination d'équipes, les outils collaboratifs, la transformation digitale, le suivi des performances et l'intégration de l'intelligence artificielle dans la gestion des projets.\n\nÀ l'IPMD, la formation exécutive est orientée à 80 % vers la pratique, afin de former des dirigeants et décideurs capables de conduire des projets digitaux et la gouvernance numérique de leur organisation.",
    degrees: ["Master Exécutif", "MBA Exécutif", "DBA"],
    entryLevels: ["Bac+3", "Bac+4", "Bac+5"],
    field: "Gouvernance",
    icon: "🏛️",
  },
  {
    id: "gov-marketing",
    universe: "gouvernance",
    title: "Marketing digital & stratégie IA",
    description:
      "Le Marketing digital permet de promouvoir une entreprise, une marque, un produit ou un service à travers les canaux numériques.\n\nTrès demandé sur le marché, il couvre les réseaux sociaux, le e-commerce, la publicité en ligne, le référencement, la création de contenu, l'analyse des données, l'intelligence artificielle et les technologies financières digitales.\n\nÀ l'IPMD, la formation exécutive est orientée à 80 % vers la pratique, afin de former des dirigeants et décideurs capables de piloter une stratégie marketing digitale performante à l'ère de l'IA.",
    degrees: ["Master Exécutif", "MBA Exécutif", "DBA"],
    entryLevels: ["Bac+3", "Bac+4", "Bac+5"],
    field: "Marketing",
    icon: "📈",
  },
  {
    id: "gov-finance",
    universe: "gouvernance",
    title: "Finance digitale & stratégie IA",
    description:
      "La Comptabilité et Finance digitale forme aux nouvelles pratiques de gestion financière, de comptabilité numérique et d'analyse des données financières.\n\nTrès demandée par les entreprises, cabinets, banques, fintechs et organisations, elle couvre la comptabilité, la finance, les outils digitaux de gestion, les tableaux de bord, la digitalisation financière, les paiements numériques, la FinTech et l'intelligence artificielle appliquée à la finance.\n\nÀ l'IPMD, la formation exécutive est orientée à 80 % vers la pratique, afin de former des dirigeants et décideurs capables de gérer, analyser et optimiser la performance financière à l'ère de l'IA.",
    degrees: ["Master Exécutif", "MBA Exécutif", "DBA"],
    entryLevels: ["Bac+3", "Bac+4", "Bac+5"],
    field: "Finance",
    icon: "📊",
  },
];

/** Image d'illustration par domaine (réutilisée sur chaque carte formation). */
export const fieldImages: Record<string, string> = {
  Marketing:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop",
  Communication:
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80&auto=format&fit=crop",
  Design:
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80&auto=format&fit=crop",
  Commerce:
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop",
  Développement:
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80&auto=format&fit=crop",
  IA: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80&auto=format&fit=crop",
  Management:
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80&auto=format&fit=crop",
  Finance:
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80&auto=format&fit=crop",
  Gouvernance:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&auto=format&fit=crop",
};

/** Image d'une formation selon son domaine (avec repli). */
export const getProgramImage = (field: string): string =>
  fieldImages[field] ?? fieldImages.Marketing;

export const getProgramsByUniverse = (universe: string): Program[] =>
  programs.filter((p) => p.universe === universe);
