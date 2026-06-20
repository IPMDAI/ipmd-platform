import type { ReactNode } from "react";
import { Container } from "./Container";

interface SectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Variante de fond. */
  variant?: "light" | "white" | "dark";
  /** Largeur pleine du fond, contenu dans un Container. */
  contained?: boolean;
}

const variants: Record<NonNullable<SectionProps["variant"]>, string> = {
  light: "bg-ipmd-light text-ipmd-black",
  white: "bg-white text-ipmd-black",
  dark: "bg-ipmd-black text-white",
};

/** Section de page : padding vertical homogène + fond thématique. */
export function Section({
  children,
  id,
  className = "",
  variant = "light",
  contained = true,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`py-16 sm:py-24 ${variants[variant]} ${className}`}
    >
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}
