"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { countItems, useCart } from "@/lib/cart";
import { getDrop } from "@/lib/catalog";
import { useDropPhase } from "@/lib/time";
import { openOverlay, overlay } from "@/lib/ui";
import { useWishlist } from "@/lib/wishlist";
import { BRAND } from "@/lib/brand";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";
import { isActive, isOverlayPage, NAV } from "./nav";

const drop = getDrop("001")!;

/**
 * Header minimalista.
 * - Sobre hero escuro: transparente. Ao rolar: fundo sólido.
 * - Rolando para baixo some; para cima volta (mais tela para o produto).
 * - Celular: logo, busca, bag e menu.
 */
export default function Header() {
  const path = usePathname();
  const count = countItems(useCart());
  const wish = useWishlist().length;
  const open = overlay.use();
  const phase = useDropPhase(drop);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      setHidden(y > 480 && y > last + 4 ? true : y < last - 4 ? false : (h) => h);
      last = y;
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [path]);

  const overlayMode = isOverlayPage(path) && !scrolled;
  const liveDot = phase === "presale" || phase === "live";

  return (
    <header
      className={`sticky top-0 z-50 transition-[transform,background-color,color,border-color] duration-400 ease-out ${hidden && !open ? "-translate-y-full" : ""} ${
        overlayMode ? "theme-dark border-b border-transparent !bg-transparent" : "border-b border-line bg-bg/92 backdrop-blur-md"
      }`}
    >
      <div className="wrap grid h-header grid-cols-[1fr_auto_1fr] items-center gap-4">
        <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(path, n.href) ? "page" : undefined}
              className="eyebrow relative inline-flex min-h-11 items-center gap-1.5 text-label text-fg after:absolute after:inset-x-0 after:bottom-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-accent-fg after:transition-transform after:duration-300 hover:after:scale-x-100 aria-[current=page]:after:scale-x-100"
            >
              {n.label}
              {n.href === "/drops" && liveDot && <span aria-label="drop aberto" className="size-1.5 bg-accent" />}
            </Link>
          ))}
        </nav>

        <Link href="/" aria-label={`${BRAND.name}, página inicial`} className="col-start-1 justify-self-start lg:col-start-2 lg:justify-self-center">
          <Logo />
        </Link>

        <div className="col-start-3 flex items-center justify-end gap-0.5 sm:gap-1.5">
          <button type="button" onClick={() => openOverlay("search")} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2" aria-label="Buscar (atalho /)">
            <Icon name="search" />
            <span className="eyebrow hidden text-label xl:inline">Buscar</span>
          </button>
          <Link href="/account" className="hidden min-h-11 min-w-11 items-center justify-center lg:inline-flex" aria-label="Minha conta">
            <Icon name="user" />
          </Link>
          <Link href="/wishlist" className="relative hidden min-h-11 min-w-11 items-center justify-center sm:inline-flex" aria-label={`Wishlist, ${wish} ${wish === 1 ? "item" : "itens"}`}>
            <Icon name="heart" filled={wish > 0} />
            {wish > 0 && <span className="num absolute top-1.5 right-0.5 font-mono text-[0.6875rem] leading-none">{wish}</span>}
          </Link>
          <button type="button" onClick={() => openOverlay("cart")} className="relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2" aria-label={`Bag, ${count} ${count === 1 ? "item" : "itens"}`}>
            <Icon name="bag" />
            <span key={count} className={`num grid h-5 min-w-5 animate-[bump_.5s_var(--ease-out)] place-items-center px-1 font-mono text-[0.6875rem] leading-none font-bold ${count ? "bg-accent text-on-accent" : "border border-line-strong"}`}>
              {count}
            </span>
          </button>
          <button type="button" onClick={() => openOverlay("menu")} className="inline-flex min-h-11 min-w-11 items-center justify-center lg:hidden" aria-label="Abrir menu" aria-expanded={open === "menu"}>
            <Icon name="menu" />
          </button>
        </div>
      </div>
    </header>
  );
}
