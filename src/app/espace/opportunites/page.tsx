import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { OPPORTUNITIES } from "@/lib/opportunities";

export const metadata: Metadata = { title: "Opportunités pour vous" };

export default async function OpportunitesPage() {
  const { supabase, userId } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("comm_opt_commercial")
    .eq("id", userId)
    .single();
  const optedIn = profile?.comm_opt_commercial ?? false;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            ✨ Opportunités pour vous
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-black/55">
            Des formations IPMD pensées pour <strong>vous</strong>, parent ou tuteur — distinctes du
            suivi de votre enfant.
          </p>

          {!optedIn ? (
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-black/70">
                Pour découvrir les formations, certifications et opportunités IPMD qui pourraient
                vous intéresser, activez simplement les communications d&apos;offres dans vos
                préférences. Vos informations scolaires restent, elles, toujours accessibles.
              </p>
              <Link
                href="/espace/parametres"
                className="mt-4 inline-flex rounded-full bg-ipmd-red px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Activer dans mes préférences →
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {OPPORTUNITIES.map((o) => (
                <Link
                  key={o.href + o.title}
                  href={o.href}
                  className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:ring-ipmd-red/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl" aria-hidden>{o.icon}</span>
                    <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black/55">
                      {o.tag}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-ipmd-black group-hover:text-ipmd-red">
                    {o.title}
                  </h2>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-black/60">{o.subtitle}</p>
                  <span className="mt-3 text-sm font-semibold text-ipmd-red">Découvrir →</span>
                </Link>
              ))}
            </div>
          )}

          {optedIn && (
            <p className="mt-6 text-xs text-black/40">
              Vous recevez ces suggestions car vous avez accepté les communications d&apos;offres
              IPMD. Vous pouvez les désactiver à tout moment dans{" "}
              <Link href="/espace/parametres" className="underline">vos paramètres</Link>.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
