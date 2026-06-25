import fs from "node:fs";
import path from "node:path";

/** Liste les images d'un dossier de public/ (triées par nom, chemins encodés). */
export function getGalleryImages(dir = "galerie"): string[] {
  try {
    const full = path.join(process.cwd(), "public", dir);
    return fs
      .readdirSync(full)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/${dir}/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}
