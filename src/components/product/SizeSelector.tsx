"use client";

/**
 * Seletor de tamanho: disponível, selecionado e esgotado (riscado + texto "esgotado", não só cor).
 * O esgotado continua clicável para abrir o "avise-me".
 * Teclado (padrão WAI-ARIA de radiogroup): um único Tab entra no grupo; setas trocam o tamanho.
 */
export default function SizeSelector({ sizes, soldOut, value, onChange, error }: { sizes: string[]; soldOut: string[]; value: string | null; onChange: (s: string) => void; error?: boolean }) {
  return (
    <div
      role="radiogroup"
      onKeyDown={(e) => {
        const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        // parte do botão em foco (pode não ser o selecionado) ou do selecionado
        const from = (e.target as HTMLElement).dataset.size ?? value;
        const i = from ? sizes.indexOf(from) : -1;
        const next = sizes[(i + dir + sizes.length) % sizes.length];
        onChange(next);
        (e.currentTarget.querySelector(`[data-size="${CSS.escape(next)}"]`) as HTMLElement | null)?.focus();
      }}
      aria-labelledby="size-label"
      aria-invalid={error || undefined}
      aria-describedby={error ? "size-error" : undefined}
      className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1.5"
    >
      {sizes.map((s, i) => {
        const out = soldOut.includes(s);
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            data-size={s}
            tabIndex={on || (!value && i === 0) ? 0 : -1}
            aria-label={out ? `${s}, esgotado` : s}
            onClick={() => onChange(s)}
            className={`num relative flex min-h-13 flex-col items-center justify-center border font-mono text-label font-medium transition-colors duration-200 ${
              on ? (out ? "border-fg text-muted" : "border-fg bg-fg text-bg") : out ? "border-line text-muted" : "border-line-strong hover:border-fg"
            } ${error && !on ? "border-danger" : ""}`}
          >
            <span className={out ? "line-through decoration-1" : ""}>{s}</span>
            {out && <span aria-hidden className="text-[0.625rem] leading-none tracking-wide uppercase no-underline">esgot.</span>}
          </button>
        );
      })}
    </div>
  );
}
