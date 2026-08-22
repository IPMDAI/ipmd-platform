"use client";

import { useEffect, useRef, useState } from "react";
import type { UniverseId } from "@/types";
import { getUniverse } from "@/data/universes";
import { WIZARD_STEPS, STEP_COUNT } from "./steps";
import { Step0Parcours } from "./Step0Parcours";
import { Step1Identite } from "./Step1Identite";
import {
  EMPTY_IDENTITY,
  isIdentityValid,
  minAgeForUniverse,
  composeBirthDate,
  phoneE164,
  whatsappE164,
  type Identity,
} from "./identity";
import { Step2Parcours } from "./Step2Parcours";
import {
  EMPTY_BACKGROUND,
  isBackgroundValid,
  variantForUniverse,
  type Background,
} from "./background";
import { Step3Projet } from "./Step3Projet";
import {
  activeDocProfileKey,
  areRequiredDocsUploaded,
  EMPTY_PROJECT,
  isProjectValid,
  type Project,
  type Uploads,
  type WizardCatalog,
} from "./project";
import { Step4Pieces } from "./Step4Pieces";
import { Step5Recap } from "./Step5Recap";
import { submitWizardCandidature } from "@/lib/wizard-submit";

/**
 * Coquille du wizard d'admission (étapes 0→5).
 *
 * ⚠️ ISOLÉ : ce composant vit sur /admission/wizard et NE remplace PAS le
 * formulaire public /admission (toujours actif en production). Les étapes 0→4
 * sont fonctionnelles ; l'étape 5 affiche un placeholder tant qu'elle n'est pas
 * validée. Les Étapes 3 et 4 lisent le catalogue réel (`catalog`, chargé serveur).
 */
export function AdmissionWizard({ catalog }: { catalog: WizardCatalog }) {
  const [step, setStep] = useState(0);
  const [universe, setUniverse] = useState<UniverseId | null>(null);
  const [identity, setIdentity] = useState<Identity>(EMPTY_IDENTITY);
  const [background, setBackground] = useState<Background>(EMPTY_BACKGROUND);
  const [project, setProject] = useState<Project>(EMPTY_PROJECT);
  const [uploads, setUploads] = useState<Uploads>({});
  const [confirmed, setConfirmed] = useState(false);

  // Envoi réel (Étape 5)
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  // Verrou SYNCHRONE anti-double-submit : le state `submitting` ne se met à jour
  // qu'au prochain rendu, donc deux clics dans le même tick le liraient encore à
  // false. Ce ref est posé immédiatement et bloque toute réentrance.
  const submitLockRef = useRef(false);

  // Dossier Storage unique par session wizard : généré à la 1re pièce (côté
  // client uniquement → pas de souci d'hydratation), réutilisé pour toutes les
  // pièces du candidat.
  const folderRef = useRef<string>("");
  const getFolder = () => {
    if (!folderRef.current) folderRef.current = crypto.randomUUID();
    return folderRef.current;
  };

  // Variante du parcours choisi (campus / pro / executive / certificat) : pilote
  // les champs de l'Étape 2 et les options de l'Étape 3.
  const variant = variantForUniverse(universe);
  const minAge = minAgeForUniverse(universe);

  const canNext =
    step === 0
      ? universe !== null
      : step === 1
        ? isIdentityValid(identity, minAge)
        : step === 2
          ? isBackgroundValid(background, variant)
          : step === 3
            ? isProjectValid(project, universe, variant, catalog)
            : step === 4
              ? areRequiredDocsUploaded(
                  activeDocProfileKey(project, universe, variant, catalog),
                  catalog,
                  uploads,
                )
              : true;
  const atFirst = step === 0;
  const atLast = step === STEP_COUNT - 1;

  // ── Synchronisation avec l'historique navigateur ──
  // Chaque avancée d'étape empile une entrée d'historique ; le bouton « retour »
  // du navigateur (popstate) recule d'une étape (4→3→2→1→0). À l'Étape 0, un
  // retour supplémentaire quitte /admission (entrée de base). Les données ne sont
  // jamais perdues : seul `step` change, l'état du dossier reste dans la coquille.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Entrée de base = Étape 0 (remplace, ne quitte pas la page).
    window.history.replaceState({ wizardStep: 0 }, "");
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { wizardStep?: number } | null)?.wizardStep;
      if (typeof s === "number") setStep(s);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Avance vers une étape en empilant une entrée d'historique (navigation « avant »).
  const goToStep = (n: number) => {
    setStep(n);
    if (typeof window !== "undefined") window.history.pushState({ wizardStep: n }, "");
  };

  const goNext = () => {
    if (!canNext || atLast) return;
    goToStep(Math.min(step + 1, STEP_COUNT - 1));
  };
  // Le bouton « Précédent » du wizard passe par l'historique → cohérent avec le
  // bouton retour du navigateur (une seule source de vérité). À l'Étape 0 il est
  // désactivé, donc jamais de sortie involontaire par ce bouton.
  const goPrev = () => {
    if (atFirst) return;
    if (typeof window !== "undefined") window.history.back();
    else setStep((s) => Math.max(s - 1, 0));
  };

  // Étape 0 : cliquer une carte enregistre le parcours ET avance à l'Étape 1
  // (avec entrée d'historique). La sélection persiste si le candidat revient.
  const selectParcours = (id: UniverseId) => {
    setUniverse(id);
    goToStep(1);
  };

  // Envoi réel : assemble le payload et appelle la RPC transactionnelle.
  // Anti-double-submit via `submitting` ; les données du wizard restent
  // intactes en cas d'échec (aucun reset).
  const handleSubmit = async () => {
    if (submitLockRef.current || !universe) return;
    submitLockRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const documents = Object.entries(uploads).flatMap(([doc_key, paths]) =>
        (paths ?? []).map((path) => ({ doc_key, path })),
      );
      const res = await submitWizardCandidature({
        universe,
        identity: {
          last_name: identity.lastName,
          first_name: identity.firstName,
          email: identity.email,
          phone: phoneE164(identity) ?? "",
          whatsapp: whatsappE164(identity) ?? "",
          birth_date: composeBirthDate(identity) ?? "",
          birth_place: identity.birthPlace,
          birth_country: identity.birthCountry,
          phone_country: identity.phoneCountry,
          whatsapp_country: identity.whatsappCountry,
        },
        background: {
          last_level: background.lastLevel,
          last_diploma: background.lastDiploma,
          graduation_year: background.graduationYear,
          institution: background.institution,
          current_situation: background.currentSituation,
          professional_status: background.professionalStatus,
          current_position: background.currentPosition,
          organization: background.organization,
          sector: background.sector,
          experience_years: background.experienceYears,
        },
        project: {
          campus_intake_id: project.campusIntakeId,
          campus_offering_key: project.campusOfferingKey,
          catalog_offering_id: variant === "executive" ? project.execOfferingId : project.proOfferingId,
          pro_offering_id: project.proOfferingId,
          exec_offering_id: project.execOfferingId,
          cert_item_id: project.certItemId,
        },
        mode: project.mode,
        documents,
      });
      if (res.ok) setSuccessId(res.requestId);
      else setSubmitError(res.message);
    } catch {
      setSubmitError("Une erreur réseau est survenue. Vos données sont conservées — réessayez.");
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  const current = WIZARD_STEPS[step];
  const selectedName = universe ? getUniverse(universe)?.name : null;

  // Écran final de confirmation après un envoi réussi.
  if (successId) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-4xl" aria-hidden="true">
            ✅
          </p>
          <h2 className="mt-3 text-2xl font-black text-ipmd-black">Candidature envoyée</h2>
          <p className="mt-2 text-sm text-black/60">
            Merci {identity.firstName || ""} ! Votre demande d'admission a bien été transmise à
            l'IPMD. Notre équipe vous recontactera.
          </p>
          <p className="mt-4 inline-block rounded-full bg-ipmd-light px-4 py-2 text-xs font-semibold text-black/70">
            Référence de votre candidature :{" "}
            <span className="font-mono text-ipmd-black">{successId}</span>
          </p>
          <p className="mt-4 text-[12px] text-black/45">
            Conservez cette référence pour tout échange avec l'administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Fil d'Ariane — pastilles compactes (mobile) → libellés (desktop) */}
      <nav aria-label="Progression" className="mb-6">
        {/* Mobile : « Étape n/6 · Titre » + barre de progression */}
        <div className="sm:hidden">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ipmd-red">
              Étape {step + 1}/{STEP_COUNT}
            </span>
            <span className="text-sm font-semibold text-ipmd-black">{current.label}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-ipmd-red transition-all"
              style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop : stepper à pastilles + libellés */}
        <ol className="hidden items-center gap-1 sm:flex">
          {WIZARD_STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                      active
                        ? "bg-ipmd-red text-white"
                        : done
                          ? "bg-ipmd-red/15 text-ipmd-red"
                          : "bg-black/10 text-black/40"
                    }`}
                  >
                    {done ? "✓" : i}
                  </span>
                  <span
                    className={`whitespace-nowrap text-xs font-semibold ${
                      active ? "text-ipmd-black" : "text-black/40"
                    }`}
                  >
                    {s.short}
                  </span>
                </div>
                {i < STEP_COUNT - 1 && (
                  <span className={`h-px flex-1 ${done ? "bg-ipmd-red/40" : "bg-black/10"}`} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Contenu de l'étape */}
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
        {step === 0 ? (
          <Step0Parcours selected={universe} onSelect={selectParcours} />
        ) : step === 1 ? (
          <Step1Identite value={identity} minAge={minAge} onChange={setIdentity} />
        ) : step === 2 ? (
          <Step2Parcours value={background} variant={variant} onChange={setBackground} />
        ) : step === 3 ? (
          <Step3Projet
            universe={universe}
            variant={variant}
            catalog={catalog}
            value={project}
            onChange={setProject}
          />
        ) : step === 4 ? (
          <Step4Pieces
            universe={universe}
            variant={variant}
            catalog={catalog}
            project={project}
            uploads={uploads}
            onUploadsChange={setUploads}
            getFolder={getFolder}
          />
        ) : step === 5 ? (
          <Step5Recap
            universe={universe}
            variant={variant}
            catalog={catalog}
            identity={identity}
            background={background}
            project={project}
            uploads={uploads}
            confirmed={confirmed}
            onConfirm={setConfirmed}
            onEdit={goToStep}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        ) : (
          <div className="py-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-ipmd-red">
              Étape {step + 1} · {current.label}
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-ipmd-black">{current.hint}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-black/55">
              Cette étape est en cours de préparation. La structure du wizard est en
              place ; le contenu sera activé après validation de l'Étape 0.
            </p>
            {selectedName && (
              <p className="mt-4 inline-block rounded-full bg-ipmd-light px-3 py-1 text-xs font-semibold text-black/60">
                Parcours choisi : {selectedName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation précédent / suivant */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={atFirst}
          className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-ipmd-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Précédent
        </button>

        <span className="hidden text-xs text-black/40 sm:block">
          {step === 0 && !universe
            ? "Sélectionnez un parcours pour continuer"
            : (step === 1 || step === 2) && !canNext
              ? "Complétez les champs obligatoires pour continuer"
              : step === 3 && !canNext
                ? "Choisissez une formation ouverte pour continuer"
                : step === 4 && !canNext
                  ? "Téléversez les pièces obligatoires pour continuer"
                  : " "}
        </span>

        {atLast ? (
          // Dernière étape : l'envoi vit dans le récapitulatif (Étape 5).
          <span className="w-[120px]" aria-hidden="true" />
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className="rounded-full bg-ipmd-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ipmd-red-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
}
