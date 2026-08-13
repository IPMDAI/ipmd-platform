import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { StudentSearchList } from "@/components/espace/StudentSearchList";

export const metadata: Metadata = {
  title: "Bulletins",
};

export default async function BulletinsPage() {
  const { supabase } = await requireAdmin();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "etudiant")
    .order("full_name");

  const list = students ?? [];

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
            Bulletins
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Choisissez un étudiant pour consulter et imprimer son bulletin.
          </p>

          {list.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun étudiant.
            </p>
          ) : (
            <StudentSearchList
              cta="Voir le bulletin →"
              items={list.map((s) => ({
                id: s.id,
                name: s.full_name || "",
                email: s.email || "",
                href: `/espace/bulletin/${s.id}`,
              }))}
            />
          )}
        </div>
      </Container>
    </section>
  );
}
