import type { Metadata } from "next";
import WishlistView from "@/components/views/WishlistView";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Suas peças salvas.",
  alternates: { canonical: "/wishlist" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <WishlistView />;
}
