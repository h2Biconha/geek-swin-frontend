import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BuyBox from "@/components/BuyBox";
import ProductGallery from "@/components/ProductGallery";
import ProductGrid from "@/components/ProductGrid";
import { Breadcrumb, SectionHead } from "@/components/ui";
import { brl, categoryName, DROP, getProduct, installment, pix, PRODUCTS, related, SIZE_TABLES } from "@/lib/products";

// Uma página estática por peça do catálogo, gerada no build. Slug desconhecido = 404.
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.name}: ${p.specs}. ${brl(p.price)} ou 6x de ${installment(p.price)} sem juros.`,
    openGraph: { images: [`/products/${p.modelImage}`] },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const table = SIZE_TABLES[p.sizeTable];
  const kicker = p.edition ? `Drop ${DROP.number} · ${DROP.name} · Nº ${p.number} / ${p.edition}` : `Linha permanente · Nº ${p.number}`;

  return (
    <>
      <section className="px-gutter pb-16 pt-8 md:pt-12">
        <Breadcrumb trail={[["Início", "/"], ["Loja", "/loja"], [categoryName(p.category), `/loja#${p.category}`], [p.name]]} />
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ProductGallery product={p} />
          </div>

          <div className="lg:col-span-5">
            <div className="flex flex-col gap-7 lg:sticky lg:top-32">
              <div>
                <p className="font-mono text-micro uppercase tracking-[0.16em] text-muted">{kicker}</p>
                <h1 className="mt-3 font-display text-[clamp(2rem,3.6vw,3.2rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">{p.name}</h1>
                <p className="mt-2 font-mono text-micro uppercase tracking-[0.14em] text-muted">{p.specs}</p>
              </div>

              <div className="tabular-nums">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display text-3xl font-extrabold">{brl(p.price)}</span>
                  {p.compareAt && <span className="font-mono text-sm text-muted line-through">{brl(p.compareAt)}</span>}
                </div>
                <p className="mt-1 text-sm text-muted">
                  ou 6x de {installment(p.price)} sem juros · <strong className="font-medium text-ink">{pix(p.price)} no Pix</strong>
                </p>
              </div>

              {p.edition && p.stockLeft !== undefined ? (
                <div>
                  <div className="flex justify-between font-mono text-micro uppercase tracking-[0.14em] tabular-nums">
                    <span className="text-acid-ink">
                      Restam {p.stockLeft} de {p.edition}
                    </span>
                    <span className="text-muted">Sem reposição</span>
                  </div>
                  <div className="mt-2 h-[3px] overflow-hidden bg-line/15">
                    <i className="block h-full bg-acid" style={{ width: `${(p.stockLeft / p.edition) * 100}%` }} />
                  </div>
                </div>
              ) : (
                <p className="font-mono text-micro uppercase tracking-[0.14em] text-muted">Linha permanente · volta ao estoque sempre</p>
              )}

              <BuyBox product={p} priceLabel={brl(p.price)} />

              <ul className="grid gap-2 text-sm text-muted">
                <li>✦ Frete grátis acima de R$ 349</li>
                <li>✦ Troca grátis em 30 dias</li>
                <li>✦ {p.edition ? "Peça numerada com certificado e QR" : "Envio em até 2 dias úteis"}</li>
              </ul>

              <div className="[&_details]:border-t [&_details]:border-line/15 [&_summary]:flex [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:items-center [&_summary]:justify-between [&_summary]:py-4 [&_summary]:font-mono [&_summary]:text-label [&_summary]:font-bold [&_summary]:uppercase [&_summary]:tracking-[0.14em] [&_summary::-webkit-details-marker]:hidden">
                <Acc title="Descrição" open>
                  {p.description}
                </Acc>
                <Acc title="Tecido e tecnologia">
                  <ul className="grid gap-1.5">
                    {p.fabric.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </Acc>
                <Acc title="Tabela de medidas" id="medidas">
                  <p className="mb-3 text-xs">{table.label}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse font-mono text-small tabular-nums [&_td]:border-b [&_td]:border-line/15 [&_td]:px-2 [&_td]:py-2.5 [&_th]:border-b [&_th]:border-line/15 [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-micro [&_th]:uppercase [&_th]:tracking-[0.1em] [&_th]:text-ink">
                      <thead>
                        <tr>
                          {table.columns.map((c) => (
                            <th key={c}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((r) => (
                          <tr key={String(r[0])}>
                            {r.map((c, i) => (
                              <td key={i}>{c}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Acc>
                <Acc title="Cuidados">Lave do avesso em água fria, com cores parecidas. Não use alvejante. Seque à sombra e passe em temperatura baixa, sem passar sobre a estampa.</Acc>
                <Acc title="Envio e trocas" last>
                  Envio em até 2 dias úteis após a confirmação. Frete grátis acima de R$ 349. A primeira troca é por nossa conta em até 30 dias, com a etiqueta e o lacre de numeração intactos.
                </Acc>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-gutter pb-20 md:pb-28">
        <SectionHead title="Complete o look" sub="Peças que foram feitas para andar juntas." />
        <ProductGrid products={related(p)} />
      </section>
    </>
  );
}

function Acc({ title, children, open, id, last }: { title: string; children: React.ReactNode; open?: boolean; id?: string; last?: boolean }) {
  return (
    <details id={id} open={open} className={`group ${last ? "border-b border-line/15" : ""}`}>
      <summary>
        {title}
        <span aria-hidden className="text-lg transition-transform duration-500 ease-lux group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-5 leading-relaxed text-muted">{children}</div>
    </details>
  );
}
