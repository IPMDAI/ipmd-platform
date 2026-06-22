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
      { label: "Salles", href: "/espace/salles", icon: "🚪" },
      { label: "Planning", href: "/espace/planning", icon: "🗓️" },
      { label: "Présences", href: "/espace/presences", icon: "✅" },
      { label: "Fiches pédagogiques", href: "/espace/fiches", icon: "🗂️" },
      { label: "Recrutement profs", href: "/espace/recrutement", icon: "🧑‍🏫" },
    ],
  },
  {
    title: "Scolarité & finance",
    items: [
      { label: "Étudiants", href: "/espace/etudiants", icon: "🎓" },
      { label: "Bulletins", href: "/espace/bulletins", icon: "📄" },
      { label: "Documents officiels", href: "/espace/documents", icon: "🪪" },
      { label: "Finance", href: "/espace/finance", icon: "💰" },
    ],
  },
  {
    title: "Relations & accès",
    items: [
      { label: "Annonces", href: "/espace/annonces", icon: "📢" },
      { label: "Utilisateurs", href: "/espace/utilisateurs", icon: "🔑" },
      { label: "Parents & élèves", href: "/espace/parents", icon: "👨‍👩‍👧" },
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
    ],
  },
  {
    title: "Scolarité",
    items: [
      { label: "Mes documents", href: "/espace/documents", icon: "🪪" },
      { label: "Ma scolarité", href: "/espace/mes-paiements", icon: "💳" },
    ],
  },
];

const PARENT_NAV: NavGroup[] = [
  { items: [HOME] },
  {
    title: "Suivi",
    items: [
      { label: "Mon enfant", href: "/espace/mon-enfant", icon: "👨‍👩‍👧" },
    ],
  },
];

const ACCOUNT_GROUP: NavGroup = {
  title: "Compte",
  items: [{ label: "Paramètres", href: "/espace/parametres", icon: "⚙️" }],
};

export function getNavForRole(role: string): NavGroup[] {
  let base: NavGroup[];
  if (role === "admin" || role === "super_admin") base = ADMIN_NAV;
  else if (role === "enseignant") base = TEACHER_NAV;
  else if (role === "parent") base = PARENT_NAV;
  else base = LEARNER_NAV; // etudiant, professionnel, dirigeant
  return [...base, ACCOUNT_GROUP];
}
