import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
}

/** En-tête de section homogène : sur-titre, titre, description. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";
  const descColor = tone === "dark" ? "text-white/70" : "text-black/60";

  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow && (
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-ipmd-red">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-lg leading-relaxed ${descColor}`}>
          {description}
        </p>
      )}
    </div>
  );
}
