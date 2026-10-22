import { IPMD_WAVE_PAY_URL } from "@/lib/finance";

/**
 * Bouton de règlement Wave officiel IPMD. Ouvre le lien de paiement Wave.
 * Astuce Wave : ajouter l'expéditeur IPMD à ses contacts rend le lien cliquable.
 */
export function WavePayButton({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <a
        href={IPMD_WAVE_PAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-[#1dc8ff] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        💳 Payer par Wave
      </a>
      <p className="mt-1.5 text-[11px] text-black/45">
        Autres moyens : Orange Money, versement / virement AFG (RIB fourni à l&apos;inscription).
      </p>
    </div>
  );
}
