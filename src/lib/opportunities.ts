/**
 * « Opportunités pour vous » — catalogue curé des formations IPMD présentées au
 * parent (cross-sell), SÉPARÉ du suivi de l'enfant et affiché uniquement avec son
 * consentement (comm_opt_commercial). Liens vers les pages publiques (pas de table).
 */
export type Opportunity = {
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  tag: string;
};

export const OPPORTUNITIES: Opportunity[] = [
  {
    title: "IPMD Pro",
    subtitle: "Diplômes en formation continue, pensés pour les salariés en activité.",
    href: "/professionnel",
    icon: "💼",
    tag: "Formation continue",
  },
  {
    title: "IPMD Executive",
    subtitle: "Diplômes exécutifs pour cadres dirigeants et décideurs.",
    href: "/gouvernance",
    icon: "🎯",
    tag: "Dirigeants",
  },
  {
    title: "UltraBoost",
    subtitle: "Bootcamps intensifs pour professionnels et cadres qui veulent monter en compétences.",
    href: "/ultraboost",
    icon: "🚀",
    tag: "Bootcamp",
  },
  {
    title: "UltraExecutive",
    subtitle: "Bootcamps premium, format court et exclusif pour dirigeants.",
    href: "/ultraexecutive",
    icon: "⭐",
    tag: "Bootcamp premium",
  },
  {
    title: "SeniorsHub",
    subtitle: "Parcours dédiés aux profils seniors et expérimentés.",
    href: "/seniorshub",
    icon: "🧭",
    tag: "Seniors",
  },
  {
    title: "Certificats & IA",
    subtitle: "Certifications métiers du digital et de l'intelligence artificielle.",
    href: "/formations",
    icon: "📜",
    tag: "Certification",
  },
];
