"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * Smooth scroll global.
 * Obs.: @studio-freight/react-lenis foi DEPRECIADO e renomeado para `lenis`.
 * O componente agora vem de "lenis/react" (mesma API: <ReactLenis root />).
 *
 * lerp: 0.08 = scroll "pesado" e cinematográfico. 0.1 é o padrão; 0.05 fica lento demais.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.08, wheelMultiplier: 0.9, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
