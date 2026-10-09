import Link from "next/link";
import { asset, categoryHref, type Product } from "@/lib/catalog";
import { bundleLive, BUNDLES } from "@/lib/commerce/bundles";
import { listingProducts, navCategories, type ListingDef } from "@/lib/merch/listings";
import { allLooks } from "@/lib/merch/looks";
import { suggestFor } from "@/lib/merch/recommend";
import { BUILD_TIME } from "@/lib/clock";
import BundleCard from "../commerce/BundleCard";
import LookCard from "../commerce/LookCard";
import ListingGrid from "../listing/ListingGrid";
import ProductRail from "../product/ProductRail";
import SignupForm from "../sections/SignupForm";
import Breadcrumbs from "../ui/Breadcrumbs";

/**
 * Página de listagem (/shop/<slug>). Mesmo design system, personalidade por categoria (catalog.json > categories[].spotlight):
 * looks (camisetas, moletons), silhuetas (calças), detalhes (bonés), tipos (acessórios), kits, ficha técnica (periféricos).
 * Categoria sem peça: estado vazio honesto, com aviso de interesse (fonte "categoria-<slug>").
 */
export default function CategoryView({ listing: l }: { listing: ListingDef }) {
  const products = listingProducts(l);
  const c = l.category;
  const empty = products.length === 0;
  const looks = allLooks().filter((x) => x.products.some((s) => products.some((p) => p.slug === s)));
  // "combina com": peças de outros papéis que formam look com as desta página (relações reais do catálogo)
  const pairs = empty || c?.role === "pack" ? [] : suggestFor(products.map((p) => p.slug), BUILD_TIME, undefined, 4).map((s) => s.product).filter((p) => !products.includes(p));
  const kits = BUNDLES.filter((b) => bundleLive(b, BUILD_TIME));
  const others = navCategories().filter((x) => x.slug !== l.slug);

  return (
    <>
      <section aria-labelledby="cat-title" className="wrap pt-6 lg:pt-8">
        <Breadcrumbs items={[["Início", "/"], ["Loja", "/shop"], [l.name]]} />
        <div className="mt-8 grid gap-10 pb-12 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:pb-16">
          <div>
            <p className="eyebrow num text-muted">
              {l.kind === "category" ? "Categoria" : l.kind === "new" ? "Novidades" : l.kind === "sale" ? "Sale" : "Coleção"} · {empty ? "em preparação" : `${String(products.length).padStart(2, "0")} ${products.length === 1 ? "peça" : "peças"}`}
            </p>
            <h1 id="cat-title" className="font-display mt-4 text-d1">
              {l.name}
            </h1>
            <p className="font-display mt-6 text-d4 text-accent-fg">{l.headline}</p>
            <p className="mt-6 max-w-[52ch] text-[1.0625rem] text-muted">{l.intro}</p>
          </div>
          {l.art && (
            <div className="studio relative hidden aspect-[5/4] overflow-hidden lg:block" aria-hidden>
              <img src={asset(l.art)} alt="" className="absolute inset-0 size-full object-contain p-[10%]" />
              <span className="font-display num absolute -right-2 -bottom-6 text-[9rem] leading-none text-fg/[0.06]">{String(products.length).padStart(2, "0")}</span>
            </div>
          )}
        </div>
        {c && c.highlights.length > 0 && !empty && (
          <ul className="grid gap-6 border-t border-line py-8 sm:grid-cols-3">
            {c.highlights.map(([t, d], i) => (
              <li key={t}>
                <p className="eyebrow num text-muted">0{i + 1}</p>
                <p className="mt-2 font-medium">{t}</p>
                <p className="mt-1 text-small text-muted">{d}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {empty ? (
        <Empty listing={l} others={others} />
      ) : (
        <>
          {c?.spotlight === "silhouettes" && <Silhouettes products={products} />}
          {c?.spotlight === "details" && <Details products={products} />}
          <section className="wrap pb-section" aria-label={`Peças · ${l.name}`}>
            <ListingGrid products={products} facets={c?.facets ?? ["tamanho", "colecao", "preco", "disp"]} listName={l.slug} />
          </section>
          {c?.spotlight === "bundles" && kits.length > 0 && (
            <section aria-labelledby="kits-t" className="wrap pb-section">
              <h2 id="kits-t" className="font-display text-d3">
                Monte o seu kit
              </h2>
              <p className="mt-4 max-w-[52ch] text-muted">Escolha a peça e o tamanho de cada espaço. Desconto de kit só aparece quando existe de verdade.</p>
              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {kits.map((b) => (
                  <BundleCard key={b.slug} bundle={b} />
                ))}
              </div>
            </section>
          )}
          {(c?.spotlight === "looks" || c?.spotlight === "details") && looks.length > 0 && (
            <section aria-labelledby="looks-t" className="studio py-section">
              <div className="wrap">
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="eyebrow text-muted">Monte com</p>
                    <h2 id="looks-t" className="font-display mt-4 text-d3">
                      Looks com {l.name.toLowerCase()}
                    </h2>
                  </div>
                  <Link href="/loadout" className="btn btn-ghost">
                    <span>Montar o meu loadout</span>
                  </Link>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                  {looks.slice(0, 3).map((x, i) => (
                    <LookCard key={`${x.drop.number}-${x.n}`} look={x} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}
          {pairs.length > 0 && (
            <section aria-labelledby="pairs-t" className="wrap py-section">
              <p className="eyebrow text-muted">Para completar</p>
              <h2 id="pairs-t" className="font-display mt-4 text-d3">
                Combina com
              </h2>
              <div className="mt-10">
                <ProductRail products={pairs} />
              </div>
            </section>
          )}
        </>
      )}

      {others.length > 0 && (
        <nav aria-label="Outras categorias" className="wrap border-t border-line py-12">
          <p className="eyebrow text-muted">Continue explorando</p>
          <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={categoryHref(o.slug)} className="font-display link-u text-[1.75rem] leading-none">
                  {o.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop/core" className="font-display link-u text-[1.75rem] leading-none">
                Linha Core
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}

/** calças: a silhueta lado a lado, com o caimento descrito pela própria ficha */
function Silhouettes({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="sil-t" className="wrap pb-section">
      <h2 id="sil-t" className="eyebrow text-muted">
        Silhuetas
      </h2>
      <div className={`mt-5 grid gap-5 ${products.length > 1 ? "md:grid-cols-2" : ""}`}>
        {products.map((p) => (
          <Link key={p.slug} href={`/product/${p.slug}`} className="group grid grid-cols-[minmax(0,0.9fr)_1fr] items-center gap-5 border border-line p-4">
            <span className="studio block aspect-[3/4]">
              <img src={asset(p.media[0].src)} alt="" loading="lazy" className="size-full object-contain p-[8%] transition-transform duration-700 group-hover:scale-[1.03]" />
            </span>
            <span>
              <span className="eyebrow text-muted">{p.attrs.modelo ?? p.attrs.modelagem ?? "Silhueta"}</span>
              <span className="font-display mt-2 block text-[1.75rem] leading-none">{p.name}</span>
              <span className="mt-3 block text-small text-muted">{p.fit}</span>
              <span className="eyebrow mt-4 inline-block text-fg">Ver a peça →</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** bonés: o detalhe de perto (fotos de detalhe do catálogo) */
function Details({ products }: { products: Product[] }) {
  const shots = products.flatMap((p) => p.media.filter((m) => m.view !== p.media[0].view).map((m) => ({ p, m }))).slice(0, 3);
  if (!shots.length) return null;
  return (
    <section aria-labelledby="det-t" className="wrap pb-section">
      <h2 id="det-t" className="eyebrow text-muted">
        De perto
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        {shots.map(({ p, m }, i) => (
          <figure key={`${p.slug}-${m.src}`} className={`studio ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}>
            <img src={asset(m.src)} alt={`${p.name}, ${m.view.toLowerCase()}`} loading="lazy" className="aspect-square w-full object-contain p-[10%]" />
            <figcaption className="eyebrow px-4 pb-4 text-muted">
              {p.name} · {m.view}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Empty({ listing: l, others }: { listing: ListingDef; others: { slug: string; name: string }[] }) {
  const c = l.category;
  return (
    <section aria-labelledby="empty-t" className="wrap pb-section">
      <div className="grid gap-10 border border-dashed border-line-strong p-6 md:p-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <span className="font-display num text-d2 text-muted">000</span>
          <h2 id="empty-t" className="font-display mt-4 text-d4">
            Nenhuma peça publicada ainda
          </h2>
          <p className="mt-4 max-w-[46ch] text-muted">
            {c?.spotlight === "specs"
              ? "Quando abrir, cada item vai ter fabricante, garantia, compatibilidade e ficha técnica na página. Deixe seu e-mail se quiser saber quando a primeira peça entrar."
              : `Ainda não tem ${l.name.toLowerCase()} na loja. Não vamos mostrar peça que não existe: deixe seu e-mail e avisamos quando a primeira entrar.`}
          </p>
          {others.length > 0 && (
            <p className="mt-6 text-small text-muted">
              Enquanto isso:{" "}
              {others.slice(0, 3).map((o, i) => (
                <span key={o.slug}>
                  <Link href={categoryHref(o.slug)} className="link-u text-fg">
                    {o.name}
                  </Link>
                  {i < Math.min(others.length, 3) - 1 ? " · " : ""}
                </span>
              ))}
            </p>
          )}
        </div>
        <SignupForm source={`categoria-${l.slug}`} cta="Me avise" done={`Pronto. Você recebe um e-mail quando ${l.name.toLowerCase()} chegarem.`} />
      </div>
    </section>
  );
}
