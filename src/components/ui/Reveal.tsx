"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Um único IntersectionObserver para o site todo: qualquer elemento com data-reveal entra suave
 * quando aparece na tela. Use style={{"--i": n}} para escalonar.
 */
export default function Reveal() {
  const path = usePathname();
  useEffect(() => {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("is-in"), io.unobserve(e.target))),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    const scan = () => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => (io.disconnect(), mo.disconnect());
  }, [path]);
  return null;
}
