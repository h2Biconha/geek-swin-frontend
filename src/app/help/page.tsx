import type { Metadata } from "next";
import HelpView from "@/components/views/HelpView";

export const metadata: Metadata = {
  title: "Ajuda",
  description: "Envio, prazos, pré-venda, trocas, pagamento e contato.",
  alternates: { canonical: "/help" },

};

export default function Page() {
  return <HelpView />;
}
