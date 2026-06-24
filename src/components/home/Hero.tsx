import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/** Vidéo YouTube jouée en fond du hero (muette, en boucle). */
const HERO_VIDEO_ID = "azB3Irjscyg";

/** Bande d'identité IPMD (titre, slogan, CTA, statistiques) sur fond vidéo. */
export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-ipmd-black text-white">
      {/* Vidéo de fond (derrière les écritures) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <iframe
          title="Vidéo de présentation IPMD"
          src={`https://www.youtube-nocookie.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${HERO_VIDEO_ID}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&disablekb=1`}
          allow="autoplay; encrypted-media"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "100vw",
            height: "56.25vw",
            minHeight: "100%",
            minWidth: "177.78vh",
          }}
        />
      </div>

      {/* Voile sombre + décor pour garder le texte lisible */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-ipmd-black/80 via-ipmd-black/70 to-ipmd-black/85"
        aria-hidden
      />
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div
        className="absolute -left-32 -top-20 h-96 w-96 rounded-full bg-ipmd-red/25 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-ipmd-red/20 blur-3xl"
        aria-hidden
      />

      <Container className="relative w-full py-24 sm:py-32">
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
            className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-white/75 sm:text-xl"
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
              className="border-white/40 text-white hover:bg-white hover:text-ipmd-black"
            >
              Demander une admission
            </Button>
          </div>

          {/* Mini-statistiques */}
          <div
            className="mx-auto mt-16 grid max-w-2xl animate-fade-up grid-cols-3 gap-6 border-t border-white/15 pt-8"
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
                <p className="mt-1 text-xs text-white/70 sm:text-sm">
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
