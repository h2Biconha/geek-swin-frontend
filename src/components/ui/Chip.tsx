/** botão de filtro liga/desliga (aria-pressed). Mesmo visual da loja inteira. */
export default function Chip({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button type="button" aria-pressed={on} aria-label={label} onClick={onClick} className={`num min-h-10 border px-3 font-mono text-label transition-colors ${on ? "border-fg bg-fg text-bg" : "border-line-strong hover:border-fg"}`}>
      {children}
    </button>
  );
}
