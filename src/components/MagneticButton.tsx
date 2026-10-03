"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { EASE_LUX } from "@/lib/motion";

/**
 * Botão magnético real: mede a distância do mouse ao centro e puxa o botão
 * proporcionalmente (strength). O rótulo anda menos = profundidade.
 * No hover, o verde sobe por dentro e o texto vira preto (contraste garantido).
 */
// Link do Next com animação do Framer (navegação client-side + mola)
const motionLink = motion.create(Link);

export default function MagneticButton({
  href,
  children,
  strength = 0.35,
}: {
  href: string;
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const MotionLink = motionLink;
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 150, damping: 18, mass: 0.4 };
  const x = useSpring(mx, spring);
  const y = useSpring(my, spring);
  const lx = useTransform(x, (v) => v * 0.5);
  const ly = useTransform(y, (v) => v * 0.5);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <MotionLink
      ref={ref}
      href={href}
      data-cursor="link"
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y }}
      initial="rest"
      whileHover="hover"
      className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-invert px-8 py-5 text-on-invert transition-shadow duration-700 hover:shadow-[0_18px_50px_-18px_rgb(57_255_20/0.9)]"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-acid"
        variants={{ rest: { y: "101%" }, hover: { y: "0%" } }}
        transition={{ duration: 0.8, ease: EASE_LUX }}
      />
      <motion.span
        style={{ x: lx, y: ly }}
        className="relative font-mono text-label font-bold uppercase tracking-[0.18em] transition-colors duration-400 group-hover:text-on-acid"
      >
        {children} <span aria-hidden>→</span>
      </motion.span>
    </MotionLink>
  );
}
