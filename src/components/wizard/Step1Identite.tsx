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
 * Étape 1 — Votre identité. Composant contrôlé : l'état vit dans la coquille
 * (persistance à la navigation). Les erreurs n'apparaissent qu'après que le
 * champ a été « touché » (blur) — validation simple, non intrusive.
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

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });
  const blur = (k: Field) => () => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k: Field) => (touched[k] ? errors[k] : undefined);

  const F = ({
    k,
    label,
    type = "text",
    required = false,
    placeholder,
    autoComplete,
    inputMode,
    hint,
  }: {
    k: Field;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    autoComplete?: string;
    inputMode?: "text" | "tel" | "email";
    hint?: string;
  }) => {
    const message = err(k);
    return (
      <div>
        <label htmlFor={`id-${k}`} className="text-sm font-semibold text-ipmd-black">
          {label}
          {required && <span className="text-ipmd-red"> *</span>}
        </label>
        <input
          id={`id-${k}`}
          type={type}
          value={value[k]}
          onChange={set(k)}
          onBlur={blur(k)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={!!message}
          aria-describedby={message ? `id-${k}-err` : undefined}
          className={fieldClass(!!message)}
        />
        {hint && !message && <p className="mt-1 text-[11px] text-black/45">{hint}</p>}
        {message && (
          <p id={`id-${k}-err`} className="mt-1 text-[11px] font-medium text-ipmd-red">
            {message}
          </p>
        )}
      </div>
    );
  };

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
        <F k="lastName" label="Nom" required autoComplete="family-name" placeholder="Ex. KOUAMÉ" />
        <F k="firstName" label="Prénoms" required autoComplete="given-name" placeholder="Ex. Amani Grâce" />
        <F k="birthDate" label="Date de naissance" type="date" required autoComplete="bday" />
        <F k="birthPlace" label="Lieu de naissance" required placeholder="Ex. Abidjan, Côte d'Ivoire" hint="Ville, pays" />
        <F k="email" label="Email" type="email" required inputMode="email" autoComplete="email" placeholder="vous@exemple.com" />
        <F k="phone" label="Téléphone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="+225 07 00 00 00 00" hint="Format international, ex. +225 07 00 00 00 00" />
        <div className="sm:col-span-2">
          <F
            k="whatsapp"
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            placeholder="Ex. +225 07 00 00 00 00"
            hint="Facultatif — pour un échange plus rapide avec un conseiller."
          />
        </div>
      </div>
    </div>
  );
}
