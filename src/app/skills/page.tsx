import type { Metadata } from "next";
import { HubShowcase } from "@/components/sections/HubShowcase";

export const metadata: Metadata = {
  title: "IPMD Skills — Insertion professionnelle & recrutement | IPMD",
  description:
    "Le pôle employabilité de l'IPMD : mise en relation entreprises, placement en stage et emploi, insertion professionnelle, recrutement.",
};

export default function SkillsPage() {
  return <HubShowcase hubId="skills" />;
}
