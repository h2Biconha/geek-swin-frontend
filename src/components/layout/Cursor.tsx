"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor de apoio, só em mouse/trackpad: um rótulo "Ver"/"Zoom" que segue o ponteiro
 * sobre imagens de produto. O cursor normal continua visível (nada de esconder o ponteiro).
 */
export default function Cursor() {
  const el = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      if (el.current) el.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = (e.target as HTMLElement).closest?.("[data-cursor]") as HTMLElement | null;
      setLabel(t ? (t.dataset.cursor === "zoom" ? "Zoom" : "Ver") : null);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => (window.removeEventListener("pointermove", move), cancelAnimationFrame(raf));
  }, []);
  return (
    <div ref={el} aria-hidden className="pointer-events-none fixed top-0 left-0 z-[120] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      <span className={`eyebrow -mt-7 ml-4 block bg-accent px-2.5 py-1.5 text-on-accent transition-[opacity,transform] duration-200 ${label ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>{label ?? "Ver"}</span>
    </div>
  );
}
