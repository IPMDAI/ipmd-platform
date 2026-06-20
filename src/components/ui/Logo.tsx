import Link from "next/link";

interface LogoProps {
  /** Couleur du texte selon le fond (sombre = sur fond clair). */
  variant?: "dark" | "light";
  className?: string;
}

/**
 * Logo type « wordmark » IPMD (placeholder propre, sans fichier image).
 * Remplaçable par le vrai logo plus tard (SVG/PNG dans /public).
 */
export function Logo({ variant = "dark", className = "" }: LogoProps) {
  const text = variant === "dark" ? "text-ipmd-black" : "text-white";
  return (
    <Link
      href="/"
      aria-label="IPMD — Accueil"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ipmd-red font-black text-white shadow-md transition-transform group-hover:scale-105">
        I
      </span>
      <span className={`flex flex-col leading-none ${text}`}>
        <span className="text-lg font-extrabold tracking-tight">IPMD</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] opacity-60">
          Métiers du Digital
        </span>
      </span>
    </Link>
  );
}
