"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { discount, img, type Product } from "@/lib/products";
import { EASE_LUX } from "@/lib/motion";

/** Galeria: peça, no modelo e detalhe (a própria peça ampliada até chegar a foto de detalhe real). */
export default function ProductGallery({ product: p }: { product: Product }) {
  const views = [
    { id: "produto", label: "Peça", src: p.image, detail: false },
    { id: "modelo", label: "No modelo", src: p.modelImage, detail: false },
    { id: "detalhe", label: "Detalhe", src: p.image, detail: true },
  ];
  const [active, setActive] = useState(views[0].id);
  const view = views.find((v) => v.id === active)!;
  const off = discount(p);

  return (
    <div>
      <motion.div whileHover="hover" data-cursor="view" className="studio relative aspect-[4/5] overflow-hidden rounded-[28px]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={view.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_LUX }}
          >
            <motion.div
              className="absolute inset-0"
              style={view.detail ? { scale: 2.1, x: "4%", y: "8%" } : undefined}
              variants={{ hover: view.detail ? { scale: 2.2 } : { scale: 1.05, x: "-1%", y: "-1.2%" } }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <Image src={img(view.src)} alt={`${p.name}, ${view.label.toLowerCase()}`} fill priority unoptimized sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
        {(off || p.badge) && (
          <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 font-mono text-micro font-bold uppercase tracking-[0.12em] ${off ? "bg-acid text-on-acid" : "bg-invert text-on-invert"}`}>
            {off ? `-${off}%` : p.badge}
          </span>
        )}
      </motion.div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:w-2/3">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v.id)}
            aria-pressed={active === v.id}
            aria-label={`Ver ${v.label.toLowerCase()}`}
            className="studio relative aspect-[4/5] overflow-hidden rounded-2xl outline outline-1 outline-offset-[3px] outline-transparent transition-[outline-color] aria-pressed:outline-ink"
          >
            <Image src={img(v.src)} alt="" fill unoptimized className={`object-cover ${v.detail ? "translate-x-[4%] translate-y-[8%] scale-[2.1]" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
