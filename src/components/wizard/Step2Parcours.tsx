"use client";

import { useState } from "react";
import type { Background, BackgroundVariant } from "./background";
import {
  academicRequired,
  backgroundErrors,
  EDUCATION_LEVELS,
  situationSpec,
} from "./background";

type Field = keyof Background;

const controlClass = (invalid: boolean) =>
  `mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ipmd-black outline-none transition placeholder:text-black/30 focus:ring-2 ${
    invalid
      ? "border-ipmd-red focus:border-ipmd-red focus:ring-ipmd-red/25"
      : "border-black/15 focus:border-ipmd-red focus:ring-ipmd-red/20"
  }`;

/**
 * Étape 2 — Votre parcours actuel. Composant contrôlé (état dans la coquille).
 * Rendu et obligations pilotés par la `variant` (campus / pro / executive /
 * certificat). Décrit uniquement l'acquis — jamais le niveau visé à l'IPMD.
 */
export function Step2Parcours({
  value,
  variant,
  onChange,
}: {
  value: Background;
  variant: BackgroundVariant;
  onChange: (next: Background) => void;
}) {
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const errors = backgroundErrors(value, variant);

  const set =
    (k: Field) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...value, [k]: e.target.value });
  const blur = (k: Field) => () => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k: Field) => (touched[k] ? errors[k] : undefined);

  const Label = ({ k, label, required }: { k: Field; label: string; required?: boolean }) => (
    <label htmlFor={`bg-${k}`} className="text-sm font-semibold text-ipmd-black">
      {label}
      {required && <span className="text-ipmd-red"> *</span>}
    </label>
  );

  const Msg = ({ k, hint }: { k: Field; hint?: string }) => {
    const m = err(k);
    if (m)
      return (
        <p id={`bg-${k}-err`} className="mt-1 text-[11px] font-medium text-ipmd-red">
          {m}
        </p>
      );
    if (hint) return <p className="mt-1 text-[11px] text-black/45">{hint}</p>;
    return null;
  };

  const Text = ({
    k,
    label,
    required,
    placeholder,
    hint,
    inputMode,
  }: {
    k: Field;
    label: string;
    required?: boolean;
    placeholder?: string;
    hint?: string;
    inputMode?: "text" | "numeric";
  }) => (
    <div>
      <Label k={k} label={label} required={required} />
      <input
        id={`bg-${k}`}
        type="text"
        inputMode={inputMode}
        value={value[k]}
        onChange={set(k)}
        onBlur={blur(k)}
        placeholder={placeholder}
        aria-invalid={!!err(k)}
        aria-describedby={err(k) ? `bg-${k}-err` : undefined}
        className={controlClass(!!err(k))}
      />
      <Msg k={k} hint={hint} />
    </div>
  );

  const LevelSelect = ({ required }: { required?: boolean }) => (
    <div>
      <Label k="lastLevel" label="Dernier niveau d'études atteint" required={required} />
      <select
        id="bg-lastLevel"
        value={value.lastLevel}
        onChange={set("lastLevel")}
        onBlur={blur("lastLevel")}
        aria-invalid={!!err("lastLevel")}
        aria-describedby={err("lastLevel") ? "bg-lastLevel-err" : undefined}
        className={controlClass(!!err("lastLevel"))}
      >
        <option value="">— Sélectionnez —</option>
        {EDUCATION_LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <Msg k="lastLevel" hint="Le niveau que vous avez déjà obtenu, pas celui visé à l'IPMD." />
    </div>
  );

  const isCert = variant === "certificat";
  const acad = academicRequired(variant); // true pour campus/pro/executive
  const sit = situationSpec(variant);

  const situationField = sit.show ? (
    <div className="sm:col-span-2">
      <Text
        k="currentSituation"
        label={sit.label}
        required={sit.required}
        placeholder={sit.placeholder}
        hint={sit.hint}
      />
    </div>
  ) : null;

  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">
        Votre parcours actuel
      </h2>
      <p className="mt-1 text-sm text-black/55">
        {isCert
          ? "Quelques informations sur votre parcours — tout est facultatif ici."
          : "Décrivez le parcours que vous avez déjà accompli. Le niveau visé à l'IPMD sera précisé à l'étape suivante."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isCert ? (
          <>
            <LevelSelect />
            <Text k="lastDiploma" label="Dernier diplôme obtenu" placeholder="Ex. Baccalauréat série D" hint="Facultatif" />
            {situationField}
          </>
        ) : (
          <>
            <LevelSelect required={acad} />
            <Text
              k="lastDiploma"
              label="Dernier diplôme obtenu"
              required={acad}
              placeholder="Ex. Licence en informatique"
            />
            <Text
              k="graduationYear"
              label="Année d'obtention"
              inputMode="numeric"
              placeholder="Ex. 2023"
              hint="Facultatif"
            />
            <Text
              k="institution"
              label="Établissement d'origine"
              placeholder="Ex. Université Félix Houphouët-Boigny"
              hint="Facultatif"
            />
            {situationField}
          </>
        )}
      </div>
    </div>
  );
}
