import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import type { Partner } from "@/lib/partners";

/** Bandeau « Ils nous font confiance » — logos des partenaires actifs (accueil). */
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

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {partners.map((p) => {
            const content = p.logo_url ? (
              <Image src={p.logo_url} alt={p.name} width={130} height={56} className="max-h-12 w-auto object-contain opacity-80 transition-opacity hover:opacity-100" unoptimized />
            ) : (
              <span className="text-sm font-semibold text-black/55 transition-colors hover:text-ipmd-black">{p.name}</span>
            );
            return p.website ? (
              <a key={p.id} href={p.website} target="_blank" rel="noopener noreferrer" title={p.name} className="flex h-12 items-center">{content}</a>
            ) : (
              <span key={p.id} title={p.name} className="flex h-12 items-center">{content}</span>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/partenaires" className="text-sm font-semibold text-ipmd-red hover:underline">
            Voir tous nos partenaires →
          </Link>
        </div>
      </Container>
    </section>
  );
}
