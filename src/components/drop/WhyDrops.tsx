const STEPS = [
  ["Conceito", "Cada drop nasce de uma ideia da cultura digital. Não é coleção de estação, é capítulo."],
  ["Quantidade", "Tiragem definida antes da abertura e publicada na página do drop. Cada peça sai numerada."],
  ["Identidade", "Nome, número e história próprios. Você sabe de qual drop é a sua."],
  ["Período", "Abre com hora marcada, no horário de Brasília, e fica no ar até acabar. Quem está na lista recebe o aviso."],
  ["Esgotado", "Acabou, acabou. A peça vai para o arquivo e não volta."],
];

export default function WhyDrops() {
  return (
    <section id="como-funciona" aria-labelledby="why-t" className="studio py-section">
      <div className="wrap">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div data-reveal>
            <p className="eyebrow text-muted">Como funciona</p>
            <h2 id="why-t" className="font-display mt-4 text-d2">
              Por que drops?
            </h2>
            <p className="mt-6 max-w-[34ch] text-[1.125rem] text-muted">Sem estoque infinito: poucas peças, numeradas, e quando acaba não volta.</p>
          </div>
          <ol className="border-t border-line-strong">
            {STEPS.map(([t, d], i) => (
              <li key={t} data-reveal style={{ "--i": i } as React.CSSProperties} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-line-strong py-6 sm:grid-cols-[4rem_12rem_1fr] sm:items-baseline">
                <span className="eyebrow num text-muted">0{i + 1}</span>
                <h3 className={`font-display text-[1.75rem] leading-none ${i === STEPS.length - 1 ? "text-accent-fg" : ""}`}>{t}</h3>
                <p className="col-start-2 text-muted sm:col-start-3">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
