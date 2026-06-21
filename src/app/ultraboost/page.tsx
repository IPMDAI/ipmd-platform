import type { Metadata } from "next";
import { UniverseShowcase } from "@/components/sections/UniverseShowcase";

export const metadata: Metadata = {
  title: "UltraBoost — Bootcamps professionnels",
  description:
    "15 bootcamps courts et intensifs pour accélérer la montée en compétence des professionnels dans le digital et l'IA.",
};

export default function UltraBoostPage() {
  return <UniverseShowcase universeId="ultraboost" />;
}
