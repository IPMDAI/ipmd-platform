import type { Metadata } from "next";
import { HubShowcase } from "@/components/sections/HubShowcase";

export const metadata: Metadata = {
  title: "IPMD Hub — Recherche, incubation & mise en relation | IPMD",
  description:
    "L'espace d'innovation IPMD : recherche appliquée, incubation de projets et mise en relation des talents et des entreprises.",
};

export default function HubPage() {
  return <HubShowcase hubId="hub" />;
}
