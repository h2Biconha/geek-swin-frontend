import type { Metadata } from "next";
import CheckoutView from "@/components/views/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Checkout seguro.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CheckoutView />;
}
