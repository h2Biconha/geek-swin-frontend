"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/catalog";
import Media from "../ui/Media";
import Icon from "../ui/Icon";
import Lightbox from "./Lightbox";

/**
 * Galeria editorial.
 * Celular: carrossel com deslize nativo (scroll-snap) e contador.
 * Desktop: imagens grandes empilhadas (a primeira inteira, as outras em pares) com a compra fixa ao lado.
 * Qualquer imagem abre o zoom em tela cheia.
 */
export default function ProductGallery({ product: p }: { product: Product }) {
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const media = p.media;

  return (
    <>
      {/* celular / tablet */}
      <div className="relative lg:hidden">
        <div
          ref={track}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          aria-label={`Imagens de ${p.name}`}
          role="region"
          tabIndex={0}
        >
          {media.map((m, i) => (
            <button key={m.src} type="button" onClick={() => setZoomAt(i)} className="studio relative aspect-[4/5] w-full shrink-0 snap-center" aria-label={`Ampliar ${m.view.toLowerCase()}`}>
              <Media media={m} alt={`${p.name}, ${m.view.toLowerCase()}`} priority={i === 0} className="absolute inset-0 size-full object-contain p-[7%]" />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-between px-4">
          <span className="eyebrow num bg-bg/80 px-2 py-1">
            {media[active]?.view} · {active + 1}/{media.length}
          </span>
          <div className="flex gap-1.5" aria-hidden>
            {media.map((m, i) => (
              <span key={m.src} className={`h-[3px] transition-all duration-300 ${i === active ? "w-6 bg-fg" : "w-3 bg-line-strong"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* desktop */}
      <div className="hidden grid-cols-2 gap-1 lg:grid">
        {media.map((m, i) => (
          <button
            key={m.src}
            type="button"
            onClick={() => setZoomAt(i)}
            data-cursor="zoom"
            className={`studio group relative overflow-hidden ${i === 0 || media.length === 2 ? "col-span-2 aspect-[5/5]" : "aspect-[4/5]"} cursor-zoom-in`}
            aria-label={`Ampliar ${m.view.toLowerCase()}`}
          >
            <Media media={m} alt={`${p.name}, ${m.view.toLowerCase()}`} priority={i === 0} className="absolute inset-0 size-full object-contain p-[7%] transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
            <span className="eyebrow absolute bottom-4 left-4 text-muted">{m.view}</span>
            <span className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100">
              <Icon name="zoom" />
            </span>
          </button>
        ))}
      </div>

      {zoomAt != null && <Lightbox media={media} start={zoomAt} name={p.name} onClose={() => setZoomAt(null)} />}
    </>
  );
}
