/**
 * HubSkills — pôle qui regroupe les temps d'accompagnement et de
 * développement (rencontres, recherche, pitch, compétences, soft skills,
 * incubation, VISIONPRENEUR…), par univers.
 *
 * 👉 Pour gérer : modifier les tableaux ci-dessous.
 */
export type HubSkillItem = {
  icon: string;
  title: string;
  description: string;
};

export type HubSkills = {
  eyebrow: string;
  title: string;
  intro: string;
  items: HubSkillItem[];
};

export const HUBSKILLS_BY_UNIVERSE: Record<string, HubSkills> = {
  ultrajobs: {
    eyebrow: "HubSkills",
    title: "Le hub qui booste vos compétences & votre réseau",
    intro:
      "Au-delà des bootcamps, HubSkills réunit tout ce qui fait grandir : rencontres, recherche, pitch, soft skills, incubation et accompagnement entrepreneurial.",
    items: [
      { icon: "🤝", title: "Rencontres & networking", description: "Des rendez-vous réguliers pour rencontrer pros, recruteurs et pairs, et développer votre réseau." },
      { icon: "🔬", title: "Recherche & veille", description: "Veille techno, tendances IA et exploration de nouveaux outils pour rester à la pointe." },
      { icon: "🎤", title: "Pitch & prise de parole", description: "Apprenez à pitcher votre projet ou votre profil avec impact, devant un jury ou des investisseurs." },
      { icon: "🧠", title: "Compétences techniques", description: "Renforcez vos compétences digitales clés via des ateliers et des challenges 100 % pratiques." },
      { icon: "💬", title: "Soft Skills", description: "Communication, travail d'équipe, leadership et savoir-être pour réussir en entreprise." },
      { icon: "🚀", title: "Incubation", description: "Un accompagnement pour transformer votre idée en projet concret et le faire grandir." },
      { icon: "🌟", title: "VISIONPRENEUR", description: "Le programme des entrepreneurs visionnaires : posture, vision claire et passage à l'action." },
      { icon: "🎓", title: "Mentorat & communauté", description: "Des mentors expérimentés et une communauté active pour avancer plus vite, ensemble." },
    ],
  },
};

/** Renvoie le HubSkills d'un univers (null si aucun). */
export function getHubSkills(universeId: string): HubSkills | null {
  return HUBSKILLS_BY_UNIVERSE[universeId] ?? null;
}
