import type { Product } from "@/lib/catalog";
import ProductCard from "./ProductCard";

/** Grid editorial: a peça principal ocupa 2×2 e as outras preenchem ao lado (5 peças fecham o grid sem sobra). */
export default function EditorialGrid({ products }: { products: Product[] }) {
  const list = [...products].sort((a, b) => Number(b.featured) - Number(a.featured) || a.rank - b.rank);
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-y-14">
      {list.map((p, i) => (
        <div key={p.slug} className={i === 0 ? "col-span-2 lg:row-span-2" : ""}>
          <ProductCard product={p} index={i} priority={i === 0} />
        </div>
      ))}
    </div>
  );
}
