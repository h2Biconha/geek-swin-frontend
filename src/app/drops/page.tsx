import type { Metadata } from "next";
import Countdown from "@/components/Countdown";
import ProductGrid from "@/components/ProductGrid";
import SignupForm from "@/components/SignupForm";
import { BigTitle, Breadcrumb, SectionHead } from "@/components/ui";
import { DROP_ITEMS } from "@/lib/products";

export const metadata: Metadata = { title: "Drops", description: "Calendário de drops da GEEK SWIN e contagem regressiva do Drop 001 Genesis." };

const NEXT = [
  { when: "Ao vivo em breve", name: "001 · Genesis", text: "10 de outubro, 20h. Moletons, camisetas, cargo e acessórios.", style: "bg-invert text-on-invert", tag: "text-acid" },
  { when: "Dezembro de 2026", name: "002 · Respawn", text: "Jaquetas e peças de inverno. Detalhes saem na lista primeiro.", style: "border border-line/15", tag: "text-muted" },
  { when: "2027", name: "003 · ▒▒▒▒▒", label: "003, nome ainda em segredo", text: "Uma colab que ainda não podemos contar.", style: "border border-dashed border-line/30", tag: "text-muted" },
];

export default function DropsPage() {
  const left = DROP_ITEMS.reduce((s, p) => s + (p.stockLeft ?? 0), 0);
  const total = DROP_ITEMS.reduce((s, p) => s + (p.edition ?? 0), 0);
  return (
    <>
      <section className="px-gutter pb-16 pt-12 md:pt-16">
        <Breadcrumb trail={[["Início", "/"], ["Drops"]]} />
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-acid px-3.5 py-1.5 font-mono text-hud font-bold uppercase text-on-acid">
              <i className="size-1.5 animate-pulse rounded-full bg-on-acid" />
              Drop 001 · abre 10/10 às 20h
            </span>
            <BigTitle lines={["Drop 001", "Genesis"]} />
          </div>
          <div className="lg:col-span-5">
            <Countdown />
          </div>
        </div>
        <div className="mt-12 grid gap-4 rounded-[28px] border border-line/15 p-6 sm:grid-cols-3 md:p-10">
          {[
            ["Peças", `${DROP_ITEMS.length} modelos`],
            ["Tiragem numerada", `${left} de ${total}`],
            ["Reposição", "Nenhuma"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="font-mono text-hud uppercase text-muted">{k}</p>
              <p className="mt-2 font-display text-3xl font-extrabold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-gutter pb-20">
        <SectionHead title="Peças do drop" sub="Cada uma sai numerada. Quando o contador zera, acabou." />
        <ProductGrid products={DROP_ITEMS} />
      </section>

      <section className="px-gutter pb-20 md:pb-28">
        <SectionHead title="Próximos drops" sub="O calendário até o fim do ano. Quem está na lista entra uma hora antes." />
        <ol className="grid gap-4 md:grid-cols-3">
          {NEXT.map((d) => (
            <li key={d.name} className={`rounded-[22px] p-8 ${d.style}`}>
              <p className={`font-mono text-hud uppercase ${d.tag}`}>{d.when}</p>
              <p className="mt-6 font-display text-3xl font-extrabold uppercase" aria-label={"label" in d ? d.label : undefined}>{d.name}</p>
              <p className="mt-2 opacity-70">{d.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-8 rounded-[28px] bg-acid p-8 text-on-acid md:grid-cols-2 md:items-center md:p-14">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">Entre na lista dos drops</h2>
          <SignupForm id="drops-email" source="pagina-drops" tone="acid" cta="Quero acesso" />
        </div>
      </section>
    </>
  );
}
