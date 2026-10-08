/** Acordeão com <details>: acessível e sem JavaScript. */
export default function Accordion({ items, defaultOpen = 0 }: { items: { title: string; content: React.ReactNode }[]; defaultOpen?: number }) {
  return (
    <div className="border-b border-line">
      {items.map((it, i) => (
        <details key={it.title} open={i === defaultOpen} className="group border-t border-line">
          <summary className="flex min-h-14 list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
            <span className="eyebrow text-fg">{it.title}</span>
            <span aria-hidden className="relative size-3">
              <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <div className="pb-6 text-[0.9375rem] text-muted">{it.content}</div>
        </details>
      ))}
    </div>
  );
}
