"use client";

import { useState } from "react";
import { COUNTRIES } from "@/data/countries";
import type { Identity } from "./identity";
import { identityErrors } from "./identity";

type Field = keyof Identity;

const ctrl = (invalid: boolean) =>
  `mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ipmd-black outline-none transition placeholder:text-black/30 focus:ring-2 ${
    invalid
      ? "border-ipmd-red focus:border-ipmd-red focus:ring-ipmd-red/25"
      : "border-black/15 focus:border-ipmd-red focus:ring-ipmd-red/20"
  }`;

// ── Sous-composants au NIVEAU MODULE (identité stable → aucun remount d'input) ──

function Lbl({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className="text-sm font-semibold text-ipmd-black">
      {label}
      {required && <span className="text-ipmd-red"> *</span>}
    </label>
  );
}

function Err({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={`${id}-err`} className="mt-1 text-[11px] font-medium text-ipmd-red">
        {error}
      </p>
    );
  if (hint) return <p className="mt-1 text-[11px] text-black/45">{hint}</p>;
  return null;
}

function TextField(p: {
  id: string; label: string; value: string; onChange: (v: string) => void; onBlur: () => void;
  error?: string; required?: boolean; placeholder?: string; hint?: string; type?: string;
  inputMode?: "text" | "tel" | "email"; autoComplete?: string;
}) {
  return (
    <div>
      <Lbl id={p.id} label={p.label} required={p.required} />
      <input
        id={p.id}
        type={p.type ?? "text"}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
        placeholder={p.placeholder}
        inputMode={p.inputMode}
        autoComplete={p.autoComplete}
        aria-invalid={!!p.error}
        className={ctrl(!!p.error)}
      />
      <Err id={p.id} error={p.error} hint={p.hint} />
    </div>
  );
}

const COUNTRY_OPTIONS = COUNTRIES.map((c) => (
  <option key={c.code} value={c.code}>
    {c.name} ({c.dial})
  </option>
));

function CountrySelect(p: {
  id: string; label: string; value: string; onChange: (v: string) => void; onBlur: () => void;
  error?: string; required?: boolean;
}) {
  return (
    <div>
      <Lbl id={p.id} label={p.label} required={p.required} />
      <select
        id={p.id}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
        aria-invalid={!!p.error}
        className={ctrl(!!p.error)}
      >
        <option value="">— Sélectionnez —</option>
        {COUNTRY_OPTIONS}
      </select>
      <Err id={p.id} error={p.error} />
    </div>
  );
}

// Champ téléphone composite : pays/indicatif + numéro national.
function PhoneField(p: {
  idBase: string; label: string; required?: boolean; hint?: string;
  country: string; onCountry: (v: string) => void;
  number: string; onNumber: (v: string) => void;
  onBlur: () => void; errorCountry?: string; errorNumber?: string;
}) {
  return (
    <div>
      <Lbl id={`${p.idBase}-num`} label={p.label} required={p.required} />
      <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_1.5fr]">
        <select
          id={`${p.idBase}-country`}
          value={p.country}
          onChange={(e) => p.onCountry(e.target.value)}
          onBlur={p.onBlur}
          aria-invalid={!!p.errorCountry}
          className={`${ctrl(!!p.errorCountry)} !mt-0`}
        >
          <option value="">— Indicatif —</option>
          {COUNTRY_OPTIONS}
        </select>
        <input
          id={`${p.idBase}-num`}
          type="tel"
          inputMode="numeric"
          value={p.number}
          // Saisie nettoyée : chiffres + séparateurs raisonnables ( espace ( ) - . )
          // uniquement. Toute lettre (tapée ou collée) est retirée immédiatement.
          onChange={(e) => p.onNumber(e.target.value.replace(/[^\d\s().\-]/g, ""))}
          onBlur={p.onBlur}
          placeholder="Numéro (sans indicatif)"
          aria-invalid={!!p.errorNumber}
          className={`${ctrl(!!p.errorNumber)} !mt-0`}
        />
      </div>
      <Err id={`${p.idBase}-num`} error={p.errorCountry || p.errorNumber} hint={p.hint} />
    </div>
  );
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const NOW_YEAR = new Date().getFullYear();
// Années de naissance : plafonnées à (année courante − âge minimum du parcours),
// donc jamais l'année en cours/future ni une année d'âge insuffisant.
function birthYears(minAge: number): string[] {
  const max = NOW_YEAR - minAge;
  return Array.from({ length: 100 - minAge + 1 }, (_, i) => String(max - i));
}

/**
 * Étape 1 — Votre identité (internationale). État dans la coquille (persistant).
 * `minAge` provient du parcours (voir minAgeForVariant). Erreurs après blur.
 */
export function Step1Identite({
  value,
  minAge,
  onChange,
}: {
  value: Identity;
  minAge: number;
  onChange: (next: Identity) => void;
}) {
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const errors = identityErrors(value, minAge);
  const years = birthYears(minAge);

  const set = (k: Field) => (v: string) => onChange({ ...value, [k]: v });
  const blur = (k: Field) => () => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k: Field) => (touched[k] ? errors[k] : undefined);
  // La date se valide dès que les 3 parties sont touchées (ou l'une d'elles).
  const dateTouched = touched.birthDay || touched.birthMonth || touched.birthYear;
  const dateErr = dateTouched ? errors.birthYear : undefined;
  const dateBlur = () => setTouched((t) => ({ ...t, birthDay: true, birthMonth: true, birthYear: true }));

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
        <TextField id="id-lastName" label="Nom" required autoComplete="family-name" placeholder="Ex. KOUAMÉ" value={value.lastName} onChange={set("lastName")} onBlur={blur("lastName")} error={err("lastName")} />
        <TextField id="id-firstName" label="Prénoms" required autoComplete="given-name" placeholder="Ex. Amani Grâce" value={value.firstName} onChange={set("firstName")} onBlur={blur("firstName")} error={err("firstName")} />

        {/* Date de naissance : Jour / Mois / Année */}
        <div className="sm:col-span-2">
          <Lbl id="id-birthDay" label="Date de naissance" required />
          <div className="mt-1 grid grid-cols-3 gap-2">
            <select id="id-birthDay" value={value.birthDay} onChange={(e) => set("birthDay")(e.target.value)} onBlur={dateBlur} aria-invalid={!!dateErr} className={`${ctrl(!!dateErr)} !mt-0`}>
              <option value="">Jour</option>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select id="id-birthMonth" value={value.birthMonth} onChange={(e) => set("birthMonth")(e.target.value)} onBlur={dateBlur} aria-invalid={!!dateErr} className={`${ctrl(!!dateErr)} !mt-0`}>
              <option value="">Mois</option>
              {MONTHS.map((mo, i) => <option key={mo} value={String(i + 1).padStart(2, "0")}>{mo}</option>)}
            </select>
            <select id="id-birthYear" value={value.birthYear} onChange={(e) => set("birthYear")(e.target.value)} onBlur={dateBlur} aria-invalid={!!dateErr} className={`${ctrl(!!dateErr)} !mt-0`}>
              <option value="">Année</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Err id="id-birthDay" error={dateErr} hint={`Âge minimum pour ce parcours : ${minAge} ans.`} />
        </div>

        <CountrySelect id="id-birthCountry" label="Pays de naissance" required value={value.birthCountry} onChange={set("birthCountry")} onBlur={blur("birthCountry")} error={err("birthCountry")} />
        <TextField id="id-birthPlace" label="Ville / lieu de naissance" required placeholder="Ex. Abidjan" value={value.birthPlace} onChange={set("birthPlace")} onBlur={blur("birthPlace")} error={err("birthPlace")} />

        <div className="sm:col-span-2">
          <TextField id="id-email" label="Email" type="email" required inputMode="email" autoComplete="email" placeholder="vous@exemple.com" value={value.email} onChange={set("email")} onBlur={blur("email")} error={err("email")} />
        </div>

        <div className="sm:col-span-2">
          <PhoneField idBase="id-phone" label="Téléphone" required hint="Choisissez le pays/indicatif, puis le numéro."
            country={value.phoneCountry} onCountry={set("phoneCountry")} number={value.phone} onNumber={set("phone")}
            onBlur={() => setTouched((t) => ({ ...t, phoneCountry: true, phone: true }))}
            errorCountry={touched.phoneCountry ? errors.phoneCountry : undefined}
            errorNumber={touched.phone ? errors.phone : undefined} />
        </div>

        <div className="sm:col-span-2">
          <PhoneField idBase="id-whatsapp" label="WhatsApp" hint="Facultatif — pour un échange plus rapide avec un conseiller."
            country={value.whatsappCountry} onCountry={set("whatsappCountry")} number={value.whatsapp} onNumber={set("whatsapp")}
            onBlur={() => setTouched((t) => ({ ...t, whatsappCountry: true, whatsapp: true }))}
            errorCountry={touched.whatsappCountry ? errors.whatsappCountry : undefined}
            errorNumber={touched.whatsapp ? errors.whatsapp : undefined} />
        </div>
      </div>
    </div>
  );
}
