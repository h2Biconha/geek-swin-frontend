import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, Syne } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import LuxuryCursor from "@/components/LuxuryCursor";
import DropModal from "@/components/DropModal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddedToast from "@/components/AddedToast";
import "./globals.css";

// next/font baixa as fontes no build e serve do seu domínio: zero layout shift.
const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-syne" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-space-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  // troque pela URL real ao publicar (usado nas imagens de compartilhamento)
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  // cada página define o próprio título; o template completa com a marca
  title: { default: "GEEK SWIN — Genesis Collection", template: "%s · GEEK SWIN" },
  description: "Gamer Streetwear premium. Drop 001 numerado, frete grátis acima de R$ 349 e 6x sem juros.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${grotesk.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll>
          <LuxuryCursor />
          <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-invert focus:px-5 focus:py-3 focus:text-on-invert">
            Pular para o conteúdo
          </a>
          <Header />
          <main id="conteudo" tabIndex={-1} className="focus:outline-none">{children}</main>
          <Footer />
          <AddedToast />
          <DropModal />
        </SmoothScroll>
      </body>
    </html>
  );
}
