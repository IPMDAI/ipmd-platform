import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/sections/PageHero";
import { PARTNER_CATEGORIES, type Partner } from "@/lib/partners";

export const metadata: Metadata = {
  title: "Nos partenaires — IPMD",
  description:
    "L'IPMD s'appuie sur un réseau de partenaires académiques, entreprises et associatifs pour offrir des formations connectées au marché et à l'emploi.",
};

export const revalidate = 300;

export default async function PartenairesPublicPage() {
  const supabase = await createClient();
  let partners: Partner[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("partners")
      .select("id, name, category, logo_url, website, description, status, sort_order")
      .eq("status", "actif")
      .order("sort_order")
      .order("name");
    partners = (data ?? []) as Partner[];
  }

  return (
    <>
      <PageHero
        eyebrow="Réseau IPMD"
        title="Nos partenaires"
        description="Académiques, entreprises et associations : un réseau qui connecte nos étudiants au marché, à l'emploi et à l'international."
      />
      <section className="bg-white py-16 sm:py-24">
        <Container>
          {partners.length === 0 ? (
            <p className="text-center text-black/50">Nos partenariats seront bientôt présentés ici.</p>
          ) : (
            <div className="space-y-16">
              {PARTNER_CATEGORIES.map((cat) => {
                const list = partners.filter((p) => p.category === cat.value);
                if (list.length === 0) return null;
                return (
                  <div key={cat.value}>
                    <h2 className="text-center text-2xl font-extrabold tracking-tight text-ipmd-black">
                      {cat.icon} {cat.label}
                    </h2>
                    <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                      {list.map((p) => {
                        const card = (
                          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-ipmd-light p-6 text-center ring-1 ring-black/5 transition-shadow hover:shadow-md">
                            <span className="flex h-20 w-full items-center justify-center">
                              {p.logo_url ? (
                                <Image src={p.logo_url} alt={p.name} width={140} height={80} className="max-h-20 w-auto object-contain" unoptimized />
                              ) : (
                                <span className="text-4xl">{cat.icon}</span>
                              )}
                            </span>
                            <span className="text-sm font-semibold text-ipmd-black">{p.name}</span>
                            {p.description && <span className="text-xs text-black/50">{p.description}</span>}
                          </div>
                        );
                        return p.website ? (
                          <a key={p.id} href={p.website} target="_blank" rel="noopener noreferrer">{card}</a>
                        ) : (
                          <div key={p.id}>{card}</div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
