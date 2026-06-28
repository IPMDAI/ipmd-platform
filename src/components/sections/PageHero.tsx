import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** En-tête plus court (pages de listing : news/jobs/opportunities). */
  compact?: boolean;
}

/** En-tête sombre standard des pages intérieures. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-ipmd-black text-white">
      <div className="absolute inset-0 bg-grid" aria-hidden />
      <div
        className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-ipmd-red/25 blur-3xl"
        aria-hidden
      />
      <Container className={`relative ${compact ? "py-12 sm:py-16" : "py-20 sm:py-28"}`}>
        <div className="max-w-3xl">
          {eyebrow && (
            <div className="mb-4">
              <Badge tone="red">{eyebrow}</Badge>
            </div>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 text-lg text-white/70 sm:text-xl">
              {description}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
