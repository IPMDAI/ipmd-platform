import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { contactInfo } from "@/data/navigation";

/** Section contact (aperçu) sur la page d'accueil. */
export function ContactTeaser() {
  return (
    <Section id="contact" variant="light">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <SectionHeading
          align="left"
          eyebrow="Contact"
          title="Une question ? Parlons de votre projet"
          description="Notre équipe répond à vos questions sur les formations, l'admission et le financement."
        />
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <dl className="space-y-5">
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
                <dd className="font-semibold text-ipmd-black">
                  {contactInfo.phones.join(" · ")}
                </dd>
              </div>
            </div>
          </dl>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/contact">Nous contacter</Button>
            <Button href="/admission" variant="outline">
              Demander une admission
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
