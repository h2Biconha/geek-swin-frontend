import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BigTitle, Breadcrumb, Perks } from "@/components/ui";
import { brl, getProduct, img, LOOKS } from "@/lib/products";

export const metadata: Metadata = { title: "Lookbook", description: "Lookbook do Drop 001 Genesis: três looks com as peças da coleção." };

export default function LookbookPage() {
  return (
    <>
      <section className="px-gutter pt-12 md:pt-16">
        <Breadcrumb trail={[["Início", "/"], ["Lookbook"]]} />
        <BigTitle lines={["Lookbook", "Genesis"]} />
        <p className="mt-6 max-w-[44ch] text-muted">Três jeitos de vestir o Drop 001. Ilustrações provisórias, as fotos do ensaio entram aqui.</p>
      </section>
      <div className="px-gutter">
        {LOOKS.map((l, i) => {
          const items = l.products.map((s) => getProduct(s)!);
          const rev = i % 2 === 1;
          return (
            <article key={l.n} id={`look-${l.n}`} className="grid scroll-mt-28 items-center gap-8 py-12 md:grid-cols-12 md:gap-12 md:py-20">
              <div data-cursor="view" className={`studio group relative aspect-[3/4] overflow-hidden rounded-[28px] md:col-span-6 ${rev ? "md:order-2 md:col-start-7" : ""}`}>
                <Image src={img(l.image)} alt={`Look ${l.n}, ${l.name}`} fill unoptimized className="object-cover transition-transform duration-1500 ease-out group-hover:scale-105" />
              </div>
              <div className={`md:col-span-5 ${rev ? "md:order-1" : "md:col-start-8"}`}>
                <p className="font-mono text-hud uppercase text-muted">Look {l.n}</p>
                <h2 className="mt-3 font-display text-[clamp(2.4rem,5vw,4.4rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em]">{l.name}</h2>
                <p className="mt-4 max-w-[38ch] text-muted">{l.text}</p>
                <ul className="mt-8 border-t border-line/15">
                  {items.map((q) => (
                    <li key={q.slug}>
                      <Link href={`/produto/${q.slug}`} className="flex items-center gap-4 border-b border-line/15 py-3 hover:text-acid-ink">
                        <span className="studio relative block size-16 shrink-0 overflow-hidden rounded-xl">
                          <Image src={img(q.image)} alt="" fill unoptimized className="object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display font-bold">{q.name}</span>
                          <span className="font-mono text-micro uppercase tracking-[0.12em] tabular-nums text-muted">{brl(q.price)}</span>
                        </span>
                        <span aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-mono text-micro uppercase tracking-[0.14em] tabular-nums">Look completo: {brl(items.reduce((s, q) => s + q.price, 0))}</p>
              </div>
            </article>
          );
        })}
      </div>
      <Perks />
    </>
  );
}
