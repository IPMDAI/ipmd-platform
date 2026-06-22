/**
 * Configuration des espaces (dashboards) par rôle.
 * Les rôles « apprenants » et le parent/enseignant ont des tuiles simples ;
 * les admins ont des tuiles regroupées en sections.
 */

export type DashTile = {
  title: string;
  description: string;
  icon: string;
  status: "ready" | "soon";
  href?: string;
};

export type DashSection = { title: string; tiles: DashTile[] };

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

/** Pour les apprenants connectés : leur situation de paiement personnelle. */
const LEARNER_SCOLARITE: DashTile = {
  title: "Ma scolarité",
  icon: "💳",
  status: "ready",
  href: "/espace/mes-paiements",
  description: "Tes frais, paiements et ton solde.",
};

const BULLETIN: DashTile = {
  title: "Mon bulletin",
  icon: "📄",
  status: "ready",
  href: "/espace/mon-bulletin",
  description: "Tes résultats et ta moyenne générale.",
};

const DOCUMENTS: DashTile = {
  title: "Mes documents",
  icon: "🪪",
  status: "ready",
  href: "/espace/documents",
  description: "Attestations, certificat et carte étudiant.",
};

/** Tuiles des rôles apprenants / parent / enseignant. */
export const dashboardTiles: Record<string, DashTile[]> = {
  etudiant: [
    { title: "Mes cours", icon: "📚", status: "ready", href: "/espace/mes-cours", description: "Tes cours, devoirs et séances." },
    { title: "Emploi du temps", icon: "🗓️", status: "ready", href: "/espace/mon-emploi-du-temps", description: "Le planning de ta classe." },
    { title: "Mes notes", icon: "📊", status: "ready", href: "/espace/mes-notes", description: "Tes résultats et ta moyenne." },
    BULLETIN,
    DOCUMENTS,
    LEARNER_SCOLARITE,
  ],
  professionnel: [
    { title: "Mon parcours", icon: "🚀", status: "ready", href: "/espace/mes-cours", description: "Tes cours, devoirs et séances." },
    { title: "Emploi du temps", icon: "🗓️", status: "ready", href: "/espace/mon-emploi-du-temps", description: "Le planning de ta classe." },
    { title: "Mes notes", icon: "📊", status: "ready", href: "/espace/mes-notes", description: "Validation de tes compétences." },
    BULLETIN,
    DOCUMENTS,
    LEARNER_SCOLARITE,
  ],
  dirigeant: [
    { title: "Mon programme", icon: "🏛️", status: "ready", href: "/espace/mes-cours", description: "Tes cours, devoirs et séances." },
    { title: "Emploi du temps", icon: "🗓️", status: "ready", href: "/espace/mon-emploi-du-temps", description: "Le planning de ta classe." },
    { title: "Mes notes", icon: "📊", status: "ready", href: "/espace/mes-notes", description: "Validation du programme." },
    BULLETIN,
    DOCUMENTS,
    LEARNER_SCOLARITE,
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
};

/** Tuiles admin, réutilisées dans les sections. */
const ADMIN_TILES = {
  users: { title: "Gestion des utilisateurs", icon: "🔑", status: "ready", href: "/espace/utilisateurs", description: "Attribuer les rôles aux comptes." },
  candidatures: { title: "Candidatures", icon: "📥", status: "ready", href: "/espace/candidatures", description: "Demandes d'inscription reçues." },
  messages: { title: "Messages de contact", icon: "✉️", status: "ready", href: "/espace/messages", description: "Messages envoyés via le site." },
  annonces: { title: "Annonces", icon: "📢", status: "ready", href: "/espace/annonces", description: "Communiquer avec étudiants et parents." },
  parents: { title: "Parents & élèves", icon: "👨‍👩‍👧", status: "ready", href: "/espace/parents", description: "Relier les parents à leurs enfants." },
  classes: { title: "Classes & filières", icon: "🏫", status: "ready", href: "/espace/classes", description: "Filières, promotions et affectation." },
  salles: { title: "Salles", icon: "🚪", status: "ready", href: "/espace/salles", description: "Salles disponibles pour le planning." },
  planning: { title: "Planning", icon: "🗓️", status: "ready", href: "/espace/planning", description: "Emploi du temps par classe." },
  recrutement: { title: "Recrutement profs", icon: "🧑‍🏫", status: "ready", href: "/espace/recrutement", description: "Candidatures enseignants + tri IA." },
  finance: { title: "Finance", icon: "💰", status: "ready", href: "/espace/finance", description: "Frais, paiements et soldes." },
  bulletins: { title: "Bulletins", icon: "📄", status: "ready", href: "/espace/bulletins", description: "Bulletins de notes des étudiants." },
  documents: { title: "Documents officiels", icon: "🪪", status: "ready", href: "/espace/documents", description: "Attestations, certificats, cartes étudiant." },
  etudiants: { title: "Étudiants", icon: "🎓", status: "ready", href: "/espace/etudiants", description: "Annuaire, bulletins et documents." },
  scolarite: { title: "Scolarité", icon: "🗂️", status: "soon", description: "Inscriptions et dossiers." },
} satisfies Record<string, DashTile>;

/** Tableaux de bord en sections (admins). */
export const dashboardSections: Record<string, DashSection[]> = {
  super_admin: [
    {
      title: "Pédagogie & planning",
      tiles: [ADMIN_TILES.classes, ADMIN_TILES.salles, ADMIN_TILES.planning, ADMIN_TILES.recrutement],
    },
    {
      title: "Scolarité & finance",
      tiles: [
        ADMIN_TILES.etudiants,
        ADMIN_TILES.scolarite,
        ADMIN_TILES.finance,
        ADMIN_TILES.bulletins,
        ADMIN_TILES.documents,
      ],
    },
    {
      title: "Relations & accès",
      tiles: [ADMIN_TILES.annonces, ADMIN_TILES.users, ADMIN_TILES.candidatures, ADMIN_TILES.messages, ADMIN_TILES.parents],
    },
  ],
  admin: [
    {
      title: "Pédagogie & planning",
      tiles: [ADMIN_TILES.classes, ADMIN_TILES.salles, ADMIN_TILES.planning, ADMIN_TILES.recrutement],
    },
    {
      title: "Scolarité & finance",
      tiles: [
        ADMIN_TILES.etudiants,
        ADMIN_TILES.scolarite,
        ADMIN_TILES.finance,
        ADMIN_TILES.bulletins,
        ADMIN_TILES.documents,
      ],
    },
    {
      title: "Relations",
      tiles: [ADMIN_TILES.annonces, ADMIN_TILES.candidatures, ADMIN_TILES.messages, ADMIN_TILES.parents],
    },
  ],
};
