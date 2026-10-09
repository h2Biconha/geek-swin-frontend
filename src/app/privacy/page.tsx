import type { Metadata } from "next";
import LegalView from "@/components/views/LegalView";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Quais dados a loja coleta, para quê, com quem compartilha, cookies e como exercer seus direitos (LGPD).",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <LegalView doc="privacy" />;
}
