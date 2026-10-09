import type { Inventory, Product } from "@/lib/catalog";

/**
 * Tiragem restante. Só aparece com número REAL do servidor (inventário) e para peça numerada.
 * Sem servidor (prévia) mostra apenas o tamanho da tiragem planejada, sem contador.
 */
export default function StockMeter({ product: p, inv, compact }: { product: Product; inv?: Inventory; compact?: boolean }) {
  if (p.edition == null) return null;
  const left = inv?.editionLeft;
  if (left == null)
    return compact ? null : (
      <p className="eyebrow text-muted">
        Tiragem numerada · <span className="num text-fg">{p.edition}</span> peças · sem reposição
      </p>
    );
  const pct = Math.max(0, Math.min(1, left / p.edition));
  return (
    <div className={compact ? "" : "w-full"}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow num">{left === 0 ? "Tiragem esgotada" : `${left} de ${p.edition} disponíveis`}</span>
        {!compact && <span className="eyebrow text-muted">sem reposição</span>}
      </div>
      <div className="mt-2 h-[2px] w-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={p.edition} aria-valuenow={left} aria-label={`${left} de ${p.edition} peças disponíveis`}>
        <div className="h-full origin-left bg-fg transition-transform duration-700 ease-out" style={{ transform: `scaleX(${pct})` }} />
      </div>
    </div>
  );
}
