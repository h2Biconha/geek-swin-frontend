import { reviewsFor, REVIEWS, type Review } from "@/lib/catalog";
import Icon from "../ui/Icon";

export function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="flex flex-col gap-4 border-t border-line pt-6">
      <div className="flex gap-0.5 text-accent-fg" aria-label={`${r.rating} de 5 estrelas`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Icon key={i} name="star" size={16} filled={i < r.rating} />
        ))}
      </div>
      <blockquote className="text-[1.0625rem]">“{r.text}”</blockquote>
      <figcaption className="eyebrow text-muted">
        {r.name}
        {r.size ? ` · veste ${r.size}` : ""} {r.verified && <span className="text-fg">· Compra verificada</span>}
      </figcaption>
    </figure>
  );
}

/**
 * Avaliações reais (compra verificada). Sem avaliação, a seção não aparece: nada de estrela vazia
 * nem promessa de convite para avaliar enquanto esse fluxo não existir (ver BACKEND.md > Avaliações).
 */
export default function Reviews({ product }: { product?: string }) {
  const list = product ? reviewsFor(product) : REVIEWS;
  if (!list.length) return null;
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return (
    <section aria-labelledby="reviews-t" className="wrap py-section">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div data-reveal>
          <p className="eyebrow text-muted">Avaliações</p>
          <h2 id="reviews-t" className="font-display mt-4 text-d3">
            {avg.toFixed(1).replace(".", ",")} / 5
          </h2>
          <p className="mt-4 max-w-[34ch] text-muted">
            {list.length} {list.length === 1 ? "avaliação" : "avaliações"} de quem recebeu a peça.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {list.slice(0, 6).map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
      </div>
    </section>
  );
}
