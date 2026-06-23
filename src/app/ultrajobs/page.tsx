import type { Metadata } from "next";
import { UniverseShowcase } from "@/components/sections/UniverseShowcase";

export const metadata: Metadata = {
  title: "UltraJobs — Bootcamps jeunes à l'ère de l'IA",
  description:
    "15 bootcamps certifiants, courts et 100% pratiques pour les jeunes de 18 à 30 ans : compétences digitales, IA, freelance et employabilité.",
};

export default function UltraJobsPage() {
  return <UniverseShowcase universeId="ultrajobs" />;
}
