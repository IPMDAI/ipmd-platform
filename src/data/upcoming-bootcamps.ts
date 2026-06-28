/**
 * Prochains bootcamps — sessions à DATES FIXES (places limitées), par univers.
 * Quand une session est terminée, on la remplace par une nouvelle, ou on
 * repousse la date si le nombre minimum de participants n'est pas atteint.
 *
 * 👉 Pour gérer l'agenda : modifier les tableaux ci-dessous (dates, places, frais, créneaux).
 *    Image optionnelle : déposer dans public/prochains/ et mettre le chemin.
 */
export type UpcomingBootcamp = {
  id: string;
  title: string;
  /** Sous-titre éventuel (ex. session premium). */
  subtitle?: string;
  /** Lieu court affiché dans le badge (ex. « Premium à Abidjan »). */
  badge: string;
  description: string;
  /** Atouts mis en avant (ex. Dîner Black Tie, Hébergement inclus). */
  highlights?: string[];
  /** Public visé (optionnel). */
  audience?: string;
  date: string;
  places: string;
  location: string;
  price: string;
  slots: string[];
  slotsNote?: string;
  image?: string;
  /** Variante visuelle (premium = doré, luxe = Silver Masters). */
  variant?: "premium" | "luxe";
};

/** Sessions à venir par univers (clé = id d'univers). */
export const UPCOMING_BY_UNIVERSE: Record<string, UpcomingBootcamp[]> = {
  ultraboost: [
    {
      id: "ia-chatgpt-juin-2026",
      title: "Intelligence Artificielle & ChatGPT",
      badge: "Bootcamp Premium à Abidjan",
      description:
        "Bootcamp 80 % pratique pour utiliser efficacement l'Intelligence Artificielle et ChatGPT : automatiser des tâches, améliorer votre productivité, créer du contenu professionnel et optimiser vos activités.",
      date: "9 au 12 juin 2026",
      places: "Limité à 15 participants",
      location: "UltraBoost à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 8h – 11h", "Créneau Soir · 18h – 21h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
    {
      id: "vente-ligne-juin-2026",
      title: "Vente en Ligne & Automatisation",
      badge: "Bootcamp Premium à Abidjan",
      description:
        "Bootcamp 80 % pratique pour vendre en ligne, convertir des prospects en clients, attirer une audience qualifiée sur les réseaux sociaux et automatiser vos tâches commerciales afin d'augmenter vos revenus.",
      date: "16 au 19 juin 2026",
      places: "Limité à 15 participants",
      location: "UltraBoost à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 8h – 11h", "Créneau Soir · 18h – 21h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
    {
      id: "administration-digitale-juin-2026",
      title: "Administration Digitale, IA & Automatisation Professionnelle",
      badge: "Bootcamp Premium à Abidjan",
      description:
        "Bootcamp 80 % pratique pour utiliser les outils digitaux modernes, l'IA et les solutions d'automatisation : améliorer la productivité, optimiser les tâches administratives et renforcer vos compétences professionnelles.",
      date: "23 au 26 juin 2026",
      places: "Limité à 15 participants",
      location: "UltraBoost à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 8h – 11h", "Créneau Soir · 18h – 21h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
    {
      id: "silver-masters-juin-2026",
      title: "Silver Masters",
      subtitle: "Bootcamp Écosystème Digital · IA · E-Business",
      badge: "Bootcamp Premium à Grand-Bassam",
      description:
        "Bootcamp immersif qui accompagne professionnels et décideurs dans l'usage des outils digitaux modernes, de l'IA et des stratégies E-Business pour optimiser leurs activités et accélérer leur croissance.",
      highlights: ["2 jours pratiques", "Dîner Black Tie", "Hébergement inclus"],
      audience: "Réservé aux professionnels, dirigeants et entrepreneurs.",
      date: "26 & 27 juin 2026",
      places: "Limité à 30 participants",
      location: "Comoé Lodge — Grand-Bassam",
      price: "385 000 FCFA",
      slots: ["Créneau Matin · 7h30 – 12h30", "Créneau Après-midi · 14h – 17h"],
      variant: "luxe",
    },
  ],

  // ⚠️ Échantillons à ajuster (dates, places, frais réels) — UltraJobs.
  ultrajobs: [
    {
      id: "uj-community-juil-2026",
      title: "Community Management & Création de contenu IA",
      badge: "Session UltraJobs à Abidjan",
      description:
        "Bootcamp 80 % pratique pour animer les réseaux sociaux, créer du contenu engageant et gagner du temps avec l'IA — prêt pour l'emploi ou le freelance.",
      date: "7 au 10 juillet 2026",
      places: "Limité à 20 participants",
      location: "UltraJobs à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 8h – 11h", "Créneau Soir · 18h – 21h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
    {
      id: "uj-design-juil-2026",
      title: "Design graphique & Canva IA",
      badge: "Session UltraJobs à Abidjan",
      description:
        "Bootcamp 80 % pratique pour créer des visuels et une identité professionnels avec Canva, Photoshop et l'IA — et décrocher vos premiers clients.",
      date: "14 au 17 juillet 2026",
      places: "Limité à 20 participants",
      location: "UltraJobs à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 8h – 11h", "Créneau Soir · 18h – 21h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
    {
      id: "uj-web-juil-2026",
      title: "Développement web express avec l'IA",
      badge: "Session UltraJobs à Abidjan",
      description:
        "Bootcamp 80 % pratique pour construire des sites web modernes, assisté par l'IA — bases solides pour devenir développeur ou freelance.",
      date: "21 au 24 juillet 2026",
      places: "Limité à 20 participants",
      location: "UltraJobs à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 8h – 11h", "Créneau Soir · 18h – 21h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
  ],

  // ⚠️ Échantillons à ajuster (dates, places, frais réels) — SeniorsHub.
  seniorshub: [
    {
      id: "sh-ia-quotidien-juil-2026",
      title: "Maîtriser l'IA & les outils numériques au quotidien",
      badge: "Session SeniorsHub à Abidjan",
      description:
        "Bootcamp 80 % pratique pensé pour les seniors et professionnels expérimentés : utiliser l'IA, le smartphone et les outils numériques en toute confiance.",
      date: "7 au 9 juillet 2026",
      places: "Limité à 15 participants",
      location: "SeniorsHub à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 9h – 12h", "Créneau Après-midi · 14h – 17h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
    {
      id: "sh-whatsapp-juil-2026",
      title: "WhatsApp Business & communication digitale",
      badge: "Session SeniorsHub à Abidjan",
      description:
        "Bootcamp 80 % pratique pour communiquer, vendre et gérer son activité avec WhatsApp Business et les réseaux sociaux, à votre rythme.",
      date: "14 au 16 juillet 2026",
      places: "Limité à 15 participants",
      location: "SeniorsHub à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 9h – 12h", "Créneau Après-midi · 14h – 17h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
    {
      id: "sh-bureautique-juil-2026",
      title: "Bureautique, sécurité numérique & démarches en ligne",
      badge: "Session SeniorsHub à Abidjan",
      description:
        "Bootcamp 80 % pratique pour maîtriser la bureautique, sécuriser ses comptes et réaliser ses démarches administratives en ligne sereinement.",
      date: "21 au 23 juillet 2026",
      places: "Limité à 15 participants",
      location: "SeniorsHub à Abidjan",
      price: "150 000 FCFA",
      slots: ["Créneau Matin · 9h – 12h", "Créneau Après-midi · 14h – 17h"],
      slotsNote: "Chaque participant choisit le créneau qui lui convient.",
      variant: "premium",
    },
  ],
};

/** Renvoie les sessions à venir d'un univers (vide si aucune). */
export function getUpcoming(universeId: string): UpcomingBootcamp[] {
  return UPCOMING_BY_UNIVERSE[universeId] ?? [];
}
