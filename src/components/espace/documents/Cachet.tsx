import { officialAssetDataUri } from "@/lib/secure-assets";

/**
 * Cachet / tampon officiel de l'IPMD.
 * 🔒 Lu depuis le bucket privé `official-assets/stamps/cachet-ipmd.png`
 * (jamais accessible par URL) et incrusté en base64. S'affiche uniquement
 * si le fichier existe ; sinon ne rend rien (pas d'image cassée).
 */
export async function Cachet({ size = 100 }: { size?: number }) {
  const src = await officialAssetDataUri("stamps/cachet-ipmd.png");
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Cachet officiel IPMD"
      width={size}
      height={size}
      className="pointer-events-none select-none object-contain opacity-90"
    />
  );
}
