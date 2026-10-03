"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { brl, getProduct, img } from "@/lib/products";
import { EASE_LUX } from "@/lib/motion";

/** Confirmação "Adicionado à bag". Escuta o evento que lib/cart.ts dispara em cart.add(). */
export default function AddedToast() {
  const [last, setLast] = useState<{ slug: string; size: string; t: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onAdd = (e: Event) => {
      const d = (e as CustomEvent<{ slug: string; size: string }>).detail;
      setLast({ ...d, t: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setLast(null), 4200);
    };
    window.addEventListener("gs:added", onAdd);
    return () => {
      window.removeEventListener("gs:added", onAdd);
      clearTimeout(timer);
    };
  }, []);

  const p = last ? getProduct(last.slug) : null;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-[80] w-[min(24rem,calc(100%-2rem))]">
      <AnimatePresence>
        {p && last && (
          <motion.div
            key={last.t}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_LUX }}
            className="flex items-center gap-4 rounded-3xl bg-invert p-3 pr-5 text-on-invert shadow-2xl"
          >
            <div className="studio relative size-16 shrink-0 overflow-hidden rounded-2xl">
              <Image src={img(p.image)} alt="" fill unoptimized className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-micro uppercase tracking-[0.16em] text-acid">Adicionado à bag ✓</p>
              <p className="truncate font-display font-bold">{p.name}</p>
              <p className="text-xs tabular-nums opacity-70">
                Tamanho {last.size} · {brl(p.price)}
              </p>
            </div>
            <Link href="/carrinho" className="rounded-full bg-acid px-4 py-2.5 font-mono text-micro font-bold uppercase tracking-[0.16em] text-on-acid">
              Ver bag
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
