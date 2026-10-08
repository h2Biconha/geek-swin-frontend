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

/** Avaliações reais (compra verificada). Vazio = estado honesto, sem avaliação inventada. */
export default function Reviews({ product }: { product?: string }) {
  const list = product ? reviewsFor(product) : REVIEWS;
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
  return (
    <section aria-labelledby="reviews-t" className="wrap py-section">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div data-reveal>
          <p className="eyebrow text-muted">Reviews</p>
          <h2 id="reviews-t" className="font-display mt-4 text-d3">
            {list.length ? `${avg.toFixed(1)} / 5` : "Só compra verificada."}
          </h2>
          <p className="mt-4 max-w-[34ch] text-muted">
            {list.length ? `${list.length} avaliações de quem recebeu a peça.` : "As primeiras avaliações chegam depois das entregas do Drop 001. Aqui não entra review inventada."}
          </p>
        </div>
        {list.length ? (
          <div className="grid gap-8 md:grid-cols-2">
            {list.slice(0, 6).map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <div className="grid content-start gap-px border border-dashed border-line-strong p-6 sm:p-8" data-reveal>
            <div className="flex gap-0.5 text-line-strong" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Icon key={i} name="star" size={18} />
              ))}
            </div>
            <p className="mt-4 text-muted">Comprou? Depois da entrega você recebe um link para avaliar. Avaliação com foto ganha destaque.</p>
          </div>
        )}
      </div>
    </section>
  );
}
