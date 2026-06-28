/**
 * Catalogue UltraBoost — Executive Bootcamps, organisés par SECTEUR.
 * Chaque bootcamp : résumé court (carte) + objectifs spécifiques (page programme).
 * Approche IPMD : 80 % pratique / 20 % notions essentielles, cas réels & livrable final.
 *
 * 👉 Pour gérer : modifier ULTRABOOST_SECTORS.
 */

export type UltraBoostBootcamp = {
  id: string;
  title: string;
  summary: string;
  objectives: string[];
};

export type UltraBoostSector = {
  id: string;
  icon: string;
  title: string;
  bootcamps: UltraBoostBootcamp[];
};

/** Durée et tarif indicatifs communs. */
export const ULTRABOOST_DURATION_H = 42;
export const ULTRABOOST_PRICE = "730 000 FCFA";

export const ULTRABOOST_SECTORS: UltraBoostSector[] = [
  {
    id: "management",
    icon: "💼",
    title: "Management & pilotage",
    bootcamps: [
      {
        id: "ub-manager-ia",
        title: "Manager augmenté par l'IA",
        summary: "Apprenez à utiliser l'IA pour piloter vos équipes, préparer vos décisions, produire des rapports et améliorer votre efficacité managériale.",
        objectives: [
          "Utiliser l'IA pour préparer des réunions, notes et rapports.",
          "Améliorer la gestion du temps, des priorités et des équipes.",
          "Analyser rapidement des situations professionnelles avec l'IA.",
          "Créer des tableaux de suivi simples pour piloter l'activité.",
          "Développer une posture de manager moderne à l'ère de l'IA.",
        ],
      },
      {
        id: "ub-assistant-direction",
        title: "Assistant de direction augmenté par l'IA",
        summary: "Renforcez vos compétences administratives avec l'IA : courriers, comptes rendus, synthèses, agendas, documents et suivi des priorités.",
        objectives: [
          "Rédiger rapidement des courriers, emails et comptes rendus professionnels.",
          "Organiser les agendas, priorités et tâches avec des outils digitaux.",
          "Produire des synthèses claires à partir de documents ou réunions.",
          "Gérer le classement, le suivi et la communication administrative.",
          "Améliorer la productivité du secrétariat et de l'assistanat de direction.",
        ],
      },
      {
        id: "ub-chef-projet",
        title: "Chef de projet digital & transformation numérique",
        summary: "Apprenez à piloter un projet digital de l'idée à la livraison : besoin, cahier des charges, planning, équipe, outils et suivi.",
        objectives: [
          "Identifier les besoins d'un projet digital.",
          "Rédiger un cahier des charges simple et exploitable.",
          "Planifier les étapes, ressources et livrables du projet.",
          "Suivre l'avancement avec des outils digitaux et IA.",
          "Accompagner l'adoption du changement dans une organisation.",
        ],
      },
      {
        id: "ub-ia-dirigeants",
        title: "IA pour dirigeants & prise de décision",
        summary: "Comprenez les usages, opportunités et risques de l'IA pour prendre de meilleures décisions stratégiques dans votre organisation.",
        objectives: [
          "Comprendre les principaux usages de l'IA en entreprise.",
          "Identifier les opportunités d'IA dans son secteur d'activité.",
          "Évaluer les risques liés aux données, à la sécurité et à l'éthique.",
          "Utiliser l'IA pour préparer des décisions et scénarios stratégiques.",
          "Construire une feuille de route IA simple pour son organisation.",
        ],
      },
    ],
  },
  {
    id: "finance",
    icon: "📊",
    title: "Finance, comptabilité & data",
    bootcamps: [
      {
        id: "ub-comptabilite-ia",
        title: "Comptabilité augmentée par l'IA",
        summary: "Utilisez l'IA pour analyser les comptes, contrôler les pièces, préparer les rapports et améliorer le suivi comptable.",
        objectives: [
          "Exploiter l'IA pour analyser des données comptables.",
          "Automatiser la préparation de synthèses et rapports comptables.",
          "Contrôler les pièces, anomalies et incohérences.",
          "Suivre les impayés, relances et situations financières.",
          "Améliorer la productivité du service comptable.",
        ],
      },
      {
        id: "ub-finance-ia",
        title: "Finance, analyse & reporting avec IA",
        summary: "Renforcez vos capacités d'analyse financière, de reporting et d'aide à la décision avec les outils digitaux et l'IA.",
        objectives: [
          "Construire des analyses financières simples et utiles.",
          "Produire des rapports financiers clairs avec l'appui de l'IA.",
          "Interpréter les indicateurs clés de performance financière.",
          "Présenter les données de façon professionnelle.",
          "Aider la direction à prendre des décisions fondées sur les chiffres.",
        ],
      },
      {
        id: "ub-controle-gestion-ia",
        title: "Contrôle de gestion avec IA",
        summary: "Apprenez à suivre les coûts, budgets, écarts et indicateurs de performance avec des outils modernes et l'IA.",
        objectives: [
          "Mettre en place des tableaux de suivi budgétaire.",
          "Analyser les écarts entre prévisions et réalisations.",
          "Utiliser l'IA pour produire des commentaires de gestion.",
          "Identifier les indicateurs clés à suivre.",
          "Préparer des rapports de performance pour la direction.",
        ],
      },
      {
        id: "ub-data-excel-bi",
        title: "Data, Excel, Power BI & reporting",
        summary: "Transformez vos données en tableaux de bord clairs pour mieux suivre, analyser et décider.",
        objectives: [
          "Nettoyer et organiser des données professionnelles.",
          "Utiliser Excel avancé pour analyser les informations.",
          "Créer des tableaux de bord avec Power BI.",
          "Visualiser les indicateurs clés de performance.",
          "Produire un reporting clair pour managers et décideurs.",
        ],
      },
    ],
  },
  {
    id: "rh",
    icon: "🤝",
    title: "RH, formation & talents",
    bootcamps: [
      {
        id: "ub-rh-talents",
        title: "RH, recrutement & talents avec IA",
        summary: "Utilisez l'IA pour améliorer le recrutement, les fiches de poste, les entretiens, la formation et le suivi des talents.",
        objectives: [
          "Rédiger des fiches de poste et annonces professionnelles.",
          "Préparer des grilles d'entretien et d'évaluation.",
          "Utiliser l'IA pour présélectionner et analyser des profils.",
          "Construire des plans de formation adaptés.",
          "Suivre les compétences et talents de l'organisation.",
        ],
      },
      {
        id: "ub-formateur",
        title: "Formateur digital & IA",
        summary: "Apprenez à concevoir, animer et évaluer des formations modernes avec les outils digitaux et l'intelligence artificielle.",
        objectives: [
          "Concevoir un programme de formation structuré.",
          "Créer des supports pédagogiques avec l'IA.",
          "Animer une formation en présentiel, à distance ou hybride.",
          "Évaluer les apprenants avec des outils digitaux.",
          "Améliorer l'expérience d'apprentissage avec l'IA.",
        ],
      },
      {
        id: "ub-gestion-formation",
        title: "Gestion de la formation avec outils IA",
        summary: "Pilotez les plans de formation, les contenus, les évaluations et le suivi des compétences avec des outils digitaux et IA.",
        objectives: [
          "Organiser un plan de formation annuel.",
          "Suivre les inscriptions, présences et évaluations.",
          "Produire des rapports de formation.",
          "Utiliser l'IA pour adapter les contenus aux besoins.",
          "Mesurer l'impact des formations sur les compétences.",
        ],
      },
    ],
  },
  {
    id: "marketing",
    icon: "📣",
    title: "Marketing, vente & communication",
    bootcamps: [
      {
        id: "ub-marketing-digital-ia",
        title: "Marketing digital avec IA",
        summary: "Apprenez à construire une stratégie marketing digitale plus rapide, plus ciblée et plus performante grâce à l'IA.",
        objectives: [
          "Définir une stratégie marketing digitale adaptée.",
          "Utiliser l'IA pour créer des contenus et campagnes.",
          "Identifier les bons canaux de communication.",
          "Suivre les performances marketing.",
          "Améliorer l'acquisition et la conversion des clients.",
        ],
      },
      {
        id: "ub-marketing-crm",
        title: "Marketing, vente & CRM avec IA",
        summary: "Optimisez la prospection, la relation client, les relances et le suivi commercial avec l'IA et les outils CRM.",
        objectives: [
          "Organiser un fichier prospects et clients.",
          "Mettre en place des relances commerciales efficaces.",
          "Utiliser l'IA pour rédiger messages, scripts et propositions.",
          "Suivre les opportunités commerciales dans un CRM.",
          "Améliorer la fidélisation et la satisfaction client.",
        ],
      },
      {
        id: "ub-communication",
        title: "Communication digitale & stratégie IA",
        summary: "Renforcez votre communication institutionnelle, commerciale ou personnelle avec des contenus professionnels et une stratégie digitale claire.",
        objectives: [
          "Construire une ligne éditoriale adaptée à son organisation.",
          "Créer des contenus professionnels avec l'IA.",
          "Planifier les publications et campagnes.",
          "Gérer l'image et la réputation digitale.",
          "Mesurer l'impact des actions de communication.",
        ],
      },
      {
        id: "ub-ecommerce",
        title: "E-commerce & stratégie IA",
        summary: "Développez une activité en ligne plus efficace grâce à l'IA, aux outils digitaux, au catalogue produit et au suivi client.",
        objectives: [
          "Structurer une offre e-commerce claire.",
          "Optimiser les fiches produits et visuels avec l'IA.",
          "Gérer les commandes, clients et relances.",
          "Utiliser les réseaux sociaux et WhatsApp Business pour vendre.",
          "Suivre les ventes et améliorer les performances.",
        ],
      },
      {
        id: "ub-support-client",
        title: "Support client, CRM & chatbot IA",
        summary: "Améliorez la relation client avec des réponses rapides, un suivi organisé, un CRM et des assistants IA.",
        objectives: [
          "Organiser les demandes clients dans un outil de suivi.",
          "Créer des réponses types professionnelles avec l'IA.",
          "Mettre en place un chatbot ou assistant simple.",
          "Suivre les réclamations et niveaux de satisfaction.",
          "Améliorer la réactivité du service client.",
        ],
      },
    ],
  },
  {
    id: "tech",
    icon: "🛡️",
    title: "Tech, IA, automatisation & sécurité",
    bootcamps: [
      {
        id: "ub-automatisation-nocode",
        title: "Automatisation, no-code & productivité IA",
        summary: "Automatisez les tâches répétitives, formulaires, relances, tableaux et workflows sans coder profondément.",
        objectives: [
          "Identifier les tâches répétitives à automatiser.",
          "Créer des formulaires, tableaux et workflows simples.",
          "Connecter différents outils digitaux entre eux.",
          "Utiliser l'IA pour accélérer les processus internes.",
          "Gagner du temps dans les opérations quotidiennes.",
        ],
      },
      {
        id: "ub-dev-apps-ia",
        title: "Développement d'applications avec IA",
        summary: "Comprenez comment concevoir, prototyper et développer des applications web ou mobiles avec l'appui de l'IA.",
        objectives: [
          "Identifier le besoin et les fonctionnalités d'une application.",
          "Concevoir une interface simple et claire.",
          "Utiliser l'IA pour accélérer le développement.",
          "Comprendre les bases du front-end, back-end et API.",
          "Créer un prototype fonctionnel d'application.",
        ],
      },
      {
        id: "ub-cyber-donnees",
        title: "Cybersécurité & protection des données",
        summary: "Protégez les comptes, emails, fichiers, données clients et outils numériques de votre organisation.",
        objectives: [
          "Identifier les principales menaces numériques.",
          "Sécuriser les comptes, mots de passe et emails.",
          "Reconnaître les tentatives de phishing et fraude.",
          "Mettre en place des sauvegardes et bonnes pratiques.",
          "Sensibiliser les équipes à la sécurité numérique.",
        ],
      },
      {
        id: "ub-droit",
        title: "Droit du digital & IA",
        summary: "Comprenez les enjeux juridiques liés au numérique, aux données, à l'IA, aux contenus et aux responsabilités professionnelles.",
        objectives: [
          "Comprendre les bases du droit numérique.",
          "Identifier les responsabilités liées à l'usage de l'IA.",
          "Protéger les données personnelles et professionnelles.",
          "Encadrer les contenus, contrats et services digitaux.",
          "Anticiper les risques juridiques des projets numériques.",
        ],
      },
      {
        id: "ub-gouvernance-donnees",
        title: "Gouvernance des données & conformité numérique",
        summary: "Apprenez à organiser, protéger et exploiter les données de l'entreprise dans un cadre fiable et conforme.",
        objectives: [
          "Comprendre les principes de gouvernance des données.",
          "Identifier les données sensibles dans une organisation.",
          "Mettre en place des règles d'accès et de confidentialité.",
          "Suivre les obligations de conformité numérique.",
          "Améliorer la qualité et la sécurité des données.",
        ],
      },
    ],
  },
  {
    id: "entrepreneuriat",
    icon: "🚀",
    title: "Entrepreneuriat & transformation",
    bootcamps: [
      {
        id: "ub-entrepreneuriat",
        title: "Entrepreneuriat digital & IA",
        summary: "Utilisez le digital et l'IA pour structurer, lancer ou développer une activité rentable et moderne.",
        objectives: [
          "Clarifier son idée ou modèle économique.",
          "Utiliser l'IA pour analyser le marché et les clients.",
          "Créer une offre, une présence digitale et un plan d'action.",
          "Mettre en place des outils simples de vente et de suivi.",
          "Construire une stratégie de croissance digitale.",
        ],
      },
      {
        id: "ub-transfo-pme",
        title: "Transformation digitale des PME",
        summary: "Accompagnez une PME dans l'adoption des outils numériques, l'automatisation, la data et l'IA.",
        objectives: [
          "Diagnostiquer le niveau digital d'une PME.",
          "Identifier les processus à améliorer.",
          "Choisir les bons outils numériques.",
          "Mettre en place une feuille de route de transformation.",
          "Accompagner les équipes dans le changement.",
        ],
      },
      {
        id: "ub-pilotage-projet-ia",
        title: "Pilotage de projet IA en entreprise",
        summary: "Apprenez à cadrer, lancer et suivre un projet IA utile, réaliste et aligné sur les besoins de l'entreprise.",
        objectives: [
          "Identifier un cas d'usage IA pertinent.",
          "Définir les objectifs, données et parties prenantes.",
          "Évaluer les risques, coûts et bénéfices.",
          "Piloter le projet avec une méthode simple.",
          "Présenter les résultats et recommandations à la direction.",
        ],
      },
    ],
  },
];

/** Approche pédagogique IPMD (commune à tous les bootcamps). */
export const ULTRABOOST_APPROCHE =
  "Ce bootcamp est conçu selon l'approche IPMD : 80 % de pratique et 20 % de notions essentielles. Les participants travaillent sur des cas réels, des exercices guidés, des outils digitaux et IA, avec un livrable final directement applicable dans leur métier.";

export const ULTRABOOST_CAS_PRATIQUES =
  "Cas réels issus du terrain, exercices guidés et mises en situation en mode atelier, avec des outils digitaux et IA.";

export const ULTRABOOST_LIVRABLE =
  "Un projet / livrable final concret et directement applicable dans votre métier (plan d'action, tableau de bord, prototype, dossier…).";

export const ULTRABOOST_PUBLIC =
  "Adultes, cadres, managers, dirigeants, professionnels et entrepreneurs souhaitant monter en compétence avec le digital et l'IA.";

/** Gabarit commun du programme (modal). */
export const ULTRABOOST_SCHEDULES = [
  { icon: "🌅", label: "Morning", time: "09h - 12h", desc: "Parfait pour bien démarrer la journée" },
  { icon: "☀️", label: "Afternoon", time: "13h - 15h", desc: "Idéal après le déjeuner" },
  { icon: "🌞", label: "Full Day", time: "09h - 15h", desc: "Immersion complète" },
  { icon: "🌙", label: "Evening", time: "18h - 21h", desc: "Pour les professionnels actifs" },
];

export const ULTRABOOST_FORMATS = [
  { label: "En ligne", desc: "Cours en direct avec interaction en temps réel" },
  { label: "Premium", desc: "Présentiel + à distance ou hybride" },
  { label: "Accompagnement individuel", desc: "Suivi personnalisé et sur-mesure" },
  { label: "Entreprise", desc: "Cohorte dédiée pour vos équipes" },
  { label: "Association", desc: "Format adapté aux groupes et organisations" },
];

export const ULTRABOOST_INCLUDED = [
  "Accès à la plateforme de bootcamp",
  "Support pédagogique complet",
  "Certificat de réussite officiel",
  "Accès communauté UltraBoost",
];

export const ULTRABOOST_PREREQUIS = [
  "Motivation et engagement",
  "Ordinateur",
  "Disponibilité selon horaires choisis",
  "Niveau adapté au bootcamp",
];
