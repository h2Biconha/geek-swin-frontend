import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/JsonLd";
import { BRAND, SITE_URL } from "@/lib/brand";
import { organizationLd, websiteLd } from "@/lib/seo";
import "./globals.css";

// next/font baixa as fontes no build e serve do próprio domínio: sem layout shift, sem Google no navegador.
// Archivo é variável em peso E largura: a mesma família faz os títulos condensados e o texto de interface.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} · Streetwear nascido da cultura gamer`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: { type: "website", siteName: BRAND.name, locale: "pt_BR", url: "/" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <AppShell footer={<Footer />}>{children}</AppShell>
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
        {/* GTM e Meta Pixel: carregados em components/layout/Consent.tsx, só depois do aceite */}
      </body>
    </html>
  );
}
