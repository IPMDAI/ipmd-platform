import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/sections/PageHero";
import { UniverseVideo } from "@/components/sections/UniverseVideo";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { ProgramCard } from "@/components/cards/ProgramCard";
import { Button } from "@/components/ui/Button";
import { getProgramsByUniverse } from "@/data/programs";

export const metadata: Metadata = {
  title: "IPMD Professionnel — Diplômes",
  description:
    "Formations diplômantes pour salariés, cadres, entrepreneurs et professionnels en activité : Licence et Master, cours du soir, 80 % de pratique, parcours intensifs de 10 mois.",
};

// Affichage des diplômes sur CETTE page (offre réellement ouverte : Licence • Master).
const PRO_DEGREES = ["Licence", "Master"];

// Repli statique si la base est indisponible (le rendu reste correct hors connexion).
const FALLBACK_SESSIONS = [
  { dateISO: "2026-11-19" },
  { dateISO: "2027-02-18" },
  { dateISO: "2027-05-20" },
];

function frFull(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function frMonth(iso: string): string {
  const s = new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Lit les sessions IPMD Professionnel ouvertes (lecture seule, aucune écriture). */
async function loadSessions(): Promise<{ dateISO: string }[]> {
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("intakes")
        .select("start_date")
        .ilike("label", "%Professionnel%")
        .eq("status", "open")
        .order("start_date", { ascending: true });
      const rows = (data ?? []).filter((i) => i.start_date);
      if (rows.length) return rows.map((i) => ({ dateISO: i.start_date as string }));
    }
  } catch {
    // base indisponible : on retombe sur le repli statique
  }
  return FALLBACK_SESSIONS;
}

const ADVANTAGES: { icon: string; title: string; text: string }[] = [
  {
    icon: "🏢",
    title: "Continuez à travailler pendant votre formation",
    text: "Des cours du soir pensés pour rester compatibles avec votre activité professionnelle.",
  },
  {
    icon: "🎯",
    title: "Enseignement axé à 80 % sur la pratique",
    text: "Des projets concrets et des cas réels, plutôt que de la théorie.",
  },
  {
    icon: "🚀",
    title: "Compétences directement applicables en entreprise",
    text: "Ce que vous apprenez le soir, vous pouvez l'appliquer au travail dès le lendemain.",
  },
  {
    icon: "🤝",
    title: "Réseau de professionnels, cadres et entrepreneurs",
    text: "Apprenez et échangez aux côtés d'actifs qui partagent vos ambitions.",
  },
  {
    icon: "🤖",
    title: "Au rythme du digital, de l'IA et du business",
    text: "Des programmes adaptés aux évolutions du digital, de l'intelligence artificielle et du business.",
  },
  {
    icon: "📅",
    title: "Plusieurs rentrées dans l'année",
    text: "Novembre, Février, Mai : vous démarrez votre diplôme quand vous êtes prêt.",
  },
];

const HERO_CHIPS = [
  "🎓 Du Bac+1 au Bac+5 • Licence • Master",
  "🌙 Cours du soir",
  "🎯 80 % de pratique",
  "💳 Paiement en plusieurs échéances",
];

export default async function ProfessionnelPage() {
  const programs = getProgramsByUniverse("professionnel");
  const sessions = await loadSessions();
  const today = new Date().toISOString().slice(0, 10);
  const next = sessions.find((s) => s.dateISO >= today) ?? sessions[0];
  const others = sessions.filter((s) => s.dateISO !== next.dateISO);

  return (
    <>
      {/* 1 — HERO */}
      <PageHero
        eyebrow="💼 Diplômes — formation continue"
        title="IPMD Professionnel"
        description="Formations diplômantes pour salariés, cadres, entrepreneurs et professionnels en activité."
      >
        <div className="flex flex-wrap gap-2">
          {HERO_CHIPS.map((c) => (
            <span
              key={c}
              className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20"
            >
              {c}
            </span>
          ))}
        </div>

        {/* Bloc rentrée très visible */}
        <div className="mt-7 inline-flex flex-col gap-1 rounded-2xl border border-ipmd-red/40 bg-ipmd-red/10 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
            Prochaine rentrée
          </p>
          <p className="text-2xl font-extrabold text-white">{frFull(next.dateISO)}</p>
          {others.length > 0 && (
            <p className="text-sm text-white/60">
              Autres rentrées : {others.map((o) => frMonth(o.dateISO)).join(" • ")}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/admission" size="lg">
            Demander une admission
          </Button>
          <Button
            href="#formations"
            size="lg"
            variant="outline"
            className="border-white/50 text-white hover:bg-white hover:text-ipmd-black"
          >
            Découvrir les formations
          </Button>
        </div>
      </PageHero>

      {/* Grande image / carrousel média (public/videos-professionnel/) — juste sous le hero, resserré + plus court */}
      <UniverseVideo
        universeId="professionnel"
        className="!py-8 sm:!py-10"
        aspectClassName="aspect-video sm:aspect-[2/1]"
      />

      {/* 2 — DEUX PARCOURS (classique vs intensif) */}
      <Section variant="white" className="!py-12 sm:!py-16">
        <p className="text-sm font-bold uppercase tracking-wide text-ipmd-red">Votre parcours</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Vous avez le choix entre deux parcours
        </h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {/* Parcours classique */}
          <div className="flex flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
            <span className="inline-flex w-fit items-center rounded-full bg-ipmd-black px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Parcours classique
            </span>
            <p className="mt-4 text-[15px] leading-relaxed text-black/70">
              Du <strong className="text-ipmd-black">Bac+1 au Bac+5</strong>, avec une progression
              normale selon votre niveau d&apos;entrée : Licence 1, Licence 2, Licence 3, Master 1
              et Master 2.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"].map((l) => (
                <span
                  key={l}
                  className="rounded-xl bg-ipmd-red/10 px-3.5 py-2 text-sm font-bold text-ipmd-red ring-1 ring-ipmd-red/20"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Parcours intensifs – 10 mois */}
          <div className="flex flex-col rounded-3xl border-2 border-ipmd-red/25 bg-gradient-to-br from-ipmd-red/[0.06] to-amber-50/70 p-6 shadow-sm sm:p-8">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-ipmd-red px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              ⚡ Parcours intensifs – 10 mois
            </span>
            <p className="mt-4 text-[15px] leading-relaxed text-black/70">
              <strong className="text-ipmd-black">Un format accéléré, pratique et orienté métier</strong>,
              accessible sous conditions de niveau.
            </p>
            <ul className="mt-5 space-y-3">
              <li className="rounded-2xl bg-white p-4 ring-1 ring-ipmd-red/15">
                <p className="font-bold text-ipmd-black">
                  🎓 Licence Professionnelle intensive – 10 mois
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-black/60">
                  Accessible aux candidats titulaires d&apos;un{" "}
                  <strong className="text-ipmd-black">niveau minimum Bac+2</strong>{" "}
                  ou d&apos;un diplôme admis en équivalence.
                </p>
              </li>
              <li className="rounded-2xl bg-white p-4 ring-1 ring-ipmd-red/15">
                <p className="font-bold text-ipmd-black">
                  🎓 Master Professionnel intensif – 10 mois
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-black/60">
                  Accessible aux candidats titulaires d&apos;un{" "}
                  <strong className="text-ipmd-black">niveau Bac+3 ou Bac+4</strong>, sous réserve de
                  l&apos;étude du dossier académique et professionnel.
                </p>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6">
          <Button href="/admission">Demander une admission</Button>
        </div>
      </Section>

      {/* 3 — POURQUOI CHOISIR */}
      <Section variant="white" className="!py-12 sm:!py-16">
        <p className="text-sm font-bold uppercase tracking-wide text-ipmd-red">Vos avantages</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Pourquoi choisir IPMD Professionnel ?
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((a, i) => (
            <Reveal key={a.title} delay={i * 40}>
              <div className="h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm ring-1 ring-black/5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-red/10 text-xl">
                  {a.icon}
                </span>
                <h3 className="mt-4 font-bold text-ipmd-black">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-black/60">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 3 — CHOISISSEZ VOTRE PROCHAINE RENTRÉE */}
      <Section variant="white" className="!py-12 sm:!py-16">
        <p className="text-sm font-bold uppercase tracking-wide text-ipmd-red">Calendrier</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Choisissez votre prochaine rentrée
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {sessions.map((s, i) => {
            const isNext = s.dateISO === next.dateISO;
            return (
              <Reveal key={s.dateISO} delay={i * 50}>
                <div
                  className={`flex h-full flex-col rounded-2xl p-6 shadow-sm ring-1 ${
                    isNext
                      ? "bg-ipmd-black text-white ring-ipmd-black"
                      : "bg-white text-ipmd-black ring-black/10"
                  }`}
                >
                  <span
                    className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      isNext ? "bg-ipmd-red text-white" : "bg-ipmd-red/10 text-ipmd-red"
                    }`}
                  >
                    {isNext ? "Prochaine rentrée" : "Inscriptions ouvertes"}
                  </span>
                  <p className="mt-4 text-xl font-extrabold">{frFull(s.dateISO)}</p>
                  <div className="mt-6">
                    <Button
                      href="/admission"
                      variant={isNext ? "white" : "primary"}
                      className="w-full"
                    >
                      Candidater
                    </Button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* 4 — NOS FORMATIONS DIPLÔMANTES */}
      <Section variant="white" id="formations" className="!py-12 sm:!py-16">
        <p className="text-sm font-bold uppercase tracking-wide text-ipmd-red">Nos diplômes</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Nos formations diplômantes
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">
          Des parcours diplômants (Licence • Master) conçus avec 80 % de pratique.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program, i) => (
            <Reveal key={program.id} delay={i * 40}>
              <ProgramCard program={program} degreesOverride={PRO_DEGREES} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 7 — CTA FINAL */}
      <CtaBanner
        title="Prêt à faire évoluer votre carrière ?"
        description={`Déposez votre demande d'admission — notre équipe vous recontacte rapidement. Prochaine rentrée : ${frFull(next.dateISO)}.`}
        primary={{ label: "Demander une admission", href: "/admission" }}
        secondary={{ label: "Nous contacter", href: "/contact" }}
      />
    </>
  );
}
