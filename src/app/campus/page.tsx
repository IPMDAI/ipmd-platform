import type { Metadata } from "next";
import { UniverseShowcase } from "@/components/sections/UniverseShowcase";

export const metadata: Metadata = {
  title: "IPMD Campus — Diplômes",
  description:
    "Licence, Bachelor et Master des métiers du digital pour bacheliers et étudiants. 80 % de pratique.",
};

export default function CampusPage() {
  return <UniverseShowcase universeId="campus" />;
}
