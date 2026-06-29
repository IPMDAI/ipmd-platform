import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PartnerGrid } from "@/components/partners/PartnerGrid";
import type { Partner } from "@/lib/partners";

/** Bandeau « Ils nous font confiance » — partenaires actifs (accueil), en jolies cartes. */
export async function PartnersBand() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("partners")
    .select("id, name, category, logo_url, website, description, status, sort_order")
    .eq("status", "actif")
    .order("sort_order")
    .order("name");
  const partners = (data ?? []) as Partner[];
  if (partners.length === 0) return null;

  return (
    <section className="border-y border-black/5 bg-white py-14 sm:py-20">
      <Container>
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-ipmd-red">Ils nous font confiance</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
            Un réseau de partenaires
          </h2>
          <p className="mt-2 text-sm text-black/55">
            Académiques, entreprises et associations — au service de l&apos;employabilité de nos étudiants.
          </p>
        </div>

        <div className="mt-10">
          <PartnerGrid partners={partners} />
        </div>

        <div className="mt-10 text-center">
          <Link href="/partenaires" className="text-sm font-semibold text-ipmd-red hover:underline">
            Voir tous nos partenaires →
          </Link>
        </div>
      </Container>
    </section>
  );
}
