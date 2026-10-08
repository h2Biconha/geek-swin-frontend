"use client";

import Link from "next/link";
import { asset, dateLabel, DROPS, dropProducts, dropTitle, editionTotal, PHASE_LABEL, type Drop } from "@/lib/catalog";
import { useDropPhase } from "@/lib/time";

function Row({ drop, i }: { drop: Drop; i: number }) {
  const phase = useDropPhase(drop);
  const items = dropProducts(drop);
  const total = editionTotal(drop);
  const soon = phase === "coming-soon";
  return (
    <li data-reveal style={{ "--i": i } as React.CSSProperties}>
      <Link href={`/drops/${drop.slug}`} className="group grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 border-b border-line py-8 md:grid-cols-[10rem_1fr_auto_auto] md:gap-x-10 md:py-10">
        <span className={`font-display num row-span-2 text-[clamp(4rem,10vw,8rem)] leading-[0.8] md:row-span-1 ${soon ? "text-muted" : ""}`}>{drop.number}</span>
        <div>
          <p className={`eyebrow ${phase === "presale" || phase === "live" ? "text-accent-fg" : "text-muted"}`}>Status: {PHASE_LABEL[phase]}</p>
          <h2 className="font-display mt-2 text-d3 transition-colors group-hover:text-accent-fg">{dropTitle(drop)}</h2>
          <p className="mt-2 max-w-[48ch] text-small text-muted">{soon ? drop.concept : drop.tagline}</p>
        </div>
        <div className="col-start-2 flex items-center gap-2 md:col-start-auto">
          {items.slice(0, 3).map((p) => (
            <div key={p.slug} className="studio size-16 overflow-hidden md:size-20">
              <img src={asset(p.media[0].src)} alt="" className="size-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            </div>
          ))}
          {soon && <div className="grid size-16 place-items-center border border-dashed border-line-strong text-muted md:size-20">?</div>}
        </div>
        <div className="col-start-2 flex items-center gap-6 md:col-start-auto md:flex-col md:items-end md:gap-1">
          <span className="eyebrow num text-muted">{drop.opensAtUTC ? dateLabel(drop.opensAtUTC) + "/" + drop.opensAtUTC.slice(0, 4) : "Data: ????"}</span>
          {total > 0 && <span className="eyebrow num text-muted">{total} peças</span>}
          <span className="eyebrow inline-flex items-center gap-2 text-fg">
            <span className="link-u">{soon ? "Entrar na lista" : "Ver drop"}</span> →
          </span>
        </div>
      </Link>
    </li>
  );
}

export default function DropTimeline() {
  return (
    <ol className="border-t border-line" reversed>
      {[...DROPS].reverse().map((d, i) => (
        <Row key={d.slug} drop={d} i={i} />
      ))}
    </ol>
  );
}
