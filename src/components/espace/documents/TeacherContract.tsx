import Image from "next/image";

export type ContractData = {
  name: string;
  email?: string | null;
  phone?: string | null;
  function?: string | null;
  title?: string | null;
  specialty?: string | null;
  diplomas?: string | null;
  hourlyRate: number;
};

const DOTS = "……………………………………………";

function Fill({ value }: { value?: string | null }) {
  return value ? (
    <span className="font-semibold text-ipmd-black">{value}</span>
  ) : (
    <span className="text-black/40">{DOTS}</span>
  );
}

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-[13px] font-bold uppercase text-ipmd-black">{title}</h3>
      <div className="mt-1 space-y-2 text-[12px] leading-relaxed text-black/75">
        {children}
      </div>
    </div>
  );
}

/** Contrat de vacataire IPMD, pré-rempli depuis la fiche enseignant. */
export function TeacherContract({ data }: { data: ContractData }) {
  const rate = data.hourlyRate > 0 ? data.hourlyRate.toLocaleString("fr-FR") : "8 000";

  const Header = () => (
    <div className="flex items-center gap-3 border-b border-black/10 pb-3">
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/10">
        <Image src="/logo-ipmd.png" alt="IPMD" width={48} height={48} className="h-full w-full object-contain" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-extrabold tracking-tight text-ipmd-black">
          INSTITUT POLYTECHNIQUE DES MÉTIERS DU DIGITAL
        </p>
        <p className="text-[11px] text-black/50">Abidjan — Côte d&apos;Ivoire · ipmd.pro</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-white p-8 text-[12px] shadow-sm ring-1 ring-black/5 print:rounded-none print:p-0 print:shadow-none print:ring-0">
      <Header />

      <h1 className="mt-5 text-center text-lg font-extrabold uppercase tracking-wide text-ipmd-black">
        Contrat de vacataire — Enseignant-vacataire
      </h1>

      <p className="mt-4 font-bold">ENTRE</p>
      <p className="mt-1 leading-relaxed text-black/75">
        L&apos;Institut Polytechnique des Métiers du Digital (IPMD) SA, dont le siège
        social est sis à Abidjan, Commune de Cocody Angré, téléphone +225 25 20 01 99 22 /
        +225 05 75 75 88 88, 01 BP 13662 Abidjan 01, info@ipmd.pro, site internet :
        www.ipmd.pro, dûment représenté par Monsieur POODA Ettien Aubin, son
        Administrateur Général, ayant tous pouvoirs à l&apos;effet des présentes,
      </p>
      <p className="mt-1 italic text-black/60">
        Ci-après désigné la « Société » ou l&apos;« Employeur », d&apos;une part ;
      </p>

      <p className="mt-3 font-bold">ET</p>
      <div className="mt-1 space-y-1 leading-relaxed text-black/75">
        <p>Civilité (M., Mme ou Mlle) : <Fill /></p>
        <p>Nom : <Fill value={data.name} /></p>
        <p>Prénoms : <Fill /></p>
        <p>Profession : <Fill value={data.function} /></p>
        <p>Type de pièce : <Fill /> &nbsp; N° pièce : <Fill /></p>
        <p>Nationalité : <Fill /> &nbsp; Date de naissance : <Fill /></p>
        <p>Situation matrimoniale : <Fill /></p>
        <p>Pays de résidence : <Fill /> &nbsp; Ville de résidence : <Fill /></p>
        <p>Téléphone / Mobile : <Fill value={data.phone} /></p>
        <p>E-mail : <Fill value={data.email} /></p>
        <p>Dernier diplôme obtenu : <Fill value={data.diplomas} /></p>
        <p>Domaine d&apos;étude ou spécialité : <Fill value={data.specialty} /></p>
        <p>Date d&apos;obtention : <Fill /> &nbsp; École : <Fill /></p>
        <p>Personne à prévenir (nom &amp; tél) : <Fill /></p>
      </div>
      <p className="mt-1 italic text-black/60">
        Ci-après désigné « Enseignant/Vacataire », d&apos;autre part,
      </p>
      <p className="mt-2 font-semibold">
        IL A ÉTÉ ARRÊTÉ ET CONVENU DE CE QUI SUIT :
      </p>

      <Article title="I- Engagement">
        <p>
          IPMD engage M., Mme ou Mlle <Fill value={data.name} /> en qualité
          d&apos;enseignant/vacataire de{" "}
          <Fill value={data.function || data.specialty} />, qui accepte de fournir
          obligatoirement un dossier complet (Diplômes, Autorisation d&apos;enseigner, CNI
          ou Passeport, Syllabus, Supports de cours, une photo d&apos;identité)
          préalablement à sa prise de service.
        </p>
        <p>
          Il s&apos;engage à travailler avec conscience, dévouement, abnégation et sérieux.
          À la fin de chaque module, il fournit les notes de classe, le sujet de
          l&apos;examen final, sa correction et le sujet de l&apos;examen de rattrapage.
          Après chaque composition, il dispose d&apos;une semaine pour rendre les copies
          corrigées.
        </p>
      </Article>

      <Article title="II- Nature et durée du contrat">
        <p>
          Contrat de vacation à durée déterminée (CDD), du{" "}
          <span className="font-semibold text-ipmd-black">01 Octobre 2025</span> au{" "}
          <span className="font-semibold text-ipmd-black">31 Juillet 2026</span>.
        </p>
      </Article>

      <Article title="III- Rémunération">
        <p>
          La rémunération est calculée en fonction des heures réellement effectuées. Le
          taux horaire est fixé à{" "}
          <span className="font-semibold text-ipmd-black">{rate} francs CFA</span>. Une
          facture des honoraires est déposée à la fin du volume horaire alloué au module ;
          le paiement intervient dans un délai de six (6) mois à compter de chaque session.
          Une retenue de 7,5 % est appliquée au titre des impôts, conformément à la
          législation ivoirienne.
        </p>
        <p>
          Aucune indemnité de transport, aucune gratification ni congé payé ne sont
          accordés.
        </p>
      </Article>

      <Article title="IV- Horaires">
        <p>
          Les heures de travail sont déterminées par les emplois du temps et peuvent être
          modifiées par la direction pédagogique selon la disponibilité du vacataire et les
          besoins de formation. L&apos;enseignant doit dispenser l&apos;intégralité du
          volume horaire communiqué (hors corrections, surveillances, conseils,
          suivis de rapports de stage).
        </p>
      </Article>

      <Article title="V- Renouvellement">
        <p>
          Renouvellement réservé à la direction, tenant compte du comportement général, des
          résultats de fin d&apos;année et de la participation à la vie de l&apos;établissement.
        </p>
      </Article>

      <Article title="VI- Absences et retards injustifiés">
        <p>
          Retards et absences = heures non effectuées, non prises en compte dans la
          rémunération. Un retard de plus de 15 min entraîne la non-exécution de la première
          heure. Trois (3) retards cumulés ou trois (3) absences injustifiées entraînent
          suspension ou rupture du contrat. Le planning doit être respecté à la lettre.
        </p>
      </Article>

      <Article title="VII- Cession du droit à l'image">
        <p>
          L&apos;enseignant vacataire autorise IPMD à reproduire et exploiter son image et
          sa voix pour la promotion de ses activités, sur tout support, sans rémunération
          supplémentaire, IPMD s&apos;abstenant de tout montage déshonorant.
        </p>
      </Article>

      <Article title="VIII à XI- Suspension, différends, affirmations, publication">
        <p>
          Suspension et rupture selon la loi ivoirienne et le règlement intérieur de
          l&apos;IPMD. Les différends privilégient le dialogue et, si besoin,
          l&apos;arbitrage de l&apos;inspection du travail. Le vacataire déclare donner
          librement son consentement. Contrat établi en deux exemplaires.
        </p>
      </Article>

      {/* Signatures */}
      <div className="mt-8 flex items-end justify-between gap-6">
        <div className="text-[12px]">
          <p className="font-bold text-ipmd-black">L&apos;ENSEIGNANT / VACATAIRE</p>
          <p className="text-black/55">
            Nom, prénom et signature précédée de « Lu et approuvé »
          </p>
          <div className="mt-6 h-12 w-48 border-b border-dashed border-black/30" />
        </div>
        <div className="text-center text-[12px]">
          <p className="font-bold text-ipmd-black">L&apos;ADMINISTRATEUR GÉNÉRAL</p>
          <div className="mt-6 h-12 w-44" />
          <p className="font-semibold text-ipmd-black">POODA ETTIEN AUBIN</p>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-black/50">Fait à Abidjan, le ……/……/20…….</p>
    </div>
  );
}
