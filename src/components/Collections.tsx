"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_LUX, gridStagger } from "@/lib/motion";

const COLLECTIONS = [
  { title: "Genesis Drop", sub: "Tiragem numerada", img: "/products/model-hoodie.svg", href: "/drops", accent: false },
  { title: "Oversized Core", sub: "Básico de alto padrão", img: "/products/model-tee.svg", href: "/loja#camisetas", accent: false },
  { title: "Kits Squad", sub: "Até 20% off", img: "/products/model-cap.svg", href: "/loja#kits", accent: true },
];

const tile = {
  hidden: { opacity: 0, y: 60 },
  show: { opacity: 1, y: 0, transition: { duration: 1.3, ease: EASE_LUX } },
};

export default function Collections() {
  return (
    <motion.div
      variants={gridStagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="grid gap-4 md:grid-cols-3"
    >
      {COLLECTIONS.map((c) => (
        <motion.div key={c.title} variants={tile} whileHover="hover" data-cursor="view" className="relative">
          <Link href={c.href} className="block">
          <div className="studio relative aspect-[4/5] overflow-hidden rounded-studio">
            <motion.div
              className="absolute inset-0"
              variants={{ hover: { scale: 1.05 } }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <Image src={c.img} alt="" fill unoptimized className="object-cover" />
            </motion.div>
          </div>
          <div
            className={`absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl px-5 py-4 ${
              c.accent ? "bg-acid text-on-acid" : "bg-invert text-on-invert"
            }`}
          >
            <span>
              <span className="block font-display text-xl font-bold">{c.title}</span>
              <span className="font-mono text-micro uppercase tracking-[0.2em] opacity-70">{c.sub}</span>
            </span>
            <span aria-hidden>→</span>
          </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
