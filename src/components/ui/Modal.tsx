"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";

/**
 * Modal com <dialog> nativo: Esc fecha, foco preso dentro e devolvido ao botão que abriu.
 * variant="sheet" vira folha de baixo no celular.
 */
export default function Modal({ open, onClose, title, children, wide, variant = "center" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean; variant?: "center" | "sheet" }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const sheet = variant === "sheet";
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={`gs-modal ${sheet ? "mt-auto mb-0 w-full sm:m-auto sm:w-[min(40rem,calc(100%-2rem))]" : "m-auto"}`}
      style={!sheet ? { width: `min(${wide ? "56rem" : "36rem"}, calc(100% - 2rem))` } : undefined}
    >
      <div className={`panel max-h-[88dvh] overflow-y-auto bg-bg text-fg ${sheet ? "pb-[env(safe-area-inset-bottom)]" : ""}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-bg px-5 py-4 sm:px-7">
          <h2 className="eyebrow text-fg">{title}</h2>
          <button type="button" onClick={onClose} className="-mr-2 grid size-11 place-items-center" aria-label="Fechar">
            <Icon name="close" />
          </button>
        </div>
        <div className="px-5 py-6 sm:px-7 sm:py-8">{children}</div>
      </div>
    </dialog>
  );
}
