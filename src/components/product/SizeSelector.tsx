"use client";

/** Seletor de tamanho: disponível, selecionado e esgotado (riscado, ainda clicável para "avisar-me"). */
export default function SizeSelector({ sizes, soldOut, value, onChange, error }: { sizes: string[]; soldOut: string[]; value: string | null; onChange: (s: string) => void; error?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Tamanho" aria-invalid={error || undefined} aria-describedby={error ? "size-error" : undefined} className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1.5">
      {sizes.map((s) => {
        const out = soldOut.includes(s);
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={out ? `${s}, esgotado` : s}
            onClick={() => onChange(s)}
            className={`num relative min-h-13 border font-mono text-label font-medium transition-colors duration-200 ${
              on ? (out ? "border-fg text-muted" : "border-fg bg-fg text-bg") : out ? "border-line text-muted" : "border-line-strong hover:border-fg"
            } ${error && !on ? "border-danger" : ""}`}
          >
            <span className={out ? "line-through decoration-1" : ""}>{s}</span>
            {out && <span className="sr-only"> esgotado</span>}
          </button>
        );
      })}
    </div>
  );
}
