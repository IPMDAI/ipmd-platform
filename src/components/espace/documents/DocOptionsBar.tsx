"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * Réglages admin d'une attestation (civilité, matricule affiché, date de
 * délivrance) — pilotés par l'URL, sans éditer l'URL à la main.
 * Masqués à l'impression (print:hidden). Ne modifient pas le document lui-même.
 */
export function DocOptionsBar({
  civilite,
  matricule,
  date,
}: {
  civilite?: string;
  matricule?: string;
  date?: string;
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
      <label className="flex items-center gap-1.5">
        <span className="font-semibold text-black/55">Civilité :</span>
        <select
          defaultValue={civilite ?? ""}
          onChange={(e) => update("civilite", e.target.value)}
          className={field}
        >
          <option value="">—</option>
          <option value="mademoiselle">Mademoiselle</option>
          <option value="madame">Madame</option>
          <option value="monsieur">Monsieur</option>
        </select>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="font-semibold text-black/55">Matricule étudiant :</span>
        <input
          type="text"
          defaultValue={matricule ?? ""}
          onBlur={(e) => update("matricule", e.target.value.trim())}
          placeholder="ex. 23-24IPMD008"
          className={`${field} w-36`}
        />
      </label>

      <label className="flex items-center gap-1.5">
        <span className="font-semibold text-black/55">Date de délivrance :</span>
        <input
          type="date"
          defaultValue={date ?? ""}
          onChange={(e) => update("date", e.target.value)}
          className={field}
        />
      </label>
    </div>
  );
}
