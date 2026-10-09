import Link from "next/link";
import { categoryHref, categoryName, dropTitle, getDrop, roleOf, type Product } from "@/lib/catalog";
import { alternatives, collectionMates } from "@/lib/merch/recommend";
import BuyBox from "../product/BuyBox";
import CompleteTheLook from "../product/CompleteTheLook";
import ProductGallery from "../product/ProductGallery";
import ProductKits from "../product/ProductKits";
import ProductRail from "../product/ProductRail";
import Reviews from "../sections/Reviews";
import Breadcrumbs from "../ui/Breadcrumbs";

export default function ProductView({ product: p }: { product: Product }) {
  const drop = p.drop ? getDrop(p.drop) : undefined;
  const mates = collectionMates(p, 4);
  // alternativas só do mesmo papel e fora da coleção já mostrada acima
  const alts = roleOf(p) === "pack" ? [] : alternatives(p, 4).filter((q) => !mates.includes(q));
  return (
    <>
      <div className="wrap pt-5 lg:pt-8">
        <Breadcrumbs items={[["Loja", "/shop"], [categoryName(p.category), categoryHref(p.category)], [p.name]]} />
        <div className="mt-5 grid grid-cols-1 gap-8 *:min-w-0 lg:mt-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,1fr)] lg:gap-12 xl:gap-20">
          <div className="-mx-gutter lg:mx-0">
            <ProductGallery product={p} />
          </div>
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <BuyBox product={p} />
          </div>
        </div>
      </div>

      <CompleteTheLook product={p} />
      <ProductKits slug={p.slug} />

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

      {mates.length > 0 && (
        <section aria-labelledby="mates-t" className="wrap pt-section">
          <div className="flex items-end justify-between gap-6" data-reveal>
            <h2 id="mates-t" className="font-display text-d3">
              {drop ? `Mais do Drop ${drop.number}` : "Mais da linha Core"}
            </h2>
            <Link href={drop ? `/drops/${drop.slug}` : "/shop/core"} className="btn btn-ghost">
              <span>Ver a coleção</span>
            </Link>
          </div>
          <div className="mt-10">
            <ProductRail products={mates} />
          </div>
        </section>
      )}

      {alts.length > 0 && (
        <section aria-labelledby="alt-t" className="wrap pt-section">
          <div className="flex items-end justify-between gap-6" data-reveal>
            <h2 id="alt-t" className="font-display text-d3">
              Mais em {categoryName(p.category)}
            </h2>
            <Link href={categoryHref(p.category)} className="btn btn-ghost">
              <span>Ver {categoryName(p.category).toLowerCase()}</span>
            </Link>
          </div>
          <div className="mt-10">
            <ProductRail products={alts} />
          </div>
        </section>
      )}

      <Reviews product={p.slug} />
    </>
  );
}
