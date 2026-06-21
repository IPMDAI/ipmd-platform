import type { Metadata } from "next";
import { UniverseShowcase } from "@/components/sections/UniverseShowcase";

export const metadata: Metadata = {
  title: "IPMD Pro — Diplômes",
  description:
    "Licence, Bachelor, Master et MBA pour les professionnels, salariés, cadres et entrepreneurs.",
};

export default function ProfessionnelPage() {
  return <UniverseShowcase universeId="professionnel" />;
}
