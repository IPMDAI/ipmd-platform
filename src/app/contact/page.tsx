import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { ContactForm } from "@/components/forms/ContactForm";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { contactInfo, futureSubdomains } from "@/data/navigation";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez IPMD — Institut Polytechnique des Métiers du Digital. Email, téléphone et formulaire.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Parlons de votre projet"
        description="Une question sur nos formations, l'admission ou le financement ? Écrivez-nous."
      />

      <Section variant="white">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          {/* Coordonnées */}
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
              Nos coordonnées
            </h2>
            <dl className="mt-8 space-y-6">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-red/10 text-xl">
                  ✉️
                </span>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-black/40">
                    Email
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="font-semibold text-ipmd-black hover:text-ipmd-red"
                    >
                      {contactInfo.email}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-red/10 text-xl">
                  📞
                </span>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-black/40">
                    Téléphone
                  </dt>
                  <dd className="flex flex-wrap gap-x-3 font-semibold text-ipmd-black">
                    {contactInfo.phones.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="hover:text-ipmd-red"
                      >
                        {phone}
                      </a>
                    ))}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ipmd-red/10 text-xl">
                  📍
                </span>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-black/40">
                    Adresse
                  </dt>
                  <dd className="font-semibold text-ipmd-black">
                    {contactInfo.address}
                    <span className="block font-normal text-black/60">
                      {contactInfo.city}
                    </span>
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ipmd-red/10 text-xl">
                  🌐
                </span>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-black/40">
                    Site
                  </dt>
                  <dd className="font-semibold text-ipmd-black">
                    {contactInfo.domain}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-wide text-black/40">
                Suivez-nous
              </h3>
              <SocialLinks tone="light" className="mt-3" />
            </div>

            <div className="mt-10 rounded-2xl bg-ipmd-light p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-black/40">
                Nos espaces (bientôt)
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {futureSubdomains.map((s) => (
                  <span
                    key={s.href}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black/60 ring-1 ring-black/5"
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="rounded-3xl bg-ipmd-light p-7 shadow-sm ring-1 ring-black/5 sm:p-9">
            <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black">
              Envoyez-nous un message
            </h2>
            <p className="mt-1 text-sm text-black/60">
              Nous vous répondons dans les meilleurs délais.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
