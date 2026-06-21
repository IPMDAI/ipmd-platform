import type { Metadata } from "next";
import { UniverseShowcase } from "@/components/sections/UniverseShowcase";

export const metadata: Metadata = {
  title: "IPMD Premium Executive — Bootcamps dirigeants",
  description:
    "10 bootcamps premium pour accompagner les dirigeants dans la transformation digitale, l'IA et la gouvernance.",
};

export default function UltraExecutivePage() {
  return <UniverseShowcase universeId="ultraexecutive" />;
}
