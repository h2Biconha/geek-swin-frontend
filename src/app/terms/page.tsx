import type { Metadata } from "next";
import LegalView from "@/components/views/LegalView";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Preços, pagamento, reserva de peças numeradas, pré-venda, entrega, trocas e arrependimento.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <LegalView doc="terms" />;
}
