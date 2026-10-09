import Link from "next/link";
import { asset, categoryHref, categoryProducts } from "@/lib/catalog";
import { navCategories } from "@/lib/merch/listings";
import SectionHead from "../ui/SectionHead";

/** "Compre por categoria": só categorias com peça publicada, com contagem real */
export default function CategoryTiles() {
  const cats = navCategories();
  if (cats.length < 2) return null;
  return (
    <section aria-labelledby="cats-t" className="wrap py-section">
      <SectionHead eyebrow="Loja" title={<span id="cats-t">Compre por categoria</span>} href="/shop" cta="Ver tudo" />
      <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {cats.map((c, i) => {
          const items = categoryProducts(c.slug);
          const art = c.art ?? items[0]?.media[0]?.src;
          return (
            <li key={c.slug} data-reveal style={{ "--i": i } as React.CSSProperties}>
              <Link href={categoryHref(c.slug)} className="group relative block">
                <span className="studio relative block aspect-[4/3] overflow-hidden">
                  {art && <img src={asset(art)} alt="" loading="lazy" className="absolute inset-0 size-full object-contain p-[12%] transition-transform duration-700 ease-out group-hover:scale-[1.05]" />}
                  <span className="eyebrow num absolute top-3 right-3 text-muted">{String(items.length).padStart(2, "0")}</span>
                </span>
                <span className="mt-3 flex items-baseline justify-between gap-3">
                  <span className="font-display text-[1.75rem] leading-none transition-colors group-hover:text-accent-fg sm:text-[2.25rem]">{c.name}</span>
                  <span aria-hidden className="text-muted transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
