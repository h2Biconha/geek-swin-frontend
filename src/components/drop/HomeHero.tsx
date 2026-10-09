"use client";

import Link from "next/link";
import { useRef } from "react";
import { BRAND } from "@/lib/brand";
import { asset, dateLabel, dropProducts, dropTitle, editionTotal, PHASE_LABEL, SPECS_CONFIRMED, timeLabel, type Drop } from "@/lib/catalog";
import { useDropPhase } from "@/lib/time";
import Media from "../ui/Media";

/**
 * Hero editorial. Sem foto ainda: tipografia gigante + desenho técnico com anotações de ficha técnica.
 * Com drop.heroMedia (foto ou vídeo) preenchido, a mídia ocupa o fundo e o desenho sai.
 */
export default function HomeHero({ drop }: { drop: Drop }) {
  const phase = useDropPhase(drop);
  const ref = useRef<HTMLElement>(null);
  const total = editionTotal(drop);
  const [l1, ...rest] = dropTitle(drop).split(" ");
  const lead = dropProducts(drop).find((p) => p.edition);
  // ficha técnica só aparece no hero quando confirmada com a produção (catalog.json > site.specsConfirmed)
  const notes: [string, string][] = [
    ...(SPECS_CONFIRMED ? ([["top-[12%] left-[84%]", "Capuz forrado duplo"], ["bottom-[36%] right-[90%]", "520 g/m²"]] as [string, string][]) : []),
    ...(lead ? ([["bottom-[18%] right-[86%]", `N° ___/${lead.edition}`]] as [string, string][]) : []),
  ];

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        ref.current.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
        ref.current.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
      }}
      className="theme-dark grain relative -mt-header flex min-h-[max(40rem,100svh)] flex-col overflow-hidden pt-header"
    >
      {drop.heroMedia && (
        <div className="absolute inset-0">
          <Media media={drop.heroMedia} alt="" priority className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/50" />
        </div>
      )}

      {!drop.heroMedia && drop.heroArt && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-header bottom-0 z-0 flex items-center justify-center opacity-40 sm:opacity-60 xl:z-[2] xl:opacity-100">
          <div
            className="relative aspect-[4/5] h-[min(62svh,38rem)]"
            style={{ transform: "translate(calc(var(--px,0) * 18px), calc(var(--py,0) * 14px))", transition: "transform .6s var(--ease-out)" }}
          >
            <img src={asset(drop.heroArt)} alt="" className="size-full animate-[float_7s_ease-in-out_infinite] object-contain" />
            {/* anotações de ficha técnica */}
            {notes.map(([pos, t], i) => (
              <span key={t} className={`eyebrow absolute hidden items-center gap-2 whitespace-nowrap text-muted xl:flex ${pos} animate-[fade-in_.8s_var(--ease-out)_both]`} style={{ animationDelay: `${0.8 + i * 0.15}s` }}>
                {pos.startsWith("top") && <span className="h-px w-10 bg-line-strong" />}
                {t}
                {!pos.startsWith("top") && <span className="h-px w-10 bg-line-strong" />}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="wrap relative flex flex-1 flex-col pt-6 pb-8 lg:pt-10 lg:pb-12">
        <div className="flex animate-[fade-in_.8s_var(--ease-out)_both] flex-wrap items-center justify-between gap-3">
          <p className="eyebrow text-muted">
            {BRAND.name} · Drop {drop.number}
          </p>
          <p className="eyebrow flex items-center gap-2 text-fg">
            <span className="size-1.5 animate-blink bg-accent" aria-hidden />
            {PHASE_LABEL[phase]}
            {drop.opensAtUTC && (phase === "presale" || phase === "upcoming") && <span className="text-muted">· abre {dateLabel(drop.opensAtUTC)} {timeLabel(drop.opensAtUTC)}</span>}
          </p>
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-10">
          <h1 id="hero-title" className="font-display relative z-[1] text-d1">
            <span className="sr-only">Drop {drop.number}: </span>
            <span className="block overflow-hidden">
              <span className="block animate-[rise_1s_var(--ease-out)_.1s_both]">{l1}</span>
            </span>
            <span className="block overflow-hidden text-right lg:pr-[4vw]">
              <span className="block animate-[rise_1s_var(--ease-out)_.22s_both]">
                {rest.join(" ")}
                <span className="animate-blink text-accent-fg" aria-hidden>
                  _
                </span>
              </span>
            </span>
          </h1>

        </div>

        <div className="relative z-[3] grid animate-[rise_.9s_var(--ease-out)_.45s_both] gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-display text-d4">
              {drop.tagline.split(". ").map((s, i, a) => (
                <span key={i} className="block">
                  {s}
                  {i < a.length - 1 ? "." : ""}
                </span>
              ))}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/drops/${drop.slug}`} className="btn btn-primary btn-lg">
                Explorar drop
              </Link>
              <Link href="/about" className="btn btn-secondary btn-lg">
                Conhecer a marca
              </Link>
            </div>
          </div>
          <dl className="num grid grid-cols-2 gap-x-8 gap-y-1 border-t border-line pt-4 lg:min-w-[20rem]">
            <dt className="eyebrow text-muted">Tiragem</dt>
            <dt className="eyebrow text-muted">Reposição</dt>
            <dd className="font-display text-[2rem] leading-none">{total} peças</dd>
            <dd className="font-display text-[2rem] leading-none">Zero</dd>
          </dl>
        </div>
      </div>
    </section>
  );
}
