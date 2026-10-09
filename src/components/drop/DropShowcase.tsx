"use client";

import Link from "next/link";
import { dropProducts, dropTitle, editionLeft, editionTotal, PHASE_LABEL, type Drop } from "@/lib/catalog";
import { useInventoryMap } from "@/lib/inventory";
import { useDropPhase } from "@/lib/time";
import EditorialGrid from "../product/EditorialGrid";

/** Bloco 01 da home: o drop atual em grid editorial (peça principal grande + as outras). */
export default function DropShowcase({ drop }: { drop: Drop }) {
  const phase = useDropPhase(drop);
  const items = dropProducts(drop);
  const total = editionTotal(drop);
  const left = editionLeft(drop, useInventoryMap());
  return (
    <section aria-labelledby="drop-now" className="wrap py-section">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div data-reveal>
          <p className="eyebrow flex items-center gap-3 text-muted">
            Drop atual <span className="badge">{PHASE_LABEL[phase]}</span>
          </p>
          <h2 id="drop-now" className="font-display mt-5 text-d2">
            Drop {drop.number}
            <span className="block text-accent-fg">{dropTitle(drop)}</span>
          </h2>
          <p className="mt-6 max-w-[48ch] text-[1.0625rem] text-muted">{drop.concept}</p>
        </div>
        <div className="flex flex-col gap-4 lg:items-end" data-reveal>
          {total > 0 && (
            <>
              <p className="num font-display text-[2.5rem] leading-none">
                {left != null ? (
                  <>
                    {left}
                    <span className="text-muted">/{total}</span>
                  </>
                ) : (
                  total
                )}
              </p>
              <p className="eyebrow text-muted">{left != null ? "Peças numeradas disponíveis" : "Peças numeradas · sem reposição"}</p>
            </>
          )}
          <Link href={`/drops/${drop.slug}`} className="btn btn-ghost">
            <span>Ver o drop completo</span>
          </Link>
        </div>
      </div>
      <div className="mt-12">
        <EditorialGrid products={items} />
      </div>
    </section>
  );
}
