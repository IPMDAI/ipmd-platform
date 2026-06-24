import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { AddPartnerForm } from "@/components/espace/AddPartnerForm";
import { PartnerRow } from "@/components/espace/PartnerRow";
import { PARTNER_CATEGORIES, type Partner } from "@/lib/partners";

export const metadata: Metadata = { title: "Partenaires" };

const STAFF = ["super_admin", "admin"];

export default async function PartenairesPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const { data } = await supabase
    .from("partners")
    .select("id, name, category, logo_url, website, description, status, sort_order")
    .order("sort_order")
    .order("name");
  const partners = (data ?? []) as Partner[];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">← Retour à l&apos;espace</Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">Partenaires</h1>
          <p className="mt-1 text-sm text-black/55">
            Gérez les partenaires de l&apos;IPMD. Les partenaires « actifs » apparaissent sur le site public
            (<Link href="/partenaires" className="font-semibold text-ipmd-red hover:underline">/partenaires</Link>).
          </p>

          <div className="mt-6">
            <AddPartnerForm />
          </div>

          {PARTNER_CATEGORIES.map((cat) => {
            const list = partners.filter((p) => p.category === cat.value);
            if (list.length === 0) return null;
            return (
              <div key={cat.value} className="mt-8">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-black/40">
                  {cat.icon} {cat.label} ({list.length})
                </h2>
                <ul className="space-y-3">
                  {list.map((p) => <PartnerRow key={p.id} p={p} />)}
                </ul>
              </div>
            );
          })}

          {partners.length === 0 && (
            <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun partenaire pour l&apos;instant. Ajoutez-en un ci-dessus.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
