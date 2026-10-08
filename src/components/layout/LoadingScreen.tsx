"use client";

import { useEffect } from "react";
import { BRAND } from "@/lib/brand";

/**
 * Loading da marca: "GS_" com cursor piscando, só na primeira visita da sessão e por no máximo 0,7 s.
 * Quem liga é o script inline no <head> (classe gs-boot), então não pisca em navegações seguintes.
 */
export const BOOT_SCRIPT = `try{var d=document.documentElement;d.classList.add('js');if(!sessionStorage.getItem('gs-boot')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('gs-boot');sessionStorage.setItem('gs-boot','1')}}catch(e){}`;

export default function LoadingScreen() {
  useEffect(() => {
    const d = document.documentElement;
    if (!d.classList.contains("gs-boot")) return;
    const t = setTimeout(() => d.classList.add("gs-booted"), 650);
    const t2 = setTimeout(() => d.classList.remove("gs-boot", "gs-booted"), 1150);
    return () => (clearTimeout(t), clearTimeout(t2));
  }, []);
  return (
    <div className="gs-loader theme-dark" aria-hidden>
      <span className="font-display text-[clamp(3rem,10vw,6rem)] leading-none">
        {BRAND.short}
        <span className="animate-blink text-accent-fg">_</span>
      </span>
      <span className="gs-loader-bar" />
    </div>
  );
}
