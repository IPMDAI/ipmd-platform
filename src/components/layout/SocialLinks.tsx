import { socialLinks } from "@/data/navigation";

/** Icônes SVG des réseaux sociaux (inline, sans dépendance). */
const icons: Record<string, React.ReactNode> = {
  LinkedIn: (
    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.2 8h4.6v14H.2V8zm7.4 0h4.4v1.9h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 7v8.48h-4.6v-7.5c0-1.79-.03-4.09-2.49-4.09-2.49 0-2.87 1.95-2.87 3.96V22H7.6V8z" />
  ),
  Facebook: (
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.12 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.08 24 18.09 24 12.07z" />
  ),
  YouTube: (
    <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.6 15.57V8.43L15.82 12 9.6 15.57z" />
  ),
};

interface SocialLinksProps {
  /** Style selon le fond. */
  tone?: "dark" | "light";
  className?: string;
}

export function SocialLinks({ tone = "dark", className = "" }: SocialLinksProps) {
  const styles =
    tone === "dark"
      ? "bg-white/10 text-white hover:bg-ipmd-red"
      : "bg-ipmd-light text-ipmd-black hover:bg-ipmd-red hover:text-white";

  return (
    <div className={`flex gap-3 ${className}`}>
      {socialLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${styles}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden
          >
            {icons[s.label]}
          </svg>
        </a>
      ))}
    </div>
  );
}
