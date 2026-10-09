import Link from "next/link";
import { categoryName, dropTitle, getDrop, getProduct, PRODUCTS, type Product } from "@/lib/catalog";
import BuyBox from "../product/BuyBox";
import ProductGallery from "../product/ProductGallery";
import ProductRail from "../product/ProductRail";
import Reviews from "../sections/Reviews";
import Breadcrumbs from "../ui/Breadcrumbs";

/** "Complete o look": quem divide look com a peça primeiro, depois o resto. */
function related(p: Product, n = 4) {
  const looks = p.drop ? (getDrop(p.drop)?.looks ?? []) : [];
  const fromLooks = looks.filter((l) => l.products.includes(p.slug)).flatMap((l) => l.products);
  return [...new Set([...fromLooks, ...PRODUCTS.map((q) => q.slug)])]
    .filter((s) => s !== p.slug)
    .slice(0, n)
    .map((s) => getProduct(s)!);
}

export default function ProductView({ product: p }: { product: Product }) {
  const drop = p.drop ? getDrop(p.drop) : undefined;
  return (
    <>
      <div className="wrap pt-5 pb-section lg:pt-8">
        <Breadcrumbs items={[["Loja", "/shop"], [categoryName(p.category), `/shop?categoria=${p.category}`], [p.name]]} />
        <div className="mt-5 grid grid-cols-1 gap-8 *:min-w-0 lg:mt-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,1fr)] lg:gap-12 xl:gap-20">
          <div className="-mx-gutter lg:mx-0">
            <ProductGallery product={p} />
          </div>
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <BuyBox product={p} />
          </div>
        </div>
      </div>

      {drop && drop.story.length > 0 && (
        <section aria-labelledby="story-t" className="theme-dark grain relative overflow-hidden py-section">
          <div className="wrap relative">
            <p className="eyebrow text-accent-fg" data-reveal>
              A história · Drop {drop.number}
            </p>
            <h2 id="story-t" className="font-display mt-6 max-w-[16ch] text-d2" data-reveal>
              “{drop.quote}”
            </h2>
            <div className="mt-14 grid gap-10 border-t border-line pt-10 md:grid-cols-3">
              {drop.story.map((s, i) => (
                <div key={s.title} data-reveal style={{ "--i": i } as React.CSSProperties}>
                  <p className="eyebrow num text-muted">0{i + 1}</p>
                  <h3 className="font-display mt-3 text-[1.75rem] leading-none">{s.title}</h3>
                  <p className="mt-3 text-muted">{s.text}</p>
                </div>
              ))}
            </div>
            <Link href={`/drops/${drop.slug}`} className="btn btn-secondary mt-12">
              Ver Drop {drop.number} · {dropTitle(drop)}
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby="look-t" className="wrap pt-section">
        <div className="flex items-end justify-between gap-6" data-reveal>
          <h2 id="look-t" className="font-display text-d3">
            Complete o look
          </h2>
          <Link href="/shop" className="btn btn-ghost">
            <span>Ver tudo</span>
          </Link>
        </div>
        <div className="mt-10">
          <ProductRail products={related(p)} />
        </div>
      </section>

      <Reviews product={p.slug} />
    </>
  );
}
