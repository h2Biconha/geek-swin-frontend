"use client";

import Link from "next/link";
import { asset, dateLabel, dropProducts, dropTitle, editionLeft, editionTotal, getProduct, PHASE_LABEL, shipsLabel, timeLabel, type Drop } from "@/lib/catalog";
import { useDropPhase } from "@/lib/time";
import NextDrop from "../drop/NextDrop";
import EditorialGrid from "../product/EditorialGrid";
import Breadcrumbs from "../ui/Breadcrumbs";
import Countdown from "../ui/Countdown";
import Media from "../ui/Media";

/** Landing de cada drop: hero cinematográfico, manifesto, números, peças, história, looks e CTA. */
export default function DropView({ drop }: { drop: Drop }) {
  const phase = useDropPhase(drop);
  const items = dropProducts(drop);
  const total = editionTotal(drop);
  const left = editionLeft(drop);
  const soon = phase === "coming-soon";

  return (
    <>
      <section aria-labelledby="drop-title" className="theme-dark grain relative -mt-header flex min-h-[max(38rem,92svh)] flex-col overflow-hidden pt-header">
        {drop.heroMedia && (
          <div className="absolute inset-0">
            <Media media={drop.heroMedia} alt="" priority className="size-full object-cover opacity-70" />
          </div>
        )}
        <span aria-hidden className="font-display num pointer-events-none absolute -right-[4vw] -bottom-[6vw] text-[clamp(14rem,46vw,46rem)] leading-[0.75] text-fg/[0.06]">
          {drop.number}
        </span>
        <div className="wrap relative flex flex-1 flex-col pt-6 pb-10">
          <Breadcrumbs items={[["Drops", "/drops"], [`Drop ${drop.number}`]]} />
          <div className="my-auto grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow flex items-center gap-2 text-accent-fg animate-[fade-in_.6s_both]">
                <span className="size-1.5 animate-blink bg-accent" aria-hidden /> Drop {drop.number} · {PHASE_LABEL[phase]}
              </p>
              <h1 id="drop-title" className="font-display mt-5 animate-[rise_.9s_var(--ease-out)_both] text-d1">
                {dropTitle(drop)}
              </h1>
              <p className="font-display mt-8 animate-[rise_.9s_var(--ease-out)_.15s_both] text-d4">“{drop.quote}”</p>
            </div>
            {drop.heroArt && !drop.heroMedia && <img src={asset(drop.heroArt)} alt="" className="mx-auto w-[min(70vw,24rem)] animate-[fade-in_1.2s_.3s_both] lg:w-full lg:max-w-[26rem]" />}
          </div>
          <div className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Abertura", drop.opensAtUTC ? `${dateLabel(drop.opensAtUTC)} · ${timeLabel(drop.opensAtUTC)}` : "????"],
              ["Produzidas", total ? `${total} peças` : "????"],
              ["Restantes", total ? `${left}/${total}` : "????"],
              ["Envio", drop.shipsFrom ? `a partir de ${shipsLabel(drop.shipsFrom)}` : "????"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="eyebrow text-muted">{k}</p>
                <p className="font-display num mt-1 text-[1.75rem] leading-none">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {soon ? (
        <NextDrop fixed={drop.number} />
      ) : (
        <>
          <section aria-label="Manifesto" className="wrap grid gap-12 py-section lg:grid-cols-[1fr_1.4fr]">
            <div data-reveal>
              <p className="eyebrow text-muted">Manifesto</p>
              <p className="font-display mt-6 text-d3">{drop.tagline}</p>
              {drop.opensAtUTC && (phase === "presale" || phase === "upcoming") && (
                <div className="mt-10">
                  <p className="eyebrow mb-4 text-muted">Abre em</p>
                  <Countdown target={Date.parse(drop.opensAtUTC)} size="md" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-6 text-[1.1875rem] leading-relaxed">
              {drop.manifesto.map((m, i) => (
                <p key={i} data-reveal style={{ "--i": i } as React.CSSProperties} className={i === 0 ? "text-fg" : "text-muted"}>
                  {m}
                </p>
              ))}
            </div>
          </section>

          <section aria-labelledby="units-t" className="theme-dark py-section">
            <div className="wrap">
              <h2 id="units-t" className="font-display text-d1" data-reveal>
                <span className="num">{total}</span>
                <span className="block text-d3 text-muted">peças produzidas. Nenhuma a mais.</span>
              </h2>
            </div>
          </section>

          <section aria-labelledby="pieces-t" className="wrap py-section">
            <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
              <h2 id="pieces-t" className="font-display text-d2">
                As peças
              </h2>
              <p className="eyebrow text-muted">{items.length} peças · {PHASE_LABEL[phase]}</p>
            </div>
            <div className="mt-12">
              <EditorialGrid products={items} />
            </div>
          </section>

          {drop.story.length > 0 && (
            <section aria-labelledby="hist-t" className="studio py-section">
              <div className="wrap">
                <h2 id="hist-t" className="font-display text-d2" data-reveal>
                  História
                </h2>
                <ol className="mt-12 grid gap-10 md:grid-cols-3">
                  {drop.story.map((s, i) => (
                    <li key={s.title} className="border-t border-line-strong pt-6" data-reveal style={{ "--i": i } as React.CSSProperties}>
                      <span className="eyebrow num text-muted">Capítulo 0{i + 1}</span>
                      <h3 className="font-display mt-3 text-[2rem] leading-none">{s.title}</h3>
                      <p className="mt-4 text-muted">{s.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {drop.looks.length > 0 && (
            <section aria-labelledby="looks-t" className="wrap py-section">
              <h2 id="looks-t" className="font-display text-d2" data-reveal>
                Looks
              </h2>
              <div className="mt-12 grid gap-1 md:grid-cols-3">
                {drop.looks.map((l, i) => (
                  <article key={l.n} className="flex flex-col" data-reveal style={{ "--i": i } as React.CSSProperties}>
                    <div className="studio relative grid aspect-[4/5] grid-cols-2 place-items-center gap-2 overflow-hidden p-6">
                      {l.products.slice(0, 2).map((s, j) => {
                        const p = getProduct(s)!;
                        return <img key={s} src={asset(p.media[0].src)} alt="" className={`w-full object-contain ${j === 1 ? "translate-y-[12%]" : "-translate-y-[6%]"}`} loading="lazy" />;
                      })}
                      <span className="eyebrow absolute top-4 left-4 text-muted">Look {l.n}</span>
                    </div>
                    <div className="py-5">
                      <h3 className="font-display text-[2rem] leading-none">{l.name}</h3>
                      <p className="mt-2 text-muted">{l.text}</p>
                      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                        {l.products.map((s) => (
                          <li key={s}>
                            <Link href={`/product/${s}`} className="eyebrow link-u text-fg">
                              {getProduct(s)!.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {drop.video && (
            <section aria-label="Filme do drop" className="wrap pb-section">
              <Media media={drop.video} alt={`Filme do Drop ${drop.number}`} className="aspect-video w-full object-cover" />
            </section>
          )}

          <NextDrop />
        </>
      )}
    </>
  );
}
