import fs from "fs";
import path from "path";
import Image from "next/image";

/**
 * Cachet / tampon officiel de l'IPMD.
 * S'affiche UNIQUEMENT si le fichier `public/cachet-ipmd.png` existe
 * (sinon ne rend rien — pas d'image cassée). Déposez le tampon scanné
 * (idéalement PNG à fond transparent) sous ce nom pour qu'il apparaisse.
 */
export function Cachet({ size = 100 }: { size?: number }) {
  const file = path.join(process.cwd(), "public", "cachet-ipmd.png");
  let exists = false;
  try {
    exists = fs.existsSync(file);
  } catch {
    exists = false;
  }
  if (!exists) return null;

  return (
    <Image
      src="/cachet-ipmd.png"
      alt="Cachet officiel IPMD"
      width={size}
      height={size}
      className="pointer-events-none select-none object-contain opacity-90"
    />
  );
}
