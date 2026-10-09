import { coreProducts, getDrop } from "@/lib/catalog";
import DropShowcase from "../drop/DropShowcase";
import HomeHero from "../drop/HomeHero";
import NextDrop from "../drop/NextDrop";
import WhyDrops from "../drop/WhyDrops";
import ProductRail from "../product/ProductRail";
import SeenInTheWild from "../sections/SeenInTheWild";
import SectionHead from "../ui/SectionHead";

export default function HomeView() {
  const drop = getDrop("001")!;
  return (
    <>
      <HomeHero drop={drop} />
      <DropShowcase drop={drop} />

      {/* respiro editorial */}
      <section aria-label="Manifesto" className="wrap border-t border-line py-section">
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

      <WhyDrops />

      <section aria-labelledby="core-t" className="wrap py-section">
        <SectionHead eyebrow="Linha Core" title={<span id="core-t">Sempre no inventário.</span>} text="As básicas que voltam ao estoque. Mesmo tecido dos drops, sem tiragem." href="/shop?drop=core" cta="Ver linha Core" />
        <div className="mt-12">
          <ProductRail products={coreProducts()} />
        </div>
      </section>

      <NextDrop />
      <SeenInTheWild />
    </>
  );
}
