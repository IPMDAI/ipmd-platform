import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { UniverseCard } from "@/components/cards/UniverseCard";
import { universes } from "@/data/universes";

/** Groupes affichés (sous-titres) dans la section des univers. */
const GROUPS = [
  {
    kind: "diplome",
    icon: "🎓",
    label: "Diplômes",
    desc: "Licence, Bachelor, Master, MBA, Executive MBA — formations diplômantes, du bachelier au dirigeant.",
    note: "📅 Rentrée académique 2026-2027 : 06 octobre 2026",
  },
  { kind: "certificat", icon: "📜", label: "Certificats", desc: "Bootcamps intensifs et 100 % pratiques, certifiants à l'ère de l'IA." },
  { kind: "service", icon: "🏢", label: "Entreprises & organisations", desc: "L'IPMD au service des entreprises : former, recruter, collaborer." },
] as const;

/** Grande image qui comble l'espace vide quand un groupe laisse un trou (desktop). */
const GROUP_FILLERS: Record<string, string> = {
  certificat: "/Visuel%20UltraBoost%2C-17.png",
  service: "/ultra-excutive/ultraexecutive0.png",
};

/** Section « Nos 8 univers » : groupée par Diplômes / Certificats / Entreprises. */
export function UniversesSection() {
  return (
    <Section id="univers" variant="light">
      <div className="space-y-14">
        {GROUPS.map((group) => {
          const list = universes.filter((u) => u.kind === group.kind);
          if (list.length === 0) return null;
          return (
            <div key={group.kind}>
              <div className="flex flex-col items-center text-center">
                <h3 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
                  <span aria-hidden className="mr-2">{group.icon}</span>
                  {group.label}
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-black/55">{group.desc}</p>
                {"note" in group && group.note && (
                  <p className="mt-3 inline-block rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-bold text-white shadow-sm">
                    {group.note}
                  </p>
                )}
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((universe, i) => (
                  <Reveal key={universe.id} delay={i * 60}>
                    <UniverseCard universe={universe} />
                  </Reveal>
                ))}
                {/* Comble l'espace vide quand le groupe laisse un trou (Certificats : 4 cartes ; Entreprises : 1 carte). */}
                {GROUP_FILLERS[group.kind] && (
                  <div className="hidden overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5 lg:col-span-2 lg:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={GROUP_FILLERS[group.kind]}
                      alt={`${group.label} — IPMD`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
