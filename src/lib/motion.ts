import type { Transition, Variants } from "framer-motion";

/** Curva de luxo: arranca rápido e pousa muito devagar (expo-out). */
export const EASE_LUX = [0.16, 1, 0.3, 1] as const;

/** Mola do cursor: stiffness baixa = segue com "peso". Ajuste aqui. */
export const CURSOR_SPRING: Transition = { type: "spring", stiffness: 260, damping: 28, mass: 0.6 };

/** Container do grid: dispara os cards um depois do outro. */
export const gridStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.22, delayChildren: 0.1 } },
};

/** Card: entra subindo e, dentro dele, cada camada também tem stagger. */
export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 80 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.4, ease: EASE_LUX, staggerChildren: 0.12, delayChildren: 0.25 },
  },
};

/** A foto "abre" de baixo para cima, como uma cortina. */
export const mediaReveal: Variants = {
  hidden: { clipPath: "inset(100% 0% 0% 0%)" },
  show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.6, ease: EASE_LUX } },
};

/** Linhas de texto do card. */
export const lineReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_LUX } },
};
