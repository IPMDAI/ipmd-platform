"use client";

import { useState } from "react";
import { KNOWN_INSTITUTIONS } from "@/data/institutions";
import type { Background, BackgroundVariant } from "./background";
import {
  ACADEMIC_DIPLOMAS,
  academicRequired,
  backgroundErrors,
  EDUCATION_LEVELS,
  graduationYearOptions,
  isOtherDiploma,
  OTHER_DIPLOMA,
  situationSpec,
} from "./background";

type Field = keyof Background;

const controlClass = (invalid: boolean) =>
  `mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ipmd-black outline-none transition placeholder:text-black/30 focus:ring-2 ${
    invalid
      ? "border-ipmd-red focus:border-ipmd-red focus:ring-ipmd-red/25"
      : "border-black/15 focus:border-ipmd-red focus:ring-ipmd-red/20"
  }`;

// ── Sous-composants au NIVEAU MODULE (identité stable → aucun remount d'input) ──

function FieldLabel({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className="text-sm font-semibold text-ipmd-black">
      {label}
      {required && <span className="text-ipmd-red"> *</span>}
    </label>
  );
}

function FieldMsg({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={`${id}-err`} className="mt-1 text-[11px] font-medium text-ipmd-red">
        {error}
      </p>
    );
  if (hint) return <p className="mt-1 text-[11px] text-black/45">{hint}</p>;
  return null;
}

type BgTextProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  inputMode?: "text" | "numeric";
};

function BgText({ id, label, value, onChange, onBlur, error, required, placeholder, hint, inputMode }: BgTextProps) {
  return (
    <div>
      <FieldLabel id={id} label={label} required={required} />
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={controlClass(!!error)}
      />
      <FieldMsg id={id} error={error} hint={hint} />
    </div>
  );
}

type BgLevelProps = {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  required?: boolean;
};

function BgLevelSelect({ value, onChange, onBlur, error, required }: BgLevelProps) {
  const id = "bg-lastLevel";
  return (
    <div>
      <FieldLabel id={id} label="Dernier niveau d'études atteint" required={required} />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={controlClass(!!error)}
      >
        <option value="">— Sélectionnez —</option>
        {EDUCATION_LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <FieldMsg id={id} error={error} hint="Le niveau que vous avez déjà obtenu, pas celui visé à l'IPMD." />
    </div>
  );
}

type BgDiplomaProps = {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  required?: boolean;
  hint?: string;
};

/** Diplôme obtenu — select structuré ; « Autre diplôme… » révèle une saisie libre. */
function BgDiplomaSelect({ value, onChange, onBlur, error, required, hint }: BgDiplomaProps) {
  const id = "bg-lastDiploma";
  const [other, setOther] = useState(() => isOtherDiploma(value));
  const selectValue = other ? OTHER_DIPLOMA : ACADEMIC_DIPLOMAS.includes(value) ? value : "";
  return (
    <div>
      <FieldLabel id={id} label="Dernier diplôme obtenu" required={required} />
      <select
        id={id}
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === OTHER_DIPLOMA) {
            setOther(true);
            onChange("");
          } else {
            setOther(false);
            onChange(v);
          }
        }}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={controlClass(!!error && !other)}
      >
        <option value="">— Sélectionnez —</option>
        {ACADEMIC_DIPLOMAS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
        <option value={OTHER_DIPLOMA}>Autre diplôme…</option>
      </select>
      {other && (
        <input
          id={`${id}-other`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Précisez votre diplôme"
          aria-label="Précisez votre diplôme"
          aria-invalid={!!error}
          className={`${controlClass(!!error)} mt-2`}
        />
      )}
      <FieldMsg id={id} error={error} hint={hint} />
    </div>
  );
}

/** Année d'obtention — select dynamique (année courante → −60 ans). Facultatif. */
function BgYearSelect({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = "bg-graduationYear";
  return (
    <div>
      <FieldLabel id={id} label="Année d'obtention" />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={controlClass(false)}
      >
        <option value="">— Sélectionnez —</option>
        {graduationYearOptions().map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <FieldMsg id={id} hint="Facultatif" />
    </div>
  );
}

/** Établissement d'origine — recherche assistée (datalist) + saisie libre (« Autre »). */
function BgInstitutionCombo({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = "bg-institution";
  return (
    <div>
      <FieldLabel id={id} label="Établissement d'origine" />
      <input
        id={id}
        type="text"
        list="bg-institution-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Rechercher ou saisir votre établissement…"
        autoComplete="off"
        className={controlClass(false)}
      />
      <datalist id="bg-institution-list">
        {KNOWN_INSTITUTIONS.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <FieldMsg id={id} hint="Choisissez dans la liste ou saisissez librement (« Autre établissement »)." />
    </div>
  );
}

/**
 * Étape 2 — Votre parcours actuel. Rendu piloté par la `variant`.
 * Décrit uniquement l'acquis — jamais le niveau visé à l'IPMD.
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

  const set = (k: Field) => (v: string) => onChange({ ...value, [k]: v });
  const blur = (k: Field) => () => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k: Field) => (touched[k] ? errors[k] : undefined);

  const isCert = variant === "certificat";
  const acad = academicRequired(variant);
  const sit = situationSpec(variant);

  const situationField = sit.show ? (
    <div className="sm:col-span-2">
      <BgText
        id="bg-currentSituation"
        label={sit.label}
        required={sit.required}
        placeholder={sit.placeholder}
        hint={sit.hint}
        value={value.currentSituation}
        onChange={set("currentSituation")}
        onBlur={blur("currentSituation")}
        error={err("currentSituation")}
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
            <BgLevelSelect value={value.lastLevel} onChange={set("lastLevel")} onBlur={blur("lastLevel")} error={err("lastLevel")} />
            <BgDiplomaSelect hint="Facultatif" value={value.lastDiploma} onChange={set("lastDiploma")} onBlur={blur("lastDiploma")} error={err("lastDiploma")} />
            {situationField}
          </>
        ) : (
          <>
            <BgLevelSelect required={acad} value={value.lastLevel} onChange={set("lastLevel")} onBlur={blur("lastLevel")} error={err("lastLevel")} />
            <BgDiplomaSelect required={acad} value={value.lastDiploma} onChange={set("lastDiploma")} onBlur={blur("lastDiploma")} error={err("lastDiploma")} />
            <BgYearSelect value={value.graduationYear} onChange={set("graduationYear")} onBlur={blur("graduationYear")} />
            <BgInstitutionCombo value={value.institution} onChange={set("institution")} onBlur={blur("institution")} />
            {situationField}
          </>
        )}
      </div>
    </div>
  );
}
