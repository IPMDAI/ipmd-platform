"use client";

import { useActionState, useState, useTransition } from "react";
import {
  updateMyProfile,
  changeMyPassword,
  setCommercialOptIn,
} from "@/lib/profile-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { AvatarUpload } from "@/components/espace/AvatarUpload";
import type { FormResult } from "@/types";

export type ParentProfile = {
  profession: string | null;
  fonction: string | null;
  entreprise: string | null;
  ville: string | null;
  pays: string | null;
  commOptCommercial: boolean;
};

function Result({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return (
    <p
      className={`text-sm font-medium ${
        state.ok ? "text-green-600" : "text-ipmd-red"
      }`}
    >
      {state.message}
    </p>
  );
}

/** Préférences de communication (parent) : opt-in commercial, école toujours garanti. */
function CommunicationSettings({ initial }: { initial: boolean }) {
  const [optIn, setOptIn] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      const next = !optIn;
      const r = await setCommercialOptIn(next);
      if (r.ok) setOptIn(next);
      setMsg(r.message);
    });

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-bold text-ipmd-black">Mes communications</h2>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={optIn}
          disabled={pending}
          onChange={toggle}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-black/20 text-ipmd-red focus:ring-ipmd-red"
        />
        <span className="text-sm text-ipmd-black">
          Recevoir les offres de formations, certifications, événements et
          opportunités IPMD.
        </span>
      </label>
      <p className="rounded-lg bg-ipmd-light/70 px-3 py-2 text-xs text-black/55">
        Les informations scolaires et administratives concernant votre enfant
        restent accessibles et peuvent continuer à vous être envoyées.
      </p>
      {msg && (
        <p className="text-sm font-medium text-green-600">{msg}</p>
      )}
    </div>
  );
}

export function ProfileSettings({
  userId,
  fullName,
  email,
  roleLabel,
  birthDate,
  birthPlace,
  avatarUrl,
  parent,
}: {
  userId: string;
  fullName: string;
  email: string;
  roleLabel: string;
  birthDate?: string | null;
  birthPlace?: string | null;
  avatarUrl?: string | null;
  parent?: ParentProfile;
}) {
  const [nameState, nameAction, namePending] = useActionState<
    FormResult | null,
    FormData
  >(updateMyProfile, null);
  const [pwdState, pwdAction, pwdPending] = useActionState<
    FormResult | null,
    FormData
  >(changeMyPassword, null);

  return (
    <div className="space-y-6">
      {/* Photo de profil */}
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-bold text-ipmd-black">Photo de profil</h2>
        <AvatarUpload userId={userId} initialUrl={avatarUrl ?? null} name={fullName || email} />
      </div>

      {/* Identité */}
      <form
        action={nameAction}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <h2 className="text-lg font-bold text-ipmd-black">Mon profil</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" htmlFor="p-email">
            <input
              id="p-email"
              value={email}
              disabled
              className={`${inputBase} cursor-not-allowed bg-ipmd-light text-black/50`}
            />
          </Field>
          <Field label="Rôle" htmlFor="p-role">
            <input
              id="p-role"
              value={roleLabel}
              disabled
              className={`${inputBase} cursor-not-allowed bg-ipmd-light text-black/50`}
            />
          </Field>
        </div>

        <Field label="Nom et prénom" htmlFor="p-name" required>
          <input
            id="p-name"
            name="full_name"
            required
            defaultValue={fullName}
            className={inputBase}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date de naissance" htmlFor="p-birth">
            <input
              id="p-birth"
              name="birth_date"
              type="date"
              defaultValue={birthDate ?? ""}
              className={inputBase}
            />
          </Field>
          <Field label="Lieu de naissance" htmlFor="p-birthplace">
            <input
              id="p-birthplace"
              name="birth_place"
              defaultValue={birthPlace ?? ""}
              placeholder="Ex. Cocody (Côte d'Ivoire)"
              className={inputBase}
            />
          </Field>
        </div>
        <p className="text-xs text-black/45">
          Utilisés sur ton bulletin et tes documents officiels.
        </p>

        {/* Profil professionnel — parents / tuteurs uniquement. */}
        {parent && (
          <div className="space-y-3 border-t border-black/5 pt-4">
            <h3 className="text-sm font-bold text-ipmd-black">
              Mon profil professionnel
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Profession" htmlFor="p-profession">
                <input
                  id="p-profession"
                  name="profession"
                  defaultValue={parent.profession ?? ""}
                  className={inputBase}
                />
              </Field>
              <Field label="Fonction" htmlFor="p-fonction">
                <input
                  id="p-fonction"
                  name="fonction"
                  defaultValue={parent.fonction ?? ""}
                  className={inputBase}
                />
              </Field>
            </div>
            <Field label="Entreprise" htmlFor="p-entreprise">
              <input
                id="p-entreprise"
                name="entreprise"
                defaultValue={parent.entreprise ?? ""}
                className={inputBase}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ville" htmlFor="p-ville">
                <input
                  id="p-ville"
                  name="ville"
                  defaultValue={parent.ville ?? ""}
                  className={inputBase}
                />
              </Field>
              <Field label="Pays" htmlFor="p-pays">
                <input
                  id="p-pays"
                  name="pays"
                  defaultValue={parent.pays ?? ""}
                  placeholder="Ex. Côte d'Ivoire"
                  className={inputBase}
                />
              </Field>
            </div>
          </div>
        )}

        <ActionButton type="submit" disabled={namePending}>
          {namePending ? "Enregistrement…" : "Enregistrer"}
        </ActionButton>
        <Result state={nameState} />
      </form>

      {/* Communications — parents / tuteurs uniquement. */}
      {parent && <CommunicationSettings initial={parent.commOptCommercial} />}

      {/* Mot de passe */}
      <form
        action={pwdAction}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <h2 className="text-lg font-bold text-ipmd-black">Mot de passe</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nouveau mot de passe" htmlFor="p-pwd" required>
            <input
              id="p-pwd"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="8 caractères minimum"
              className={inputBase}
            />
          </Field>
          <Field label="Confirmer" htmlFor="p-confirm" required>
            <input
              id="p-confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              className={inputBase}
            />
          </Field>
        </div>
        <ActionButton type="submit" disabled={pwdPending}>
          {pwdPending ? "Modification…" : "Changer le mot de passe"}
        </ActionButton>
        <Result state={pwdState} />
      </form>
    </div>
  );
}
