/**
 * Navigation latérale de l'espace (cockpit), par rôle.
 * Chaque rôle voit un menu organisé en groupes → items, pointant vers des
 * routes réelles de l'application.
 */

export type NavItem = { label: string; href: string; icon: string };
export type NavGroup = { title?: string; items: NavItem[] };

const HOME: NavItem = {
  label: "Tableau de bord",
  href: "/espace",
  icon: "🏠",
};

const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      HOME,
      { label: "Statistiques", href: "/espace/statistiques", icon: "📊" },
    ],
  },
  {
    title: "Pédagogie & planning",
    items: [
      { label: "Classes & filières", href: "/espace/classes", icon: "🏫" },
      { label: "Années & Rentrées", href: "/espace/annees-rentrees", icon: "📅" },
      { label: "Calendrier académique", href: "/espace/calendrier", icon: "🗓️" },
      { label: "Salles", href: "/espace/salles", icon: "🚪" },
      { label: "Planning", href: "/espace/planning", icon: "🗓️" },
      { label: "Séances", href: "/espace/seances", icon: "📅" },
      { label: "Jours fériés", href: "/espace/jours-feries", icon: "📆" },
      { label: "Présences", href: "/espace/presences", icon: "✅" },
      { label: "Fiches pédagogiques", href: "/espace/fiches", icon: "🗂️" },
      { label: "Besoins en personnel", href: "/espace/besoins-ag", icon: "🧑‍🏫" },
      { label: "Recrutement profs", href: "/espace/recrutement", icon: "🧑‍🏫" },
      { label: "Enseignants", href: "/espace/enseignants", icon: "👨‍🏫" },
    ],
  },
  {
    title: "Scolarité & finance",
    items: [
      { label: "Étudiants", href: "/espace/etudiants", icon: "🎓" },
      { label: "Participants (bootcamps)", href: "/espace/participants", icon: "📜" },
      { label: "Bulletins", href: "/espace/bulletins", icon: "📄" },
      { label: "Documents officiels", href: "/espace/documents", icon: "🪪" },
      { label: "Signatures & cachets", href: "/espace/signatures", icon: "✍️" },
      { label: "Finance", href: "/espace/finance", icon: "💰" },
      { label: "Paie enseignants", href: "/espace/paie", icon: "💼" },
    ],
  },
  {
    title: "Relations & accès",
    items: [
      { label: "Annonces", href: "/espace/annonces", icon: "📢" },
      { label: "Actu & Opportunités", href: "/espace/contenus", icon: "📰" },
      { label: "Modération", href: "/espace/moderation", icon: "🛡️" },
      { label: "Marketing / Prospects", href: "/espace/marketing", icon: "📣" },
      { label: "Partenaires", href: "/espace/partenaires", icon: "🤝" },
      { label: "Utilisateurs", href: "/espace/utilisateurs", icon: "🔑" },
      { label: "Reprise des anciens", href: "/espace/reprise", icon: "♻️" },
      { label: "Accès anciens", href: "/espace/acces-ancien", icon: "🔓" },
      { label: "Parents & élèves", href: "/espace/parents", icon: "👨‍👩‍👧" },
      { label: "Convocations", href: "/espace/convocations", icon: "📨" },
      { label: "Documents à fournir", href: "/espace/documents-a-fournir", icon: "📎" },
      { label: "Événements", href: "/espace/evenements", icon: "🎉" },
      { label: "Candidatures", href: "/espace/candidatures", icon: "📥" },
      { label: "Messages", href: "/espace/messages", icon: "✉️" },
    ],
  },
];

const TEACHER_NAV: NavGroup[] = [
  { items: [HOME] },
  {
    title: "Enseignement",
    items: [
      { label: "Mes cours", href: "/espace/cours", icon: "📚" },
      { label: "Emploi du temps", href: "/espace/emploi-du-temps", icon: "🗓️" },
      { label: "Mes séances", href: "/espace/mes-seances", icon: "📝" },
      { label: "Suivi pédagogique", href: "/espace/mon-suivi", icon: "📋" },
      { label: "Ma classe", href: "/espace/ma-classe", icon: "📣" },
    ],
  },
];

const LEARNER_NAV: NavGroup[] = [
  { items: [HOME] },
  {
    title: "Mon parcours",
    items: [
      { label: "Mes cours", href: "/espace/mes-cours", icon: "📚" },
      { label: "Emploi du temps", href: "/espace/mon-emploi-du-temps", icon: "🗓️" },
      { label: "Mes notes", href: "/espace/mes-notes", icon: "📊" },
      { label: "Mon bulletin", href: "/espace/mon-bulletin", icon: "📄" },
      { label: "Mon stage", href: "/espace/mon-stage", icon: "🧳" },
      { label: "Mes travaux", href: "/espace/mes-travaux", icon: "📝" },
    ],
  },
  {
    title: "Scolarité",
    items: [
      { label: "Mes documents", href: "/espace/documents", icon: "🪪" },
      { label: "Mes démarches", href: "/espace/mes-demarches", icon: "📎" },
      { label: "Vie IPMD", href: "/espace/vie-ipmd", icon: "🎉" },
      { label: "Ma scolarité", href: "/espace/mes-paiements", icon: "💳" },
      { label: "Règlement intérieur", href: "/espace/reglement", icon: "📜" },
    ],
  },
];

const PARENT_NAV: NavGroup[] = [
  { items: [HOME] },
  {
    title: "Suivi",
    items: [
      { label: "Mon enfant", href: "/espace/mon-enfant", icon: "👨‍👩‍👧" },
      { label: "Vie IPMD", href: "/espace/vie-ipmd", icon: "🎉" },
      { label: "Opportunités", href: "/espace/opportunites", icon: "✨" },
    ],
  },
];

const ACCOUNT_GROUP: NavGroup = {
  title: "Compte",
  items: [
    // « Communauté » (réseau social) désactivé : messagerie officielle uniquement.
    { label: "Messagerie", href: "/espace/messagerie", icon: "💬" },
    { label: "Paramètres", href: "/espace/parametres", icon: "⚙️" },
  ],
};

const STAFF_NAV: NavGroup[] = [{ items: [HOME] }];

const PEDAGOGIE_NAV: NavGroup[] = [
  { items: [HOME] },
  {
    title: "Pédagogie",
    items: [
      { label: "Annonces de classe", href: "/espace/ma-classe", icon: "📣" },
      { label: "Séances", href: "/espace/seances", icon: "📅" },
      { label: "Enseignants", href: "/espace/enseignants", icon: "👨‍🏫" },
      { label: "Jours fériés", href: "/espace/jours-feries", icon: "📆" },
    ],
  },
];

/**
 * Directeur des Études (D2) : encadrement académique/pédagogique. N'inclut
 * aucune entrée finance / paie / RH / comptes / sécurité. « Mes cours » /
 * « Emploi du temps » n'affichent que ses cours réellement affectés
 * (courses.teacher_id = auth.uid()).
 */
const DIRECTEUR_ETUDES_NAV: NavGroup[] = [
  { items: [HOME] },
  {
    title: "Pédagogie & planning",
    items: [
      { label: "Classes & filières", href: "/espace/classes", icon: "🏫" },
      { label: "Années & Rentrées", href: "/espace/annees-rentrees", icon: "📅" },
      { label: "Calendrier académique", href: "/espace/calendrier", icon: "🗓️" },
      { label: "Salles", href: "/espace/salles", icon: "🚪" },
      { label: "Planning", href: "/espace/planning", icon: "🗓️" },
      { label: "Séances", href: "/espace/seances", icon: "📅" },
      { label: "Présences", href: "/espace/presences", icon: "✅" },
      { label: "Fiches pédagogiques", href: "/espace/fiches", icon: "🗂️" },
    ],
  },
  {
    title: "Suivi académique",
    items: [
      { label: "Étudiants", href: "/espace/etudiants", icon: "🎓" },
      { label: "Enseignants & charge", href: "/espace/enseignants-charge", icon: "👨‍🏫" },
      { label: "Bulletins", href: "/espace/bulletins", icon: "📄" },
      { label: "Convocations", href: "/espace/convocations", icon: "📨" },
      { label: "Documents à fournir", href: "/espace/documents-a-fournir", icon: "📎" },
      { label: "Annonces académiques", href: "/espace/annonces", icon: "📢" },
      { label: "Correction de notes", href: "/espace/correction-notes", icon: "🖊️" },
    ],
  },
  {
    title: "Stages & soutenances",
    items: [
      { label: "Entreprises d'accueil", href: "/espace/entreprises", icon: "🏢" },
      { label: "Stages", href: "/espace/stages", icon: "🧳" },
      { label: "Mémoires & travaux", href: "/espace/travaux", icon: "📝" },
    ],
  },
  {
    title: "Personnel",
    items: [
      { label: "Besoins en personnel", href: "/espace/besoins", icon: "🧑‍🏫" },
    ],
  },
  {
    title: "Mes cours affectés",
    items: [
      { label: "Mes cours", href: "/espace/cours", icon: "📚" },
      { label: "Emploi du temps", href: "/espace/emploi-du-temps", icon: "🗓️" },
    ],
  },
];

/** Entrée « Équipes & Accès » — RÉSERVÉE super_admin (jamais visible pour admin
 * ni aucun autre rôle). La page /espace/equipes redouble la garde côté serveur. */
const SUPER_ADMIN_GROUP: NavGroup = {
  title: "Administration avancée",
  items: [
    { label: "Équipes & Accès", href: "/espace/equipes", icon: "🛡️" },
    { label: "Journal d'activité", href: "/espace/audit", icon: "📜" },
  ],
};

export function getNavForRole(
  role: string,
  opts?: { canViewCandidatures?: boolean }
): NavGroup[] {
  let base: NavGroup[];
  if (role === "admin" || role === "super_admin") base = ADMIN_NAV;
  else if (role === "pedagogie") base = PEDAGOGIE_NAV;
  else if (role === "directeur_etudes") base = DIRECTEUR_ETUDES_NAV;
  else if (role === "scolarite") base = STAFF_NAV;
  else if (role === "enseignant") base = TEACHER_NAV;
  else if (role === "parent") base = PARENT_NAV;
  else base = LEARNER_NAV; // etudiant, professionnel, dirigeant
  const groups = [...base];
  if (role === "super_admin") groups.push(SUPER_ADMIN_GROUP);
  // Staff (module Équipes & Accès) : lien Candidatures si `view_candidatures` sur
  // ≥1 univers. admin/super_admin l'ont déjà via ADMIN_NAV → on n'ajoute rien.
  if (opts?.canViewCandidatures && role !== "admin" && role !== "super_admin") {
    groups.push({ title: "Staff", items: [{ label: "Candidatures", href: "/espace/candidatures", icon: "📥" }] });
  }
  return [...groups, ACCOUNT_GROUP];
}
