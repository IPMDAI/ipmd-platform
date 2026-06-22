/**
 * Configuration des espaces (dashboards) par rôle.
 * Chaque rôle voit un ensemble de « tuiles » adaptées à son métier.
 */

export type DashTile = {
  title: string;
  description: string;
  icon: string;
  status: "ready" | "soon";
  href?: string;
};

/** Libellés lisibles des rôles. */
export const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administration",
  enseignant: "Enseignant",
  etudiant: "Étudiant",
  parent: "Parent",
  professionnel: "Professionnel",
  dirigeant: "Dirigeant",
};

/** Sous-titre affiché sous le nom, selon le rôle. */
export const roleTagline: Record<string, string> = {
  super_admin: "Recteur / DSI — pilotage global de l'établissement",
  admin: "Scolarité, ressources humaines et finance",
  enseignant: "Vos cours, devoirs et notes",
  etudiant: "Votre apprentissage et votre scolarité",
  parent: "Le suivi de votre enfant",
  professionnel: "Votre formation continue",
  dirigeant: "Votre programme executive",
};

/** Rôles « apprenants » : ils disposent du Tuteur IA dans leur espace. */
export const LEARNER_ROLES = new Set(["etudiant", "professionnel", "dirigeant"]);

/** Options proposées dans le panneau d'attribution des rôles. */
export const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "etudiant", label: "Étudiant" },
  { value: "parent", label: "Parent" },
  { value: "enseignant", label: "Enseignant" },
  { value: "professionnel", label: "Professionnel" },
  { value: "dirigeant", label: "Dirigeant" },
  { value: "admin", label: "Administration" },
  { value: "super_admin", label: "Super Admin" },
];

/** Tous les rôles valides (sécurité côté action serveur). */
export const VALID_ROLES = ROLE_OPTIONS.map((r) => r.value);

const SCOLARITE: DashTile = {
  title: "Ma scolarité",
  icon: "💳",
  status: "ready",
  href: "/scolarite",
  description: "Frais de formation et options de financement.",
};

/** Tuiles affichées selon le rôle. */
export const dashboardTiles: Record<string, DashTile[]> = {
  etudiant: [
    { title: "Mes cours", icon: "📚", status: "soon", description: "Tes cours, supports et ressources pédagogiques." },
    { title: "Mes devoirs", icon: "📝", status: "soon", description: "Devoirs à rendre, dépôts et corrigés." },
    { title: "Mes notes", icon: "📊", status: "soon", description: "Tes résultats et ta progression." },
    SCOLARITE,
  ],
  professionnel: [
    { title: "Mon parcours", icon: "🚀", status: "soon", description: "Tes modules de formation continue." },
    { title: "Mes travaux", icon: "📝", status: "soon", description: "Projets et travaux pratiques." },
    { title: "Mes notes", icon: "📊", status: "soon", description: "Validation de tes compétences." },
    SCOLARITE,
  ],
  dirigeant: [
    { title: "Mon programme", icon: "🏛️", status: "soon", description: "Tes modules de formation executive." },
    { title: "Mes travaux", icon: "📝", status: "soon", description: "Études de cas et livrables." },
    { title: "Mes notes", icon: "📊", status: "soon", description: "Validation du programme." },
    SCOLARITE,
  ],
  parent: [
    { title: "Suivi de mon enfant", icon: "👨‍👩‍👧", status: "soon", description: "Présence, progression et résultats." },
    { title: "Notes & bulletins", icon: "📊", status: "soon", description: "Les résultats de votre enfant." },
    { title: "Communication école", icon: "✉️", status: "soon", description: "Échanges avec l'équipe pédagogique." },
    { ...SCOLARITE, title: "Scolarité & paiements" },
  ],
  enseignant: [
    { title: "Mes cours", icon: "📚", status: "soon", description: "Gérer vos cours et supports." },
    { title: "Devoirs", icon: "📝", status: "soon", description: "Créer et corriger les devoirs." },
    { title: "Saisie des notes", icon: "🖊️", status: "soon", description: "Évaluer et saisir les notes." },
    { title: "Mes classes", icon: "👥", status: "soon", description: "Vos groupes et étudiants." },
  ],
  admin: [
    { title: "Candidatures", icon: "📥", status: "ready", href: "/espace/candidatures", description: "Demandes d'inscription reçues." },
    { title: "Messages de contact", icon: "✉️", status: "ready", href: "/espace/messages", description: "Messages envoyés via le site." },
    { title: "Étudiants", icon: "🎓", status: "soon", description: "Gestion des étudiants." },
    { title: "Scolarité", icon: "🗂️", status: "soon", description: "Inscriptions et dossiers." },
    { title: "Ressources humaines", icon: "🧑‍💼", status: "soon", description: "Personnel et enseignants." },
    { title: "Finance", icon: "💰", status: "soon", description: "Paiements et facturation." },
  ],
  super_admin: [
    { title: "Gestion des utilisateurs", icon: "🔑", status: "ready", href: "/espace/utilisateurs", description: "Attribuer les rôles aux comptes." },
    { title: "Candidatures", icon: "📥", status: "ready", href: "/espace/candidatures", description: "Demandes d'inscription reçues." },
    { title: "Messages de contact", icon: "✉️", status: "ready", href: "/espace/messages", description: "Messages envoyés via le site." },
    { title: "Étudiants", icon: "🎓", status: "soon", description: "Gestion des étudiants." },
    { title: "Scolarité", icon: "🗂️", status: "soon", description: "Inscriptions et dossiers." },
    { title: "Ressources humaines", icon: "🧑‍💼", status: "soon", description: "Personnel et enseignants." },
    { title: "Finance", icon: "💰", status: "soon", description: "Paiements et facturation." },
  ],
};
