// ──────────────────────────────────────────────────────────────
// IPMD — Convention de formation (cursus Diplôme).
// ⚠️ TEXTE PLACEHOLDER — à FINALISER / valider juridiquement par l'IPMD.
// Pour modifier : éditer ce fichier (un article = { n, title, body[] }).
// ──────────────────────────────────────────────────────────────

export const CONVENTION_VERSION = "diplome-2025-2026";
export const CONVENTION_TITLE = "Convention de formation";
export const CONVENTION_YEAR = "2025-2026";

export type ConventionArticle = { n: number; title: string; body: string[] };

export const CONVENTION_ARTICLES: ConventionArticle[] = [
  {
    n: 1,
    title: "Objet",
    body: [
      "La présente convention définit les conditions dans lesquelles l'Institut Polytechnique des Métiers du Digital (IPMD) dispense la formation à l'étudiant admis, et les engagements réciproques des parties.",
    ],
  },
  {
    n: 2,
    title: "Durée et déroulement",
    body: [
      "La formation se déroule sur l'année académique indiquée dans le pack d'admission, selon le calendrier et les emplois du temps communiqués par l'IPMD.",
    ],
  },
  {
    n: 3,
    title: "Frais et modalités de paiement",
    body: [
      "Les frais d'inscription et de scolarité, ainsi que l'échéancier, sont ceux communiqués dans le pack d'admission. Le détail définitif et les modalités de paiement sont confirmés par le service Scolarité (le pack d'admission affiche un montant prévisionnel, non contractuel tant que le plan de paiement n'est pas confirmé).",
    ],
  },
  {
    n: 4,
    title: "Engagements de l'étudiant",
    body: [
      "L'étudiant s'engage à respecter le règlement intérieur de l'IPMD et à s'acquitter des frais selon les modalités convenues.",
    ],
  },
  {
    n: 5,
    title: "Prise d'effet et signature",
    body: [
      "La présente convention prend effet à sa signature par les deux parties. La signature s'effectue par document signé (manuscrit scanné) ou, le cas échéant, via un prestataire de signature électronique agréé.",
    ],
  },
];
