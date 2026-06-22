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
    { title: "Mes cours", icon: "📚", status: "ready", href: "/espace/mes-cours", description: "Tes cours, devoirs et séances." },
    { title: "Emploi du temps", icon: "🗓️", status: "ready", href: "/espace/mon-emploi-du-temps", description: "Le planning de ta classe." },
    { title: "Mes notes", icon: "📊", status: "ready", href: "/espace/mes-notes", description: "Tes résultats et ta moyenne." },
    SCOLARITE,
  ],
  professionnel: [
    { title: "Mon parcours", icon: "🚀", status: "ready", href: "/espace/mes-cours", description: "Tes cours, devoirs et séances." },
    { title: "Emploi du temps", icon: "🗓️", status: "ready", href: "/espace/mon-emploi-du-temps", description: "Le planning de ta classe." },
    { title: "Mes notes", icon: "📊", status: "ready", href: "/espace/mes-notes", description: "Validation de tes compétences." },
    SCOLARITE,
  ],
  dirigeant: [
    { title: "Mon programme", icon: "🏛️", status: "ready", href: "/espace/mes-cours", description: "Tes cours, devoirs et séances." },
    { title: "Emploi du temps", icon: "🗓️", status: "ready", href: "/espace/mon-emploi-du-temps", description: "Le planning de ta classe." },
    { title: "Mes notes", icon: "📊", status: "ready", href: "/espace/mes-notes", description: "Validation du programme." },
    SCOLARITE,
  ],
  parent: [
    { title: "Suivi de mon enfant", icon: "👨‍👩‍👧", status: "ready", href: "/espace/mon-enfant", description: "Cours, emploi du temps et notes." },
    { title: "Notes & bulletins", icon: "📊", status: "soon", description: "Les résultats de votre enfant." },
    { title: "Communication école", icon: "✉️", status: "soon", description: "Échanges avec l'équipe pédagogique." },
    { ...SCOLARITE, title: "Scolarité & paiements" },
  ],
  enseignant: [
    { title: "Mes cours", icon: "📚", status: "ready", href: "/espace/cours", description: "Créer vos cours et leurs devoirs." },
    { title: "Emploi du temps", icon: "🗓️", status: "ready", href: "/espace/emploi-du-temps", description: "Vos séances de la semaine." },
    { title: "Saisie des notes", icon: "🖊️", status: "ready", href: "/espace/cours", description: "Ouvrez un cours pour saisir les notes." },
    { title: "Mes classes", icon: "👥", status: "soon", description: "Vos groupes et étudiants." },
  ],
  admin: [
    { title: "Candidatures", icon: "📥", status: "ready", href: "/espace/candidatures", description: "Demandes d'inscription reçues." },
    { title: "Messages de contact", icon: "✉️", status: "ready", href: "/espace/messages", description: "Messages envoyés via le site." },
    { title: "Parents & élèves", icon: "👨‍👩‍👧", status: "ready", href: "/espace/parents", description: "Relier les parents à leurs enfants." },
    { title: "Classes & filières", icon: "🏫", status: "ready", href: "/espace/classes", description: "Filières, promotions et affectation." },
    { title: "Salles", icon: "🚪", status: "ready", href: "/espace/salles", description: "Salles disponibles pour le planning." },
    { title: "Planning", icon: "🗓️", status: "ready", href: "/espace/planning", description: "Emploi du temps par classe." },
    { title: "Étudiants", icon: "🎓", status: "soon", description: "Gestion des étudiants." },
    { title: "Scolarité", icon: "🗂️", status: "soon", description: "Inscriptions et dossiers." },
    { title: "Recrutement profs", icon: "🧑‍🏫", status: "ready", href: "/espace/recrutement", description: "Candidatures enseignants + tri IA." },
    { title: "Finance", icon: "💰", status: "ready", href: "/espace/finance", description: "Frais, paiements et soldes." },
  ],
  super_admin: [
    { title: "Gestion des utilisateurs", icon: "🔑", status: "ready", href: "/espace/utilisateurs", description: "Attribuer les rôles aux comptes." },
    { title: "Candidatures", icon: "📥", status: "ready", href: "/espace/candidatures", description: "Demandes d'inscription reçues." },
    { title: "Messages de contact", icon: "✉️", status: "ready", href: "/espace/messages", description: "Messages envoyés via le site." },
    { title: "Parents & élèves", icon: "👨‍👩‍👧", status: "ready", href: "/espace/parents", description: "Relier les parents à leurs enfants." },
    { title: "Classes & filières", icon: "🏫", status: "ready", href: "/espace/classes", description: "Filières, promotions et affectation." },
    { title: "Salles", icon: "🚪", status: "ready", href: "/espace/salles", description: "Salles disponibles pour le planning." },
    { title: "Planning", icon: "🗓️", status: "ready", href: "/espace/planning", description: "Emploi du temps par classe." },
    { title: "Étudiants", icon: "🎓", status: "soon", description: "Gestion des étudiants." },
    { title: "Scolarité", icon: "🗂️", status: "soon", description: "Inscriptions et dossiers." },
    { title: "Recrutement profs", icon: "🧑‍🏫", status: "ready", href: "/espace/recrutement", description: "Candidatures enseignants + tri IA." },
    { title: "Finance", icon: "💰", status: "ready", href: "/espace/finance", description: "Frais, paiements et soldes." },
  ],
};
