"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { CURSOR_SPRING, EASE_LUX } from "@/lib/motion";

/**
 * Cursor fluorescente.
 * - Ponto na cor do texto (preto no claro, branco no escuro) que segue o mouse com mola.
 * - Sobre [data-cursor="view"] vira um disco acid com "VER" (preto em cima do verde = legível).
 * - Sobre [data-cursor="link"] vira um anel.
 * - Só existe com mouse de verdade (pointer: fine).
 */
type Mode = "default" | "view" | "link";
const SIZE: Record<Mode, number> = { default: 10, view: 84, link: 44 };

export default function LuxuryCursor() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("default");

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, reduce ? { duration: 0 } : CURSOR_SPRING);
  const sy = useSpring(y, reduce ? { duration: 0 } : CURSOR_SPRING);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-lux-cursor");

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    // Delegação: um listener só, funciona para elementos que entram na tela depois.
    const over = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      setMode((target?.dataset.cursor as Mode) ?? "default");
    };
    const leave = () => setVisible(false);

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-lux-cursor");
    };
  }, [x, y]);

  const size = SIZE[mode];

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full ${
        mode === "view" ? "bg-acid" : mode === "link" ? "border border-ink bg-transparent" : "bg-ink"
      }`}
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      animate={{ width: size, height: size, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.7, ease: EASE_LUX }}
    >
      <motion.span
        className="font-mono text-micro font-bold tracking-[0.2em] text-on-acid"
        animate={{ opacity: mode === "view" ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        VER
      </motion.span>
    </motion.div>
  );
}
