"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-actions";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Field, inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

export default function ConnexionPage() {
  const [loginState, loginAction, loginPending] = useActionState<
    FormResult | null,
    FormData
  >(signIn, null);

  return (
    <section className="bg-ipmd-light">
      <Container className="flex min-h-[80vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <div className="mb-4 flex justify-center">
            <Logo hideText />
          </div>
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-ipmd-black">
            Espace IPMD
          </h1>
          <p className="mt-1 text-center text-sm text-black/60">
            Connectez-vous avec les identifiants fournis par l&apos;IPMD.
          </p>

          <form action={loginAction} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="login-email" required>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@email.com"
                className={inputBase}
              />
            </Field>
            <Field label="Mot de passe" htmlFor="login-password" required>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputBase}
              />
            </Field>
            <ActionButton
              type="submit"
              size="lg"
              className="w-full"
              disabled={loginPending}
            >
              {loginPending ? "Connexion…" : "Se connecter"}
            </ActionButton>
            {loginState && !loginState.ok && (
              <p className="text-center text-sm font-medium text-ipmd-red">
                {loginState.message}
              </p>
            )}
            <p className="text-center text-sm">
              <Link
                href="/mot-de-passe-oublie"
                className="font-semibold text-ipmd-red hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-black/55">
            Pas encore inscrit·e ?{" "}
            <Link
              href="/admission"
              className="font-semibold text-ipmd-red hover:underline"
            >
              Demander une inscription
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
