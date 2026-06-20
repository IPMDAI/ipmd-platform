import type { Metadata } from "next";
import { UniverseShowcase } from "@/components/sections/UniverseShowcase";

export const metadata: Metadata = {
  title: "IPMD Gouvernance — Diplômes exécutifs",
  description:
    "Master Exécutif, MBA Exécutif et DBA pour dirigeants, managers et décideurs. Gouvernance digitale & IA.",
};

export default function GouvernancePage() {
  return <UniverseShowcase universeId="gouvernance" />;
}
