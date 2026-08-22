"use client";

import { useEffect } from "react";
import type { UniverseId } from "@/types";
import { FORMATION_MODES } from "@/lib/academic";
import type { BackgroundVariant } from "./background";
import {
  campusDiplomaForLevel,
  campusFilieresForLevel,
  campusLevels,
  offeringKey,
  type CatalogProgram,
  type Project,
  type WizardCatalog,
} from "./project";

/** État vide générique : aucun programme ouvert → message + Suivant bloqué. */
function EmptyState({ label }: { label: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
      <p className="text-2xl" aria-hidden="true">
        📭
      </p>
      <p className="mt-2 text-sm font-semibold text-amber-900">
        Aucun programme n'est actuellement ouvert pour {label}.
      </p>
      <p className="mt-1 text-[13px] text-amber-800/80">
        Les inscriptions ne sont pas encore ouvertes pour ce parcours. Revenez bientôt ou
        contactez l'IPMD — le bouton « Suivant » reste désactivé.
      </p>
    </div>
  );
}

const optionClass = (active: boolean) =>
  `flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
    active
      ? "border-ipmd-red bg-ipmd-red/[0.04] ring-2 ring-ipmd-red/30"
      : "border-black/10 bg-white hover:border-black/25"
  }`;

/** Mode de formation — obligatoire, source canonique FORMATION_MODES (3 choix). */
function ModeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-ipmd-black">
        Mode de formation <span className="text-ipmd-red">*</span>
      </p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {FORMATION_MODES.map((m) => {
          const active = value === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition ${
                active
                  ? "border-ipmd-red bg-ipmd-red/[0.04] ring-2 ring-ipmd-red/30 text-ipmd-black"
                  : "border-black/15 bg-white text-black/70 hover:border-black/30"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-ipmd-red" : "border-black/25"}`}
                aria-hidden="true"
              >
                {active && <span className="h-2 w-2 rounded-full bg-ipmd-red" />}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Radio({ active }: { active: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
        active ? "border-ipmd-red" : "border-black/25"
      }`}
      aria-hidden="true"
    >
      {active && <span className="h-2 w-2 rounded-full bg-ipmd-red" />}
    </span>
  );
}

/**
 * Étape 3 — Votre projet à l'IPMD. Entièrement piloté par `catalog` (base réelle).
 * Aucune option n'est codée en dur ; si le catalogue est vide → état vide.
 */
export function Step3Projet({
  universe,
  variant,
  catalog,
  value,
  onChange,
}: {
  universe: UniverseId | null;
  variant: BackgroundVariant;
  catalog: WizardCatalog;
  value: Project;
  onChange: (next: Project) => void;
}) {
  // Campus : rentrée courante = choisie, sinon l'unique rentrée ouverte.
  const campusIntake =
    catalog.campusIntakes.find((i) => i.id === value.campusIntakeId) ??
    (catalog.campusIntakes.length === 1 ? catalog.campusIntakes[0] : undefined);

  // Auto-sélection de l'unique rentrée (persistée) pour que le gating soit cohérent.
  useEffect(() => {
    if (variant === "campus" && !value.campusIntakeId && catalog.campusIntakes.length === 1) {
      onChange({ ...value, campusIntakeId: catalog.campusIntakes[0].id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, catalog.campusIntakes.length, value.campusIntakeId]);

  const title = (
    <>
      <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">
        Votre projet à l'IPMD
      </h2>
      <p className="mt-1 text-sm text-black/55">
        Choisissez la formation que vous visez à l'IPMD. Seules les offres réellement
        ouvertes sont proposées.
      </p>
    </>
  );

  // ─────────────────────────── CAMPUS (cascade) ───────────────────────────
  if (variant === "campus") {
    if (!campusIntake) return <div>{title}<EmptyState label="le parcours Campus" /></div>;

    // Niveau/filière dérivés UNIQUEMENT des offres réellement ouvertes.
    const levels = campusLevels(campusIntake);
    const selectedLevel =
      value.campusLevel || (value.campusOfferingKey ? value.campusOfferingKey.split("::")[1] : "");
    const selectedFiliereId = value.campusOfferingKey ? value.campusOfferingKey.split("::")[0] : "";
    const filieres = selectedLevel ? campusFilieresForLevel(campusIntake, selectedLevel) : [];

    // Changer la rentrée/le niveau réinitialise la sélection en aval (jamais de combo invalide).
    const selectIntake = (id: string) =>
      onChange({ ...value, campusIntakeId: id, campusLevel: "", campusOfferingKey: "" });
    const selectLevel = (lvl: string) =>
      onChange({ ...value, campusLevel: lvl, campusOfferingKey: "" });
    const selectFiliere = (fid: string) =>
      onChange({ ...value, campusOfferingKey: offeringKey(fid, selectedLevel) });

    return (
      <div>
        {title}

        {/* 1) Rentrée souhaitée — présélectionnée si unique, mais toujours visible. */}
        <div className="mt-5">
          {catalog.campusIntakes.length > 1 ? (
            <>
              <label htmlFor="pj-intake" className="text-sm font-semibold text-ipmd-black">
                Rentrée souhaitée <span className="text-ipmd-red">*</span>
              </label>
              <select
                id="pj-intake"
                value={campusIntake.id}
                onChange={(e) => selectIntake(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20"
              >
                {catalog.campusIntakes.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label} — {i.academicYear}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ipmd-black">
                Rentrée souhaitée <span className="text-ipmd-red">*</span>
              </p>
              <div className="mt-1.5 inline-flex items-center gap-2 rounded-xl border border-ipmd-red/30 bg-ipmd-red/[0.04] px-3.5 py-2.5 text-sm font-semibold text-ipmd-black">
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-ipmd-red"
                  aria-hidden="true"
                >
                  <span className="h-2 w-2 rounded-full bg-ipmd-red" />
                </span>
                {campusIntake.label} — {campusIntake.academicYear}
              </div>
            </>
          )}
        </div>

        {/* 2) Niveau visé — uniquement les niveaux réellement proposés. */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-ipmd-black">
            Niveau visé <span className="text-ipmd-red">*</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {levels.map((lvl) => {
              const active = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => selectLevel(lvl)}
                  className={`rounded-xl border p-3 text-center text-sm font-medium transition ${
                    active
                      ? "border-ipmd-red bg-ipmd-red/[0.04] ring-2 ring-ipmd-red/30 text-ipmd-black"
                      : "border-black/15 bg-white text-black/70 hover:border-black/30"
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3) Formation / Filière — filtrée par le niveau choisi (offres ouvertes). */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-ipmd-black">
            Formation / Filière <span className="text-ipmd-red">*</span>
          </p>
          {!selectedLevel ? (
            <p className="mt-2 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3 text-[13px] text-black/50">
              Choisissez d'abord un niveau visé pour afficher les filières disponibles.
            </p>
          ) : filieres.length === 0 ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] font-semibold text-amber-900">
              Aucune filière n'est ouverte pour ce niveau à cette rentrée.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filieres.map((f) => {
                const active = selectedFiliereId === f.filiereId;
                return (
                  <button
                    key={f.filiereId}
                    type="button"
                    onClick={() => selectFiliere(f.filiereId)}
                    className={optionClass(active)}
                  >
                    <Radio active={active} />
                    <span>
                      <span className="text-sm font-semibold text-ipmd-black">{f.filiereName}</span>
                      <span className="mt-0.5 block text-[11px] text-black/50">
                        {f.filiereName} · {selectedLevel} — Diplôme visé : {campusDiplomaForLevel(selectedLevel)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4) Mode de formation */}
        <ModeField value={value.mode} onChange={(m) => onChange({ ...value, mode: m })} />
      </div>
    );
  }

  // ─────────────────────── PRO / EXECUTIVE ───────────────────────
  if (variant === "pro" || variant === "executive") {
    const programs: CatalogProgram[] =
      variant === "pro" ? catalog.proPrograms : catalog.execPrograms;
    const label = variant === "pro" ? "le parcours IPMD Pro" : "le parcours IPMD Executive";
    if (programs.length === 0) return <div>{title}<EmptyState label={label} /></div>;

    const selectedId = variant === "pro" ? value.proOfferingId : value.execOfferingId;
    const pick = (id: string) =>
      onChange(
        variant === "pro" ? { ...value, proOfferingId: id } : { ...value, execOfferingId: id },
      );

    return (
      <div>
        {title}
        <p className="mt-5 text-sm font-semibold text-ipmd-black">
          Programme visé <span className="text-ipmd-red">*</span>
        </p>
        <div className="mt-2 space-y-2">
          {programs.map((p) => {
            const active = selectedId === p.offeringId;
            return (
              <button
                key={p.offeringId}
                type="button"
                onClick={() => pick(p.offeringId)}
                className={optionClass(active)}
              >
                <Radio active={active} />
                <span>
                  <span className="text-sm font-semibold text-ipmd-black">{p.name}</span>
                  {p.credential && (
                    <span className="ml-2 rounded-full bg-ipmd-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ipmd-red">
                      {p.credential}
                    </span>
                  )}
                  <span className="mt-0.5 block text-[11px] text-black/50">
                    Rentrée : {p.intakeLabel} — {p.academicYear}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <ModeField value={value.mode} onChange={(m) => onChange({ ...value, mode: m })} />
      </div>
    );
  }

  // ─────────────────────────── CERTIFICATS ───────────────────────────
  const items = catalog.certByUniverse[universe ?? ""] ?? [];
  if (items.length === 0) return <div>{title}<EmptyState label="ce parcours" /></div>;

  return (
    <div>
      {title}
      <p className="mt-5 text-sm font-semibold text-ipmd-black">
        Programme / certificat visé <span className="text-ipmd-red">*</span>
      </p>
      <div className="mt-2 space-y-2">
        {items.map((it) => {
          const active = value.certItemId === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange({ ...value, certItemId: it.id })}
              className={optionClass(active)}
            >
              <Radio active={active} />
              <span>
                <span className="text-sm font-semibold text-ipmd-black">{it.name}</span>
                {it.credential && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    {it.credential}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <ModeField value={value.mode} onChange={(m) => onChange({ ...value, mode: m })} />
    </div>
  );
}
