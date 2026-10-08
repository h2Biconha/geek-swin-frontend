"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";

/**
 * Gaveta lateral (carrinho, menu, filtros). Fecha com Esc, clique fora ou botão.
 * Trava o scroll do fundo e prende o foco dentro enquanto aberta.
 */
export default function Drawer({ open, onClose, title, side = "right", children, footer, labelledBy }: { open: boolean; onClose: () => void; title: React.ReactNode; side?: "right" | "left"; children: React.ReactNode; footer?: React.ReactNode; labelledBy?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const html = document.documentElement;
    const sw = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    html.style.paddingRight = `${sw}px`;
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>("[data-autofocus], button, a, input")?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      const [first, last] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      html.style.overflow = "";
      html.style.paddingRight = "";
      window.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : typeof title === "string" ? title : undefined}
        className={`fixed inset-y-0 z-90 flex w-full max-w-[28rem] flex-col bg-bg text-fg shadow-drawer ${side === "right" ? "right-0 animate-[slide-in-right_.4s_var(--ease-out)]" : "left-0 animate-[slide-in-left_.4s_var(--ease-out)]"}`}
      >
        <div className="flex h-header shrink-0 items-center justify-between border-b border-line px-5">
          <div id={labelledBy} className="eyebrow text-fg">
            {title}
          </div>
          <button type="button" onClick={onClose} className="-mr-2 grid size-11 place-items-center" aria-label="Fechar">
            <Icon name="close" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </>
  );
}
