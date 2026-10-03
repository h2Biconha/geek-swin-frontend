const ITEMS = [
  "Frete grátis acima de R$ 349",
  "6x sem juros no cartão",
  "Drop 001 · Genesis · 10/10 às 20h",
  "Troca grátis em 30 dias",
  "Peças numeradas à mão",
];

// Server component: é só CSS. A lista se repete 2x e anda -50% em loop (sem emenda).
export default function AnnouncementBar() {
  const row = () => (
    <div className="flex shrink-0 gap-12 pr-12">
      {ITEMS.flatMap((t) => [<span key={t}>{t}</span>, <span key={`${t}-s`}>✦</span>])}
    </div>
  );
  return (
    <div className="relative overflow-hidden bg-invert py-2.5 font-mono text-micro font-medium uppercase tracking-[0.2em] text-on-invert">
      {/* o leitor de tela lê a frase uma vez; a faixa animada é só visual */}
      <p className="sr-only">{ITEMS.join(". ")}</p>
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]" aria-hidden>
        {row()}
        {row()}
      </div>
    </div>
  );
}
