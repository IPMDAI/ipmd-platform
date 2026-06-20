import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="bg-ipmd-black text-white">
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="text-7xl font-black text-ipmd-red-light">404</p>
        <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
          Page introuvable
        </h1>
        <p className="mt-3 max-w-md text-white/60">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button href="/">Retour à l'accueil</Button>
          <Button
            href="/formations"
            variant="outline"
            className="border-white/30 text-white hover:bg-white hover:text-ipmd-black"
          >
            Voir les formations
          </Button>
        </div>
      </Container>
    </section>
  );
}
