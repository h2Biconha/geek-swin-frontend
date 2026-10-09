"use client";

import { sizeOut, type Inventory, type Product } from "@/lib/catalog";

/** seletor compacto de tamanho (linhas de look, kit e loadout). Tamanho esgotado aparece, desabilitado. */
export default function SizeSelect({ product: p, value, onChange, inv, id, invalid }: { product: Product; value: string | null; onChange: (s: string) => void; inv?: Inventory; id: string; invalid?: boolean }) {
  if (p.sizes.length === 1)
    return (
      <span className="eyebrow inline-flex min-h-10 items-center text-muted" id={id}>
        Tam. {p.sizes[0]}
      </span>
    );
  return (
    <>
      <label htmlFor={id} className="sr-only">
        Tamanho de {p.name}
      </label>
      <div className="relative">
        <select id={id} value={value ?? ""} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value)} className="input min-h-10 w-[7.5rem] appearance-none py-0 pr-8 font-mono text-label">
          <option value="" disabled>
            Tamanho
          </option>
          {p.sizes.map((s) => (
            <option key={s} value={s} disabled={sizeOut(inv, s)}>
              {s}
              {sizeOut(inv, s) ? " · esgotado" : ""}
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">
          ↓
        </span>
      </div>
    </>
  );
}

/** tamanho já escolhido: peça de tamanho único vem marcada */
export const presetSize = (p: Product) => (p.sizes.length === 1 ? p.sizes[0] : null);
