import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Button } from "@/components/ui/Button";
import { getHub } from "@/data/ecosystem";

/** Page d'un pôle de l'écosystème IPMD (SeniorsHub, Hub, Skills). */
export function HubShowcase({ hubId }: { hubId: string }) {
  const hub = getHub(hubId);
  if (!hub) return null;

  return (
    <>
      <PageHero
        eyebrow={`${hub.icon} ${hub.eyebrow}`}
        title={hub.name}
        description={hub.description}
      >
        {hub.badge && (
          <span className="mb-4 inline-block rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
            {hub.badge}
          </span>
        )}
        <div className="mt-2">
          <Button href={hub.cta.href}>{hub.cta.label}</Button>
        </div>
      </PageHero>

      <Section variant="white">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Ce que propose {hub.name}
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">{hub.tagline}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hub.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 40}>
              <div className="flex h-full flex-col rounded-2xl border border-black/5 bg-ipmd-light p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-red/10 text-xl">
                  {hub.icon}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ipmd-black">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-sm leading-relaxed text-black/60">{item.description}</p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBanner
        title={`Intéressé par ${hub.name} ?`}
        description="Notre équipe vous accompagne et répond à toutes vos questions."
        primary={{ label: hub.cta.label, href: hub.cta.href }}
      />
    </>
  );
}
