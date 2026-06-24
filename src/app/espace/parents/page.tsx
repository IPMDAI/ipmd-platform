import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { LinkParentForm } from "@/components/espace/LinkParentForm";
import { unlinkParentChild } from "@/lib/admin-actions";
import { PARENT_RELATIONSHIP_LABEL } from "@/lib/academic";

export const metadata: Metadata = {
  title: "Parents & élèves",
};

export default async function ParentsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: parents }, { data: students }, { data: links }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "parent")
        .order("full_name"),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "etudiant")
        .order("full_name"),
      supabase
        .from("parent_links")
        .select("id, parent_id, student_id, relationship")
        .order("created_at", { ascending: false }),
    ]);

  const nameMap = new Map<string, string>();
  for (const p of [...(parents ?? []), ...(students ?? [])]) {
    nameMap.set(p.id, p.full_name || p.email);
  }

  const linkList = links ?? [];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Parents &amp; élèves
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Reliez chaque parent à son ou ses enfants pour activer leur suivi.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Liens existants */}
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">
                  Liens existants
                </h2>
                <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-bold text-white">
                  {linkList.length}
                </span>
              </div>

              {linkList.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun lien pour le moment. Créez-en un →
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {linkList.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <p className="min-w-0 text-sm">
                        <span className="font-semibold text-ipmd-black">
                          {nameMap.get(l.parent_id) ?? "—"}
                        </span>
                        {l.relationship && (
                          <span className="ml-1.5 rounded-full bg-ipmd-light px-2 py-0.5 text-[10px] font-bold text-black/55">
                            {PARENT_RELATIONSHIP_LABEL[l.relationship] ?? l.relationship}
                          </span>
                        )}
                        <span className="text-black/40"> → </span>
                        <span className="font-semibold text-ipmd-black">
                          {nameMap.get(l.student_id) ?? "—"}
                        </span>
                      </p>
                      <form action={unlinkParentChild.bind(null, l.id)}>
                        <button
                          type="submit"
                          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                        >
                          Retirer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulaire */}
            <div className="order-1 lg:order-2">
              <LinkParentForm
                parents={parents ?? []}
                students={students ?? []}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
