import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { AcceptReglementButton } from "@/components/espace/AcceptReglementButton";
import { getReglement } from "@/data/reglement";
import { resolveUserIsBootcamp } from "@/lib/reglement-user";

export const metadata: Metadata = { title: "Règlement intérieur" };

const LEARNER = ["etudiant", "professionnel", "dirigeant"];

export default async function ReglementPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const isLearner = LEARNER.includes(me?.role ?? "");

  // Cursus bootcamp/certifiant vs diplôme : identifié par le PARCOURS du candidat
  // (profiles.universe, puis candidature → univers ; marqueur financier en dernier
  // recours seulement). Cf. resolveUserIsBootcamp.
  const isBootcamp = await resolveUserIsBootcamp(userId);
  const reglement = getReglement(isBootcamp);

  const { data: accept } = await supabase
    .from("reglement_acceptances")
    .select("accepted_at")
    .eq("user_id", userId)
    .eq("version", reglement.version)
    .maybeSingle();

  const acceptedAt = accept?.accepted_at
    ? new Date(accept.accepted_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  // Acceptation d'une version ANTÉRIEURE (ex. diplome-2026-2027 avant r2) : affichée
  // pour traçabilité, ne vaut pas acceptation de la version en vigueur.
  const { data: prior } = acceptedAt
    ? { data: null }
    : await supabase
        .from("reglement_acceptances")
        .select("accepted_at")
        .eq("user_id", userId)
        .neq("version", reglement.version)
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
  const priorAcceptedAt = prior?.accepted_at
    ? new Date(prior.accepted_at).toLocaleDateString("fr-FR", {
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
            <div className="flex items-center gap-2">
              {/* Vrai téléchargement : fichier PDF servi en pièce jointe (≠ impression). */}
              <a
                href="/espace/reglement/pdf"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/15 transition-opacity hover:opacity-90"
              >
                ⬇️ Télécharger (PDF)
              </a>
              <PrintButton />
            </div>
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
                Année {reglement.year}
              </p>
            </header>

            <h1 className="mt-7 text-center text-xl font-extrabold uppercase tracking-wide text-ipmd-black sm:text-2xl">
              Règlement intérieur
            </h1>
            <p className="mt-1 text-center text-sm text-black/55">
              {isBootcamp ? "Bootcamps & Certificats" : "Cursus Diplôme (Licence & Master)"} — {reglement.year}
            </p>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-ipmd-red" />

            {/* Articles */}
            <div className="mt-8 space-y-6">
              {reglement.articles.map((a) => (
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
                  {priorAcceptedAt && (
                    <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                      Vous aviez accepté une version précédente de ce règlement le {priorAcceptedAt}.
                      Cette version a été mise à jour&nbsp;: merci d&apos;en accuser lecture
                      ci-dessous. Votre acceptation précédente reste enregistrée.
                    </p>
                  )}
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

            {/* Pied (impression) — l'acceptation se fait en ligne (accusé de lecture
                horodaté, article 23), pas par signature papier. */}
            <div className="mt-8 hidden border-t border-black/10 pt-6 text-xs text-black/55 print:block">
              <p>
                Acceptation&nbsp;: l&apos;accusé de lecture du présent règlement est recueilli et
                horodaté en ligne sur la plateforme IPMD (article 23). Ce document imprimé est une
                copie de référence.
              </p>
            </div>
            <p className="mt-6 text-center text-[11px] text-black/40">
              INSTITUT POLYTECHNIQUE DES MÉTIERS DU DIGITAL — {reglement.title} · {reglement.year}
            </p>
          </article>
        </div>
      </Container>
    </section>
  );
}
