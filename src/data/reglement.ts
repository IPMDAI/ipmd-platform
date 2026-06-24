// ──────────────────────────────────────────────────────────────
// IPMD — Règlement intérieur (cursus Diplôme) 2025-2026.
// Source : « règlement intérieur étudiants IPMD 2025-2026.doc ».
// ⚠️ Texte importé à RELIRE / corriger par l'administration.
// Pour modifier : éditer ce fichier (un article = { n, title, body[] }).
// ──────────────────────────────────────────────────────────────

export const REGLEMENT_VERSION = "diplome-2025-2026";
export const REGLEMENT_TITLE = "Règlement intérieur — Étudiants (Diplôme)";
export const REGLEMENT_YEAR = "2025-2026";

export type Article = { n: number; title: string; body: string[] };

export const REGLEMENT_ARTICLES: Article[] = [
  {
    n: 1,
    title: "Dispositions législatives et règlementaires",
    body: [
      "Le présent règlement intérieur est soumis aux articles L.6352-3 et suivants et R.6352-1 et suivants du Code du Travail.",
    ],
  },
  {
    n: 2,
    title: "Calendrier de l'année, emplois du temps et e-mail",
    body: [
      "L'année universitaire se déroule sur deux semestres. Le calendrier de l'année et les emplois du temps sont établis par l'administration qui les publie au début de l'année universitaire ou en début de semestre. Ils peuvent donner lieu à modification en fonction des contraintes pédagogiques. La publication est faite sur mail, sur WhatsApp ou sur notre plateforme. La durée hebdomadaire des cours varie selon les années, les sections et les périodes universitaires. Elle peut être augmentée ou réduite en fonction des impératifs internes de l'école.",
      "Un e-mail est attribué à chaque nouvel(le) étudiant(e). Il est obligatoire d'utiliser cet e-mail pour assurer le bon déroulement et le suivi de votre formation et la réception des informations capitales.",
    ],
  },
  {
    n: 3,
    title: "Ouverture de l'école",
    body: [
      "Les jours et les heures d'ouverture de l'école sont affichés à l'accueil. Les demandes d'ouverture exceptionnelle sont adressées par les intéressés à l'administration au moins sept (7) jours à l'avance.",
    ],
  },
  {
    n: 4,
    title: "L'administrateur général",
    body: [
      "Il définit la politique de l'école, représente celle-ci dans les relations extérieures, est responsable de l'administration générale, recrute le personnel, organise, coordonne et contrôle les programmes d'études. Il est le représentant légal vis-à-vis du Ministère de l'Enseignement Supérieur et de la recherche scientifique, du Ministère de l'Emploi et de la Protection Sociale.",
    ],
  },
  {
    n: 5,
    title: "Le directeur des études",
    body: [
      "Il participe au recrutement des étudiants et des intervenants. Il assure le contrôle du suivi individuel de chaque étudiant. Il organise, coordonne et contrôle les programmes d'études. Il fait appliquer les directives et veille à leur bonne exécution auprès des étudiants et des enseignants.",
    ],
  },
  {
    n: 6,
    title: "Le conseil pédagogique",
    body: [
      "Il se réunit par promotion et par section, sous la présidence de l'administrateur général ou de son représentant à la fin de chaque semestre. Il examine les résultats et émet un avis sur les différents problèmes d'ordre pédagogique qui sont soulevés.",
      "Participent au conseil pédagogique : le directeur des projets et des métiers digitaux et insertion socio-professionnelle ; le coordinateur de master et de digital e-learning ; le coordinateur de licence et de digital e-learning ; le responsable insertion, entrepreneuriat et financement du projet ; les formateurs et les intervenants ; les étudiants délégués de section, à titre consultatif.",
    ],
  },
  {
    n: 7,
    title: "Les délégués de section (Classe)",
    body: [
      "Chaque section désigne pour l'année par voie d'élection, deux délégués. Si, durant l'année universitaire, les 2/3 des étudiants d'une section demandent la démission du ou des délégués, il est procédé à de nouvelles élections. Pour le délégué général, il est procédé à une élection chaque année. Les délégués de classe et le délégué général ont un devoir de réserve pendant et après leur mandat.",
    ],
  },
  {
    n: 8,
    title: "Les associations des élèves",
    body: [
      "Elles peuvent être autorisées par l'administration. Les statuts doivent être déposés et légalisés auprès de la mairie de la commune. Leur raison sociale est indépendante de celle de l'école. Elles représentent les étudiants de l'établissement conformément au contenu de leurs statuts. Leur siège est autorisé au sein de l'établissement. Cette autorisation peut être retirée si l'activité de l'association risque de mettre en cause la notoriété et le bon fonctionnement de l'établissement. Elles organisent des activités tant didactiques (conférences, réunions) que ludiques (sortie détente, journée culturelle).",
      "L'association des étudiants de IPMD est constituée d'un bureau représentatif dont les membres sont des étudiants de chaque niveau allant de la licence 1 au master 2, ayant différentes responsabilités et répondant à une hiérarchie (président(e), vice-président(e), secrétaire et secrétaire(s) adjoint(s), responsable organisation et adjoint(s), responsable communication et adjoint(s), trésorier(e) et adjoint(s)).",
      "L'administrateur général ou son représentant est président d'honneur de toute association hébergée par l'école.",
    ],
  },
  {
    n: 9,
    title: "Entrevue avec l'administrateur général de l'École",
    body: [
      "Tout étudiant ou parent d'étudiant qui désire être reçu par l'administrateur général ou son représentant doit en effectuer la demande auprès du secrétariat.",
    ],
  },
  {
    n: 10,
    title: "Réunion avec les parents d'étudiants / Commissions d'études",
    body: [
      "L'administration se réserve la possibilité d'organiser une rencontre entre les enseignants et les parents des étudiants. La date et l'heure de cette réunion seront communiquées aux parents durant l'année universitaire. À l'occasion de cette réunion, les parents d'étudiants pourront rencontrer individuellement les professeurs et l'administration.",
      "L'administrateur général ou son représentant peut réunir des commissions d'études composées de toutes les personnes (formateurs et/ou étudiants et/ou entreprises) susceptibles d'aider à la résolution de problème de formation.",
    ],
  },
  {
    n: 11,
    title: "Assiduité des étudiants",
    body: [
      "Alinéa 1 — Assiduité en cours : elle est impérative. Aucun étudiant ne sera admis en classe une fois le cours commencé. Toute absence devra être justifiée par l'étudiant sous 48 heures. Le contrôle des absences est effectué par les enseignants à chaque séquence de cours.",
      "Alinéa 2 — Justification des absences : tout manquement à l'obligation d'assiduité doit être justifié par un document écrit. Toute absence pour maladie ou accident doit être obligatoirement signalée dans les 48 heures et justifiée par une copie de l'arrêt de travail ou du certificat médical, remise au pôle pédagogique. En cas d'absence non justifiée par un arrêt de travail, un courrier explicatif ou un document officiel doit être adressé à la direction des études qui évalue le motif allégué. Si la direction des études estime que le motif est acceptable, l'absence est excusée. Dans le cas contraire, l'absence est non excusée et sanctionnable.",
      "Alinéa 3 — Retards : les retards sont comptabilisés et sanctionnés comme les absences. En cas de retard, les étudiants doivent signaler leur présence sur le campus et signer le registre à l'accueil en précisant leur heure d'arrivée. Si, exceptionnellement, le retardataire est admis en cours de séance, à charge pour lui de s'assurer que l'enseignant a bien noté son arrivée.",
      "Alinéa 4 — Absences aux contrôles : toute absence non justifiée à un contrôle continu, partiel ou examen est sanctionnée par un zéro (0). Les justificatifs doivent être produits dans les 48 h après l'épreuve. Aucun document remis ultérieurement ne sera pris en considération. L'accès à d'éventuelles épreuves de rattrapage pourra être décidé par le Conseil Pédagogique. Aucun retard n'est autorisé lors d'une épreuve.",
    ],
  },
  {
    n: 12,
    title: "Stages / Missions / Projets professionnels",
    body: [
      "Ils s'effectuent sous l'autorité du directeur des projets et des métiers digitaux et insertion socio-professionnelle et après accord formel. Un accord préalable devra être validé avant le début du stage ou de la mission, et remis à la direction des projets au moins quinze jours avant le démarrage.",
      "Aucun stage ou mission ne peut être entamé sans validation préalable de la direction des projets. Après avis favorable, chaque période de stage ou de mission en entreprise fait l'objet d'une convention entre l'école et l'entreprise d'accueil, établie conformément aux dispositions en vigueur (Décret 2006-1093 du 29/08/2006). Cette convention pourra être adaptée lorsque le stage ou la mission se déroule dans une entreprise située à l'étranger.",
      "Les étudiants, durant leurs stages et missions, bénéficient de la responsabilité civile de l'École et des dispositions de la législation sur les accidents du travail (article L.412-8 du Code de la Sécurité Sociale). Aucun stage ne pourra débuter sans le retour de la convention signée.",
    ],
  },
  {
    n: 13,
    title: "Règlement des examens et évaluations",
    body: [
      "Alinéa 1 — Organisation matérielle de l'épreuve : les sacs et documents doivent être déposés à l'entrée de la salle. Aucun vêtement ou effet personnel ne doit être déposé sur les tables. L'utilisation de supports spécifiques (dictionnaires…) et/ou de calculatrices est précisée sur les sujets ; à défaut, il n'y a pas d'autorisation d'usage. Les téléphones portables, smartphones, tablettes, ordinateurs ou assimilés sont totalement interdits et devront être rangés dans les sacs. Si un étudiant est surpris à utiliser un tel appareil, il sera exclu et se verra attribuer un zéro (0). Le copiage ou la fraude sont directement sanctionnés par une exclusion immédiate de l'épreuve et l'attribution d'un zéro (0).",
      "Alinéa 2 — Déroulement de l'épreuve : toute communication entre étudiants est interdite. Le surveillant pourra déplacer un étudiant après un rappel à l'ordre ; s'il refuse, il sera exclu. Tout étudiant exclu doit se présenter au secrétariat pédagogique et/ou à la direction des études. En fin d'épreuve, l'étudiant devra émarger la feuille de présence présentée par le surveillant.",
      "Alinéa 6 — Délivrance des Diplômes ou Titres : selon la nature de la formation suivie, celle-ci sera sanctionnée par un Diplôme délivré à l'issue d'examens organisés par l'administration de l'établissement. La cérémonie de remise de diplôme est obligatoire et se fait un (1) an ou plus après la soutenance. Elle est obligatoire en Licence 3 et Master 2. L'étudiant devra obligatoirement rédiger et déposer un mémoire et un rapport de stage (ou un projet), puis présenter et expliquer ses travaux devant un jury, conformément au Contrat d'Engagement Académique et d'Obtention des Diplômes. Le diplôme ne sera délivré qu'après le règlement total des frais de scolarité. Pour les programmes spécifiques à l'École, un certificat de fin de formation est délivré au vu des résultats. Tout étudiant ayant obtenu une note inférieure ou égale à 09/20 à l'évaluation finale d'un cours a droit à une session de rattrapage. Le Conseil pédagogique peut émettre un avis favorable de redoublement au vu des résultats, du comportement et de l'assiduité.",
    ],
  },
  {
    n: 14,
    title: "Fraude et plagiat",
    body: [
      "Toute fraude, tentative de fraude ou plagiat commis par un étudiant peut entraîner l'annulation de son épreuve ou la nullité du document remis (mémoire, rapport, dossier, projet…). En cas de flagrant délit lors d'une épreuve écrite, le candidat doit quitter la salle et se voit attribuer un zéro (0).",
      "« Il est interdit de copier, de contrefaire ou de falsifier un document sujet à une évaluation et d'utiliser, dans un document ou un travail soumis à évaluation, en tout ou partie, l'œuvre d'autrui ou des passages appréciables tirés de celle-ci, sans les identifier expressément comme citation. »",
    ],
  },
  {
    n: 15,
    title: "Discipline et sanctions",
    body: [
      "Le dialogue et le suivi personnalisé ont pour objectif de permettre à chacun de progresser. Cependant, les manquements permanents et graves seront naturellement sanctionnés. Peuvent faire l'objet d'un avertissement et, suivant le degré de gravité, entraîner la convocation du Conseil de Discipline, les agissements portant atteinte à la bonne image de l'école.",
      "Dans le cadre d'échanges avec d'autres établissements (conventions de coopération, jumelage, voyages…), l'étudiant devra respecter le règlement intérieur de l'établissement d'accueil. Toute sanction prononcée par l'établissement d'accueil pourra également être suivie d'effet par l'administration de l'école.",
      "L'étudiant dont le travail sera jugé notoirement insuffisant par le Conseil Pédagogique (article 6) pourra également faire l'objet d'une convocation par l'administration et/ou du conseil de discipline.",
    ],
  },
  {
    n: 16,
    title: "Le conseil de discipline",
    body: [
      "Le conseil de discipline est le seul habilité à prononcer, à l'encontre des étudiants, des sanctions graves de nature à affecter la poursuite de la scolarité dans l'établissement. L'étudiant y est jugé dans la transparence, par une commission représentative, devant laquelle il peut prendre la parole et se faire assister.",
      "La commission comprend : 1) l'administrateur général ou son représentant ; 2) éventuellement, selon la faute reprochée, un représentant du corps professoral et/ou un responsable du suivi et de l'accompagnement des étudiants ; 3) sur demande expresse de l'étudiant convoqué, un délégué de sa section (qui ne prend pas part au vote).",
      "L'administration peut suspendre la présence de l'étudiant si elle estime que celle-ci est de nature à causer un trouble important dans la classe, l'établissement ou l'entreprise de stage. Un compte-rendu sera adressé à l'étudiant.",
    ],
  },
  {
    n: 17,
    title: "Règles de vie",
    body: [
      "Ce règlement fixe les mesures d'application en matière d'hygiène et de sécurité, de comportements et de respect des lieux. Il s'applique à tous les étudiants inscrits et poursuivant leurs études dans l'établissement.",
      "Alinéa 1 — Interdiction de fumer : il est strictement interdit de fumer et de vapoter dans tous les locaux de l'établissement et aux abords de l'établissement.",
      "Alinéa 2 — Tenue vestimentaire : une tenue et un comportement corrects sont exigés, dans l'établissement comme durant les missions de représentation de l'école. Pour des raisons de sécurité, il est interdit de porter tout vêtement ou accessoire (casquette, capuche, lunettes de soleil…) rendant difficile l'identification des personnes. Pas de basket, pas de sandales, pas de jeans déchirés ; veste obligatoire pour les dames ; polo ou tee-shirt à l'effigie de IPMD ; tenue libre mais correcte.",
      "Alinéa 3 — Interdiction de bizutage : le bizutage, sous quelque forme que ce soit, est strictement interdit et l'école décline toute responsabilité.",
      "Alinéa 4 — Substances toxiques ou alcoolisées : il est interdit d'introduire et de consommer des substances toxiques ou alcoolisées dans l'école et aux abords de l'école.",
      "Alinéa 5 — Mesure d'hygiène : il est formellement interdit de consommer nourriture et boisson en dehors des lieux autorisés par l'administration.",
      "Alinéa 6 — Respect de l'environnement : veiller à ne laisser traîner aucun détritus et utiliser les corbeilles. Il est strictement interdit de sortir le mobilier des salles de cours. Les étudiants respectent scrupuleusement les règles de stationnement.",
    ],
  },
  {
    n: 18,
    title: "Usage du matériel",
    body: [
      "Alinéa 1 — Dégradations matérielles : chaque étudiant a l'obligation de conserver en bon état le matériel confié et les locaux mis à sa disposition. L'utilisation du matériel à d'autres fins, notamment personnelles, est interdite. Toute dégradation fait l'objet de sanctions et de poursuites, et le montant des dégâts peut être facturé au responsable.",
      "Alinéa 2 — Vol ou dommages des biens personnels : l'école décline toute responsabilité en cas de perte, vol ou détérioration des objets personnels apportés ou déposés par les étudiants dans les locaux du campus.",
    ],
  },
  {
    n: 19,
    title: "Affichage",
    body: [
      "Tout affichage doit être préalablement autorisé par l'administration. Les affiches doivent être apposées aux endroits prévus et enlevées dès la fin de la manifestation. Les annonces personnelles doivent être datées et enlevées dans les 30 jours.",
    ],
  },
  {
    n: 20,
    title: "Dispositions matérielles",
    body: [
      "Alinéa 1 — Courrier personnel : aucun courrier personnel d'étudiant ne saurait être réceptionné par l'école.",
      "Alinéa 2 — Téléphone de l'école : les messages téléphoniques destinés aux étudiants ne seront enregistrés et transmis que pour des cas graves et urgents. L'usage du téléphone de l'école par les étudiants n'est pas autorisé.",
      "Alinéa 3 — Téléphone mobile ou smartphone : son utilisation n'est pas autorisée pendant les cours et examens. Toute utilisation entraînera l'exclusion immédiate, une convocation par l'administration, et éventuellement le conseil de discipline en cas de récidive.",
      "Alinéa 4 — Salles et matériels informatiques ou audiovisuels : les règles d'accès et d'utilisation sont définies par l'administration.",
      "Alinéa 5 — Ordinateurs personnels et tablettes : un ordinateur personnel aux caractéristiques minimales (Core i3 – RAM 8 Go – 1 To de mémoire) est obligatoire.",
      "Alinéa 6 — Charte informatique et internet : la réglementation précisant l'utilisation des technologies de l'information (ordinateur personnel, ordinateur de l'école, wifi, internet…) figure dans le document « Charte Informatique et Internet ». Les photocopieurs sont à l'usage exclusif de l'administration.",
    ],
  },
  {
    n: 21,
    title: "Documentation pédagogique",
    body: [
      "La documentation pédagogique remise lors des cours ou mise à disposition sur l'intranet est protégée au titre des droits d'auteur et ne peut être réutilisée autrement que pour un strict usage personnel.",
    ],
  },
  {
    n: 22,
    title: "Frais de scolarité",
    body: [
      "Le non-règlement des frais de scolarité à terme peut, après un premier avertissement, entraîner l'exclusion temporaire ou définitive de l'établissement sur décision de l'administration. Les évaluations auxquelles l'étudiant n'aura pas pris part lui vaudront une note de 0/20. Dès lors, le solde du montant de la scolarité devient immédiatement exigible.",
      "Le montant des droits d'inscription et des frais de scolarité est fixé chaque année par l'administration générale. Les droits d'inscription et/ou les frais de scolarité payés ne sont en aucun cas remboursables.",
    ],
  },
  {
    n: 23,
    title: "Acceptation du présent règlement intérieur",
    body: [
      "Tout étudiant inscrit à IPMD est réputé avoir pris connaissance et approuvé le présent règlement intérieur et s'engage à le respecter. Un exemplaire est disponible sur la plateforme.",
    ],
  },
];
