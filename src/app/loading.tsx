/** Enquanto uma rota carrega: o cursor da marca, sem spinner genérico. */
export default function Loading() {
  return (
    <div className="grid min-h-[60svh] place-items-center" role="status" aria-label="Carregando">
      <span className="font-display text-[3rem] leading-none">
        GS<span className="animate-blink text-accent-fg">_</span>
      </span>
    </div>
  );
}
