import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import Collections from "@/components/Collections";
import ProductGrid from "@/components/ProductGrid";
import { Perks, SectionHead } from "@/components/ui";
import { brl, discount, DROP_ITEMS, getProduct, img, installment, LOOKS } from "@/lib/products";

const TECH = [
  ["VoidBlack™", "O preto que não desbota depois de 50 lavagens."],
  ["LockNeck™", "Gola com ribana dupla que não abre."],
  ["520 g/m²", "Moletom pesado, caimento estruturado."],
  ["ZeroShrink™", "Algodão pré-encolhido: o tamanho fica."],
];

const linkCls = "font-mono text-label uppercase tracking-[0.16em] underline underline-offset-[6px] hover:text-acid-ink";

export default function Home() {
  const left = DROP_ITEMS.reduce((s, p) => s + (p.stockLeft ?? 0), 0);
  const total = DROP_ITEMS.reduce((s, p) => s + (p.edition ?? 0), 0);
  const kit = getProduct("kit-squad-3-tees")!;

  return (
    <>
      <Hero />

      <section aria-label="Tecnologias do tecido" className="border-y border-line/15">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 px-gutter py-10 md:grid-cols-4">
          {TECH.map(([t, d]) => (
            <li key={t}>
              <p className="font-display text-lg font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-gutter py-20 md:py-28">
        <SectionHead title="Escolha sua classe" sub="Três linhas, um mesmo padrão de tecido." aside={<Link href="/loja" className={linkCls}>Ver loja</Link>} />
        <Collections />
      </section>

      <section className="px-gutter pb-20 md:pb-28">
        <SectionHead
          title="Genesis Drop"
          sub="Cada peça sai numerada. Quando o contador zera, acabou."
          aside={
            <Link href="/drops" className="flex items-center gap-2 font-mono text-micro uppercase tracking-[0.16em] tabular-nums text-acid-ink">
              <i className="size-1.5 animate-pulse rounded-full bg-acid" />
              {left} de {total} restantes
            </Link>
          }
        />
        <ProductGrid products={DROP_ITEMS.slice(0, 4)} />
      </section>

      <section className="px-gutter pb-20 md:pb-28">
        <div className="grid overflow-hidden rounded-[28px] bg-invert text-on-invert md:grid-cols-2">
          <div className="flex flex-col justify-between gap-10 p-8 md:p-14">
            <div>
              <span className="font-mono text-hud uppercase opacity-70">Kits feitos pro squad</span>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,3.6vw,3.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
                3 oversized.
                <br />
                {discount(kit)}% off no kit.
              </h2>
              <p className="mt-5 max-w-[38ch] opacity-75">Preta, cimento e off-white no mesmo tamanho. Sai por {brl(kit.price / 3)} cada.</p>
            </div>
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4 tabular-nums">
              <div>
                <span className="block font-mono text-sm line-through opacity-60">{brl(kit.compareAt!)}</span>
                <span className="font-display text-4xl font-extrabold">{brl(kit.price)}</span>
                <span className="block font-mono text-label opacity-70">ou 6x de {installment(kit.price)} sem juros</span>
              </div>
              <Link href={`/produto/${kit.slug}`} className="rounded-full bg-acid px-7 py-4 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-acid transition-transform duration-700 ease-lux hover:-translate-y-1">
                Montar meu kit
              </Link>
            </div>
          </div>
          <Link href={`/produto/${kit.slug}`} aria-label={`Ver o ${kit.name}`} data-cursor="view" className="studio relative grid aspect-[5/4] grid-cols-3 md:aspect-auto">
            {["model-hoodie.svg", "model-tee.svg", "model-cap.svg"].map((m, i) => (
              <div key={m} className={`relative ${i === 0 ? "-mr-[30%]" : i === 2 ? "-ml-[30%]" : "z-[1]"}`}>
                <Image src={img(m)} alt="" fill unoptimized className="object-cover" />
              </div>
            ))}
          </Link>
        </div>
      </section>

      <section className="px-gutter pb-20 md:pb-28">
        <SectionHead title="Lookbook Genesis" sub="Como o drop veste na rua." aside={<Link href="/lookbook" className={linkCls}>Ver os 3 looks</Link>} />
        <div className="grid gap-4 md:grid-cols-3">
          {LOOKS.map((l) => (
            <Link key={l.n} href={`/lookbook#look-${l.n}`} data-cursor="view" className="group block">
              <div className="studio relative aspect-[3/4] overflow-hidden rounded-studio">
                <Image src={img(l.image)} alt={`Look ${l.n}`} fill unoptimized className="object-cover transition-transform duration-1500 ease-out group-hover:scale-105" />
                <span className="absolute left-4 top-4 font-mono text-micro uppercase tracking-[0.2em] text-muted">Look {l.n}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{l.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <Perks />
    </>
  );
}
