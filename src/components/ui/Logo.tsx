import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  /** Couleur du texte selon le fond (dark = sur fond clair). */
  variant?: "dark" | "light";
  className?: string;
  /** Masquer le texte à côté de l'emblème (logo seul). */
  hideText?: boolean;
}

/**
 * Logo officiel IPMD : emblème circulaire (public/logo-ipmd.png) + nom.
 * L'emblème est posé sur une pastille blanche pour rester lisible sur
 * n'importe quel fond (clair comme sombre).
 */
export function Logo({
  variant = "dark",
  className = "",
  hideText = false,
}: LogoProps) {
  const text = variant === "dark" ? "text-ipmd-black" : "text-white";

  return (
    <Link
      href="/"
      aria-label="IPMD — Accueil"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105">
        <Image
          src="/logo-ipmd.png"
          alt="Logo IPMD"
          width={44}
          height={44}
          className="h-full w-full object-contain"
          priority
        />
      </span>
      {!hideText && (
        <span className={`flex flex-col leading-none ${text}`}>
          <span className="text-lg font-extrabold tracking-tight">IPMD</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] opacity-60">
            Métiers du Digital
          </span>
        </span>
      )}
    </Link>
  );
}
