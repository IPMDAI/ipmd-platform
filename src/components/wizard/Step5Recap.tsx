"use client";

import type { ReactNode } from "react";
import type { UniverseId } from "@/types";
import { getUniverse } from "@/data/universes";
import type { Background, BackgroundVariant } from "./background";
import { backgroundErrors, isBackgroundValid, situationSpec } from "./background";
import type { Identity } from "./identity";
import { identityErrors, isIdentityValid, minAgeForVariant, composeBirthDate, phoneE164, whatsappE164 } from "./identity";
import { countryName } from "@/data/countries";
import {
  activeDocProfileKey,
  areRequiredDocsUploaded,
  describeProject,
  documentLinesForProfile,
  isProjectValid,
  type DocRequirement,
  type Project,
  type Uploads,
  type WizardCatalog,
} from "./project";

const IDENTITY_LABELS: Partial<Record<keyof Identity, string>> = {
  lastName: "Nom",
  firstName: "Prénoms",
  birthDay: "Date de naissance",
  birthMonth: "Date de naissance",
  birthYear: "Date de naissance",
  birthCountry: "Pays de naissance",
  birthPlace: "Ville de naissance",
  email: "Email",
  phoneCountry: "Indicatif téléphone",
  phone: "Téléphone",
  whatsappCountry: "Indicatif WhatsApp",
  whatsapp: "WhatsApp",
};

const docBadge: Record<DocRequirement, { c: string; t: string }> = {
  required: { c: "bg-ipmd-red/10 text-ipmd-red", t: "Obligatoire" },
  optional: { c: "bg-black/[0.06] text-black/55", t: "Facultatif" },
  conditional: { c: "bg-amber-100 text-amber-800", t: "Selon votre dossier" },
};

function SectionCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-black/60">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-ipmd-black hover:bg-black/10"
        >
          Modifier
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-black/5 py-1.5 last:border-0">
      <span className="text-[13px] text-black/50">{label}</span>
      <span className="text-[13px] font-medium text-ipmd-black">{value || <em className="font-normal text-black/30">—</em>}</span>
    </div>
  );
}

/**
 * Étape 5 — Récapitulatif & envoi. Récap structuré (parcours, identité, parcours
 * actuel, projet, pièces) + « Modifier » par section, liste des champs
 * obligatoires manquants, case de confirmation et bouton final désactivé tant
 * que le dossier n'est pas valide. L'envoi réel est délégué à la coquille
 * (`onSubmit`) qui appelle la RPC transactionnelle.
 */
export function Step5Recap({
  universe,
  variant,
  catalog,
  identity,
  background,
  project,
  uploads,
  confirmed,
  onConfirm,
  onEdit,
  onSubmit,
  submitting,
  submitError,
}: {
  universe: UniverseId | null;
  variant: BackgroundVariant;
  catalog: WizardCatalog;
  identity: Identity;
  background: Background;
  project: Project;
  uploads: Uploads;
  confirmed: boolean;
  onConfirm: (v: boolean) => void;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {

  const uni = universe ? getUniverse(universe) : undefined;
  const minAge = minAgeForVariant(variant);
  const idErr = identityErrors(identity, minAge);
  const bgErr = backgroundErrors(background, variant);
  const sit = situationSpec(variant);
  const summary = describeProject(project, universe, variant, catalog);
  const profileKey = activeDocProfileKey(project, universe, variant, catalog);
  const docLines = documentLinesForProfile(profileKey, catalog);
  const docsOk = areRequiredDocsUploaded(profileKey, catalog, uploads);

  // ── Champs obligatoires manquants (par section) ──
  const missing: { section: string; step: number; items: string[] }[] = [];
  if (!universe) missing.push({ section: "Parcours IPMD", step: 0, items: ["Parcours non choisi"] });
  if (!isIdentityValid(identity, minAge))
    missing.push({
      section: "Identité",
      step: 1,
      items: [
        ...new Set(
          (Object.keys(idErr) as (keyof Identity)[]).map((k) => IDENTITY_LABELS[k] ?? k),
        ),
      ],
    });
  if (!isBackgroundValid(background, variant))
    missing.push({
      section: "Parcours actuel",
      step: 2,
      items: (Object.keys(bgErr) as (keyof Background)[]).map((k) =>
        k === "currentSituation" ? sit.label : k === "lastLevel" ? "Dernier niveau d'études atteint" : "Dernier diplôme obtenu",
      ),
    });
  if (!isProjectValid(project, universe, variant, catalog))
    missing.push({
      section: "Projet à l'IPMD",
      step: 3,
      items: ["Formation / programme non sélectionné (ou aucun ouvert)"],
    });
  if (!docsOk)
    missing.push({
      section: "Pièces justificatives",
      step: 4,
      items: docLines
        .filter((d) => d.requirement === "required" && (uploads[d.docKey]?.length ?? 0) === 0)
        .map((d) => d.label),
    });

  const complete = missing.length === 0;
  const canSubmit = complete && confirmed;

  const showSituation = sit.show;

  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">
        Récapitulatif &amp; envoi
      </h2>
      <p className="mt-1 text-sm text-black/55">
        Vérifiez votre demande. Vous pouvez modifier chaque section avant l'envoi.
      </p>

      {/* Champs obligatoires manquants */}
      {!complete && (
        <div className="mt-5 rounded-2xl border border-ipmd-red/30 bg-ipmd-red/[0.04] p-4">
          <p className="text-sm font-bold text-ipmd-red">Éléments obligatoires manquants</p>
          <ul className="mt-2 space-y-1.5">
            {missing.map((m) => (
              <li key={m.section} className="text-[13px] text-black/70">
                <button
                  type="button"
                  onClick={() => onEdit(m.step)}
                  className="font-semibold text-ipmd-red underline underline-offset-2"
                >
                  {m.section}
                </button>{" "}
                — {m.items.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {/* Parcours IPMD */}
        <SectionCard title="Parcours IPMD" onEdit={() => onEdit(0)}>
          {uni ? (
            <p className="text-sm font-semibold text-ipmd-black">
              <span className="mr-1">{uni.icon}</span>
              {uni.name}
              <span className="ml-2 text-[12px] font-normal text-black/50">{uni.tagline}</span>
            </p>
          ) : (
            <p className="text-sm text-ipmd-red">Aucun parcours choisi.</p>
          )}
        </SectionCard>

        {/* Identité */}
        <SectionCard title="Identité" onEdit={() => onEdit(1)}>
          <Row label="Nom" value={identity.lastName} />
          <Row label="Prénoms" value={identity.firstName} />
          <Row label="Né(e) le" value={composeBirthDate(identity)} />
          <Row label="Pays de naissance" value={identity.birthCountry ? countryName(identity.birthCountry) : ""} />
          <Row label="Ville de naissance" value={identity.birthPlace} />
          <Row label="Email" value={identity.email} />
          <Row label="Téléphone" value={phoneE164(identity)} />
          <Row label="WhatsApp" value={whatsappE164(identity)} />
        </SectionCard>

        {/* Parcours actuel */}
        <SectionCard title="Parcours actuel" onEdit={() => onEdit(2)}>
          <Row label="Dernier niveau d'études atteint" value={background.lastLevel} />
          <Row label="Dernier diplôme obtenu" value={background.lastDiploma} />
          {variant !== "certificat" && (
            <>
              <Row label="Année d'obtention" value={background.graduationYear} />
              <Row label="Établissement d'origine" value={background.institution} />
            </>
          )}
          {showSituation && <Row label={sit.label} value={background.currentSituation} />}
        </SectionCard>

        {/* Projet à l'IPMD */}
        <SectionCard title="Projet à l'IPMD" onEdit={() => onEdit(3)}>
          {summary ? (
            <>
              {summary.rentree && <Row label="Rentrée" value={summary.rentree} />}
              <Row label="Formation / programme" value={summary.formation} />
              {summary.credential && <Row label="Diplôme / certificat visé" value={summary.credential} />}
            </>
          ) : (
            <p className="text-sm text-ipmd-red">Aucune formation sélectionnée.</p>
          )}
        </SectionCard>

        {/* Pièces attendues */}
        <SectionCard title="Pièces attendues" onEdit={() => onEdit(4)}>
          {docLines.length === 0 ? (
            <p className="text-[13px] text-black/50">Profil documentaire non défini.</p>
          ) : (
            <ul className="space-y-1.5">
              {docLines.map((d) => {
                const b = docBadge[d.requirement];
                const count = uploads[d.docKey]?.length ?? 0;
                const status =
                  count > 0
                    ? { c: "bg-emerald-50 text-emerald-700", t: count > 1 ? `✓ Fourni (${count})` : "✓ Fourni" }
                    : d.requirement === "required"
                      ? { c: "bg-ipmd-red/10 text-ipmd-red", t: "Manquant" }
                      : d.requirement === "conditional"
                        ? { c: "bg-amber-50 text-amber-700", t: "Selon votre dossier" }
                        : { c: "bg-black/[0.04] text-black/45", t: "Non fourni" };
                return (
                  <li key={d.docKey} className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-ipmd-black">{d.label}</span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${b.c}`}>{b.t}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.c}`}>
                        {status.t}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Confirmation + envoi */}
      <label className="mt-5 flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirm(e.target.checked)}
          disabled={!complete}
          className="mt-0.5 h-4 w-4"
        />
        <span className="text-[13px] text-black/70">
          Je certifie que les informations fournies sont exactes et je souhaite soumettre ma
          demande d'admission à l'IPMD.
        </span>
      </label>

      <div className="mt-4">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={() => {
            if (!canSubmit || submitting) return;
            onSubmit();
          }}
          className="w-full rounded-full bg-ipmd-red px-6 py-3 text-sm font-bold text-white transition hover:bg-ipmd-red-dark disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {submitting ? "Envoi en cours…" : "Envoyer ma candidature"}
        </button>
        {!canSubmit && !submitting && (
          <p className="mt-2 text-[12px] text-black/45">
            {complete
              ? "Cochez la case de confirmation pour activer l'envoi."
              : "Complétez les éléments obligatoires manquants pour activer l'envoi."}
          </p>
        )}
        {submitError && (
          <p className="mt-3 rounded-xl bg-ipmd-red/10 px-4 py-3 text-[13px] font-medium text-ipmd-red">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
