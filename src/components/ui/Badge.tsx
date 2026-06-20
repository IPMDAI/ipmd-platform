import type { ReactNode } from "react";

type Tone = "red" | "dark" | "light" | "outline";

const tones: Record<Tone, string> = {
  red: "bg-ipmd-red text-white",
  dark: "bg-ipmd-black text-white",
  light: "bg-white text-ipmd-black ring-1 ring-black/10",
  outline: "border border-white/30 text-white",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

/** Petite pastille (ex. « 80% de pratique »). */
export function Badge({ children, tone = "red", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
