import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/** Hero principal de la page d'accueil. */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ipmd-black text-white">
      {/* Décor : grille + halos rouges */}
      <div className="absolute inset-0 bg-grid" aria-hidden />
      <div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-ipmd-red/30 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-ipmd-red/20 blur-3xl"
        aria-hidden
      />

      <Container className="relative py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-in">
            <Badge tone="red">80 % de pratique</Badge>
          </div>

          <h1 className="mt-6 animate-fade-up text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Institut Polytechnique
            <br />
            des <span className="text-ipmd-red-light">Métiers du Digital</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-white/70 sm:text-xl"
            style={{ animationDelay: "100ms" }}
          >
            École supérieure digitale, moderne et orientée intelligence
            artificielle. Formez-vous aux métiers du digital pour une
            employabilité réelle.
          </p>

          <p
            className="mt-8 animate-fade-up text-2xl font-black tracking-tight sm:text-3xl"
            style={{ animationDelay: "150ms" }}
          >
            Ose. <span className="text-ipmd-red-light">Agis.</span> Impacte.
          </p>

          <div
            className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: "200ms" }}
          >
            <Button href="/formations" size="lg">
              Découvrir nos formations
            </Button>
            <Button
              href="/admission"
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white hover:text-ipmd-black"
            >
              Demander une inscription
            </Button>
          </div>

          {/* Mini-statistiques */}
          <div
            className="mx-auto mt-16 grid max-w-2xl animate-fade-up grid-cols-3 gap-6 border-t border-white/10 pt-8"
            style={{ animationDelay: "250ms" }}
          >
            {[
              { value: "6", label: "univers de formation" },
              { value: "35+", label: "bootcamps certifiants" },
              { value: "80%", label: "de pratique" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold text-ipmd-red-light">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-white/60 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
