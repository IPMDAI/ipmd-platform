import type { Metadata } from "next";
import { UniverseShowcase } from "@/components/sections/UniverseShowcase";

export const metadata: Metadata = {
  title: "IPMD Jobs — Bootcamps jeunes",
  description:
    "10 bootcamps courts, pratiques et orientés emploi pour former rapidement les jeunes aux compétences digitales.",
};

export default function UltraJobsPage() {
  return <UniverseShowcase universeId="ultrajobs" />;
}
