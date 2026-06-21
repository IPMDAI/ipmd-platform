"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/lib/auth-actions";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { Field, inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

type Tab = "login" | "signup";

export default function ConnexionPage() {
  const [tab, setTab] = useState<Tab>("login");

  const [loginState, loginAction, loginPending] = useActionState<
    FormResult | null,
    FormData
  >(signIn, null);
  const [signupState, signupAction, signupPending] = useActionState<
    FormResult | null,
    FormData
  >(signUp, null);

  return (
    <section className="bg-ipmd-light">
      <Container className="flex min-h-[80vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-ipmd-black">
            Espace IPMD
          </h1>
          <p className="mt-1 text-center text-sm text-black/60">
            Accédez à votre espace personnel.
          </p>

          {/* Onglets */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-ipmd-light p-1">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === "login"
                  ? "bg-white text-ipmd-black shadow-sm"
                  : "text-black/50"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === "signup"
                  ? "bg-white text-ipmd-black shadow-sm"
                  : "text-black/50"
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* Connexion */}
          {tab === "login" && (
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
            </form>
          )}

          {/* Création de compte */}
          {tab === "signup" && (
            <form action={signupAction} className="mt-6 space-y-4">
              <Field label="Nom complet" htmlFor="signup-name" required>
                <input
                  id="signup-name"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Votre nom et prénom"
                  className={inputBase}
                />
              </Field>
              <Field label="Email" htmlFor="signup-email" required>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="vous@email.com"
                  className={inputBase}
                />
              </Field>
              <Field label="Mot de passe" htmlFor="signup-password" required>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Au moins 6 caractères"
                  className={inputBase}
                />
              </Field>
              <ActionButton
                type="submit"
                size="lg"
                className="w-full"
                disabled={signupPending}
              >
                {signupPending ? "Création…" : "Créer mon compte"}
              </ActionButton>
              {signupState && (
                <p
                  className={`text-center text-sm font-medium ${
                    signupState.ok ? "text-green-600" : "text-ipmd-red"
                  }`}
                >
                  {signupState.message}
                </p>
              )}
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
