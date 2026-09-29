"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * Réglages admin de l'ATTESTATION DE RÉUSSITE, confirmés par étudiant :
 * - admission : libellé exact (ex. « admis en Licence 3 »),
 * - soutenance : clause « soutenu son projet de fin de formation »,
 * - année : année académique validée (ex. « 2025-2026 »).
 * Pilotés par l'URL. Ne rien émettre sans confirmation du dossier physique.
 */
export function ReussiteOptionsBar({
  admission,
  soutenance,
  annee,
}: {
  admission?: string;
  soutenance?: string;
  annee?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`);
  };

  const field = "rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px]";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white p-3 text-xs shadow-sm ring-1 ring-black/5 print:hidden">
      <span className="font-semibold text-ipmd-red">Réussite — à confirmer :</span>
      <label className="flex items-center gap-1.5">
        <span className="font-semibold text-black/55">Admission :</span>
        <input
          type="text"
          defaultValue={admission ?? ""}
          onBlur={(e) => update("admission", e.target.value.trim())}
          placeholder="ex. admis en Licence 3"
          className={`${field} w-52`}
        />
      </label>

      <label className="flex items-center gap-1.5">
        <span className="font-semibold text-black/55">Année :</span>
        <input
          type="text"
          defaultValue={annee ?? ""}
          onBlur={(e) => update("annee", e.target.value.trim())}
          placeholder="ex. 2025-2026"
          className={`${field} w-28`}
        />
      </label>

      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          defaultChecked={soutenance === "1" || soutenance === "true"}
          onChange={(e) => update("soutenance", e.target.checked ? "1" : "0")}
          className="h-4 w-4 accent-ipmd-red"
        />
        <span className="font-semibold text-black/55">Soutenance de projet</span>
      </label>
    </div>
  );
}
