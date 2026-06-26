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
  /** Bouton d'action principal. */
  cta: { label: string; href: string };
};

export const hubs: Hub[] = [
  {
    id: "seniorshub",
    href: "/seniorshub",
    name: "SeniorsHub",
    eyebrow: "Bootcamps & montée en compétences",
    tagline: "Bootcamps IA pour adultes & professionnels",
    description:
      "Des bootcamps intensifs et 100 % pratiques pour monter en compétences à l'ère de l'IA, quel que soit votre parcours.",
    icon: "🚀",
    items: [
      { title: "Bootcamp IA & e-business", description: "Maîtriser l'intelligence artificielle et le business en ligne." },
      { title: "Bootcamps digitalisation des compétences", description: "Digitaliser et moderniser vos compétences métiers." },
      { title: "Bootcamps IA", description: "Comprendre, utiliser et intégrer l'IA dans votre quotidien professionnel." },
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
      "Le pôle qui connecte nos étudiants au marché de l'emploi et accompagne les entreprises dans leurs recrutements.",
    icon: "🤝",
    items: [
      { title: "Mise en relation avec les entreprises" },
      { title: "Placement en stage et en emploi" },
      { title: "Accompagnement à l'insertion professionnelle" },
      { title: "Présélection de candidats pour les entreprises" },
      { title: "Sessions de recrutement avec nos entreprises partenaires" },
    ],
    cta: { label: "Devenir entreprise partenaire", href: "/contact" },
  },
];

export const getHub = (id: string): Hub | undefined => hubs.find((h) => h.id === id);
