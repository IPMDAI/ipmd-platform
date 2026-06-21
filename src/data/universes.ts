import type { Universe } from "@/types";

/**
 * Les 6 grands univers IPMD. La structure est volontairement ouverte :
 * pour ajouter un 7e univers plus tard, il suffit d'ajouter une entrée ici
 * (et l'ID correspondant dans `UniverseId`).
 */
export const universes: Universe[] = [
  {
    id: "campus",
    name: "IPMD Campus",
    tagline: "Diplômes — formation initiale",
    description:
      "Pour les bacheliers, étudiants et jeunes en formation initiale. Licence, Bachelor et Master dans les métiers du digital, avec 80 % de pratique.",
    kind: "diplome",
    audience: "Bacheliers, étudiants, jeunes en formation initiale",
    credentials: ["Licence", "Bachelor", "Master"],
    subdomain: "campus.ipmd.pro",
    href: "/campus",
    icon: "🎓",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "ultrajobs",
    name: "UltraJobs",
    tagline: "Bootcamps jeunes — certificats job",
    description:
      "Des bootcamps courts, pratiques et orientés emploi qui forment rapidement les jeunes aux compétences digitales recherchées par les entreprises.",
    kind: "certificat",
    audience: "Jeunes, étudiants, chercheurs d'emploi",
    credentials: ["10 bootcamps certifiants"],
    subdomain: "ultrajobs.ipmd.pro",
    href: "/ultrajobs",
    icon: "🚀",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "professionnel",
    name: "IPMD Professionnel",
    tagline: "Diplômes — pour les actifs",
    description:
      "Licence, Bachelor, Master et MBA conçus pour les professionnels, salariés, cadres et entrepreneurs qui veulent monter en compétence sans quitter leur poste.",
    kind: "diplome",
    audience: "Professionnels, salariés, cadres, entrepreneurs",
    credentials: ["Licence", "Bachelor", "Master", "MBA"],
    subdomain: "pro.ipmd.pro",
    href: "/professionnel",
    icon: "💼",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "ultraboost",
    name: "UltraBoost",
    tagline: "Bootcamps professionnels — certificats pro",
    description:
      "Des bootcamps courts et intensifs qui accélèrent la montée en compétence des professionnels dans le digital, l'IA, le business et la performance.",
    kind: "certificat",
    audience: "Professionnels, salariés, entrepreneurs, freelances, cadres",
    credentials: ["15 bootcamps certifiants"],
    subdomain: "ultraboost.ipmd.pro",
    href: "/ultraboost",
    icon: "⚡",
    image:
      "https://images.unsplash.com/photo-1552581234-26160f608093?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "gouvernance",
    name: "IPMD Gouvernance",
    tagline: "Diplômes exécutifs",
    description:
      "Master Exécutif, MBA Exécutif et DBA pour les dirigeants, managers et décideurs qui pilotent la transformation digitale et la gouvernance par l'IA.",
    kind: "diplome",
    audience: "Dirigeants, managers, entrepreneurs, décideurs",
    credentials: ["Master Exécutif", "MBA Exécutif", "DBA"],
    subdomain: "executive.ipmd.pro",
    href: "/gouvernance",
    icon: "🏛️",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "ultraexecutive",
    name: "UltraExecutive",
    tagline: "Bootcamps dirigeants — certificats gouvernance",
    description:
      "Des bootcamps premium qui accompagnent les dirigeants dans la transformation digitale, l'intelligence artificielle, la stratégie et la gouvernance.",
    kind: "certificat",
    audience: "Dirigeants, managers, entrepreneurs, hauts responsables",
    credentials: ["10 bootcamps premium"],
    subdomain: "ultraexecutive.ipmd.pro",
    href: "/ultraexecutive",
    icon: "👑",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop",
  },
];

export const getUniverse = (id: string): Universe | undefined =>
  universes.find((u) => u.id === id);
