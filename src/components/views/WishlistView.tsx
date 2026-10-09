"use client";

import { useHydrated } from "@/lib/store";
import { getProduct } from "@/lib/catalog";
import { useInventoryMap } from "@/lib/inventory";
import { suggestFor } from "@/lib/merch/recommend";
import { useNow } from "@/lib/time";
import { useWishlist } from "@/lib/wishlist";
import ProductGrid from "../product/ProductGrid";
import ProductRail from "../product/ProductRail";
import EmptyState from "../ui/EmptyState";

export default function WishlistView() {
  const slugs = useWishlist();
  const ready = useHydrated();
  const items = slugs.map((s) => getProduct(s)!).filter(Boolean);
  const stock = useInventoryMap() ?? undefined;
  const now = useNow(60_000);
  const picks = ready && items.length ? suggestFor(slugs, now, stock, 4).map((x) => x.product) : [];
  return (
    <div className="wrap pt-10 pb-section lg:pt-14">
      <div className="border-b border-line pb-8">
        <p className="eyebrow num text-muted">{ready ? `${items.length} salvos` : "…"}</p>
        <h1 className="font-display mt-3 text-d2">Favoritos</h1>
        <p className="mt-4 max-w-[48ch] text-muted">Fica salva neste navegador. Esgotou? O card mostra, e você pode pedir aviso na página da peça.</p>
      </div>
      <div className="mt-10">
        {!ready ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton aspect-[4/5]" />
            ))}
          </div>
        ) : items.length ? (
          <ProductGrid products={items} />
        ) : (
          <EmptyState level={2} code="♡ 0" title="Nada salvo ainda" text="Toque no coração de uma peça para guardar aqui." cta="Explorar a loja" href="/shop" />
        )}
      </div>
      {picks.length > 0 && (
        <section className="mt-section" aria-labelledby="fav-combina">
          <h2 id="fav-combina" className="eyebrow text-muted">
            Combina com seus favoritos
          </h2>
          <div className="mt-6">
            <ProductRail products={picks} />
          </div>
        </section>
      )}
    </div>
  );
}
