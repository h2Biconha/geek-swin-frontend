"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { categoryHref, getDrop, PHASE_LABEL, SITE, dropTitle } from "@/lib/catalog";
import { navCategories, preparingCategories } from "@/lib/merch/listings";
import { useDropPhase } from "@/lib/time";
import { closeOverlay, overlay } from "@/lib/ui";
import Countdown from "../ui/Countdown";
import Drawer from "../ui/Drawer";
import { isActive, NAV } from "./nav";

const drop = getDrop("001")!;

export default function MobileMenu() {
  const open = overlay.use() === "menu";
  const path = usePathname();
  const phase = useDropPhase(drop);
  const [shop, setShop] = useState(true);
  const big = "font-display flex w-full animate-[rise_.45s_var(--ease-out)_both] items-baseline justify-between border-b border-line py-4 text-[2.75rem] leading-none aria-[current=page]:text-accent-fg";
  return (
    <Drawer open={open} onClose={closeOverlay} title="Menu" side="left">
      <nav aria-label="Menu do celular" className="px-5 pt-4">
        {NAV.map((n, i) =>
          "mega" in n ? (
            <div key={n.href}>
              <button type="button" onClick={() => setShop((v) => !v)} aria-expanded={shop} aria-controls="m-loja" className={big} style={{ animationDelay: `${60 + i * 50}ms` }}>
                {n.label}
                <span aria-hidden className={`eyebrow text-muted transition-transform ${shop ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {shop && (
                <ul id="m-loja" className="grid grid-cols-2 gap-x-4 border-b border-line py-3">
                  {[{ slug: "", name: "Ver tudo" }, ...navCategories(), { slug: "core", name: "Linha Core" }].map((c) => {
                    const href = c.slug ? categoryHref(c.slug) : "/shop";
                    return (
                      <li key={href}>
                        <Link href={href} onClick={closeOverlay} aria-current={path === href ? "page" : undefined} className="flex min-h-11 items-center text-[1.0625rem] aria-[current=page]:text-accent-fg">
                          {c.name}
                        </Link>
                      </li>
                    );
                  })}
                  {preparingCategories().map((c) => (
                    <li key={c.slug}>
                      <Link href={categoryHref(c.slug)} onClick={closeOverlay} className="flex min-h-11 items-center gap-2 text-[1.0625rem] text-muted">
                        {c.name} <span className="eyebrow">em breve</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <Link key={n.href} href={n.href} onClick={closeOverlay} aria-current={isActive(path, n.href) ? "page" : undefined} className={big} style={{ animationDelay: `${60 + i * 50}ms` }}>
              {n.label}
              <span className="eyebrow text-muted">0{i + 1}</span>
            </Link>
          ),
        )}
      </nav>
      <div className="grid grid-cols-2 gap-px px-5 pt-6">
        {[
          ["Minha conta", "/account"],
          ["Favoritos", "/wishlist"],
          ["Sobre", "/about"],
          ["Ajuda", "/help"],
          ["Arquivo", "/drops#arquivo"],
        ].map(([l, h]) => (
          <Link key={h} href={h} onClick={closeOverlay} className="eyebrow flex min-h-12 items-center text-fg">
            {l}
          </Link>
        ))}
      </div>
      <Link href={`/drops/${drop.slug}`} onClick={closeOverlay} className="theme-dark mx-5 mt-6 mb-6 block p-5">
        <span className="eyebrow text-accent-fg">{PHASE_LABEL[phase]}</span>
        <span className="font-display mt-2 block text-d4">
          Drop {drop.number} · {dropTitle(drop)}
        </span>
        {drop.opensAtUTC && (phase === "presale" || phase === "upcoming") && (
          <div className="mt-4">
            <Countdown target={Date.parse(drop.opensAtUTC)} size="md" />
          </div>
        )}
      </Link>
      {SITE.preview && <p className="px-5 pb-6 text-small text-muted">{SITE.previewNote}</p>}
    </Drawer>
  );
}
