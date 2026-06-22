import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Suivi de mon enfant",
};

export default async function MonEnfantPage() {
  const { supabase, userId } = await requireUser();

  const { data: links } = await supabase
    .from("parent_links")
    .select("student_id")
    .eq("parent_id", userId);

  const ids = (links ?? []).map((l) => l.student_id);

  let children: { id: string; full_name: string | null; email: string }[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    children = data ?? [];
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Suivi de mon enfant
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Consultez les cours, l&apos;emploi du temps et les notes de votre
            enfant.
          </p>

          {children.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun enfant rattaché à votre compte. Contactez l&apos;administration
              de l&apos;IPMD (info@ipmd.pro) pour activer le suivi.
            </p>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {children.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/espace/mon-enfant/${c.id}`}
                    className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
                  >
                    <h2 className="text-base font-bold text-ipmd-black">
                      {c.full_name || c.email}
                    </h2>
                    <p className="text-sm text-black/50">{c.email}</p>
                    <span className="mt-2 inline-block text-xs font-semibold text-ipmd-red">
                      Voir le suivi →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
