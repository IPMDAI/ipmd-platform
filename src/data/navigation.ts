import type { NavItem } from "@/types";

/** Navigation principale du site public. */
export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  {
    label: "Formations",
    href: "/formations",
    children: [
      { label: "🎓 Diplômes", href: "/formations", heading: true },
      { label: "IPMD Campus", href: "/campus", description: "Licence, Bachelor, Master — étudiants" },
      { label: "IPMD Pro", href: "/professionnel", description: "Diplômes en formation continue — salariés" },
      { label: "IPMD Executive", href: "/gouvernance", description: "Diplômes exécutifs — dirigeants" },
      { label: "📜 Certificats (bootcamps)", href: "/formations", heading: true },
      { label: "UltraJobs", href: "/ultrajobs", description: "Bootcamps jeunes (18-30 ans)" },
      { label: "UltraBoost", href: "/ultraboost", description: "Bootcamps professionnels & cadres" },
      { label: "UltraExecutive", href: "/ultraexecutive", description: "Bootcamps premium — dirigeants" },
      { label: "SeniorsHub", href: "/seniorshub", description: "Bootcamps seniors & expérimentés" },
    ],
  },
  {
    label: "Écosystème",
    href: "/hub",
    children: [
      { label: "Hub", href: "/hub", description: "Recherche, incubation & mise en relation" },
      { label: "Skills", href: "/skills", description: "Insertion, stage & emploi" },
      { label: "Entreprise / Organisation", href: "/entreprise", description: "Former, recruter, collaborer" },
    ],
  },
  {
    label: "Actu & Opportunités",
    href: "/news",
    children: [
      { label: "📰 IPMD News", href: "/news", description: "Actualités digital, IA & innovations" },
      { label: "💼 IPMD Jobs", href: "/jobs", description: "Emplois, stages, alternances, freelance" },
      { label: "🌍 IPMD Opportunities", href: "/opportunities", description: "Bourses, concours, hackathons, programmes" },
    ],
  },
  { label: "Scolarité", href: "/scolarite" },
  {
    label: "Admission",
    href: "/admission",
    children: [
      { label: "Demande d'information", href: "/demande-info" },
      { label: "Candidature / Inscription", href: "/admission" },
    ],
  },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

/** Liens regroupés pour le pied de page. */
export const footerNav = {
  formations: [
    { label: "IPMD Campus", href: "/campus" },
    { label: "UltraJobs", href: "/ultrajobs" },
    { label: "IPMD Pro", href: "/professionnel" },
    { label: "UltraBoost", href: "/ultraboost" },
    { label: "IPMD Executive", href: "/gouvernance" },
    { label: "UltraExecutive", href: "/ultraexecutive" },
  ] satisfies NavItem[],
  institut: [
    { label: "À propos", href: "/a-propos" },
    { label: "Scolarité & financement", href: "/scolarite" },
    { label: "Demande d'information", href: "/demande-info" },
    { label: "Admission", href: "/admission" },
    { label: "Toutes les formations", href: "/formations" },
    { label: "Nos partenaires", href: "/partenaires" },
    { label: "IPMD News", href: "/news" },
    { label: "IPMD Jobs", href: "/jobs" },
    { label: "IPMD Opportunities", href: "/opportunities" },
    { label: "Galerie", href: "/galerie" },
    { label: "Tableau d'honneur", href: "/distingues" },
    { label: "Enseigner à l'IPMD", href: "/recrutement" },
    { label: "Contact", href: "/contact" },
  ] satisfies NavItem[],
};

/** Sous-domaines prévus dans l'architecture future. */
export const futureSubdomains = [
  { label: "Campus", href: "https://campus.ipmd.pro" },
  { label: "UltraJobs", href: "https://ultrajobs.ipmd.pro" },
  { label: "Pro", href: "https://pro.ipmd.pro" },
  { label: "UltraBoost", href: "https://ultraboost.ipmd.pro" },
  { label: "Executive", href: "https://executive.ipmd.pro" },
  { label: "UltraExecutive", href: "https://ultraexecutive.ipmd.pro" },
  { label: "Application", href: "https://app.ipmd.pro" },
  { label: "Admin", href: "https://admin.ipmd.pro" },
  { label: "API", href: "https://api.ipmd.pro" },
];

/** Coordonnées officielles de l'institut. */
export const contactInfo = {
  email: "info@ipmd.pro",
  phones: ["+225 07 75 75 88 88", "+225 05 66 05 14 14"],
  address: "Riviera Palmeraie — Cocody Angré, à 100 m du rond-point ADO",
  city: "Abidjan, Côte d'Ivoire",
  domain: "www.ipmd.pro",
  slogan: "Ose. Agis. Impacte.",
};

/** Réseaux sociaux officiels IPMD. */
export const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/school/ipmdcampus/",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/IPMDCampus",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@IPMDcampus",
  },
] as const;
