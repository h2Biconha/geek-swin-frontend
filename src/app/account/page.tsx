import type { Metadata } from "next";
import AccountView from "@/components/views/AccountView";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Pedidos, favoritos e tamanhos salvos.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <AccountView />;
}
