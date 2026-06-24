import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

const tutors = [
  { icon: "🎓", label: "Étudiants", desc: "Tuteur d'apprentissage personnalisé" },
  { icon: "👔", label: "Professionnels", desc: "Coach de montée en compétence" },
  { icon: "👪", label: "Parents", desc: "Suivi et accompagnement" },
  { icon: "📚", label: "Enseignants", desc: "Assistant pédagogique" },
  { icon: "🏛️", label: "Dirigeants", desc: "Conseiller stratégique IA" },
  { icon: "⚙️", label: "Administration", desc: "Automatisation & support" },
];

/** Section « IA éducative » — futurs tuteurs IA par profil. */
export function AiSection() {
  return (
    <section className="relative overflow-hidden bg-ipmd-ink text-white">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div
        className="absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-ipmd-red/20 blur-3xl"
        aria-hidden
      />
      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="red">Intelligence artificielle éducative</Badge>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Un tuteur IA pour chaque profil
          </h2>
          <p className="mt-4 text-lg text-white/70">
            IPMD prépare une IA éducative qui accompagnera chaque acteur de
            l'institut : apprentissage, pédagogie, pilotage et administration.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor, i) => (
            <Reveal key={tutor.label} delay={i * 50}>
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-ipmd-red/40">
                <span className="text-3xl">{tutor.icon}</span>
                <div>
                  <h3 className="font-bold">{tutor.label}</h3>
                  <p className="mt-1 text-sm text-white/60">{tutor.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
