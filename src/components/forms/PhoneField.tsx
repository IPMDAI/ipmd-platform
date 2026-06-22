"use client";

import { useState } from "react";
import { inputBase } from "@/components/forms/FormField";

/** Indicatifs pays (étudiants de divers horizons). Côte d'Ivoire par défaut. */
const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "+225", label: "🇨🇮 Côte d'Ivoire +225" },
  { code: "+226", label: "🇧🇫 Burkina Faso +226" },
  { code: "+223", label: "🇲🇱 Mali +223" },
  { code: "+221", label: "🇸🇳 Sénégal +221" },
  { code: "+228", label: "🇹🇬 Togo +228" },
  { code: "+229", label: "🇧🇯 Bénin +229" },
  { code: "+227", label: "🇳🇪 Niger +227" },
  { code: "+224", label: "🇬🇳 Guinée +224" },
  { code: "+233", label: "🇬🇭 Ghana +233" },
  { code: "+234", label: "🇳🇬 Nigeria +234" },
  { code: "+237", label: "🇨🇲 Cameroun +237" },
  { code: "+241", label: "🇬🇦 Gabon +241" },
  { code: "+242", label: "🇨🇬 Congo +242" },
  { code: "+243", label: "🇨🇩 RD Congo +243" },
  { code: "+212", label: "🇲🇦 Maroc +212" },
  { code: "+216", label: "🇹🇳 Tunisie +216" },
  { code: "+213", label: "🇩🇿 Algérie +213" },
  { code: "+33", label: "🇫🇷 France +33" },
  { code: "+32", label: "🇧🇪 Belgique +32" },
  { code: "+41", label: "🇨🇭 Suisse +41" },
  { code: "+1", label: "🇺🇸 USA / Canada +1" },
  { code: "+44", label: "🇬🇧 Royaume-Uni +44" },
];

/**
 * Champ téléphone : sélecteur d'indicatif pays + numéro (chiffres uniquement).
 * Le numéro complet (« +225 07 00 00 00 00 ») est soumis via un input caché.
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

  return (
    <div className="flex gap-2">
      <select
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Indicatif pays"
        className={`${inputBase} w-auto shrink-0`}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
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
        className={inputBase}
      />
      {/* Valeur réellement soumise : indicatif + numéro */}
      <input type="hidden" name={name} value={`${code} ${number.trim()}`} />
    </div>
  );
}
