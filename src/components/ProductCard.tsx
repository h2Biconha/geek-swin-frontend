"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { brl, discount, DROP, img, installment, type Product } from "@/lib/products";
import { isPresaleItem, OPENS_LABEL, usePresaleOpen } from "@/lib/presale";
import { cardReveal, EASE_LUX, lineReveal, mediaReveal } from "@/lib/motion";

/**
 * Card de produto.
 * Entrada: herda "hidden/show" do <ProductGrid> (stagger entre cards) e faz o próprio stagger interno.
 * Hover:   troca a peça pelo modelo, zoom lento (scale 1.05 em 1.5s) e "Ver tamanhos" sobe.
 */
export default function ProductCard({ product: p, priority = false, animateIn = false }: { product: Product; priority?: boolean; animateIn?: boolean }) {
  const off = discount(p);
  const presale = usePresaleOpen();
  const badge = off ? `-${off}%` : p.badge;
  const stockPct = p.edition && p.stockLeft !== undefined ? (p.stockLeft / p.edition) * 100 : null;

  return (
    <motion.article
      variants={cardReveal}
      // dentro de um <ProductGrid> o pai controla a entrada; sozinho, o card entra quando aparece na tela
      {...(animateIn ? { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.15 } } : {})}
      whileHover="hover"
      data-cursor="view"
    >
      <Link href={`/produto/${p.slug}`} className="block" aria-label={`${p.name}, ${brl(p.price)}`}>
        <motion.div variants={mediaReveal} className="studio relative aspect-[4/5] overflow-hidden rounded-studio">
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1, x: "0%", y: "0%" }}
            variants={{ hover: { scale: 1.05, x: "-1%", y: "-1.2%", transition: { duration: 1.5, ease: "easeOut" } } }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Image src={img(p.image)} alt={p.name} fill priority={priority} unoptimized sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            <motion.div className="absolute inset-0" initial={{ opacity: 0 }} variants={{ hover: { opacity: 1 } }} transition={{ duration: 0.9, ease: EASE_LUX }}>
              <Image src={img(p.modelImage)} alt="" fill unoptimized sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </motion.div>
          </motion.div>

          {badge && (
            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-micro font-bold uppercase tracking-[0.12em] ${off ? "bg-acid text-on-acid" : "bg-invert text-on-invert"}`}>
              {badge}
            </span>
          )}
          <span className="absolute right-4 top-4 font-mono text-micro uppercase tracking-[0.2em] text-muted">Nº {p.number}</span>
          <motion.span
            className="absolute inset-x-3 bottom-3 rounded-full bg-invert py-3 text-center font-mono text-micro font-bold uppercase tracking-[0.16em] text-on-invert"
            initial={{ y: "calc(100% + 1rem)" }}
            variants={{ hover: { y: 0 } }}
            transition={{ duration: 0.8, ease: EASE_LUX }}
          >
            Ver tamanhos →
          </motion.span>
        </motion.div>

        <motion.h3 variants={lineReveal} className="mt-4 font-display text-[clamp(0.98rem,1.3vw,1.15rem)] font-bold leading-tight">
          {p.name}
        </motion.h3>
        <motion.p variants={lineReveal} className="mt-1 font-mono text-micro uppercase tracking-[0.12em] text-muted">
          {p.specs}
        </motion.p>
        <motion.div variants={lineReveal} className="mt-3">
          <div className="flex flex-wrap items-baseline gap-x-2.5 tabular-nums">
            <span className="font-display text-lg font-bold">{brl(p.price)}</span>
            {p.compareAt && <span className="font-mono text-label text-muted line-through">{brl(p.compareAt)}</span>}
          </div>
          <p className="text-small tabular-nums text-muted">ou 6x de {installment(p.price)} sem juros</p>
        </motion.div>
        <motion.div variants={lineReveal} className="mt-4">
          {stockPct !== null ? (
            <>
              <div className="h-[3px] overflow-hidden bg-line/15">
                <motion.i
                  className="block h-full origin-left bg-acid"
                  style={{ width: `${stockPct}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.8, ease: EASE_LUX, delay: 0.4 }}
                />
              </div>
              <span className="mt-2 block font-mono text-micro uppercase tracking-[0.14em] tabular-nums text-acid-ink">
                Restam {p.stockLeft} de {p.edition}
              </span>
              {isPresaleItem(p, presale) && (
                <span className="mt-1 block font-mono text-micro uppercase tracking-[0.14em] text-muted">Pré-venda · abre {OPENS_LABEL}</span>
              )}
            </>
          ) : (
            <>
              <span className="block font-mono text-micro uppercase tracking-[0.14em] text-muted">{p.drop ? `Drop ${DROP.number} · ${DROP.name}` : "Linha permanente"}</span>
              {isPresaleItem(p, presale) && (
                <span className="mt-1 block font-mono text-micro uppercase tracking-[0.14em] text-muted">Pré-venda · abre {OPENS_LABEL}</span>
              )}
            </>
          )}
        </motion.div>
      </Link>
    </motion.article>
  );
}
