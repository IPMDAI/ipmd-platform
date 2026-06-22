/** Filières standard de l'IPMD (= les formations proposées). */
export const IPMD_FILIERES = [
  "Marketing digital",
  "Communication digitale",
  "Graphisme & Design",
  "Développement d'applications",
  "E-commerce & commerce international",
  "Informatique & intelligence artificielle",
  "Management de projet digital",
  "Comptabilité & finance digitale",
];

/**
 * Modules proposés par filière (point de départ éditable).
 * Les clés correspondent exactement aux noms de IPMD_FILIERES.
 */
export const MODULE_SEED: Record<string, string[]> = {
  "Marketing digital": [
    "Référencement (SEO / SEA)",
    "Réseaux sociaux & community management",
    "Publicité en ligne (Meta / Google Ads)",
    "Email marketing",
    "Marketing de contenu",
    "Web analytics (data)",
    "Stratégie marketing digitale",
    "E-réputation",
    "Marketing automation & IA",
  ],
  "Communication digitale": [
    "Stratégie de communication",
    "Création de contenu",
    "Community management",
    "Communication de marque (branding)",
    "Relations presse & influence",
    "Communication visuelle",
    "Storytelling",
    "Communication de crise",
  ],
  "Graphisme & Design": [
    "Design graphique (Photoshop / Illustrator)",
    "Identité visuelle & branding",
    "UX design",
    "UI design (Figma)",
    "Motion design",
    "Design d'interface mobile",
    "Typographie & couleurs",
    "IA générative (images)",
  ],
  "Développement d'applications": [
    "Algorithmique & programmation",
    "HTML / CSS",
    "JavaScript",
    "Développement front-end (React)",
    "Développement back-end (Node.js)",
    "Bases de données (SQL)",
    "Développement mobile",
    "API & sécurité",
    "Git & outils collaboratifs",
  ],
  "E-commerce & commerce international": [
    "Création de boutique en ligne",
    "Marketplaces",
    "Logistique & supply chain",
    "Paiement digital",
    "Marketing e-commerce",
    "Relation client (CRM)",
    "Import-export",
    "Droit du commerce électronique",
  ],
  "Informatique & intelligence artificielle": [
    "Bases de l'informatique",
    "Programmation Python",
    "Bases de données",
    "Réseaux & systèmes",
    "Cybersécurité",
    "Analyse de données",
    "Machine learning",
    "IA générative",
    "Automatisation des processus",
  ],
  "Management de projet digital": [
    "Gestion de projet",
    "Méthodes agiles (Scrum)",
    "Coordination d'équipes",
    "Outils collaboratifs",
    "Transformation digitale",
    "Suivi des performances (KPI)",
    "Gestion des risques",
    "Leadership",
  ],
  "Comptabilité & finance digitale": [
    "Comptabilité générale",
    "Finance d'entreprise",
    "Outils digitaux de gestion",
    "Tableaux de bord financiers",
    "Digitalisation financière",
    "Paiements numériques",
    "FinTech",
    "Analyse financière",
    "IA appliquée à la finance",
  ],
};

/** Niveaux d'étude proposés pour les classes. */
export const NIVEAUX = [
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
];
