/**
 * UltraJobs — bootcamps métiers (jeunes & chercheurs d'emploi),
 * organisés par DOMAINE. Chaque métier a un résumé percutant.
 */

export type UltraJobsMetier = {
  title: string;
  summary: string;
  skills: string[];
  /** Tarif spécifique (sinon ULTRAJOBS_PRICE par défaut). */
  price?: string;
  /** Volume horaire spécifique (sinon ULTRAJOBS_HOURS par défaut). */
  hours?: number;
};

export type UltraJobsDomain = {
  id: string;
  icon: string;
  title: string;
  metiers: UltraJobsMetier[];
};

/** Tarif & volume horaire communs aux bootcamps métiers UltraJobs. */
export const ULTRAJOBS_PRICE = "345 000 FCFA";
export const ULTRAJOBS_HOURS = 44;

/** Gabarit commun du programme (modal). */
export const ULTRAJOBS_OBJECTIFS_SPECIFIQUES = [
  "Maîtriser les concepts fondamentaux, le vocabulaire métier et les cas d'usage à forte valeur.",
  "Mettre en œuvre des exercices pratiques et des mises en situation alignées sur les attentes des entreprises.",
  "Construire un plan d'actions personnalisé pour déployer les acquis dans votre contexte professionnel.",
];

export const ULTRAJOBS_PREREQUIS = [
  "Bonnes bases numériques (bureautique, messagerie, visioconférence).",
  "Disponibilité pour les travaux guidés entre les sessions.",
  "Motivation pour progresser sur un rythme exigeant type bootcamp.",
];

export const ULTRAJOBS_FORMATS = [
  "En ligne (live)",
  "Présentiel premium",
  "Hybride",
  "VIP",
  "Équipe / cohorte dédiée",
];

export const ULTRAJOBS_CRENEAUX = [
  "Matin : 09h – 12h",
  "Après-midi : 13h – 15h",
  "Journée complète : 09h – 15h",
  "Soir : 18h – 21h",
];

export const ULTRAJOBS_DOMAINS: UltraJobsDomain[] = [
  {
    id: "marketing",
    icon: "📣",
    title: "Marketing digital & réseaux sociaux",
    metiers: [
      { title: "Community Manager & Créateur de contenu IA", summary: "Fédérez une communauté et produisez du contenu viral en un temps record grâce à l'IA.", skills: ["Réseaux sociaux", "Contenu IA", "Storytelling"] },
      { title: "Social Media Manager", summary: "Pilotez la présence d'une marque sur tous les réseaux et transformez l'audience en clients.", skills: ["Stratégie social", "Calendrier édito", "KPIs"] },
      { title: "Traffic Manager / Spécialiste Ads", summary: "Générez du trafic qualifié et des ventes avec des campagnes Meta & Google rentables.", skills: ["Meta Ads", "Google Ads", "ROAS"] },
      { title: "Growth Marketer", summary: "Activez des leviers de croissance data-driven et faites décoller l'acquisition.", skills: ["Funnel", "A/B testing", "Growth"] },
      { title: "Marketing Automation Specialist", summary: "Automatisez le marketing de bout en bout (emails, CRM, chatbots) pour vendre 24/7.", skills: ["Automation", "CRM", "Chatbots IA"] },
    ],
  },
  {
    id: "design",
    icon: "🎨",
    title: "Design graphique, infographie & création visuelle",
    metiers: [
      { title: "Infographiste / Designer graphique", summary: "Créez des visuels et identités qui marquent, avec Canva, Photoshop et l'IA.", skills: ["Canva", "Photoshop", "Création IA"] },
      { title: "Social Media Designer", summary: "Concevez des visuels qui stoppent le scroll et boostent l'engagement.", skills: ["Visuels", "Réseaux sociaux", "IA"] },
      { title: "UI/UX Designer", summary: "Dessinez des interfaces fluides et désirables pour apps et sites web.", skills: ["UX", "UI", "Figma"] },
      { title: "Motion Designer", summary: "Donnez vie aux marques avec des animations et vidéos qui captivent.", skills: ["Motion", "Animation", "After Effects"] },
      { title: "Brand Identity Designer", summary: "Construisez des identités de marque cohérentes et mémorables.", skills: ["Branding", "Logo", "Charte"] },
    ],
  },
  {
    id: "dev",
    icon: "💻",
    title: "Développement web & applications",
    metiers: [
      { title: "Développeur web à l'ère de l'IA", summary: "Codez des sites modernes et performants, assisté par l'IA.", skills: ["HTML/CSS", "JavaScript", "Outils IA"] },
      { title: "Développeur d'applications mobiles", summary: "Concevez et publiez des apps Android/iOS prêtes pour le marché.", skills: ["Mobile", "React Native", "Publication"] },
      { title: "Développeur full-stack junior", summary: "Maîtrisez le front et le back pour livrer des produits complets.", skills: ["Front", "Back", "API"] },
      { title: "Intégrateur API", summary: "Connectez les services et faites dialoguer les applications entre elles.", skills: ["API", "Intégration", "Webhooks"] },
      { title: "Testeur QA", summary: "Garantissez des produits fiables grâce aux tests et à l'assurance qualité.", skills: ["Tests", "QA", "Débogage"] },
    ],
  },
  {
    id: "ia",
    icon: "🤖",
    title: "IA appliquée, prompting & productivité",
    metiers: [
      { title: "Spécialiste IA appliquée", summary: "Déployez l'IA dans les métiers pour gagner en efficacité et en valeur.", skills: ["IA métier", "Outils IA", "Cas d'usage"] },
      { title: "Prompt Engineer métier", summary: "Maîtrisez l'art du prompt pour faire produire l'IA au niveau expert.", skills: ["Prompting", "LLM", "Optimisation"] },
      { title: "AI Content Creator", summary: "Produisez textes, visuels et vidéos à grande échelle avec l'IA.", skills: ["Contenu IA", "Image IA", "Vidéo IA"] },
      { title: "Formateur IA", summary: "Formez les équipes à exploiter l'IA dans leur quotidien.", skills: ["Pédagogie", "IA", "Animation"] },
      { title: "Assistant IA métier", summary: "Devenez le bras droit IA qui automatise et accélère les tâches.", skills: ["Assistants IA", "Productivité", "Automatisation"] },
    ],
  },
  {
    id: "data",
    icon: "📊",
    title: "Data, Power BI & analyse",
    metiers: [
      { title: "Data Analyst", summary: "Transformez les données brutes en décisions business claires.", skills: ["Excel", "SQL", "Analyse"] },
      { title: "Power BI Analyst", summary: "Construisez des tableaux de bord Power BI qui parlent aux dirigeants.", skills: ["Power BI", "DAX", "Dashboards"] },
      { title: "Business Intelligence Analyst", summary: "Pilotez la performance avec des indicateurs et de la BI.", skills: ["BI", "KPIs", "Datavisualisation"] },
      { title: "Reporting Officer", summary: "Produisez des rapports fiables et automatisés pour piloter l'activité.", skills: ["Reporting", "Automatisation", "Tableurs"] },
      { title: "Analyste marketing digital", summary: "Mesurez et optimisez chaque franc investi en marketing.", skills: ["Analytics", "Tracking", "ROI"] },
    ],
  },
  {
    id: "automatisation",
    icon: "⚙️",
    title: "Automatisation, no-code, low-code & agents IA",
    metiers: [
      { title: "Automation Specialist", summary: "Automatisez les processus et faites gagner des heures aux équipes.", skills: ["Automatisation", "Workflows", "Zapier/Make"] },
      { title: "No-code / Low-code Builder", summary: "Créez des applications et workflows sans coder lourdement.", skills: ["No-code", "Low-code", "Apps"] },
      { title: "Chatbot Designer", summary: "Concevez des chatbots qui répondent et convertissent 24/7.", skills: ["Chatbots", "Conversation", "IA"] },
      { title: "Agent IA Builder", summary: "Construisez des agents IA autonomes qui exécutent des tâches complexes.", skills: ["Agents IA", "Automatisation", "Outils"] },
      { title: "CRM Automation Assistant", summary: "Automatisez la relation client et le suivi commercial.", skills: ["CRM", "Automation", "Suivi"] },
    ],
  },
  {
    id: "ecommerce",
    icon: "🛒",
    title: "E-commerce, business en ligne & vente digitale",
    metiers: [
      { title: "Assistant e-commerce", summary: "Gérez une boutique en ligne et boostez les ventes au quotidien.", skills: ["Boutique", "Commandes", "Ventes"] },
      { title: "Gestionnaire boutique en ligne", summary: "Pilotez catalogue, commandes et logistique d'une boutique digitale.", skills: ["Catalogue", "Logistique", "Shopify"] },
      { title: "Social Selling Specialist", summary: "Vendez via les réseaux sociaux et le contenu engageant.", skills: ["Social selling", "Contenu", "Conversion"] },
      { title: "WhatsApp Business Manager", summary: "Transformez WhatsApp en canal de vente et de service performant.", skills: ["WhatsApp Business", "Vente", "Relation client"] },
      { title: "Marketplace Manager junior", summary: "Développez les ventes sur Jumia, Amazon et les marketplaces.", skills: ["Marketplaces", "Annonces", "Ventes"] },
    ],
  },
  {
    id: "support",
    icon: "💬",
    title: "Support client digital, assistant virtuel & télétravail",
    metiers: [
      { title: "Assistant virtuel avec IA", summary: "Gérez agendas, tâches et clients à distance, augmenté par l'IA.", skills: ["Assistance", "IA", "Organisation"] },
      { title: "Support client digital", summary: "Offrez un service client réactif et professionnel en ligne.", skills: ["Support", "Tickets", "Communication"] },
      { title: "Assistant administratif digital", summary: "Digitalisez l'administratif et fluidifiez l'organisation.", skills: ["Admin", "Outils digitaux", "Productivité"] },
      { title: "Opérateur CRM", summary: "Maîtrisez le CRM pour suivre et fidéliser chaque client.", skills: ["CRM", "Suivi", "Données client"] },
      { title: "Gestionnaire de rendez-vous en ligne", summary: "Organisez et optimisez la prise de rendez-vous à distance.", skills: ["Agenda", "Booking", "Relation client"] },
    ],
  },
  {
    id: "transformation",
    icon: "🚀",
    title: "Transformation digitale & gestion de projets numériques",
    metiers: [
      { title: "Digital Transformation Officer", summary: "Conduisez la transformation digitale des organisations.", skills: ["Transformation", "Conduite du changement", "Digital"], price: "585 000 FCFA", hours: 60 },
      { title: "Chef de projet digital junior", summary: "Pilotez des projets numériques de l'idée à la livraison.", skills: ["Gestion de projet", "Agile", "Coordination"], price: "585 000 FCFA", hours: 60 },
      { title: "Product Manager junior", summary: "Portez la vision produit et priorisez ce qui crée de la valeur.", skills: ["Produit", "Roadmap", "Priorisation"], price: "585 000 FCFA", hours: 60 },
      { title: "Business Analyst digital", summary: "Analysez les besoins et traduisez-les en solutions digitales.", skills: ["Analyse", "Besoins", "Spécifications"], price: "585 000 FCFA", hours: 48 },
      { title: "Coordinateur transformation digitale", summary: "Coordonnez les équipes et les outils du changement digital.", skills: ["Coordination", "Outils", "Suivi"], price: "585 000 FCFA", hours: 48 },
    ],
  },
];
