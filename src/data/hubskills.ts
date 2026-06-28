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
  /** Nom du hub (sert d'étiquette d'onglet) : HubSkills, HubPro, HubSavoir… */
  eyebrow: string;
  /** Icône de l'onglet. */
  icon?: string;
  title: string;
  intro: string;
  items: HubSkillItem[];
};

export const HUBSKILLS_BY_UNIVERSE: Record<string, HubSkills> = {
  ultrajobs: {
    eyebrow: "HubSkills",
    icon: "💡",
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

  ultraboost: {
    eyebrow: "HubPro",
    icon: "💼",
    title: "Le hub des professionnels qui montent en puissance",
    intro:
      "Au-delà des bootcamps, HubPro réunit l'essentiel pour accélérer votre carrière : networking, veille, masterclass, certifications et accompagnement.",
    items: [
      { icon: "🤝", title: "Rencontres & networking pro", description: "Des rendez-vous réguliers avec des experts, recruteurs et pairs pour développer votre réseau professionnel." },
      { icon: "🔬", title: "Veille & innovation", description: "Tendances IA, nouveaux outils et bonnes pratiques pour rester compétitif dans votre métier." },
      { icon: "🎓", title: "Masterclass expertes", description: "Des sessions animées par des professionnels confirmés sur des sujets de pointe." },
      { icon: "📜", title: "Certifications & compétences", description: "Validez et renforcez vos compétences avec des certifications reconnues." },
      { icon: "💬", title: "Soft skills & leadership", description: "Communication, management et posture pour évoluer vers des postes à responsabilité." },
      { icon: "🚀", title: "Accompagnement carrière", description: "Coaching, CV, entretien et stratégie pour booster votre évolution professionnelle." },
      { icon: "🌐", title: "Communauté & alumni", description: "Un réseau d'anciens et de pros actifs pour s'entraider et saisir des opportunités." },
      { icon: "🎯", title: "Mentorat", description: "Des mentors expérimentés pour vous guider dans vos choix de carrière." },
    ],
  },

  seniorshub: {
    eyebrow: "HubSavoir",
    icon: "📚",
    title: "Le hub du savoir, de la transmission et de la convivialité",
    intro:
      "HubSavoir réunit les seniors et professionnels expérimentés autour du partage : ateliers, rencontres, compétences numériques et accompagnement, à votre rythme.",
    items: [
      { icon: "🤝", title: "Rencontres & convivialité", description: "Des moments d'échange chaleureux pour apprendre et partager en toute sérénité." },
      { icon: "🧩", title: "Ateliers découverte", description: "Numérique, IA et outils du quotidien, expliqués simplement et pas à pas." },
      { icon: "🪶", title: "Transmission & partage", description: "Valorisez et transmettez votre expérience aux nouvelles générations." },
      { icon: "💻", title: "Compétences numériques", description: "Maîtrisez smartphone, internet, messagerie et démarches en ligne en confiance." },
      { icon: "🤲", title: "Accompagnement personnalisé", description: "Un suivi adapté à votre rythme et à vos besoins, sans pression." },
      { icon: "🌷", title: "Communauté & entraide", description: "Une communauté bienveillante pour avancer ensemble et rompre l'isolement." },
      { icon: "🎤", title: "Conférences & culture digitale", description: "Des rencontres pour comprendre le monde numérique et ses opportunités." },
      { icon: "🔄", title: "Mentorat intergénérationnel", description: "Apprendre des jeunes, leur transmettre : un échange dans les deux sens." },
    ],
  },

  ultraexecutive: {
    eyebrow: "HubExecutive",
    icon: "👔",
    title: "Le cercle des dirigeants qui anticipent et décident",
    intro:
      "HubExecutive réunit dirigeants et décideurs autour de l'essentiel : networking C-level, veille stratégique, masterclass, gouvernance et accompagnement de haut niveau.",
    items: [
      { icon: "🤝", title: "Cercle de dirigeants", description: "Un networking C-level confidentiel pour échanger entre pairs et nouer des alliances." },
      { icon: "🔭", title: "Veille stratégique & prospective", description: "Anticipez les ruptures IA, marché et réglementaires pour décider avec longueur d'avance." },
      { icon: "🎓", title: "Masterclass & keynotes", description: "Des interventions d'experts et de leaders sur les enjeux de transformation." },
      { icon: "🏛️", title: "Gouvernance & transformation", description: "Piloter la stratégie data/IA et la conduite du changement à l'échelle de l'organisation." },
      { icon: "💬", title: "Leadership & influence", description: "Posture, prise de parole et soft power pour incarner et fédérer." },
      { icon: "🧠", title: "Think tank & co-développement", description: "Résoudre vos défis de dirigeant en intelligence collective entre pairs." },
      { icon: "🎯", title: "Mentorat & advisory", description: "Un accompagnement par des dirigeants et advisors expérimentés." },
      { icon: "🥂", title: "Événements VIP & immersions", description: "Des rendez-vous d'exception (retraites, dîners, immersions) propices au réseautage de haut niveau." },
    ],
  },

  campus: {
    eyebrow: "HubCampus",
    icon: "🎓",
    title: "Le hub de la vie étudiante à l'IPMD",
    intro:
      "Au-delà des cours, HubCampus réunit tout ce qui fait l'expérience étudiante : clubs, événements, sport, mentorat, projets et insertion professionnelle.",
    items: [
      { icon: "🎉", title: "Vie de campus & événements", description: "Soirées, journées d'intégration et temps forts qui rythment l'année." },
      { icon: "🤝", title: "Clubs & associations", description: "Rejoignez des clubs (tech, design, entrepreneuriat…) et créez le vôtre." },
      { icon: "⚽", title: "Sport & bien-être", description: "Activités sportives et initiatives bien-être pour s'épanouir." },
      { icon: "🎯", title: "Mentorat & tutorat", description: "Un accompagnement par des aînés et des enseignants pour réussir." },
      { icon: "🚀", title: "Hackathons & projets", description: "Des défis et projets concrets pour appliquer ce que vous apprenez." },
      { icon: "🧭", title: "Orientation & carrière", description: "Stages, alternance et insertion : un accompagnement vers l'emploi." },
      { icon: "🌐", title: "Communauté & alumni", description: "Un réseau d'étudiants et de diplômés actifs pour avancer ensemble." },
      { icon: "🎤", title: "Conférences & culture", description: "Des intervenants inspirants et des rencontres ouvertes sur le monde." },
    ],
  },

  professionnel: {
    eyebrow: "HubCarrière",
    icon: "📈",
    title: "Le hub qui fait avancer votre carrière",
    intro:
      "HubCarrière réunit l'essentiel pour les professionnels en formation : networking, coaching, certifications, mentorat et opportunités d'emploi.",
    items: [
      { icon: "🤝", title: "Networking professionnel", description: "Des rencontres régulières avec pros, recruteurs et pairs." },
      { icon: "🧭", title: "Coaching carrière", description: "CV, LinkedIn, entretien et stratégie d'évolution professionnelle." },
      { icon: "📜", title: "Certifications & compétences", description: "Renforcez et validez vos compétences avec des certifications reconnues." },
      { icon: "🎓", title: "Masterclass & ateliers", description: "Des sessions pratiques animées par des experts du métier." },
      { icon: "🎯", title: "Mentorat", description: "Des mentors expérimentés pour vous guider dans vos choix." },
      { icon: "💼", title: "Forum emploi & alternance", description: "Stages, alternance et offres via notre réseau de partenaires." },
      { icon: "🌐", title: "Communauté & alumni", description: "Un réseau actif de professionnels et d'anciens pour s'entraider." },
      { icon: "🚀", title: "Entrepreneuriat", description: "Un accompagnement pour ceux qui veulent créer leur activité." },
    ],
  },

  gouvernance: {
    eyebrow: "HubLeaders",
    icon: "👑",
    title: "Le cercle des dirigeants & décideurs",
    intro:
      "HubLeaders réunit dirigeants et décideurs autour de la stratégie : networking C-level, conférences, think tank, gouvernance et accompagnement de haut niveau.",
    items: [
      { icon: "🤝", title: "Cercle de dirigeants", description: "Un networking C-level confidentiel pour échanger entre pairs." },
      { icon: "🔭", title: "Veille & prospective", description: "Anticiper les ruptures IA, marché et réglementaires." },
      { icon: "🎓", title: "Conférences & masterclass", description: "Des interventions d'experts sur les enjeux de transformation." },
      { icon: "🏛️", title: "Gouvernance & stratégie", description: "Piloter la stratégie data/IA et la conduite du changement." },
      { icon: "🧠", title: "Think tank & co-développement", description: "Résoudre ses défis de dirigeant en intelligence collective." },
      { icon: "💬", title: "Leadership & influence", description: "Posture, prise de parole et soft power pour fédérer." },
      { icon: "🎯", title: "Mentorat & advisory", description: "Un accompagnement par des dirigeants et advisors expérimentés." },
      { icon: "🥂", title: "Événements VIP", description: "Des rendez-vous d'exception propices au réseautage de haut niveau." },
    ],
  },
};

/** Renvoie le HubSkills d'un univers (null si aucun). */
export function getHubSkills(universeId: string): HubSkills | null {
  return HUBSKILLS_BY_UNIVERSE[universeId] ?? null;
}
