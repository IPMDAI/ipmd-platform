/**
 * Pied de page officiel IPMD (mentions légales compactes) + mention NB.
 * Utilisé sur les attestations, certificats, bulletins et relevés.
 * (Pas de Facebook ici ; pas ce pied complet sur la carte étudiant.)
 */

const LEGAL_LINES = [
  "IPMD SA — Siège social : Cocody, Angré — 01 BP 13662 Abidjan 01",
  "RCCM : CI-ABJ-03-2024-M-35856 — CC : 1948221 E — CNPS : 352039",
  "Aut. création : Décision N°1207/MESRS/DGES/DESUP/Kkj du 24 AVR. 2020",
  "Aut. ouverture : Arrêté N°1208/MESRS/DGES/DESUP/Kkj du 24 AVR. 2020",
  "Tél. : (+225) 05 75 75 88 88 / 05 66 05 14 14",
  "Email : info@ipmd.pro — Site : www.ipmd.pro",
];

const NB_LONG =
  "Le présent document est délivré en version originale vérifiable par QR code. Toute reproduction doit conserver le QR code et le numéro unique du document. Pour toute vérification de l'authenticité de ce document, veuillez scanner le QR code ou contacter : audit@ipmd.pro.";

const NB_SHORT =
  "Document officiel vérifiable par QR code. Pour toute vérification : audit@ipmd.pro.";

export function OfficialFooter({
  nb = "none",
}: {
  /** Mention NB : longue (bulletins/relevés), courte (attestations/certificats) ou aucune. */
  nb?: "short" | "long" | "none";
}) {
  return (
    <div className="mt-6 border-t border-black/10 pt-3 text-center text-black/45">
      {nb === "long" && (
        <p className="mb-2 text-[10px] italic leading-relaxed">
          <span className="font-semibold not-italic">NB : </span>
          {NB_LONG}
        </p>
      )}
      {nb === "short" && (
        <p className="mb-2 text-[10px] italic leading-relaxed">{NB_SHORT}</p>
      )}
      <div className="space-y-0.5 text-[9px] leading-relaxed">
        {LEGAL_LINES.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
    </div>
  );
}
