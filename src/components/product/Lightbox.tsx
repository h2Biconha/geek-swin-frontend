"use client";

import { useEffect, useRef, useState } from "react";
import { asset, type Media } from "@/lib/catalog";
import Icon from "../ui/Icon";

/** Zoom em tela cheia: setas/teclado navegam, clique amplia 2,2x e a imagem segue o ponteiro. */
export default function Lightbox({ media, start, name, onClose }: { media: Media[]; start: number; name: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const go = (d: number) => (setZoom(false), setI((x) => (x + d + media.length) % media.length));

  useEffect(() => {
    ref.current?.showModal();
    const k = (e: KeyboardEvent) => (e.key === "ArrowRight" ? go(1) : e.key === "ArrowLeft" ? go(-1) : null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const m = media[i];
  return (
    <dialog ref={ref} onClose={onClose} aria-label={`Imagens de ${name}`} className="gs-modal theme-dark m-0 h-dvh w-screen">
      <div className="studio relative flex h-full w-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <p className="eyebrow num text-muted">
            {m.view} · {i + 1}/{media.length}
          </p>
          <button type="button" onClick={() => ref.current?.close()} className="grid size-11 place-items-center" aria-label="Fechar zoom">
            <Icon name="close" />
          </button>
        </div>
        <button
          type="button"
          aria-label={zoom ? "Diminuir zoom" : "Ampliar"}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            setZoom((z) => !z);
          }}
          onPointerMove={(e) => {
            if (!zoom || e.pointerType !== "mouse") return;
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          }}
          className={`relative min-h-0 flex-1 overflow-hidden ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        >
          <img src={asset(m.src)} alt={`${name}, ${m.view.toLowerCase()}`} className="mx-auto h-full w-full object-contain p-4 transition-transform duration-500 ease-out" style={{ transform: zoom ? "scale(2.2)" : "none", transformOrigin: origin }} draggable={false} />
        </button>
        <div className="flex items-center justify-center gap-2 px-4 py-4">
          <button type="button" onClick={() => go(-1)} className="grid size-11 place-items-center border border-line" aria-label="Imagem anterior">
            <Icon name="arrow-left" size={18} />
          </button>
          {media.map((x, j) => (
            <button key={x.src} type="button" onClick={() => (setZoom(false), setI(j))} aria-label={`Ver ${x.view}`} aria-current={j === i} className={`h-14 w-11 border ${j === i ? "border-fg" : "border-line opacity-60"}`}>
              <img src={asset(x.src)} alt="" className="size-full object-contain p-1" />
            </button>
          ))}
          <button type="button" onClick={() => go(1)} className="grid size-11 place-items-center border border-line" aria-label="Próxima imagem">
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </dialog>
  );
}
