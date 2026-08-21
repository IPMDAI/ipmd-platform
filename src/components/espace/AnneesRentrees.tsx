"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createAcademicYear,
  activateYear,
  createIntake,
  addOffering,
  setOfferingStatus,
  openIntake,
  closeIntake,
} from "@/lib/academic-year-actions";
import { inputBase } from "@/components/forms/FormField";
import { IntakeOfferingConfig } from "@/components/espace/IntakeOfferingConfig";
import type { FormResult } from "@/types";

export type YearRow = { year: string; status: string; activatedAt: string | null };
export type OfferingRow = {
  id: string;
  filiereId: string;
  filiereName: string;
  level: string;
  status: string;
  hasClass: boolean;
};
export type IntakeRow = {
  id: string;
  academicYear: string;
  label: string;
  startDate: string | null;
  applicationsOpenAt: string | null;
  applicationsCloseAt: string | null;
  status: string;
  offerings: OfferingRow[];
};
export type FiliereRow = { id: string; name: string };

const badge = (status: string) => {
  const map: Record<string, string> = {
    preparation: "bg-amber-100 text-amber-800",
    active: "bg-emerald-100 text-emerald-800",
    archived: "bg-black/10 text-black/50",
    open: "bg-emerald-100 text-emerald-800",
    closed: "bg-black/10 text-black/50",
    planned: "bg-amber-100 text-amber-800",
  };
  return `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[status] ?? "bg-black/10 text-black/50"}`;
};

function AddOfferingForm({
  intakeId,
  filieres,
  levels,
}: {
  intakeId: string;
  filieres: FiliereRow[];
  levels: string[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(addOffering, null);
  return (
    <form action={action} className="mt-2 flex flex-wrap items-end gap-2">
      <input type="hidden" name="intake_id" value={intakeId} />
      <select name="filiere_id" required className={`${inputBase} py-1 text-xs`} defaultValue="">
        <option value="" disabled>
          Filière…
        </option>
        {filieres.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <select name="level" required className={`${inputBase} py-1 text-xs`} defaultValue="">
        <option value="" disabled>
          Niveau…
        </option>
        {levels.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ipmd-black px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        + Offre
      </button>
      {state && (
        <span className={`text-[11px] font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}

export function AnneesRentrees({
  years,
  intakes,
  filieres,
  levels,
  isSuper,
}: {
  years: YearRow[];
  intakes: IntakeRow[];
  filieres: FiliereRow[];
  levels: string[];
  isSuper: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<FormResult>, confirmMsg?: string) => {
    if (pending) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
    });
  };

  const [yearState, yearAction, yearPending] = useActionState<FormResult | null, FormData>(
    createAcademicYear,
    null
  );
  const [intakeState, intakeAction, intakePending] = useActionState<FormResult | null, FormData>(
    createIntake,
    null
  );

  const intakesByYear = years.map((y) => ({
    year: y,
    list: intakes.filter((i) => i.academicYear === y.year),
  }));

  // Résumé haut d'écran : distinguer FONCTIONNEMENT vs RECRUTEMENT.
  const activeYear = years.find((y) => y.status === "active") ?? null;
  const openIntakes = intakes.filter((i) => i.status === "open");

  // Prêt à ouvrir ? ≥1 offre 'open' ET chacune a exactement 1 classe.
  const openReadiness = (it: IntakeRow) => {
    const open = it.offerings.filter((o) => o.status === "open");
    const withClass = open.filter((o) => o.hasClass).length;
    return { open: open.length, withClass, canOpen: open.length > 0 && withClass === open.length };
  };

  return (
    <div className="space-y-8">
      {/* ====== BANDEAU : Fonctionnement ≠ Recrutement ====== */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700/80">
            ⚙️ Année de fonctionnement
          </p>
          <p className="mt-1 text-xl font-black text-emerald-900">{activeYear?.year ?? "—"}</p>
          <p className="mt-0.5 text-[11px] text-emerald-800/70">
            Utilisée par la finance et les étudiants en cours.
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700/80">
            📥 Recrutements ouverts
          </p>
          {openIntakes.length === 0 ? (
            <p className="mt-1 text-sm font-semibold text-blue-900/70">Aucune rentrée ouverte.</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {openIntakes.map((i) => (
                <span
                  key={i.id}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 ring-1 ring-blue-200"
                >
                  {i.label} · {i.academicYear}
                </span>
              ))}
            </div>
          )}
          <p className="mt-1 text-[11px] text-blue-800/70">
            Indépendant de l&apos;année de fonctionnement.
          </p>
        </div>
      </section>

      {msg && (
        <p className={`text-sm font-medium ${msg.ok ? "text-green-600" : "text-ipmd-red"}`}>{msg.text}</p>
      )}

      {/* ============ ANNÉES ============ */}
      <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="text-lg font-bold text-ipmd-black">Années académiques</h2>
        <p className="mt-1 text-xs text-black/50">
          L&apos;année <strong>active</strong> = année de fonctionnement (finance/étudiants). Le
          recrutement se pilote par les rentrées ci-dessous, indépendamment de l&apos;année active.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {years.map((y) => (
            <div
              key={y.year}
              className="flex items-center gap-2 rounded-xl bg-ipmd-light px-3 py-2 ring-1 ring-black/5"
            >
              <span className="font-semibold text-ipmd-black">{y.year}</span>
              <span className={badge(y.status)}>{y.status}</span>
              {y.status === "preparation" && isSuper && (
                <button
                  type="button"
                  onClick={() =>
                    run(
                      () => activateYear(y.year),
                      `Cette action change l'année de fonctionnement utilisée par la finance (→ ${y.year}). Les recrutements ouverts ne sont pas modifiés. Confirmer ?`
                    )
                  }
                  disabled={pending}
                  className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Activer
                </button>
              )}
            </div>
          ))}
        </div>
        <form action={yearAction} className="mt-4 flex flex-wrap items-end gap-2">
          <input
            name="year"
            placeholder="2027-2028"
            pattern="\d{4}-\d{4}"
            required
            className={`${inputBase} py-1.5 text-sm`}
          />
          <button
            type="submit"
            disabled={yearPending}
            className="rounded-full bg-ipmd-black px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            + Année (préparation)
          </button>
          {yearState && (
            <span className={`text-xs font-medium ${yearState.ok ? "text-green-600" : "text-ipmd-red"}`}>
              {yearState.message}
            </span>
          )}
        </form>
      </section>

      {/* ============ NOUVELLE RENTRÉE ============ */}
      <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="text-lg font-bold text-ipmd-black">Nouvelle rentrée</h2>
        <form action={intakeAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-black/55">
            Année
            <select name="academic_year" required className={`${inputBase} mt-1 py-1.5 text-sm`} defaultValue="">
              <option value="" disabled>
                Année…
              </option>
              {years.map((y) => (
                <option key={y.year} value={y.year}>
                  {y.year}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-black/55">
            Libellé de rentrée
            <input name="label" placeholder="ex. Novembre 2026" required className={`${inputBase} mt-1 py-1.5 text-sm`} />
          </label>
          <label className="text-xs font-semibold text-black/55">
            Début des cours (facultatif)
            <input type="date" name="start_date" className={`${inputBase} mt-1 py-1.5 text-sm`} />
          </label>
          <label className="text-xs font-semibold text-black/55">
            Ouverture candidatures (facultatif)
            <input type="datetime-local" name="applications_open_at" className={`${inputBase} mt-1 py-1.5 text-sm`} />
          </label>
          <label className="text-xs font-semibold text-black/55">
            Fermeture candidatures (facultatif)
            <input type="datetime-local" name="applications_close_at" className={`${inputBase} mt-1 py-1.5 text-sm`} />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={intakePending}
              className="rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              + Créer la rentrée
            </button>
          </div>
        </form>
        {intakeState && (
          <p className={`mt-2 text-xs font-medium ${intakeState.ok ? "text-green-600" : "text-ipmd-red"}`}>
            {intakeState.message}
          </p>
        )}
      </section>

      {/* ============ RENTRÉES PAR ANNÉE ============ */}
      {intakesByYear.map(({ year, list }) =>
        list.length === 0 ? null : (
          <section key={year.year} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <h2 className="text-lg font-bold text-ipmd-black">
              Rentrées {year.year} <span className={badge(year.status)}>{year.status}</span>
            </h2>
            <div className="mt-3 space-y-4">
              {list.map((it) => {
                const r = openReadiness(it);
                return (
                <div key={it.id} className="rounded-xl bg-ipmd-light p-4 ring-1 ring-black/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ipmd-black">{it.label}</span>
                    <span className={badge(it.status)}>{it.status}</span>
                    {it.startDate && (
                      <span className="text-[11px] text-black/45">Cours : {it.startDate}</span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.canOpen ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.open} offre(s) ouverte(s) · {r.withClass}/{r.open} classe(s) configurée(s)
                    </span>
                    <div className="ml-auto flex gap-2">
                      {it.status !== "open" ? (
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              () => openIntake(it.id),
                              `Ouvrir « ${it.label} » aux candidatures ?\n(Refusé si aucune offre « open » ou si une offre ouverte n'a pas exactement 1 classe.)`
                            )
                          }
                          disabled={pending || !r.canOpen}
                          title={
                            r.canOpen
                              ? "Ouvrir la rentrée aux candidatures"
                              : r.open === 0
                              ? "Aucune offre ouverte : passez au moins une offre en « open »."
                              : "Une offre ouverte n'a pas de classe configurée."
                          }
                          className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Ouvrir aux candidatures
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              () => closeIntake(it.id),
                              `Fermer « ${it.label} » ?\n(N'affecte aucune candidature déjà déposée.)`
                            )
                          }
                          disabled={pending}
                          className="rounded-full bg-ipmd-black px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          Fermer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Offres */}
                  <div className="mt-3 space-y-1.5">
                    {it.offerings.length === 0 && (
                      <p className="text-[11px] text-black/40">Aucune offre déclarée.</p>
                    )}
                    {it.offerings.map((o) => (
                      <div
                        key={o.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-black/5"
                      >
                        <span className="text-xs font-medium text-black/70">
                          {o.filiereName} — {o.level}
                        </span>
                        <span className={badge(o.status)}>{o.status}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            o.hasClass ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-ipmd-red"
                          }`}
                        >
                          {o.hasClass ? "classe ✓" : "classe manquante"}
                        </span>
                        <div className="ml-auto flex gap-1.5">
                          {o.status !== "open" ? (
                            <button
                              type="button"
                              onClick={() => run(() => setOfferingStatus(o.id, "open"))}
                              disabled={pending}
                              className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              title={o.hasClass ? "Ouvrir l'offre" : "Nécessite 1 classe configurée"}
                            >
                              Ouvrir
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => run(() => setOfferingStatus(o.id, "closed"))}
                              disabled={pending}
                              className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold text-black/60 hover:bg-black/20 disabled:opacity-50"
                            >
                              Fermer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <AddOfferingForm intakeId={it.id} filieres={filieres} levels={levels} />

                  <IntakeOfferingConfig
                    intakeId={it.id}
                    filieres={filieres}
                    levels={levels}
                    offerings={it.offerings.map((o) => ({
                      id: o.id,
                      filiereId: o.filiereId,
                      level: o.level,
                      status: o.status,
                    }))}
                  />
                </div>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}
