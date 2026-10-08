import type { Product } from "@/lib/catalog";
import ProductCard from "./ProductCard";

/** No celular vira trilho com deslize; no desktop, grid. Evita "card órfão" em listas curtas. */
export default function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className={`scrollbar-none -mx-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto px-gutter pb-2 sm:gap-5 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 ${products.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
      {products.map((p, i) => (
        <div key={p.slug} className="w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-auto">
          <ProductCard product={p} index={i} />
        </div>
      ))}
    </div>
  );
}
