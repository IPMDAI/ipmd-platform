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
      "Devenez expert du marketing à l'ère de l'IA : campagnes, data et growth augmentés par l'intelligence artificielle. Une compétence très recherchée par les entreprises, 80 % de pratique et une employabilité immédiate.",
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
      "Communication, contenu et influence boostés par l'IA : créez plus vite, mieux et à grande échelle. Des compétences indispensables aux marques, 80 % de pratique et de vrais débouchés.",
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
      "Créez visuels et interfaces qui marquent, propulsés par l'IA générative. Design, UX/UI et motion : un métier créatif très demandé, 80 % de pratique et un portfolio prêt pour l'emploi.",
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
      "Lancez et développez le commerce en ligne à l'international, optimisé par l'IA (recommandation, personnalisation, automatisation). Un secteur en plein essor, 80 % de pratique et de belles opportunités.",
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
      "Codez les applications web et mobile de demain, assisté par l'IA. Des compétences techniques parmi les plus recherchées du marché, 80 % de pratique et un accès direct à l'emploi tech.",
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
      "Maîtrisez la révolution de l'IA : data, machine learning et IA générative. Le domaine le plus porteur du moment, 80 % de pratique et des métiers d'avenir hautement valorisés.",
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
      "Pilotez la transformation digitale et l'IA des organisations : agilité, leadership et data pour des projets à fort impact. Des compétences clés, 80 % de pratique et des postes à responsabilité.",
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
      "Réinventez la finance avec la FinTech et l'IA : automatisation, data et finance prédictive. Des compétences rares et stratégiques, 80 % de pratique et une employabilité solide.",
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
      "Montez en compétence sur le marketing piloté par l'IA : data, growth et performance. Boostez votre carrière sans quitter votre poste, avec 80 % de pratique et des résultats concrets.",
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
      "Faites évoluer votre expertise en communication digitale augmentée par l'IA : stratégie, contenu et influence. Une montée en compétence rapide, 80 % de pratique, tout en restant en activité.",
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
      "Renforcez vos compétences en design produit, UX/UI et IA générative. Devenez un profil créatif incontournable en entreprise, avec 80 % de pratique et une vraie valeur ajoutée.",
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
      "Développez des opérations e-commerce performantes à l'international, optimisées par l'IA. Une expertise stratégique et opérationnelle, 80 % de pratique, en restant en poste.",
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
      "Devenez développeur confirmé à l'ère de l'IA : full-stack, cloud et automatisation. Des compétences très demandées pour accélérer votre carrière tech, avec 80 % de pratique.",
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
      "Intégrez l'IA et l'IA générative dans vos produits, process et décisions. La compétence la plus stratégique du moment pour faire la différence, avec 80 % de pratique.",
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
      "Pilotez la transformation digitale et l'IA, dirigez des équipes et des projets à fort impact. Accédez à des postes à responsabilité, avec 80 % de pratique, en activité.",
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
      "Modernisez votre expertise financière avec la FinTech et l'IA : data, reporting et finance prédictive. Une compétence rare et valorisée, 80 % de pratique, en poste.",
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
      "Dirigez la gouvernance digitale et l'IA de votre organisation : stratégie, disruption et leadership. Un programme exécutif à fort impact pour les décideurs qui pilotent la transformation.",
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
      "Pilotez la stratégie marketing augmentée par l'IA au plus haut niveau : data, performance et innovation. Un programme exécutif orienté décision et impact business.",
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
      "Dirigez la finance digitale et la stratégie IA : allocation du capital, data et finance prédictive. Un programme exécutif à forte valeur stratégique pour les décideurs.",
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
