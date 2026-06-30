import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/ui/Container";
import {
  officialAssetDataUri,
  OFFICIAL_ASSETS_BUCKET,
} from "@/lib/secure-assets";
import {
  uploadOfficialAsset,
  removeOfficialAsset,
} from "@/lib/official-asset-actions";

export const metadata: Metadata = { title: "Signatures & cachets" };

type AssetDef = { key: string; label: string; who: string };

const ASSETS: AssetDef[] = [
  { key: "signatures/directeur-etudes.png", label: "Signature — Directeur des Études", who: "COFFI KOMENAN EMILE" },
  { key: "signatures/admin-general.png", label: "Signature — Administrateur Général", who: "POODA ETTIEN AUBIN" },
  { key: "signatures/directrice-executive.png", label: "Signature — Directrice Exécutive", who: "YEBOUE AKISSI ESTELLE SOLANGE" },
  { key: "signatures/responsable-pedago.png", label: "Signature — Responsable pédagogique", who: "(délégation)" },
  { key: "stamps/cachet-ipmd.png", label: "Cachet officiel IPMD", who: "Tampon rond" },
];

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SignaturesPage() {
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();

  // Dernière opération par asset (historique, RLS admin).
  const { data: logs } = await supabase
    .from("official_asset_log")
    .select("asset_key, action, performed_by_name, performed_at")
    .order("performed_at", { ascending: false });
  const lastLog = new Map<
    string,
    { action: string; performed_by_name: string | null; performed_at: string }
  >();
  for (const l of logs ?? []) {
    if (!lastLog.has(l.asset_key)) lastLog.set(l.asset_key, l);
  }

  // Aperçus (base64, jamais d'URL publique) + présence.
  const previews = new Map<string, string | null>();
  await Promise.all(
    ASSETS.map(async (a) => previews.set(a.key, await officialAssetDataUri(a.key)))
  );

  const storageReady = admin !== null;

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
            Signatures &amp; cachets
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Stockage <strong>privé</strong> (bucket sécurisé) — aucune URL
            publique. Les images ne sont lues que par le serveur et incrustées
            dans les documents. Réservé aux administrateurs.
          </p>

          {!storageReady && (
            <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
              ⚠️ Stockage non configuré : la clé <code>SUPABASE_SERVICE_ROLE_KEY</code>{" "}
              n&apos;est pas définie côté serveur. L&apos;upload est indisponible
              tant qu&apos;elle n&apos;est pas configurée (Vercel).
            </p>
          )}

          <ul className="mt-8 space-y-4">
            {ASSETS.map((a) => {
              const preview = previews.get(a.key) ?? null;
              const log = lastLog.get(a.key);
              return (
                <li
                  key={a.key}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-xl bg-ipmd-light ring-1 ring-black/5">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={preview}
                            alt={a.label}
                            className="max-h-14 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-xs text-black/35">Vide</span>
                        )}
                      </span>
                      <div>
                        <p className="font-bold text-ipmd-black">{a.label}</p>
                        <p className="text-xs text-black/50">{a.who}</p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            preview
                              ? "bg-green-100 text-green-700"
                              : "bg-black/5 text-black/45"
                          }`}
                        >
                          {preview ? "Déposé" : "Absent"}
                        </span>
                        {log && (
                          <p className="mt-1 text-[11px] text-black/45">
                            Dernière {log.action} —{" "}
                            {log.performed_by_name ?? "—"} · {fmt(log.performed_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <form
                        action={uploadOfficialAsset}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="key" value={a.key} />
                        <input
                          type="file"
                          name="file"
                          accept="image/png,image/webp"
                          required
                          className="max-w-[180px] text-xs file:mr-2 file:rounded-full file:border-0 file:bg-ipmd-light file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                        />
                        <button
                          type="submit"
                          disabled={!storageReady}
                          className="rounded-full bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                          {preview ? "Remplacer" : "Déposer"}
                        </button>
                      </form>
                      {preview && (
                        <form action={removeOfficialAsset}>
                          <input type="hidden" name="key" value={a.key} />
                          <button
                            type="submit"
                            className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-black/45 transition-colors hover:bg-black/10 hover:text-ipmd-red"
                            title="Retirer ce fichier"
                          >
                            Retirer
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-xs text-black/45">
            Format conseillé : PNG à fond transparent. Bucket :{" "}
            <code>{OFFICIAL_ASSETS_BUCKET}</code> (privé).
          </p>
        </div>
      </Container>
    </section>
  );
}
