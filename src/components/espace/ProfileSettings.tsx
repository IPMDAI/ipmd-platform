"use client";

import { useActionState } from "react";
import { updateMyProfile, changeMyPassword } from "@/lib/profile-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

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

export function ProfileSettings({
  fullName,
  email,
  roleLabel,
}: {
  fullName: string;
  email: string;
  roleLabel: string;
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

        <ActionButton type="submit" disabled={namePending}>
          {namePending ? "Enregistrement…" : "Enregistrer"}
        </ActionButton>
        <Result state={nameState} />
      </form>

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
