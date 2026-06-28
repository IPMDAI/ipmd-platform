/**
 * Types de domaine IPMD — Institut Polytechnique des Métiers du Digital.
 *
 * Ces types décrivent le modèle métier (univers, programmes, formations,
 * bootcamps, utilisateurs, rôles). Ils servent à la fois au site public et,
 * plus tard, aux applications (app.ipmd.pro), à l'admin (admin.ipmd.pro) et
 * à l'API (api.ipmd.pro). Ils sont alignés sur le futur schéma Supabase.
 */

// ──────────────────────────────────────────────────────────────
// Univers & navigation
// ──────────────────────────────────────────────────────────────

/** Identifiant stable de chacun des grands univers IPMD. */
export type UniverseId =
  | "campus"
  | "ultrajobs"
  | "professionnel"
  | "ultraboost"
  | "gouvernance"
  | "ultraexecutive"
  | "seniorshub"
  | "entreprise";

/** Nature d'un univers : diplômant, certifiant, ou pôle de services. */
export type UniverseKind = "diplome" | "certificat" | "service";

export interface Universe {
  id: UniverseId;
  /** Nom affiché, ex. « IPMD Campus ». */
  name: string;
  /** Accroche courte. */
  tagline: string;
  /** Description longue (1 à 3 phrases). */
  description: string;
  kind: UniverseKind;
  /** Public visé (description longue). */
  audience: string;
  /** Public visé en version courte (label en haut de la carte). */
  target: string;
  /** Diplômes ou certificats délivrés. */
  credentials: string[];
  /** Sous-domaine futur, si applicable. */
  subdomain?: string;
  /** Lien interne vers la page de l'univers. */
  href: string;
  /** Emoji / pictogramme léger (remplaçable par une icône). */
  icon: string;
  /** Image d'illustration de la carte (URL ou chemin /public). */
  image: string;
  /** Badge personnalisé (sinon déduit du `kind`). */
  badge?: string;
  /** Carte simplifiée (sans boutons formation/admission) pour les pôles de services. */
  simple?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Diplômes & formations
// ──────────────────────────────────────────────────────────────

export type DegreeLevel =
  | "Licence"
  | "Bachelor"
  | "Master"
  | "MBA"
  | "Master Exécutif"
  | "MBA Exécutif"
  | "DBA";

/** Niveaux d'entrée acceptés. */
export type EntryLevel =
  | "Bac"
  | "Bac+1"
  | "Bac+2"
  | "Bac+3"
  | "Bac+4"
  | "Bac+5";

export interface Program {
  id: string;
  /** Univers auquel le programme appartient. */
  universe: UniverseId;
  title: string;
  description: string;
  degrees: DegreeLevel[];
  entryLevels: EntryLevel[];
  /** Mot-clé de domaine, ex. « Marketing », « Développement ». */
  field: string;
  icon: string;
  /** Image d'illustration spécifique (sinon image par domaine). */
  image?: string;
}

// ──────────────────────────────────────────────────────────────
// Bootcamps & certificats
// ──────────────────────────────────────────────────────────────

export interface Bootcamp {
  id: string;
  universe: UniverseId;
  title: string;
  description: string;
  /** Durée indicative, ex. « 6 semaines ». */
  duration: string;
  /** Format, ex. « Intensif », « Premium ». */
  format: string;
  /** Compétences clés visées. */
  skills: string[];
  icon: string;
  /** Objectifs spécifiques (page programme). */
  objectives?: string[];
  /** Cas pratiques (page programme). */
  casPratiques?: string[];
  /** Livrable final (page programme). */
  livrable?: string;
}

// ──────────────────────────────────────────────────────────────
// Utilisateurs & rôles
// ──────────────────────────────────────────────────────────────

/**
 * Rôles applicatifs. Servent aux politiques d'accès (RLS Supabase) et au
 * routage des dashboards (étudiant, parent, enseignant, admin…).
 */
export type UserRole =
  | "super_admin" // Recteur / DSI
  | "admin" // Scolarité, RH, Finance
  | "enseignant"
  | "etudiant"
  | "parent"
  | "professionnel"
  | "dirigeant";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────
// Formulaires (prêts à connecter à Supabase)
// ──────────────────────────────────────────────────────────────

export interface InscriptionRequest {
  fullName: string;
  email: string;
  phone: string;
  universe: UniverseId;
  programInterest: string;
  entryLevel?: EntryLevel;
  message?: string;
}

export interface ContactMessage {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

/** Résultat normalisé renvoyé par les server actions de formulaire. */
export interface FormResult {
  ok: boolean;
  message: string;
  /** Code optionnel pour distinguer certains cas (ex. « duplicate »). */
  code?: string;
}

// ──────────────────────────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  /** Sous-liens (menu déroulant). */
  children?: NavItem[];
  /** Courte description affichée sous le libellé (menu déroulant). */
  description?: string;
  /** Intitulé de groupe (non cliquable) à l'intérieur d'un menu déroulant. */
  heading?: boolean;
}
