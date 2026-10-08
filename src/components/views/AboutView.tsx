import Link from "next/link";
import { BRAND } from "@/lib/brand";

const PRINCIPLES = [
  ["Não é fantasia", "Nada de personagem licenciado, nada de logo de jogo. A referência está no detalhe, não no peito inteiro."],
  ["Peso de verdade", "Moletom de 520 g, malha de 280 g, sarja que segura o caimento. Roupa que dura mais que o hype."],
  ["Pouco e numerado", "Cada drop tem tiragem fechada. Acabou, vai para o arquivo. Sem reposição, sem promoção de queima."],
  ["Comunidade antes de campanha", "Quem está no lobby sabe primeiro, entra antes e ajuda a decidir o próximo capítulo."],
];

export default function AboutView() {
  return (
    <>
      <section className="theme-dark grain relative -mt-header overflow-hidden pt-header">
        <div className="wrap relative pt-16 pb-section lg:pt-24">
          <p className="eyebrow text-muted">About {BRAND.name}</p>
          <h1 className="font-display mt-6 max-w-[12ch] animate-[rise_.9s_var(--ease-out)_both] text-d1">Player by choice.</h1>
          <p className="mt-10 max-w-[38ch] animate-[rise_.9s_var(--ease-out)_.15s_both] text-[1.25rem] text-muted">A gente cresceu entre tela de título, servidor caindo às três da manhã e fórum que ninguém mais lembra. Isso virou repertório. Agora vira roupa.</p>
        </div>
      </section>

      <section aria-label="Manifesto" className="wrap grid gap-12 py-section lg:grid-cols-[1fr_1.5fr]">
        <p className="eyebrow text-muted" data-reveal>
          Manifesto
        </p>
        <div className="flex flex-col gap-8 text-[clamp(1.25rem,2vw,1.625rem)] leading-snug">
          <p data-reveal>
            A {BRAND.name} nasceu da cultura de quem passou horas jogando, acompanhando comunidade, vivendo a internet e transformando referência digital em identidade.
          </p>
          <p data-reveal className="text-muted">
            Só que identidade não é fantasia. Ninguém quer sair de casa vestido de merch. A gente quer a peça que funciona no campeonato, no rolê e no jantar, e que só quem viveu entende de onde veio.
          </p>
          <p data-reveal className="text-muted">
            Por isso o corte vem do streetwear, o tecido vem do pesado e a referência vem escondida: uma moldura de seleção, um número de série, uma frase que pisca antes do jogo começar.
          </p>
          <p data-reveal className="font-display text-d3">Não é merch. É uniforme.</p>
        </div>
      </section>

      <section aria-labelledby="principles" className="studio py-section">
        <div className="wrap">
          <h2 id="principles" className="font-display text-d2" data-reveal>
            O que a gente não negocia
          </h2>
          <ol className="mt-12 grid gap-px bg-line-strong sm:grid-cols-2">
            {PRINCIPLES.map(([t, d], i) => (
              <li key={t} className="studio flex min-h-64 flex-col justify-between gap-8 p-6 md:p-10" data-reveal style={{ "--i": i } as React.CSSProperties}>
                <span className="eyebrow num text-muted">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-[2.25rem] leading-none">{t}</h3>
                  <p className="mt-4 max-w-[40ch] text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="who" className="wrap grid gap-12 py-section lg:grid-cols-2">
        <h2 id="who" className="font-display text-d2" data-reveal>
          Você não precisa jogar para fazer parte.
        </h2>
        <div className="flex flex-col gap-6 text-[1.125rem] text-muted" data-reveal>
          <p>Se você joga, vai reconhecer cada detalhe. Se não joga, vai vestir uma peça pesada, bem cortada e sem logo gritando.</p>
          <p>Os dois são bem-vindos. A regra é uma só: gostar de coisa feita com cuidado e em pouca quantidade.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/drops/001-insert-coin" className="btn btn-primary btn-lg">
              Ver Drop 001
            </Link>
            <Link href="/members" className="btn btn-secondary btn-lg">
              Members
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
