/**
 * Pied de page officiel IPMD (mentions légales compactes) + mention NB.
 * Utilisé sur les attestations, certificats, bulletins et relevés.
 * (Pas de Facebook ici ; pas ce pied complet sur la carte étudiant.)
 */
import { OFFICIAL_LEGAL_LINES as LEGAL_LINES, NB_LONG, NB_SHORT } from "@/lib/doc-format";

export function OfficialFooter({
  nb = "none",
}: {
  /** Mention NB : longue (bulletins/relevés), courte (attestations/certificats) ou aucune. */
  nb?: "short" | "long" | "none";
}) {
  return (
    <div className="mt-6 border-t border-black/10 pt-3 text-center text-black/45 print:mt-3 print:pt-2">
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
