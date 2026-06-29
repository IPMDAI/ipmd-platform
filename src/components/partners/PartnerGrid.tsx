import Image from "next/image";
import { PARTNER_CATEGORIES, type Partner } from "@/lib/partners";

/** Grille de partenaires groupée par catégorie (cartes vedettes pour les académiques). */
export function PartnerGrid({ partners }: { partners: Partner[] }) {
  return (
    <div className="space-y-14">
      {PARTNER_CATEGORIES.map((cat) => {
        const list = partners.filter((p) => p.category === cat.value);
        if (list.length === 0) return null;
        return (
          <div key={cat.value}>
            <h3 className="text-center text-2xl font-extrabold tracking-tight text-ipmd-black">
              {cat.icon} {cat.label}
            </h3>
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => {
                const featured = cat.value === "academique";
                const card = featured ? (
                  <div className="flex h-full flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-6 sm:text-left">
                    <span className="flex h-28 w-44 shrink-0 items-center justify-center rounded-2xl bg-ipmd-light p-4">
                      {p.logo_url ? (
                        <Image src={p.logo_url} alt={p.name} width={200} height={110} className="max-h-24 w-auto object-contain" unoptimized />
                      ) : (
                        <span className="text-5xl">{cat.icon}</span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="inline-block rounded-full bg-ipmd-red/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ipmd-red">
                        Partenaire académique
                      </span>
                      <p className="mt-2 text-lg font-extrabold text-ipmd-black">{p.name}</p>
                      {p.description && (
                        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-black/60 sm:justify-start">
                          <span aria-hidden>📍</span> {p.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
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
                const wrapClass = featured ? "sm:col-span-3 lg:col-span-2" : "";
                return p.website ? (
                  <a key={p.id} href={p.website} target="_blank" rel="noopener noreferrer" className={wrapClass}>{card}</a>
                ) : (
                  <div key={p.id} className={wrapClass}>{card}</div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
