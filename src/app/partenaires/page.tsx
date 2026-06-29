import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/sections/PageHero";
import { PartnerGrid } from "@/components/partners/PartnerGrid";
import type { Partner } from "@/lib/partners";

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
            <PartnerGrid partners={partners} />
          )}
        </Container>
      </section>
    </>
  );
}
