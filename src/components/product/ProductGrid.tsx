import type { Product } from "@/lib/catalog";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, cols = 4, priority = 0 }: { products: Product[]; cols?: 3 | 4; priority?: number }) {
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:gap-y-14 ${cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {products.map((p, i) => (
        <ProductCard key={p.slug} product={p} index={i} priority={i < priority} />
      ))}
    </div>
  );
}
