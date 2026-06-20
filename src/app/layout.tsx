import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ipmd.pro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IPMD — Institut Polytechnique des Métiers du Digital",
    template: "%s | IPMD",
  },
  description:
    "École supérieure digitale moderne, pratique et orientée intelligence artificielle. Diplômes et bootcamps des métiers du digital. Ose. Agis. Impacte.",
  keywords: [
    "IPMD",
    "métiers du digital",
    "formation digitale",
    "intelligence artificielle",
    "bootcamp",
    "école digitale",
  ],
  openGraph: {
    title: "IPMD — Institut Polytechnique des Métiers du Digital",
    description: "Ose. Agis. Impacte. 80 % de pratique.",
    url: SITE_URL,
    siteName: "IPMD",
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
