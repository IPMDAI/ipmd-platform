import type { Program } from "@/types";

/**
 * Programmes diplômants par univers (Campus, Professionnel, Gouvernance).
 * Les bootcamps certifiants sont gérés séparément dans `bootcamps.ts`.
 */
export const programs: Program[] = [
  // ── IPMD Campus — Licence, Bachelor, Master ─────────────────
  {
    id: "campus-marketing",
    universe: "campus",
    title: "Marketing digital",
    description:
      "Stratégie d'acquisition, réseaux sociaux, SEO/SEA, data et growth marketing.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Marketing",
    icon: "📈",
  },
  {
    id: "campus-communication",
    universe: "campus",
    title: "Communication digitale",
    description:
      "Brand content, community management, relations publiques et storytelling.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Communication",
    icon: "📣",
  },
  {
    id: "campus-design",
    universe: "campus",
    title: "Graphisme & Design",
    description:
      "Identité visuelle, UI/UX, motion design et création graphique professionnelle.",
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
      "Marketplaces, logistique, paiement en ligne et stratégies de vente à l'international.",
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
      "Web, mobile et API : du front-end au back-end avec les frameworks modernes.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Développement",
    icon: "💻",
  },
  {
    id: "campus-ia",
    universe: "campus",
    title: "Informatique & intelligence artificielle",
    description:
      "Data science, machine learning, IA générative et systèmes intelligents.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "IA",
    icon: "🤖",
  },
  {
    id: "campus-management",
    universe: "campus",
    title: "Management de projet digital",
    description:
      "Gestion agile, pilotage produit, leadership d'équipe et transformation digitale.",
    degrees: ["Licence", "Bachelor", "Master"],
    entryLevels: ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4"],
    field: "Management",
    icon: "🧭",
  },
  {
    id: "campus-finance",
    universe: "campus",
    title: "Comptabilité & finance digitale",
    description:
      "Comptabilité, contrôle de gestion, fintech et outils financiers numériques.",
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
      "Pilotez l'acquisition et la croissance avec des méthodes data-driven appliquées.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Marketing",
    icon: "📈",
  },
  {
    id: "pro-communication",
    universe: "professionnel",
    title: "Communication digitale",
    description:
      "Construisez et déployez des stratégies de communication à fort impact.",
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
      "Maîtrisez le design produit, l'UX et la direction artistique en entreprise.",
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
      "Développez des opérations e-commerce performantes à l'échelle internationale.",
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
      "Concevez et livrez des applications robustes, du prototype à la production.",
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
      "Intégrez l'IA et l'IA générative dans vos produits, process et décisions.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "IA",
    icon: "🤖",
  },
  {
    id: "pro-management",
    universe: "professionnel",
    title: "Management de projet digital",
    description:
      "Pilotez la transformation digitale et dirigez des équipes pluridisciplinaires.",
    degrees: ["Licence", "Bachelor", "Master", "MBA"],
    entryLevels: ["Bac+2", "Bac+3", "Bac+4", "Bac+5"],
    field: "Management",
    icon: "🧭",
  },
  {
    id: "pro-finance",
    universe: "professionnel",
    title: "Finance digitale",
    description:
      "Fintech, data financière et stratégies de financement à l'ère du numérique.",
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
      "Gouvernance digitale & IA, disruption et leadership des organisations.",
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
      "Définissez la stratégie marketing augmentée par l'IA au niveau exécutif.",
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
      "Pilotez la performance financière et l'allocation du capital à l'ère de l'IA.",
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
