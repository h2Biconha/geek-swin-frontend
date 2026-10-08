import Link from "next/link";

export default function NotFoundView() {
  return (
    <section className="theme-dark grain relative flex min-h-[80svh] flex-col justify-center overflow-hidden">
      <span aria-hidden className="font-display num pointer-events-none absolute right-0 bottom-0 text-[clamp(12rem,40vw,40rem)] leading-[0.75] text-fg/[0.05]">
        404
      </span>
      <div className="wrap relative py-20">
        <p className="eyebrow text-accent-fg">Erro 404</p>
        <h1 className="font-display mt-5 text-d1">
          Player
          <br />
          not found<span className="animate-blink text-accent-fg">_</span>
        </h1>
        <p className="mt-8 max-w-[34ch] text-[1.25rem] text-muted">Você se perdeu no mapa. Essa página não existe, ou já foi para o arquivo.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary btn-lg">
            Voltar para o lobby
          </Link>
          <Link href="/shop" className="btn btn-secondary btn-lg">
            Ir para o shop
          </Link>
        </div>
      </div>
    </section>
  );
}
