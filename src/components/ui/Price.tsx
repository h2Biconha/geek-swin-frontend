import { brl, discountPct, installment, pixPrice, type Product } from "@/lib/catalog";

export default function Price({ product: p, size = "md", showInstallments }: { product: Product; size?: "md" | "lg"; showInstallments?: boolean }) {
  const off = discountPct(p);
  return (
    <div className="num">
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <span className={`${size === "lg" ? "text-2xl font-semibold" : "text-base font-semibold"} text-accent-fg`}>
          <span className="sr-only">Preço: </span>
          {brl(p.price)}
        </span>
        {p.compareAt && (
          <>
            <s className="text-small text-muted">
              <span className="sr-only">De </span>
              {brl(p.compareAt)}
            </s>
            <span className="eyebrow text-accent-fg">−{off}%</span>
          </>
        )}
      </div>
      {showInstallments && (
        <p className="mt-1 text-small text-muted">
          ou 6x de {installment(p.price)} sem juros · {brl(pixPrice(p.price))} no Pix
        </p>
      )}
    </div>
  );
}
