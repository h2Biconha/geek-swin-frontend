"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import MagneticButton from "./MagneticButton";
import { EASE_LUX } from "@/lib/motion";
import { EDITION_TOTAL } from "@/lib/products";

const line = {
  hidden: { y: "105%" },
  show: (i: number) => ({ y: "0%", transition: { duration: 1.5, ease: EASE_LUX, delay: 0.12 * i } }),
};
const fade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 1.6, ease: EASE_LUX, delay: 0.45 } },
};

export default function Hero() {
  return (
    <motion.section
      initial="hidden"
      animate="show"
      className="grid items-center gap-10 px-gutter pb-16 pt-10 md:pt-14 lg:grid-cols-12 lg:gap-6 lg:pb-24"
    >
      <div className="lg:col-span-7">
        <motion.div
          variants={fade}
          className="mb-7 inline-flex items-center gap-3 rounded-full bg-acid px-3.5 py-1.5 font-mono text-hud font-bold uppercase text-on-acid"
        >
          <i className="size-1.5 animate-pulse rounded-full bg-on-acid" /> Drop 001 · abre 10/10 às 20h
        </motion.div>

        <h1 className="font-display text-hero font-extrabold">
          <span className="block overflow-hidden pb-[0.05em]">
            <motion.span custom={0} variants={line} className="inline-block">
              Drop
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.05em]">
            <motion.span custom={1} variants={line} className="inline-block">
              Genesis<span className="text-acid-ink">.</span>
            </motion.span>
          </span>
        </h1>

        <motion.p variants={fade} className="mt-8 max-w-[40ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-relaxed text-muted">
          Streetwear de corte premium para quem vive o jogo. Tecido pesado, gola que não abre, preto que não desbota.{" "}
          <strong className="font-medium text-ink">{EDITION_TOTAL} peças numeradas. Sem reposição.</strong>
        </motion.p>

        <motion.div variants={fade} className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
          <MagneticButton href="/loja">Comprar o drop</MagneticButton>
          <Link href="/lookbook" className="font-mono text-label font-medium uppercase tracking-[0.16em] underline underline-offset-[6px] hover:text-acid-ink">
            Ver lookbook
          </Link>
        </motion.div>
      </div>

      <motion.div variants={fade} className="relative lg:col-span-5">
        <Link href="/produto/obsidian-shell-hoodie" data-cursor="view" className="studio relative block aspect-[4/5] overflow-hidden rounded-[28px]">
          <Image src="/products/model-hoodie.svg" alt="Modelo vestindo o Obsidian Shell Hoodie" fill priority unoptimized className="object-cover" />
          <span className="absolute left-5 top-5 font-mono text-micro uppercase tracking-[0.2em] text-muted">Nº 001 / 150</span>
          <span className="absolute bottom-5 left-5 rounded-full bg-surface px-3 py-1.5 font-mono text-micro uppercase tracking-[0.14em]">
            Veste: Obsidian Shell Hoodie · G
          </span>
        </Link>
        <motion.div
          aria-hidden
          className="absolute -top-6 right-2 grid size-24 place-items-center rounded-full bg-acid font-display text-xl font-extrabold text-on-acid sm:-right-6 sm:size-32"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          001
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
