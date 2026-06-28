/**
 * Prochains bootcamps — sessions à DATES FIXES (places limitées).
 * Quand une session est terminée, on la remplace par une nouvelle, ou on
 * repousse la date si le nombre minimum de participants n'est pas atteint.
 *
 * 👉 Pour gérer l'agenda : modifier ce tableau (dates, places, frais, créneaux).
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

export const UPCOMING_BOOTCAMPS: UpcomingBootcamp[] = [
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
];
