"use client";

import Link from "next/link";
import { toasts } from "@/lib/ui";

/** Feedback rápido (wishlist, avisos). aria-live anuncia para leitor de tela. */
export default function Toaster() {
  const list = toasts.use();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
      {list.map((t) => (
        <div key={t.id} className="theme-dark pointer-events-auto flex w-full max-w-sm animate-[rise_.35s_var(--ease-out)] items-center justify-between gap-4 border border-line px-4 py-3 shadow-pop">
          <div className="min-w-0">
            <p className="eyebrow text-fg">{t.title}</p>
            {t.text && <p className="truncate text-small text-muted">{t.text}</p>}
          </div>
          {t.action && (
            <Link href={t.action.href} className="eyebrow shrink-0 text-accent-fg link-u">
              {t.action.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
