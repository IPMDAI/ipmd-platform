import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

/** Grande bannière « Rentrée 2026 » (cliquable → admission), au-dessus des 6 univers. */
export function RentreeBanner() {
  return (
    <section className="bg-ipmd-light pt-14 sm:pt-20">
      <Container>
        <Link
          href="/admission"
          className="group block overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5"
          aria-label="Rentrée 2026 — Demander une admission"
        >
          <Image
            src="/Rentree_2026.png"
            alt="Rentrée 2026 — IPMD"
            width={1200}
            height={830}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
            priority
          />
        </Link>
      </Container>
    </section>
  );
}
