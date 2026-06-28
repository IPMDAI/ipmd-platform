/**
 * Fils IPMD News / Jobs / Opportunities.
 * (Données statiques — une gestion dashboard pourra les remplacer en phase 2.)
 * 👉 Pour gérer : modifier les tableaux ci-dessous.
 */
export type FeedItem = {
  id: string;
  title: string;
  /** Entreprise / source éventuelle. */
  subtitle?: string;
  /** Catégorie d'affichage. */
  category: string;
  summary: string;
  icon?: string;
  date?: string;
  readingTime?: string;
  deadline?: string;
  /** Statut (opportunités) : « Candidatures ouvertes » / « Bientôt clôturé » / « Terminé ». */
  status?: string;
  /** Petites étiquettes affichées (type, ville, mode, domaine…). */
  meta?: string[];
  /** Mots-clés pour le filtrage. */
  tags: string[];
  /** Lien externe éventuel. */
  href?: string;
};

export type FeedAction = { label: string; href: string; primary?: boolean };

export type Feed = {
  eyebrow: string;
  title: string;
  intro: string;
  /** Page dédiée (pour le lien « Voir tout »). */
  pageHref: string;
  ctaLabel: string;
  ctaHref: string;
  /** Bouton secondaire éventuel sur les cartes (ex. « Voir détails »). */
  secondaryCtaLabel?: string;
  filters: string[];
  actions?: FeedAction[];
  items: FeedItem[];
};

/* ─────────────────────────── NEWS ─────────────────────────── */
const NEWS: Feed = {
  eyebrow: "IPMD News",
  title: "Actualités Digital, IA & Métiers d'avenir",
  intro:
    "Décryptages, tendances, innovations et annonces IPMD pour comprendre les métiers de demain et rester à la pointe du digital et de l'IA.",
  pageHref: "/news",
  ctaLabel: "Lire la suite",
  ctaHref: "/contact",
  filters: ["Toutes", "Actualités IPMD", "Intelligence artificielle", "Digital & métiers", "Innovation", "Événements", "Conseils carrière", "Bootcamps & formations"],
  items: [
    { id: "n1", title: "L'IA générative transforme les métiers du digital", category: "Intelligence artificielle", date: "Juin 2026", readingTime: "3 min", summary: "Tour d'horizon des usages qui transforment le travail et les compétences attendues.", icon: "🤖", tags: ["Intelligence artificielle"] },
    { id: "n2", title: "Les métiers les plus demandés dans le digital et l'IA", category: "Digital & métiers", date: "Juin 2026", readingTime: "4 min", summary: "Quels profils recrutent le plus en 2026 et comment s'y préparer concrètement.", icon: "📊", tags: ["Digital & métiers", "Conseils carrière"] },
    { id: "n3", title: "IPMD enrichit son catalogue de bootcamps certifiants", category: "Bootcamps & formations", date: "Mai 2026", readingTime: "2 min", summary: "De nouveaux parcours pour rester à la pointe de l'employabilité.", icon: "📣", tags: ["Bootcamps & formations", "Actualités IPMD"] },
    { id: "n4", title: "Le digital, moteur de croissance en Afrique", category: "Digital & métiers", date: "Mai 2026", readingTime: "5 min", summary: "Pourquoi les compétences numériques sont plus que jamais stratégiques.", icon: "🌍", tags: ["Digital & métiers", "Innovation"] },
    { id: "n5", title: "Pourquoi les professionnels doivent se former à l'IA", category: "Conseils carrière", date: "Avril 2026", readingTime: "4 min", summary: "L'IA n'est plus optionnelle : comment l'intégrer à son métier dès maintenant.", icon: "🎯", tags: ["Conseils carrière", "Intelligence artificielle"] },
    { id: "n6", title: "Comment choisir son parcours Digital & IA", category: "Conseils carrière", date: "Avril 2026", readingTime: "5 min", summary: "Diplôme ou bootcamp, jour ou soir : le guide pour choisir selon votre projet.", icon: "🧭", tags: ["Conseils carrière", "Bootcamps & formations"] },
    { id: "n7", title: "Les technologies émergentes à suivre cette année", category: "Innovation", date: "Mars 2026", readingTime: "4 min", summary: "IA agentique, no-code, edge computing… ce qui compte vraiment.", icon: "🚀", tags: ["Innovation", "Intelligence artificielle"] },
    { id: "n8", title: "Retour sur le Hackathon IA IPMD", category: "Événements", date: "Mars 2026", readingTime: "3 min", summary: "48h d'innovation : les projets et les talents qui ont marqué l'édition.", icon: "🏆", tags: ["Événements", "Actualités IPMD"] },
  ],
};

/* ─────────────────────────── JOBS ─────────────────────────── */
const JOBS: Feed = {
  eyebrow: "IPMD Jobs",
  title: "Stages, emplois & missions dans le digital et l'IA",
  intro:
    "Accédez aux offres de stages, emplois, alternances et missions freelance proposées par IPMD, ses entreprises partenaires et le réseau UltraJobs.",
  pageHref: "/jobs",
  ctaLabel: "Postuler",
  ctaHref: "/contact",
  secondaryCtaLabel: "Voir détails",
  filters: ["Toutes", "Stage", "Emploi", "Alternance", "Freelance", "Présentiel", "À distance", "Hybride", "Abidjan", "Marketing digital", "Design", "Développement", "Data", "IA", "Support client"],
  actions: [
    { label: "Déposer mon CV", href: "/contact", primary: true },
    { label: "Entreprise ? Publier une offre", href: "/contact" },
  ],
  items: [
    { id: "j1", title: "Community Manager", subtitle: "Agence digitale", category: "Alternance", meta: ["Alternance", "Abidjan", "Présentiel", "Marketing digital"], summary: "Animer les réseaux sociaux et créer du contenu engageant.", icon: "📣", tags: ["Alternance", "Présentiel", "Abidjan", "Marketing digital"] },
    { id: "j2", title: "Designer graphique", subtitle: "Studio créatif", category: "Freelance", meta: ["Freelance", "À distance", "Design"], summary: "Créer des identités visuelles fortes pour des marques variées.", icon: "🎨", tags: ["Freelance", "À distance", "Design"] },
    { id: "j3", title: "Développeur web junior", subtitle: "TechCorp", category: "Emploi", meta: ["CDI", "Abidjan", "Hybride", "Développement"], summary: "Rejoindre une équipe produit et développer des applications modernes.", icon: "💻", tags: ["Emploi", "Hybride", "Abidjan", "Développement"] },
    { id: "j4", title: "Data Analyst junior", subtitle: "Groupe bancaire", category: "Stage", meta: ["Stage", "Abidjan", "Présentiel", "Data"], summary: "Analyser les données pour appuyer la prise de décision.", icon: "📊", tags: ["Stage", "Présentiel", "Abidjan", "Data"] },
    { id: "j5", title: "Assistant marketing digital", subtitle: "PME en croissance", category: "Stage", meta: ["Stage", "Abidjan", "Hybride", "Marketing digital"], summary: "Appuyer les campagnes, le contenu et le suivi des performances.", icon: "📈", tags: ["Stage", "Hybride", "Abidjan", "Marketing digital"] },
    { id: "j6", title: "Support client digital", subtitle: "Centre de services", category: "Emploi", meta: ["CDI", "Abidjan", "Présentiel", "Support client"], summary: "Offrir un service client réactif et professionnel en ligne.", icon: "💬", tags: ["Emploi", "Présentiel", "Abidjan", "Support client"] },
    { id: "j7", title: "Traffic Manager junior", subtitle: "Agence média", category: "Emploi", meta: ["CDI", "Abidjan", "Hybride", "Marketing digital"], summary: "Piloter des campagnes Meta & Google rentables.", icon: "🎯", tags: ["Emploi", "Hybride", "Abidjan", "Marketing digital"] },
    { id: "j8", title: "Assistant IA métier", subtitle: "Startup IA", category: "Alternance", meta: ["Alternance", "À distance", "IA"], summary: "Automatiser des tâches et accélérer la production avec l'IA.", icon: "🤖", tags: ["Alternance", "À distance", "IA"] },
    { id: "j9", title: "UI Designer junior", subtitle: "Studio produit", category: "Emploi", meta: ["CDI", "Abidjan", "Hybride", "Design"], summary: "Concevoir des interfaces fluides et désirables.", icon: "🖌️", tags: ["Emploi", "Hybride", "Abidjan", "Design"] },
    { id: "j10", title: "Assistant e-commerce", subtitle: "Boutique en ligne", category: "Freelance", meta: ["Freelance", "À distance", "Marketing digital"], summary: "Gérer une boutique en ligne et booster les ventes.", icon: "🛒", tags: ["Freelance", "À distance", "Marketing digital"] },
  ],
};

/* ───────────────────────── OPPORTUNITIES ───────────────────────── */
const OPPORTUNITIES: Feed = {
  eyebrow: "IPMD Opportunities",
  title: "Bourses, concours & opportunités internationales",
  intro:
    "Découvrez les bourses, concours, hackathons, incubateurs, appels à projets et programmes internationaux pour développer vos compétences, votre réseau et votre avenir.",
  pageHref: "/opportunities",
  ctaLabel: "Candidater",
  ctaHref: "/contact",
  secondaryCtaLabel: "En savoir plus",
  filters: ["Toutes", "Bourses", "Concours", "Hackathons", "Appels à projets", "Incubateurs", "Financements", "Programmes internationaux", "Entrepreneuriat", "Femmes & digital", "Jeunes talents"],
  actions: [
    { label: "Proposer une opportunité", href: "/contact", primary: true },
    { label: "Être alerté", href: "/contact" },
  ],
  items: [
    { id: "o1", title: "Bourse d'études digitale 2026", category: "Bourses", deadline: "Clôture août 2026", status: "Candidatures ouvertes", meta: ["Côte d'Ivoire", "Étudiants"], summary: "Financez votre formation grâce à notre dispositif de bourses.", icon: "🎓", tags: ["Bourses", "Jeunes talents", "Financements"] },
    { id: "o2", title: "Hackathon IA IPMD", category: "Hackathons", status: "Candidatures ouvertes", meta: ["Abidjan", "Tous niveaux"], summary: "48h pour concevoir une solution IA en équipe et remporter des prix.", icon: "💡", tags: ["Hackathons", "Jeunes talents"] },
    { id: "o3", title: "Appel à projets — startups tech", category: "Appels à projets", status: "Candidatures ouvertes", meta: ["Afrique de l'Ouest", "Entrepreneurs"], summary: "Présentez votre projet et bénéficiez d'un accompagnement dédié.", icon: "🚀", tags: ["Appels à projets", "Entrepreneuriat"] },
    { id: "o4", title: "Programme d'incubation IPMD", category: "Incubateurs", status: "Candidatures ouvertes", meta: ["Abidjan", "Porteurs de projet"], summary: "Transformez votre idée en entreprise avec notre incubateur.", icon: "🌱", tags: ["Incubateurs", "Entrepreneuriat"] },
    { id: "o5", title: "Concours d'innovation numérique", category: "Concours", deadline: "Bientôt clôturé", status: "Bientôt clôturé", meta: ["National", "Jeunes"], summary: "Tentez votre chance et gagnez un accompagnement sur mesure.", icon: "🏆", tags: ["Concours", "Jeunes talents"] },
    { id: "o6", title: "Programmes internationaux", category: "Programmes internationaux", status: "Candidatures ouvertes", meta: ["International", "Tous"], summary: "Mobilité, partenariats et opportunités à l'international.", icon: "✈️", tags: ["Programmes internationaux"] },
    { id: "o7", title: "Bourse femmes & digital", category: "Bourses", status: "Candidatures ouvertes", meta: ["Côte d'Ivoire", "Femmes"], summary: "Un coup de pouce dédié aux femmes qui se lancent dans le numérique.", icon: "🌸", tags: ["Bourses", "Femmes & digital", "Financements"] },
    { id: "o8", title: "Challenge jeunes talents IA", category: "Concours", status: "Candidatures ouvertes", meta: ["Abidjan", "18-30 ans"], summary: "Un challenge pour révéler les jeunes talents de l'IA.", icon: "⭐", tags: ["Concours", "Jeunes talents", "Hackathons"] },
  ],
};

const NEWS_BY_UNIVERSE: Record<string, Feed> = { home: NEWS };
const JOBS_BY_UNIVERSE: Record<string, Feed> = { home: JOBS };
const OPPORTUNITIES_BY_UNIVERSE: Record<string, Feed> = { home: OPPORTUNITIES };

export const getNews = (u: string): Feed | null => NEWS_BY_UNIVERSE[u] ?? null;
export const getJobs = (u: string): Feed | null => JOBS_BY_UNIVERSE[u] ?? null;
export const getOpportunities = (u: string): Feed | null => OPPORTUNITIES_BY_UNIVERSE[u] ?? null;
