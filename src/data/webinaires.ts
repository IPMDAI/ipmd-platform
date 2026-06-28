/**
 * Webinaires — sessions en ligne (souvent gratuites), par univers.
 * 👉 Pour gérer : modifier les tableaux ci-dessous.
 */
export type Webinaire = {
  id: string;
  title: string;
  date: string;
  time: string;
  speaker: string;
  description: string;
  /** Mention courte (ex. « En ligne · Gratuit »). */
  tag?: string;
};

export type Webinaires = {
  eyebrow: string;
  title: string;
  intro: string;
  items: Webinaire[];
};

const ONLINE_FREE = "En ligne · Gratuit";

export const WEBINAIRES_BY_UNIVERSE: Record<string, Webinaires> = {
  ultrajobs: {
    eyebrow: "Webinaires",
    title: "Des webinaires gratuits pour passer à l'action",
    intro: "Rejoignez nos webinaires en ligne, animés par des experts, pour apprendre, poser vos questions et accélérer votre parcours.",
    items: [
      { id: "uj-w1", title: "Décrocher son premier job dans le digital", date: "10 juillet 2026", time: "18h – 19h", speaker: "Équipe Carrière IPMD", description: "CV, LinkedIn, entretien : les clés pour vous démarquer et décrocher votre premier poste.", tag: ONLINE_FREE },
      { id: "uj-w2", title: "Lancer son activité freelance avec l'IA", date: "17 juillet 2026", time: "18h – 19h", speaker: "Mentor Freelance IPMD", description: "Trouver des clients, fixer ses prix et produire plus vite grâce à l'IA.", tag: ONLINE_FREE },
      { id: "uj-w3", title: "Créer du contenu viral avec ChatGPT & Canva", date: "24 juillet 2026", time: "18h – 19h", speaker: "Expert Contenu IA", description: "Méthode pratique pour créer des posts qui captent l'attention en un temps record.", tag: ONLINE_FREE },
    ],
  },
  ultraboost: {
    eyebrow: "Webinaires",
    title: "Des webinaires pour monter en compétence",
    intro: "Des sessions en ligne pour les professionnels : outils, méthodes et bonnes pratiques directement applicables.",
    items: [
      { id: "ub-w1", title: "Booster sa productivité avec l'IA", date: "9 juillet 2026", time: "18h – 19h", speaker: "Expert IA IPMD", description: "Les outils IA qui font gagner des heures chaque semaine au travail.", tag: ONLINE_FREE },
      { id: "ub-w2", title: "Automatiser son business sans coder", date: "16 juillet 2026", time: "18h – 19h", speaker: "Spécialiste No-code", description: "Workflows, CRM et chatbots pour automatiser les tâches répétitives.", tag: ONLINE_FREE },
      { id: "ub-w3", title: "Marketing digital : les leviers qui convertissent", date: "23 juillet 2026", time: "18h – 19h", speaker: "Growth Marketer", description: "Acquisition, tunnel de vente et publicité rentable, expliqués pas à pas.", tag: ONLINE_FREE },
    ],
  },
  seniorshub: {
    eyebrow: "Webinaires",
    title: "Des webinaires simples et rassurants",
    intro: "Des rencontres en ligne, à votre rythme, pour apprivoiser le numérique et l'IA en toute confiance.",
    items: [
      { id: "sh-w1", title: "L'IA expliquée simplement", date: "9 juillet 2026", time: "14h – 15h", speaker: "Formateur SeniorsHub", description: "Comprendre ce qu'est l'IA et comment elle peut vous être utile au quotidien.", tag: ONLINE_FREE },
      { id: "sh-w2", title: "Se protéger des arnaques en ligne", date: "16 juillet 2026", time: "14h – 15h", speaker: "Expert Sécurité numérique", description: "Reconnaître les pièges et sécuriser ses comptes et ses paiements.", tag: ONLINE_FREE },
      { id: "sh-w3", title: "Rester connecté avec ses proches", date: "23 juillet 2026", time: "14h – 15h", speaker: "Formateur SeniorsHub", description: "WhatsApp, photos et appels vidéo pour garder le lien facilement.", tag: ONLINE_FREE },
    ],
  },
  ultraexecutive: {
    eyebrow: "Webinaires",
    title: "Des webinaires stratégiques pour dirigeants",
    intro: "Des sessions en ligne de haut niveau pour décider avec une longueur d'avance.",
    items: [
      { id: "ux-w1", title: "IA & stratégie : ce que tout dirigeant doit savoir", date: "8 juillet 2026", time: "18h – 19h", speaker: "Direction IPMD", description: "Enjeux, opportunités et risques de l'IA pour votre organisation.", tag: ONLINE_FREE },
      { id: "ux-w2", title: "Gouvernance de la data en entreprise", date: "15 juillet 2026", time: "18h – 19h", speaker: "Expert Gouvernance", description: "Mettre en place une gouvernance data/IA solide et conforme.", tag: ONLINE_FREE },
      { id: "ux-w3", title: "Leadership à l'ère de l'IA", date: "22 juillet 2026", time: "18h – 19h", speaker: "Coach Dirigeants", description: "Faire évoluer sa posture et fédérer ses équipes face au changement.", tag: ONLINE_FREE },
    ],
  },
  campus: {
    eyebrow: "Webinaires",
    title: "Des webinaires pour bien choisir ses études",
    intro: "Des sessions en ligne pour découvrir nos formations, l'admission et la vie de campus.",
    items: [
      { id: "cp-w1", title: "Réussir son orientation post-bac", date: "10 juillet 2026", time: "16h – 17h", speaker: "Conseillers d'orientation IPMD", description: "Choisir la bonne filière digitale et construire son projet d'études.", tag: ONLINE_FREE },
      { id: "cp-w2", title: "Étudier le digital & l'IA à l'IPMD", date: "17 juillet 2026", time: "16h – 17h", speaker: "Équipe pédagogique", description: "Programmes, pédagogie 80 % pratique et débouchés de nos diplômes.", tag: ONLINE_FREE },
      { id: "cp-w3", title: "Financer ses études & bourses", date: "24 juillet 2026", time: "16h – 17h", speaker: "Service admissions", description: "Frais, facilités de paiement et dispositifs d'aide disponibles.", tag: ONLINE_FREE },
    ],
  },
  professionnel: {
    eyebrow: "Webinaires",
    title: "Des webinaires pour évoluer professionnellement",
    intro: "Des sessions en ligne pour les professionnels : reconversion, montée en compétence et diplôme.",
    items: [
      { id: "pr-w1", title: "Se reconvertir dans le digital", date: "9 juillet 2026", time: "18h – 19h", speaker: "Conseillers IPMD", description: "Changer de métier vers le digital : par où commencer et comment réussir.", tag: ONLINE_FREE },
      { id: "pr-w2", title: "Concilier emploi et formation diplômante", date: "16 juillet 2026", time: "18h – 19h", speaker: "Équipe pédagogique", description: "Cours du soir, alternance et organisation pour se former tout en travaillant.", tag: ONLINE_FREE },
      { id: "pr-w3", title: "Booster sa carrière avec un diplôme IPMD", date: "23 juillet 2026", time: "18h – 19h", speaker: "Service carrière", description: "Diplômes, débouchés et accompagnement pour faire évoluer votre carrière.", tag: ONLINE_FREE },
    ],
  },
  gouvernance: {
    eyebrow: "Webinaires",
    title: "Des webinaires stratégiques pour dirigeants",
    intro: "Des sessions en ligne de haut niveau pour les dirigeants et décideurs.",
    items: [
      { id: "gv-w1", title: "Diriger à l'ère de l'IA", date: "8 juillet 2026", time: "18h – 19h", speaker: "Direction IPMD", description: "Les enjeux de l'IA pour la stratégie et la gouvernance des organisations.", tag: ONLINE_FREE },
      { id: "gv-w2", title: "Gouvernance & stratégie digitale", date: "15 juillet 2026", time: "18h – 19h", speaker: "Expert Gouvernance", description: "Structurer la transformation et la gouvernance data/IA de l'entreprise.", tag: ONLINE_FREE },
      { id: "gv-w3", title: "L'Executive qui transforme les dirigeants", date: "22 juillet 2026", time: "18h – 19h", speaker: "Équipe Executive", description: "Découvrez le programme Executive et son impact sur votre leadership.", tag: ONLINE_FREE },
    ],
  },
};

/** Renvoie les webinaires d'un univers (null si aucun). */
export function getWebinaires(universeId: string): Webinaires | null {
  return WEBINAIRES_BY_UNIVERSE[universeId] ?? null;
}
