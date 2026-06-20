import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

interface CtaBannerProps {
  title: string;
  description: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

/** Bandeau d'appel à l'action réutilisable (admissions, etc.). */
export function CtaBanner({
  title,
  description,
  primary = { label: "Demander une inscription", href: "/admission" },
  secondary = { label: "Nous contacter", href: "/contact" },
}: CtaBannerProps) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-ipmd-red px-8 py-14 text-center text-white shadow-xl sm:px-16">
          <div
            className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div
            className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-black/10 blur-2xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-lg text-white/85">{description}</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button href={primary.href} size="lg" variant="white">
                {primary.label}
              </Button>
              <Button
                href={secondary.href}
                size="lg"
                variant="outline"
                className="border-white/60 text-white hover:bg-white hover:text-ipmd-red"
              >
                {secondary.label}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
