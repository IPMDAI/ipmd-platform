"use client";

import { Container } from "@/components/ui/Container";
import { Button, ActionButton } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="bg-ipmd-light">
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-extrabold text-ipmd-black sm:text-3xl">
          Une erreur est survenue
        </h1>
        <p className="mt-3 max-w-md text-black/55">
          Désolé, quelque chose s&apos;est mal passé. Réessayez, ou revenez à
          l&apos;accueil.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <ActionButton type="button" onClick={reset}>
            Réessayer
          </ActionButton>
          <Button href="/" variant="outline">
            Accueil
          </Button>
        </div>
      </Container>
    </section>
  );
}
