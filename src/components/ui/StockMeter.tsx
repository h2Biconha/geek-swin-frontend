import type { Product } from "@/lib/catalog";

/** Escassez real: só aparece quando o produto tem tiragem e estoque informados. */
export default function StockMeter({ product: p, compact }: { product: Product; compact?: boolean }) {
  if (p.edition == null || p.stockLeft == null) return null;
  const pct = Math.max(0, Math.min(1, p.stockLeft / p.edition));
  const low = p.stockLeft <= 20 || pct <= 0.15;
  return (
    <div className={compact ? "" : "w-full"}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`eyebrow num ${low ? "text-accent-fg" : ""}`}>
          {p.stockLeft === 0 ? "Esgotado" : `Restam ${p.stockLeft}`}
        </span>
        <span className="eyebrow num text-muted">
          {String(p.stockLeft).padStart(3, "0")} / {p.edition}
        </span>
      </div>
      <div className="mt-2 h-[2px] w-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={p.edition} aria-valuenow={p.stockLeft} aria-label={`${p.stockLeft} de ${p.edition} peças restantes`}>
        <div className="h-full origin-left bg-accent transition-transform duration-700 ease-out" style={{ transform: `scaleX(${pct})` }} />
      </div>
    </div>
  );
}
