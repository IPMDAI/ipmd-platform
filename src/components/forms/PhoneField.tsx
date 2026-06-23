"use client";

import { useState } from "react";
import { inputBase } from "@/components/forms/FormField";

/** Indicatifs pays (étudiants de divers horizons). Côte d'Ivoire par défaut. */
const COUNTRY_CODES: { code: string; flag: string; name: string }[] = [
  { code: "+225", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "+226", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "+223", flag: "🇲🇱", name: "Mali" },
  { code: "+221", flag: "🇸🇳", name: "Sénégal" },
  { code: "+228", flag: "🇹🇬", name: "Togo" },
  { code: "+229", flag: "🇧🇯", name: "Bénin" },
  { code: "+227", flag: "🇳🇪", name: "Niger" },
  { code: "+224", flag: "🇬🇳", name: "Guinée" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+237", flag: "🇨🇲", name: "Cameroun" },
  { code: "+241", flag: "🇬🇦", name: "Gabon" },
  { code: "+242", flag: "🇨🇬", name: "Congo" },
  { code: "+243", flag: "🇨🇩", name: "RD Congo" },
  { code: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "+216", flag: "🇹🇳", name: "Tunisie" },
  { code: "+213", flag: "🇩🇿", name: "Algérie" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+32", flag: "🇧🇪", name: "Belgique" },
  { code: "+41", flag: "🇨🇭", name: "Suisse" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44", flag: "🇬🇧", name: "Royaume-Uni" },
];

/**
 * Champ téléphone : sélecteur d'indicatif (court) + numéro saisissable.
 * Le numéro complet (« +225 07 00 00 00 00 ») est soumis via un input caché.
 * Si le numéro est vide, la valeur soumise est vide (utile pour un champ facultatif).
 */
export function PhoneField({
  id,
  name = "phone",
  required = false,
}: {
  id: string;
  name?: string;
  required?: boolean;
}) {
  const [code, setCode] = useState("+225");
  const [number, setNumber] = useState("");

  // Indicatif : on n'utilise PAS inputBase (qui force w-full) pour laisser
  // de la place au champ numéro à côté.
  const selectClass =
    "w-[104px] shrink-0 rounded-xl border border-black/10 bg-white px-2 py-3 text-sm text-ipmd-black shadow-sm focus:border-ipmd-red focus:outline-none focus:ring-2 focus:ring-ipmd-red/20";

  return (
    <div className="flex gap-2">
      <select
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Indicatif pays"
        className={selectClass}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code} title={c.name}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        required={required}
        autoComplete="tel"
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/[^\d\s]/g, ""))}
        placeholder="07 00 00 00 00"
        className={`${inputBase} min-w-0 flex-1`}
      />
      {/* Valeur réellement soumise : indicatif + numéro (vide si pas de numéro). */}
      <input
        type="hidden"
        name={name}
        value={number.trim() ? `${code} ${number.trim()}` : ""}
      />
    </div>
  );
}
