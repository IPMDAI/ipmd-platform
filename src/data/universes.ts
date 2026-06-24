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
      "Formations initiales diplômantes pour les bacheliers, étudiants et jeunes en formation. Parcours en Licence, Bachelor et Master dans les métiers du digital, de l'informatique, de l'IA, du management et de l'innovation.",
    kind: "diplome",
    audience: "Bacheliers, étudiants, jeunes en formation initiale",
    target: "Bacheliers & Étudiants",
    credentials: ["Licence", "Bachelor", "Master"],
    subdomain: "campus.ipmd.pro",
    href: "/campus",
    icon: "🎓",
    image: "/campus.png",
  },
  {
    id: "ultrajobs",
    name: "UltraJobs",
    tagline: "Bootcamps jeunes à l'ère de l'IA",
    description:
      "Bootcamps certifiants, intensifs et 100 % pratiques pour les jeunes de 18 à 30 ans : apprendre vite, maîtriser les outils digitaux et l'IA, puis obtenir un certificat valorisable pour l'emploi, le freelance ou un projet.",
    kind: "certificat",
    audience:
      "Jeunes 18-30 ans, étudiants, chercheurs d'emploi, jeunes entrepreneurs, reconversion rapide",
    target: "Jeunes & Chercheurs d'emploi",
    credentials: ["15 bootcamps certifiants"],
    subdomain: "ultrajobs.ipmd.pro",
    href: "/ultrajobs",
    icon: "🚀",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "professionnel",
    name: "IPMD Pro",
    tagline: "Diplômes — formation continue",
    description:
      "Formations diplômantes pour les personnes en activité qui souhaitent monter en compétence sans interrompre leur parcours professionnel. Programmes adaptés aux salariés, cadres, entrepreneurs et professionnels en reconversion.",
    kind: "diplome",
    audience: "Professionnels, salariés, cadres, entrepreneurs",
    target: "Salariés & Professionnels",
    credentials: ["Licence", "Bachelor", "Master", "MBA"],
    subdomain: "pro.ipmd.pro",
    href: "/professionnel",
    icon: "💼",
    image: "/IPMD-Pro.png",
  },
  {
    id: "ultraboost",
    name: "UltraBoost",
    tagline: "Bootcamps professionnels — certificats pro",
    description:
      "Bootcamps intensifs pour accélérer la montée en compétence des professionnels dans le digital, l'IA, le business, la productivité et la performance.",
    kind: "certificat",
    audience: "Professionnels, salariés, entrepreneurs, freelances, cadres",
    target: "Professionnels & Cadres",
    credentials: ["15 bootcamps certifiants"],
    subdomain: "ultraboost.ipmd.pro",
    href: "/ultraboost",
    icon: "⚡",
    image:
      "https://images.unsplash.com/photo-1552581234-26160f608093?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "gouvernance",
    name: "IPMD Executive",
    tagline: "Diplômes exécutifs",
    description:
      "Formations exécutives destinées aux dirigeants, managers, entrepreneurs et décideurs qui pilotent la transformation digitale, l'IA, la stratégie et la gouvernance numérique.",
    kind: "diplome",
    audience: "Dirigeants, managers, entrepreneurs, décideurs",
    target: "Dirigeants & Managers",
    credentials: ["Executive Master", "Executive MBA", "DBA"],
    subdomain: "executive.ipmd.pro",
    href: "/gouvernance",
    icon: "🏛️",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "ultraexecutive",
    name: "UltraExecutive",
    tagline: "Bootcamps premium — dirigeants",
    description:
      "Bootcamps premium pour les dirigeants, entrepreneurs et décideurs souhaitant renforcer leurs compétences en transformation digitale, IA, stratégie, leadership et gouvernance.",
    kind: "certificat",
    audience: "Dirigeants, managers, entrepreneurs, hauts responsables",
    target: "Dirigeants & Décideurs",
    credentials: ["10 bootcamps premium"],
    subdomain: "ultraexecutive.ipmd.pro",
    href: "/ultraexecutive",
    icon: "👑",
    image: "/UltraExecutive.png",
  },
];

export const getUniverse = (id: string): Universe | undefined =>
  universes.find((u) => u.id === id);

/** Nom lisible d'un univers (id → « IPMD Campus »). */
export const universeNameById: Record<string, string> = Object.fromEntries(
  universes.map((u) => [u.id, u.name])
);

/** Rôle apprenant proposé par défaut selon l'univers de formation. */
export function roleForUniverse(id: string): string {
  if (id === "professionnel" || id === "ultraboost") return "professionnel";
  if (id === "gouvernance" || id === "ultraexecutive") return "dirigeant";
  return "etudiant"; // campus, ultrajobs
}

/** Options d'univers pour les sélecteurs (id + nom). */
export const UNIVERSE_OPTIONS = universes.map((u) => ({
  value: u.id,
  label: u.name,
}));
