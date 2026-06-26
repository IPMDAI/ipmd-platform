import type { Metadata } from "next";
import { HubShowcase } from "@/components/sections/HubShowcase";

export const metadata: Metadata = {
  title: "Entreprise / Organisation — Former, recruter, collaborer | IPMD",
  description:
    "L'offre IPMD pour les entreprises et organisations : former vos équipes au digital et à l'IA, recruter des talents et nouer des partenariats.",
};

export default function EntreprisePage() {
  return <HubShowcase hubId="entreprise" />;
}
