import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { hubs } from "@/data/ecosystem";

/** Section « Notre écosystème » : SeniorsHub, Hub, Skills (au-delà des 6 univers). */
export function EcosystemSection() {
  return (
    <Section variant="white">
      <SectionHeading
        eyebrow="Au-delà des diplômes"
        title="Notre écosystème"
        description="Bootcamps, innovation et insertion professionnelle : l'IPMD vous accompagne bien au-delà de la formation."
      />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hubs.map((hub, i) => (
          <Reveal key={hub.id} delay={i * 60}>
            <Link
              href={hub.href}
              className="group flex h-full flex-col rounded-3xl border border-black/5 bg-ipmd-light p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ipmd-red/20 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  {hub.icon}
                </span>
                {hub.badge && (
                  <span className="rounded-full bg-ipmd-red px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    {hub.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-xl font-extrabold tracking-tight text-ipmd-black">
                {hub.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-ipmd-red">{hub.tagline}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-black/60">
                {hub.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ipmd-black transition-colors group-hover:text-ipmd-red">
                Découvrir
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
