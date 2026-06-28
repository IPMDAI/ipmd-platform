/**
 * Fils IPMD News / Jobs / Opportunities (par univers ; « home » = page d'accueil).
 * 👉 Pour gérer : modifier les tableaux ci-dessous.
 */
export type FeedItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Petite étiquette (date, type, lieu…). */
  meta?: string;
  description: string;
  icon?: string;
};

export type Feed = {
  eyebrow: string;
  title: string;
  intro: string;
  ctaLabel: string;
  ctaHref: string;
  items: FeedItem[];
};

export const NEWS_BY_UNIVERSE: Record<string, Feed> = {
  home: {
    eyebrow: "IPMD News",
    title: "L'actualité du digital, de l'IA et de l'innovation",
    intro: "Décryptages, tendances tech et annonces IPMD pour rester toujours à la pointe.",
    ctaLabel: "Lire la suite",
    ctaHref: "/contact",
    items: [
      { id: "n1", title: "L'IA générative bouleverse les métiers du digital", meta: "Actualité IA · 2026", description: "Tour d'horizon des usages qui transforment le travail et les compétences attendues.", icon: "🤖" },
      { id: "n2", title: "Top des technologies émergentes à suivre", meta: "Innovation", description: "IA agentique, no-code, edge computing… ce qui compte vraiment cette année.", icon: "🚀" },
      { id: "n3", title: "IPMD enrichit son catalogue de bootcamps IA", meta: "Annonce IPMD", description: "De nouveaux parcours pour rester à la pointe de l'employabilité.", icon: "📣" },
      { id: "n4", title: "Le digital, moteur de croissance en Afrique", meta: "Tech & société", description: "Pourquoi les compétences numériques sont plus que jamais stratégiques.", icon: "🌍" },
    ],
  },
};

export const JOBS_BY_UNIVERSE: Record<string, Feed> = {
  home: {
    eyebrow: "IPMD Jobs",
    title: "Offres d'emploi, stages, alternances & missions",
    intro: "Des opportunités professionnelles dans le digital, partagées via notre réseau de partenaires.",
    ctaLabel: "Postuler",
    ctaHref: "/contact",
    items: [
      { id: "j1", title: "Développeur web junior", subtitle: "TechCorp", meta: "CDI · Abidjan", description: "Rejoindre une équipe produit et développer des applications modernes.", icon: "💻" },
      { id: "j2", title: "Community Manager", subtitle: "Agence digitale", meta: "Alternance · Abidjan", description: "Animer les réseaux sociaux et créer du contenu engageant.", icon: "📣" },
      { id: "j3", title: "Data Analyst", subtitle: "Groupe bancaire", meta: "Stage · Abidjan", description: "Analyser les données pour appuyer la prise de décision.", icon: "📊" },
      { id: "j4", title: "Designer graphique", subtitle: "Studio créatif", meta: "Freelance · à distance", description: "Créer des identités visuelles fortes pour des marques variées.", icon: "🎨" },
      { id: "j5", title: "Chef de projet digital", subtitle: "Startup", meta: "CDI · Abidjan", description: "Piloter des projets numériques de l'idée à la livraison.", icon: "🚀" },
    ],
  },
};

export const OPPORTUNITIES_BY_UNIVERSE: Record<string, Feed> = {
  home: {
    eyebrow: "IPMD Opportunities",
    title: "Bourses, concours, appels à projets & programmes",
    intro: "Bourses d'études, hackathons, incubateurs, financements et programmes internationaux à ne pas manquer.",
    ctaLabel: "En savoir plus",
    ctaHref: "/contact",
    items: [
      { id: "o1", title: "Bourse d'études digitale 2026", meta: "Bourse · candidatures ouvertes", description: "Financez votre formation grâce à notre dispositif de bourses.", icon: "🎓" },
      { id: "o2", title: "Hackathon IA IPMD", meta: "Hackathon", description: "48h pour concevoir une solution IA en équipe et remporter des prix.", icon: "💡" },
      { id: "o3", title: "Appel à projets — startups tech", meta: "Appel à projets", description: "Présentez votre projet et bénéficiez d'un accompagnement dédié.", icon: "🚀" },
      { id: "o4", title: "Programme d'incubation", meta: "Incubateur", description: "Transformez votre idée en entreprise avec notre incubateur.", icon: "🌱" },
      { id: "o5", title: "Concours d'innovation numérique", meta: "Concours", description: "Tentez votre chance et gagnez un accompagnement sur mesure.", icon: "🏆" },
      { id: "o6", title: "Programmes internationaux", meta: "International", description: "Mobilité, partenariats et opportunités à l'international.", icon: "✈️" },
    ],
  },
};

export const getNews = (u: string): Feed | null => NEWS_BY_UNIVERSE[u] ?? null;
export const getJobs = (u: string): Feed | null => JOBS_BY_UNIVERSE[u] ?? null;
export const getOpportunities = (u: string): Feed | null => OPPORTUNITIES_BY_UNIVERSE[u] ?? null;
