import type { Metadata } from "next";
import { HubShowcase } from "@/components/sections/HubShowcase";

export const metadata: Metadata = {
  title: "SeniorsHub — Bootcamps IA | IPMD",
  description:
    "Bootcamps intensifs et pratiques pour monter en compétences à l'ère de l'IA : IA & e-business, digitalisation des compétences, IA.",
};

export default function SeniorsHubPage() {
  return <HubShowcase hubId="seniorshub" />;
}
