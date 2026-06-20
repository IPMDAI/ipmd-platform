import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "white";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ipmd-red focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-ipmd-red text-white hover:bg-ipmd-red-dark shadow-lg shadow-ipmd-red/25 hover:shadow-xl hover:-translate-y-0.5",
  secondary:
    "bg-ipmd-black text-white hover:bg-ipmd-ink shadow-lg shadow-black/20 hover:-translate-y-0.5",
  outline:
    "border-2 border-current text-ipmd-black hover:bg-ipmd-black hover:text-white",
  ghost: "text-current hover:bg-black/5",
  white:
    "bg-white text-ipmd-red hover:bg-ipmd-light hover:text-ipmd-red-dark shadow-lg shadow-black/10 hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

interface ButtonStyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

/** Bouton-lien (par défaut) basé sur next/link. */
export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: { href: string; children: ReactNode } & ButtonStyleProps &
  Omit<ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Variante <button> pour les formulaires (submit, etc.). */
export function ActionButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: { children: ReactNode } & ButtonStyleProps &
  ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
