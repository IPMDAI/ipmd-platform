"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Field, inputBase } from "@/components/forms/FormField";

export default function DefinirMotDePassePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Le lien d'invitation établit une session (détectée dans l'URL).
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const pwd = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (pwd.length < 8) {
      setError("8 caractères minimum.");
      return;
    }
    if (pwd !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/espace"), 1200);
  };

  return (
    <section className="bg-ipmd-light">
      <Container className="flex min-h-[80vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <div className="mb-4 flex justify-center">
            <Logo hideText />
          </div>
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-ipmd-black">
            Définir mon mot de passe
          </h1>
          <p className="mt-1 text-center text-sm text-black/60">
            Bienvenue à l&apos;IPMD ! Choisis ton mot de passe pour accéder à
            ton espace.
          </p>

          {!ready ? (
            <p className="mt-8 text-center text-sm text-black/45">Chargement…</p>
          ) : done ? (
            <p className="mt-8 rounded-xl bg-green-50 p-4 text-center text-sm font-medium text-green-700 ring-1 ring-green-200">
              ✅ Mot de passe défini ! Redirection vers ton espace…
            </p>
          ) : !hasSession ? (
            <p className="mt-8 rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-800 ring-1 ring-amber-200">
              Lien invalide ou expiré. Demande à l&apos;administration de te
              renvoyer une invitation.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Nouveau mot de passe" htmlFor="password" required>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  className={inputBase}
                />
              </Field>
              <Field label="Confirmer" htmlFor="confirm" required>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputBase}
                />
              </Field>
              <ActionButton
                type="submit"
                size="lg"
                className="w-full"
                disabled={pending}
              >
                {pending ? "Enregistrement…" : "Définir et accéder à mon espace"}
              </ActionButton>
              {error && (
                <p className="text-center text-sm font-medium text-ipmd-red">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
