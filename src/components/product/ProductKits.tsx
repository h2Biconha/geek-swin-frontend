"use client";

import { bundlesWith } from "@/lib/commerce/bundles";
import { useNow } from "@/lib/time";
import BundleCard from "../commerce/BundleCard";

/** kits em que a peça entra (só kits ligados, no prazo e com todas as peças publicadas) */
export default function ProductKits({ slug }: { slug: string }) {
  const now = useNow(60_000);
  const kits = bundlesWith(slug, now).slice(0, 2);
  if (!kits.length) return null;
  return (
    <section aria-labelledby="kits-p" className="wrap pt-section">
      <p className="eyebrow text-muted">Leve junto</p>
      <h2 id="kits-p" className="font-display mt-4 text-d3">
        Kits com esta peça
      </h2>
      <div className={`mt-10 grid gap-5 ${kits.length > 1 ? "md:grid-cols-2" : "md:max-w-xl"}`}>
        {kits.map((b) => (
          <BundleCard key={b.slug} bundle={b} highlight={slug} />
        ))}
      </div>
    </section>
  );
}
