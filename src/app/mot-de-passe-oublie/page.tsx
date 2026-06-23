"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-actions";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Field, inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

export default function MotDePasseOubliePage() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    requestPasswordReset,
    null
  );

  return (
    <section className="bg-ipmd-light">
      <Container className="flex min-h-[80vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <div className="mb-4 flex justify-center">
            <Logo hideText />
          </div>
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-ipmd-black">
            Mot de passe oublié
          </h1>
          <p className="mt-1 text-center text-sm text-black/60">
            Indique ton email : on t&apos;envoie un lien pour définir un nouveau
            mot de passe.
          </p>

          {state?.ok ? (
            <p className="mt-8 rounded-xl bg-green-50 p-4 text-center text-sm font-medium text-green-700 ring-1 ring-green-200">
              {state.message}
            </p>
          ) : (
            <form action={action} className="mt-6 space-y-4">
              <Field label="Email" htmlFor="reset-email" required>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="vous@email.com"
                  className={inputBase}
                />
              </Field>
              <ActionButton
                type="submit"
                size="lg"
                className="w-full"
                disabled={pending}
              >
                {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
              </ActionButton>
              {state && !state.ok && (
                <p className="text-center text-sm font-medium text-ipmd-red">
                  {state.message}
                </p>
              )}
            </form>
          )}

          <p className="mt-6 text-center text-sm text-black/55">
            <Link href="/connexion" className="font-semibold text-ipmd-red hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
