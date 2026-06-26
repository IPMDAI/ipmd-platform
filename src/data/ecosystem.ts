/**
 * Pôles de l'écosystème IPMD, au-delà des 6 univers de formation diplômante :
 * SeniorsHub (bootcamps), Hub (recherche/incubation), Skills (insertion/emploi).
 */
export type HubItem = { title: string; description?: string };

export type Hub = {
  id: string;
  /** Route publique, ex. "/seniorshub". */
  href: string;
  name: string;
  eyebrow: string;
  tagline: string;
  description: string;
  icon: string;
  items: HubItem[];
  /** Badge optionnel (ex. « Certificats »). */
  badge?: string;
  /** Bouton d'action principal. */
  cta: { label: string; href: string };
};

export const hubs: Hub[] = [
  {
    id: "seniorshub",
    href: "/seniorshub",
    name: "SeniorsHub",
    eyebrow: "Bootcamps certifiants — IA, digital & valorisation d'expertise",
    tagline: "Valoriser, transmettre et monétiser l'expertise des seniors & professionnels expérimentés",
    description:
      "SeniorsHub s'adresse aux seniors, retraités et professionnels expérimentés qui souhaitent apprendre le digital, l'intelligence artificielle et l'e-business, afin de valoriser, transmettre et monétiser leur expertise.",
    icon: "🌟",
    badge: "Certificats",
    items: [
      { title: "Bootcamp IA & e-business", description: "Maîtriser l'intelligence artificielle et le business en ligne pour créer de nouveaux revenus." },
      { title: "Digitalisation des compétences", description: "Digitaliser et valoriser votre expertise métier acquise au fil des années." },
      { title: "Bootcamp IA", description: "Comprendre et utiliser l'IA pour rester actif et pertinent dans le numérique." },
    ],
    cta: { label: "Demander des informations", href: "/demande-info" },
  },
  {
    id: "hub",
    href: "/hub",
    name: "IPMD Hub",
    eyebrow: "Innovation & accompagnement",
    tagline: "Recherche · Incubation · Mise en relation",
    description:
      "Un espace d'innovation qui soutient la recherche appliquée, l'incubation de projets et la mise en relation des talents et des entreprises.",
    icon: "💡",
    items: [
      { title: "Recherche", description: "Veille et projets de recherche appliquée sur le digital et l'IA." },
      { title: "Incubation", description: "Accompagnement des porteurs de projets, startups et innovateurs." },
      { title: "Mise en relation", description: "Connecter étudiants, experts, mentors et entreprises." },
    ],
    cta: { label: "Nous contacter", href: "/contact" },
  },
  {
    id: "skills",
    href: "/skills",
    name: "IPMD Skills",
    eyebrow: "Employabilité & insertion",
    tagline: "Stage · Emploi · Recrutement",
    description:
      "IPMD Skills est le pôle employabilité d'IPMD. Il connecte les étudiants, diplômés et jeunes talents aux entreprises à travers le stage, l'emploi, la présélection de candidats et les sessions de recrutement.",
    icon: "🤝",
    items: [
      { title: "Placement en stage", description: "Nous accompagnons les étudiants dans la recherche de stages adaptés à leur formation et à leur projet professionnel." },
      { title: "Placement en emploi", description: "Nous connectons les diplômés et jeunes talents aux entreprises qui recrutent." },
      { title: "Publication d'offres", description: "Les entreprises partenaires peuvent publier leurs offres de stage, d'emploi ou de mission." },
      { title: "Présélection de candidats", description: "Nous aidons les entreprises à recevoir des profils déjà filtrés selon le poste, le niveau et les compétences recherchées." },
      { title: "Tests de compétences", description: "Évaluation pratique des candidats : bureautique, digital, IA, communication, comptabilité, vente, etc." },
      { title: "Sessions de recrutement", description: "Organisation de journées ou campagnes de recrutement avec les entreprises partenaires." },
    ],
    cta: { label: "Devenir entreprise partenaire", href: "/contact" },
  },
];

// Pôle « Entreprise / Organisation » — affiché comme 8e univers, page dédiée /entreprise.
hubs.push({
  id: "entreprise",
  href: "/entreprise",
  name: "Entreprise / Organisation",
  eyebrow: "Entreprises & organisations",
  tagline: "Former · Recruter · Collaborer",
  description:
    "L'IPMD accompagne les entreprises et organisations : formez vos équipes aux métiers du digital et de l'IA, recrutez des talents et nouez des partenariats.",
  icon: "🏢",
  badge: "Entreprises",
  items: [
    { title: "Former vos équipes", description: "Formations et bootcamps sur mesure en digital, IA, data, management… pour vos collaborateurs." },
    { title: "Recruter des talents", description: "Accédez à nos étudiants et diplômés via le pôle IPMD Skills (stage, emploi, présélection)." },
    { title: "Sessions de recrutement", description: "Organisation de journées et campagnes de recrutement avec vos équipes RH." },
    { title: "Partenariat & collaboration", description: "Projets communs, interventions d'experts, accueil de stagiaires, innovation avec IPMD Hub." },
  ],
  cta: { label: "Devenir partenaire", href: "/contact" },
});

export const getHub = (id: string): Hub | undefined => hubs.find((h) => h.id === id);
