"use client";

import { useEffect } from "react";
import type { UniverseId } from "@/types";
import { FORMATION_MODES } from "@/lib/academic";
import type { BackgroundVariant } from "./background";
import {
  campusDiplomaForLevel,
  campusFilieresForLevel,
  campusLevels,
  certProgrammesForSession,
  certSessions,
  offeringKey,
  proFilieresForSessionLevel,
  proLevelsForSession,
  proSessions,
  programFilieresForSessionLevel,
  programLevelsForSession,
  programSessions,
  resolveCertOffering,
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

  // Auto-sélection de l'unique session Pro (persistée).
  useEffect(() => {
    if (variant === "pro" && !value.proIntakeId) {
      const sessions = proSessions(catalog);
      if (sessions.length === 1) onChange({ ...value, proIntakeId: sessions[0].intakeId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, value.proIntakeId]);

  // Auto-sélection de l'unique session Executive (persistée).
  useEffect(() => {
    if (variant === "executive" && !value.execIntakeId) {
      const sessions = programSessions(catalog.execPrograms);
      if (sessions.length === 1) onChange({ ...value, execIntakeId: sessions[0].intakeId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, value.execIntakeId]);

  // Certificats : auto-session unique + résolution de l'offering pour un programme
  // présélectionné (arrivée depuis une carte /admission?u=&item=).
  useEffect(() => {
    if (variant !== "certificat" || !universe) return;
    const sessions = certSessions(catalog, universe);
    let intakeId = value.certIntakeId;
    let patch: Partial<Project> = {};
    if (!intakeId && sessions.length === 1) { intakeId = sessions[0].intakeId; patch.certIntakeId = intakeId; }
    if (intakeId && value.certItemId && !value.certOfferingId) {
      const off = resolveCertOffering(catalog, universe, intakeId, value.certItemId);
      if (off) patch.certOfferingId = off.offeringId;
    }
    if (Object.keys(patch).length > 0) onChange({ ...value, ...patch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, universe, value.certIntakeId, value.certItemId, value.certOfferingId]);

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

  // ─────────────────────────── PRO (cascade) ───────────────────────────
  if (variant === "pro") {
    const sessions = proSessions(catalog);
    if (sessions.length === 0) return <div>{title}<EmptyState label="le parcours IPMD Pro" /></div>;

    const selectedSession = value.proIntakeId || (sessions.length === 1 ? sessions[0].intakeId : "");
    const selectedLevel = value.proLevel;
    const selectedOfferingId = value.proOfferingId;
    const levels = selectedSession ? proLevelsForSession(catalog, selectedSession) : [];
    const filieres =
      selectedSession && selectedLevel ? proFilieresForSessionLevel(catalog, selectedSession, selectedLevel) : [];

    const selectSession = (id: string) => onChange({ ...value, proIntakeId: id, proLevel: "", proOfferingId: "" });
    const selectLevel = (lvl: string) => onChange({ ...value, proLevel: lvl, proOfferingId: "" });
    const selectFiliere = (offId: string) => onChange({ ...value, proOfferingId: offId });

    return (
      <div>
        {title}

        {/* 1) Session Pro */}
        <div className="mt-5">
          {sessions.length > 1 ? (
            <>
              <label htmlFor="pj-pro-session" className="text-sm font-semibold text-ipmd-black">
                Session Pro <span className="text-ipmd-red">*</span>
              </label>
              <select
                id="pj-pro-session"
                value={selectedSession}
                onChange={(e) => selectSession(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20"
              >
                <option value="">— Sélectionnez —</option>
                {sessions.map((s) => (
                  <option key={s.intakeId} value={s.intakeId}>
                    {s.intakeLabel} — {s.academicYear}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ipmd-black">
                Session Pro <span className="text-ipmd-red">*</span>
              </p>
              <div className="mt-1.5 inline-flex items-center gap-2 rounded-xl border border-ipmd-red/30 bg-ipmd-red/[0.04] px-3.5 py-2.5 text-sm font-semibold text-ipmd-black">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-ipmd-red" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-ipmd-red" />
                </span>
                {sessions[0].intakeLabel} — {sessions[0].academicYear}
              </div>
            </>
          )}
        </div>

        {/* 2) Niveau visé */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-ipmd-black">
            Niveau visé <span className="text-ipmd-red">*</span>
          </p>
          {!selectedSession ? (
            <p className="mt-2 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3 text-[13px] text-black/50">
              Choisissez d'abord une session pour afficher les niveaux disponibles.
            </p>
          ) : (
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
          )}
        </div>

        {/* 3) Filière Pro — filtrée par la session + le niveau */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-ipmd-black">
            Filière Pro <span className="text-ipmd-red">*</span>
          </p>
          {!selectedLevel ? (
            <p className="mt-2 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3 text-[13px] text-black/50">
              Choisissez d'abord un niveau visé pour afficher les filières disponibles.
            </p>
          ) : filieres.length === 0 ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] font-semibold text-amber-900">
              Aucune filière n'est ouverte pour ce niveau à cette session.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filieres.map((f) => {
                const active = selectedOfferingId === f.offeringId;
                return (
                  <button
                    key={f.offeringId}
                    type="button"
                    onClick={() => selectFiliere(f.offeringId)}
                    className={optionClass(active)}
                  >
                    <Radio active={active} />
                    <span>
                      <span className="text-sm font-semibold text-ipmd-black">{f.name}</span>
                      <span className="mt-0.5 block text-[11px] text-black/50">
                        {f.name} · {selectedLevel}
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

  // ─────────────────────────── EXECUTIVE (cascade) ───────────────────────────
  if (variant === "executive") {
    const sessions = programSessions(catalog.execPrograms);
    if (sessions.length === 0) return <div>{title}<EmptyState label="le parcours IPMD Executive" /></div>;

    const selectedSession = value.execIntakeId || (sessions.length === 1 ? sessions[0].intakeId : "");
    const selectedLevel = value.execLevel;
    const selectedOfferingId = value.execOfferingId;
    const levels = selectedSession ? programLevelsForSession(catalog.execPrograms, selectedSession) : [];
    const filieres =
      selectedSession && selectedLevel
        ? programFilieresForSessionLevel(catalog.execPrograms, selectedSession, selectedLevel)
        : [];

    const selectSession = (id: string) => onChange({ ...value, execIntakeId: id, execLevel: "", execOfferingId: "" });
    const selectLevel = (lvl: string) => onChange({ ...value, execLevel: lvl, execOfferingId: "" });
    const selectFiliere = (offId: string) => onChange({ ...value, execOfferingId: offId });

    return (
      <div>
        {title}

        {/* 1) Session Executive */}
        <div className="mt-5">
          {sessions.length > 1 ? (
            <>
              <label htmlFor="pj-exec-session" className="text-sm font-semibold text-ipmd-black">
                Session Executive <span className="text-ipmd-red">*</span>
              </label>
              <select
                id="pj-exec-session"
                value={selectedSession}
                onChange={(e) => selectSession(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20"
              >
                <option value="">— Sélectionnez —</option>
                {sessions.map((s) => (
                  <option key={s.intakeId} value={s.intakeId}>
                    {s.intakeLabel} — {s.academicYear}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ipmd-black">
                Session Executive <span className="text-ipmd-red">*</span>
              </p>
              <div className="mt-1.5 inline-flex items-center gap-2 rounded-xl border border-ipmd-red/30 bg-ipmd-red/[0.04] px-3.5 py-2.5 text-sm font-semibold text-ipmd-black">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-ipmd-red" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-ipmd-red" />
                </span>
                {sessions[0].intakeLabel} — {sessions[0].academicYear}
              </div>
            </>
          )}
        </div>

        {/* 2) Niveau visé (L3 / M1 / M2) */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-ipmd-black">
            Niveau visé <span className="text-ipmd-red">*</span>
          </p>
          {!selectedSession ? (
            <p className="mt-2 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3 text-[13px] text-black/50">
              Choisissez d'abord une session pour afficher les niveaux disponibles.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
          )}
        </div>

        {/* 3) Filière Executive — filtrée par session + niveau */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-ipmd-black">
            Filière Executive <span className="text-ipmd-red">*</span>
          </p>
          {!selectedLevel ? (
            <p className="mt-2 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3 text-[13px] text-black/50">
              Choisissez d'abord un niveau visé pour afficher les filières disponibles.
            </p>
          ) : filieres.length === 0 ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] font-semibold text-amber-900">
              Aucune filière n'est ouverte pour ce niveau à cette session.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filieres.map((f) => {
                const active = selectedOfferingId === f.offeringId;
                return (
                  <button
                    key={f.offeringId}
                    type="button"
                    onClick={() => selectFiliere(f.offeringId)}
                    className={optionClass(active)}
                  >
                    <Radio active={active} />
                    <span>
                      <span className="text-sm font-semibold text-ipmd-black">{f.name}</span>
                      <span className="mt-0.5 block text-[11px] text-black/50">
                        {f.name} · {selectedLevel}
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

  // ─────────────────────────── CERTIFICATS (cascade) ───────────────────────────
  const certUni = universe ?? "";
  const certSess = certSessions(catalog, certUni);
  if (certSess.length === 0) return <div>{title}<EmptyState label="ce parcours" /></div>;

  const selectedCertSession = value.certIntakeId || (certSess.length === 1 ? certSess[0].intakeId : "");
  const certProgrammes = selectedCertSession
    ? certProgrammesForSession(catalog, certUni, selectedCertSession)
    : [];
  const preProgramme = value.certItemId
    ? (catalog.certByUniverse[certUni] ?? []).find((x) => x.itemId === value.certItemId)
    : undefined;

  const selectCertSession = (id: string) => {
    const off = value.certItemId ? resolveCertOffering(catalog, certUni, id, value.certItemId) : undefined;
    onChange({ ...value, certIntakeId: id, certOfferingId: off ? off.offeringId : "" });
  };
  const selectCertProgramme = (p: CatalogProgram) =>
    onChange({ ...value, certItemId: p.itemId, certOfferingId: p.offeringId });

  // Groupement par catégorie pour un affichage clair.
  const certByCat = new Map<string, CatalogProgram[]>();
  for (const p of certProgrammes) {
    const c = p.category ?? "Autres";
    if (!certByCat.has(c)) certByCat.set(c, []);
    certByCat.get(c)!.push(p);
  }

  return (
    <div>
      {title}

      {preProgramme && (
        <div className="mt-4 rounded-xl border border-ipmd-red/30 bg-ipmd-red/[0.04] p-3">
          <p className="text-sm font-semibold text-ipmd-black">Formation choisie : {preProgramme.name}</p>
          <p className="mt-0.5 text-[12px] text-black/55">
            {preProgramme.category ? `${preProgramme.category} · ` : ""}
            {preProgramme.credential ?? "Certificat"}
            {preProgramme.durationMonths ? ` · ${preProgramme.durationMonths} mois` : ""}
            {preProgramme.price ? ` · ${preProgramme.price.toLocaleString("fr-FR")} FCFA` : ""}
          </p>
        </div>
      )}

      {/* 1) Session certificat */}
      <div className="mt-5">
        {certSess.length > 1 ? (
          <>
            <label htmlFor="pj-cert-session" className="text-sm font-semibold text-ipmd-black">
              Session <span className="text-ipmd-red">*</span>
            </label>
            <select
              id="pj-cert-session"
              value={selectedCertSession}
              onChange={(e) => selectCertSession(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20"
            >
              <option value="">— Sélectionnez —</option>
              {certSess.map((s) => (
                <option key={s.intakeId} value={s.intakeId}>
                  {s.intakeLabel} — {s.academicYear}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-ipmd-black">
              Session <span className="text-ipmd-red">*</span>
            </p>
            <div className="mt-1.5 inline-flex items-center gap-2 rounded-xl border border-ipmd-red/30 bg-ipmd-red/[0.04] px-3.5 py-2.5 text-sm font-semibold text-ipmd-black">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-ipmd-red" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-ipmd-red" />
              </span>
              {certSess[0].intakeLabel} — {certSess[0].academicYear}
            </div>
          </>
        )}
      </div>

      {/* 2) Programme / formation (groupé par catégorie) */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-ipmd-black">
          Programme / formation <span className="text-ipmd-red">*</span>
        </p>
        {!selectedCertSession ? (
          <p className="mt-2 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3 text-[13px] text-black/50">
            Choisissez d'abord une session pour afficher les formations disponibles.
          </p>
        ) : certProgrammes.length === 0 ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] font-semibold text-amber-900">
            Aucune formation ouverte pour cette session.
          </p>
        ) : (
          <div className="mt-2 space-y-4">
            {[...certByCat.entries()].map(([cat, progs]) => (
              <div key={cat}>
                <p className="text-[13px] font-bold text-black/70">{cat}</p>
                <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {progs.map((p) => {
                    const active = value.certOfferingId === p.offeringId;
                    return (
                      <button key={p.offeringId} type="button" onClick={() => selectCertProgramme(p)} className={optionClass(active)}>
                        <Radio active={active} />
                        <span>
                          <span className="text-sm font-semibold text-ipmd-black">{p.name}</span>
                          <span className="mt-0.5 block text-[11px] text-black/50">
                            {p.credential ?? "Certificat"}
                            {p.durationMonths ? ` · ${p.durationMonths} mois` : ""}
                            {p.price ? ` · ${p.price.toLocaleString("fr-FR")} FCFA` : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3) Mode de formation */}
      <ModeField value={value.mode} onChange={(m) => onChange({ ...value, mode: m })} />
    </div>
  );
}
