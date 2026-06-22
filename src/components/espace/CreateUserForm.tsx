"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUserAccount } from "@/lib/user-admin-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { ROLE_OPTIONS } from "@/lib/dashboards";
import type { FormResult } from "@/types";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createUserAccount,
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Créer un compte</h2>
      <p className="text-sm text-black/55">
        Crée directement un compte (email confirmé d&apos;office) et attribue
        son rôle.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom et prénom" htmlFor="u-name" required>
          <input id="u-name" name="full_name" required className={inputBase} />
        </Field>
        <Field label="Rôle" htmlFor="u-role" required>
          <select id="u-role" name="role" defaultValue="etudiant" className={inputBase}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Email" htmlFor="u-email" required>
        <input
          id="u-email"
          name="email"
          type="email"
          required
          placeholder="prenom.nom@ipmd.pro"
          className={inputBase}
        />
      </Field>

      <Field label="Mot de passe provisoire" htmlFor="u-pwd" required>
        <input
          id="u-pwd"
          name="password"
          type="text"
          required
          minLength={8}
          placeholder="8 caractères minimum"
          className={inputBase}
        />
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le compte"}
      </ActionButton>
      {state && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
