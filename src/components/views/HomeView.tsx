import Link from "next/link";
import { coreProducts, getDrop } from "@/lib/catalog";
import { allLooks } from "@/lib/merch/looks";
import LookCard from "../commerce/LookCard";
import DropShowcase from "../drop/DropShowcase";
import HomeHero from "../drop/HomeHero";
import NextDrop from "../drop/NextDrop";
import ProductRail from "../product/ProductRail";
import CategoryTiles from "../sections/CategoryTiles";
import SeenInTheWild from "../sections/SeenInTheWild";
import SectionHead from "../ui/SectionHead";

/**
 * Home com hierarquia comercial, na ordem que o catálogo atual sustenta (8 peças, 1 drop, 3 looks):
 * hero do drop → peças do drop → categorias → looks compráveis → manifesto → loadout → Core → próximo drop e lista.
 * "Mais vendidos" fica de fora até existir dado real de pedidos.
 */
export default function HomeView() {
  const drop = getDrop("001")!;
  const looks = allLooks();
  return (
    <>
      <HomeHero drop={drop} />
      <DropShowcase drop={drop} />
      <CategoryTiles />

      {looks.length > 0 && (
        <section aria-labelledby="looks-home" className="studio py-section">
          <div className="wrap">
            <SectionHead eyebrow={`Lookbook · Drop ${drop.number}`} title={<span id="looks-home">Monte o look</span>} text="Combinações que saíram do próprio drop. Monte com os seus tamanhos e leve de uma vez." href="/loadout" cta="Abrir o Loadout" />
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {looks.slice(0, 3).map((l, i) => (
                <LookCard key={`${l.drop.number}-${l.n}`} look={l} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* respiro editorial */}
      <section aria-label="Manifesto" className="wrap py-section">
        <p className="eyebrow text-muted" data-reveal>
          Manifesto · 001
        </p>
        <blockquote className="font-display mt-8 max-w-[14ch] text-d2" data-reveal>
          “{drop.quote}”
        </blockquote>
        <p className="mt-10 ml-auto max-w-[40ch] text-[1.125rem] text-muted lg:mr-[8%]" data-reveal>
          A cultura que te formou não cabe numa estampa de personagem. Cabe no corte, no peso do tecido e num detalhe que só quem viveu reconhece.
        </p>
      </section>

      <section aria-labelledby="lo-band" className="theme-dark grain relative overflow-hidden">
        <div className="wrap relative grid gap-8 py-16 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:py-24">
          <div data-reveal>
            <p className="eyebrow text-accent-fg">Build your loadout</p>
            <h2 id="lo-band" className="font-display mt-4 text-d2">
              Um slot para cada peça.
            </h2>
          </div>
          <div className="flex flex-col gap-5" data-reveal>
            <p className="text-[1.0625rem] text-muted">Parte de cima, de baixo, boné e acessório. Você escolhe tamanho e quantidade e vê o total antes de pôr na bag.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/loadout" className="btn btn-primary">
                Montar o meu
              </Link>
              <Link href="/shop/kits" className="btn btn-secondary">
                Ver kits
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="core-t" className="wrap py-section">
        <SectionHead eyebrow="Linha Core" title={<span id="core-t">Sempre no inventário.</span>} text="As básicas que voltam ao estoque. Mesmo tecido dos drops, sem tiragem." href="/shop/core" cta="Ver linha Core" />
        <div className="mt-12">
          <ProductRail products={coreProducts()} />
        </div>
      </section>

      <NextDrop />
      <SeenInTheWild />
    </>
  );
}
