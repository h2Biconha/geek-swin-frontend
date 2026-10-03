"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AnnouncementBar from "./AnnouncementBar";
import { countItems, useCart } from "@/lib/cart";

const NAV = [
  ["Loja", "/loja"],
  ["Drop Genesis", "/drops"],
  ["Lookbook", "/lookbook"],
  ["Kits", "/loja#kits"],
  ["Sobre", "/sobre"],
] as const;

/**
 * Topo fixo: barra de anúncio + menu acompanham o scroll juntos (sticky).
 * Depois de 40px rolados, o menu encolhe e ganha sombra. No celular vira um botão "Menu".
 */
export default function Header() {
  const pathname = usePathname();
  const items = useCart();
  const count = countItems(items);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  // fecha o menu do celular ao trocar de página (sem efeito: ajuste de estado durante o render)
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    const id = requestAnimationFrame(onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(id);
    };
  }, []);

  const isActive = (href: string) => href !== "/loja#kits" && pathname.startsWith(href.split("#")[0]);

  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <div className={`border-b border-line/15 bg-bg/90 backdrop-blur transition-shadow duration-500 ease-lux ${scrolled ? "shadow-[0_10px_30px_-18px_rgb(11_11_11/0.35)]" : ""}`}>
        <div className={`flex items-center justify-between gap-6 px-gutter transition-[padding] duration-500 ease-lux ${scrolled ? "py-2.5" : "py-4"}`}>
          <Link href="/" className="font-display text-lg font-extrabold tracking-[0.08em]">
            GEEK<span className="text-acid-ink">/</span>SWIN
          </Link>
          <nav aria-label="Principal" className="hidden gap-8 text-sm font-medium lg:flex">
            {NAV.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className="relative py-2 transition-colors hover:text-acid-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0.5 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-acid"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5 font-mono text-label uppercase tracking-[0.14em]">
            <Link href="/sobre#contato" className="hidden py-2 sm:inline">
              Ajuda
            </Link>
            <Link href="/carrinho" className="flex items-center gap-2 py-2" aria-label={`Bag, ${count} itens`}>
              Bag
              <span key={count} className="grid size-5 animate-[bump_.6s_cubic-bezier(.16,1,.3,1)] place-items-center rounded-full bg-invert text-micro tabular-nums text-on-invert">
                {count}
              </span>
            </Link>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" className="rounded-full border border-line/15 px-4 py-2 lg:hidden">
              {open ? "Fechar" : "Menu"}
            </button>
          </div>
        </div>
        <div id="mobile-nav" inert={!open} className={`grid transition-[grid-template-rows] duration-500 ease-lux lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <nav aria-label="Principal (celular)" className="overflow-hidden px-gutter">
            {NAV.map(([label, href]) => (
              <Link key={label} href={href} aria-current={isActive(href) ? "page" : undefined} className="block border-b border-line/15 py-4 font-display text-2xl font-bold last:mb-6">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
