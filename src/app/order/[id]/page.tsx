import type { Metadata } from "next";
import OrderStatusView from "@/components/views/OrderStatusView";

export const metadata: Metadata = {
  title: "Seu pedido",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Page({ params, searchParams }: PageProps<"/order/[id]">) {
  const t = (await searchParams).t;
  // o token vem do servidor: na navegação pelo cliente, location.search pode ainda não estar atualizado
  return <OrderStatusView id={(await params).id} token={typeof t === "string" ? t : null} />;
}
