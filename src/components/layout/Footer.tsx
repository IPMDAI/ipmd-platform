import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { contactInfo, footerNav } from "@/data/navigation";

export function Footer() {
  const year = 2026; // Année fixe pour un rendu déterministe.

  return (
    <footer className="bg-ipmd-black text-white">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Marque */}
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Institut Polytechnique des Métiers du Digital. École supérieure
              digitale, pratique et orientée intelligence artificielle.
            </p>
            <p className="mt-4 text-lg font-bold text-ipmd-red-light">
              {contactInfo.slogan}
            </p>
            <SocialLinks tone="dark" className="mt-6" />
          </div>

          {/* Formations */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/40">
              Formations
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerNav.formations.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institut */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/40">
              Institut
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerNav.institut.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/40">
              Contact
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="transition-colors hover:text-white"
                >
                  {contactInfo.email}
                </a>
              </li>
              {contactInfo.phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="transition-colors hover:text-white"
                  >
                    {phone}
                  </a>
                </li>
              ))}
              <li className="text-white/50">
                {contactInfo.address}
                <br />
                {contactInfo.city}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/50 sm:flex-row">
          <p>© {year} IPMD — Institut Polytechnique des Métiers du Digital.</p>
          <p>Ose. Agis. Impacte.</p>
        </div>
      </Container>
    </footer>
  );
}
