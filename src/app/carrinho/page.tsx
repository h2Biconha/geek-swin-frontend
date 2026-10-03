import type { Metadata } from "next";
import CartView from "@/components/CartView";
import ProductGrid from "@/components/ProductGrid";
import { Breadcrumb, SectionHead } from "@/components/ui";
import { getProduct } from "@/lib/products";

export const metadata: Metadata = { title: "Bag", robots: { index: false } };

const UPSELL = ["lag-zero-socks", "respawn-cap", "ggwp-core-tee", "kit-squad-3-tees"].map((s) => getProduct(s)!);

export default function CarrinhoPage() {
  return (
    <>
      <section className="px-gutter pb-16 pt-12 md:pt-16">
        <Breadcrumb trail={[["Início", "/"], ["Bag"]]} />
        <CartView />
      </section>
      <section className="px-gutter pb-20 md:pb-28">
        <SectionHead title="Leve também" sub="Peças que combinam com qualquer look." />
        <ProductGrid products={UPSELL} />
      </section>
    </>
  );
}
