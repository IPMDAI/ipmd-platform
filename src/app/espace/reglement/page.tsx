import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { AcceptReglementButton } from "@/components/espace/AcceptReglementButton";
import {
  REGLEMENT_ARTICLES,
  REGLEMENT_TITLE,
  REGLEMENT_YEAR,
  REGLEMENT_VERSION,
} from "@/data/reglement";

export const metadata: Metadata = { title: "Règlement intérieur" };

const LEARNER = ["etudiant", "professionnel", "dirigeant"];

export default async function ReglementPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const isLearner = LEARNER.includes(me?.role ?? "");

  const { data: accept } = await supabase
    .from("reglement_acceptances")
    .select("accepted_at")
    .eq("user_id", userId)
    .eq("version", REGLEMENT_VERSION)
    .maybeSingle();

  const acceptedAt = accept?.accepted_at
    ? new Date(accept.accepted_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
              ← Retour à l&apos;espace
            </Link>
            <PrintButton />
          </div>

          <article className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 print:rounded-none print:shadow-none print:ring-0 sm:p-12">
            {/* En-tête officiel */}
            <header className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10">
                  <Image src="/logo-ipmd.png" alt="IPMD" width={56} height={56} className="h-full w-full object-contain" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-extrabold text-ipmd-black">IPMD</p>
                  <p className="text-[11px] uppercase tracking-wider text-black/55">
                    Institut Polytechnique des Métiers du Digital &amp; IA
                  </p>
                  <p className="text-[11px] text-black/45">Abidjan — Côte d&apos;Ivoire · ipmd.pro</p>
                </div>
              </div>
              <p className="text-right text-[11px] font-semibold text-black/50">
                Année {REGLEMENT_YEAR}
              </p>
            </header>

            <h1 className="mt-7 text-center text-xl font-extrabold uppercase tracking-wide text-ipmd-black sm:text-2xl">
              Règlement intérieur
            </h1>
            <p className="mt-1 text-center text-sm text-black/55">
              Cursus Diplôme (Licence &amp; Master) — {REGLEMENT_YEAR}
            </p>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-ipmd-red" />

            {/* Articles */}
            <div className="mt-8 space-y-6">
              {REGLEMENT_ARTICLES.map((a) => (
                <section key={a.n} className="break-inside-avoid">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-ipmd-red">
                    Article {a.n} — {a.title}
                  </h2>
                  <div className="mt-1.5 space-y-2 text-[13.5px] leading-relaxed text-black/75">
                    {a.body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Bloc acceptation */}
            <div className="mt-10 rounded-2xl bg-ipmd-light p-6 print:hidden">
              {acceptedAt ? (
                <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                  ✅ Vous avez confirmé la lecture de ce règlement le {acceptedAt}.
                </p>
              ) : isLearner ? (
                <>
                  <p className="mb-3 text-sm font-bold text-ipmd-black">
                    Accusé de lecture (Article 23)
                  </p>
                  <AcceptReglementButton />
                </>
              ) : (
                <p className="text-sm text-black/55">
                  Document de référence. L&apos;accusé de lecture concerne les étudiants.
                </p>
              )}
            </div>

            {/* Pied (impression) */}
            <div className="mt-8 hidden grid-cols-2 gap-8 border-t border-black/10 pt-6 text-xs text-black/55 print:grid">
              <div>
                <p>L&apos;étudiant(e) — Date et signature</p>
                <div className="mt-10 border-b border-black/30" />
              </div>
              <div>
                <p>Le parent / tuteur légal — Date et signature</p>
                <div className="mt-10 border-b border-black/30" />
              </div>
            </div>
            <p className="mt-6 text-center text-[11px] text-black/40">
              INSTITUT POLYTECHNIQUE DES MÉTIERS DU DIGITAL — {REGLEMENT_TITLE} · {REGLEMENT_YEAR}
            </p>
          </article>
        </div>
      </Container>
    </section>
  );
}
