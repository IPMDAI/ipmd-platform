"use client";

import { useState } from "react";
import type { Identity } from "./identity";
import { identityErrors } from "./identity";

type Field = keyof Identity;

const fieldClass = (invalid: boolean) =>
  `mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ipmd-black outline-none transition placeholder:text-black/30 focus:ring-2 ${
    invalid
      ? "border-ipmd-red focus:border-ipmd-red focus:ring-ipmd-red/25"
      : "border-black/15 focus:border-ipmd-red focus:ring-ipmd-red/20"
  }`;

/**
 * Champ contrôlé au NIVEAU MODULE (identité de composant stable).
 * ⚠️ Ne jamais définir ce composant à l'intérieur du rendu d'un autre composant :
 * cela recréerait son type à chaque frappe → React remonterait l'<input> →
 * perte de focus et de caractères. Ici il est stable → aucun remount.
 */
type IdentityFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
};

function IdentityField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  required = false,
  placeholder,
  hint,
  inputMode,
  autoComplete,
}: IdentityFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ipmd-black">
        {label}
        {required && <span className="text-ipmd-red"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={fieldClass(!!error)}
      />
      {hint && !error && <p className="mt-1 text-[11px] text-black/45">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-[11px] font-medium text-ipmd-red">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Étape 1 — Votre identité. Composant contrôlé : l'état vit dans la coquille
 * (persistance à la navigation). Erreurs affichées après « toucher » (blur).
 */
export function Step1Identite({
  value,
  onChange,
}: {
  value: Identity;
  onChange: (next: Identity) => void;
}) {
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const errors = identityErrors(value);

  const set = (k: Field) => (v: string) => onChange({ ...value, [k]: v });
  const blur = (k: Field) => () => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k: Field) => (touched[k] ? errors[k] : undefined);

  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">
        Votre identité
      </h2>
      <p className="mt-1 text-sm text-black/55">
        Renseignez vos informations personnelles. Les champs marqués d'un{" "}
        <span className="text-ipmd-red">*</span> sont obligatoires.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <IdentityField id="id-lastName" label="Nom" required autoComplete="family-name" placeholder="Ex. KOUAMÉ" value={value.lastName} onChange={set("lastName")} onBlur={blur("lastName")} error={err("lastName")} />
        <IdentityField id="id-firstName" label="Prénoms" required autoComplete="given-name" placeholder="Ex. Amani Grâce" value={value.firstName} onChange={set("firstName")} onBlur={blur("firstName")} error={err("firstName")} />
        <IdentityField id="id-birthDate" label="Date de naissance" type="date" required autoComplete="bday" value={value.birthDate} onChange={set("birthDate")} onBlur={blur("birthDate")} error={err("birthDate")} />
        <IdentityField id="id-birthPlace" label="Lieu de naissance" required placeholder="Ex. Abidjan, Côte d'Ivoire" hint="Ville, pays" value={value.birthPlace} onChange={set("birthPlace")} onBlur={blur("birthPlace")} error={err("birthPlace")} />
        <IdentityField id="id-email" label="Email" type="email" required inputMode="email" autoComplete="email" placeholder="vous@exemple.com" value={value.email} onChange={set("email")} onBlur={blur("email")} error={err("email")} />
        <IdentityField id="id-phone" label="Téléphone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="+225 07 00 00 00 00" hint="Format international, ex. +225 07 00 00 00 00" value={value.phone} onChange={set("phone")} onBlur={blur("phone")} error={err("phone")} />
        <div className="sm:col-span-2">
          <IdentityField id="id-whatsapp" label="WhatsApp" type="tel" inputMode="tel" placeholder="Ex. +225 07 00 00 00 00" hint="Facultatif — pour un échange plus rapide avec un conseiller." value={value.whatsapp} onChange={set("whatsapp")} onBlur={blur("whatsapp")} error={err("whatsapp")} />
        </div>
      </div>
    </div>
  );
}
