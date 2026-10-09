import SignupForm from "./SignupForm";

/** Lista do drop: o único "clube" que existe hoje é saber primeiro. Âncora #lista (links antigos de /members caem aqui). */
export default function Lobby() {
  return (
    <section id="lista" aria-labelledby="lista-t" className="wrap grid scroll-mt-[calc(var(--header-h)+1rem)] gap-10 py-section lg:grid-cols-[1.2fr_1fr] lg:items-end">
      <div data-reveal>
        <p className="eyebrow text-accent-fg">Lista do drop</p>
        <h2 id="lista-t" className="font-display mt-4 text-d2">
          Entre no lobby
        </h2>
        <p className="mt-6 max-w-[34ch] text-[1.125rem] text-muted">Quem está na lista recebe por e-mail a data, a hora e o link de cada drop.</p>
      </div>
      <div data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        <SignupForm source="lista" cta="Entrar na lista" withWhatsapp />
      </div>
    </section>
  );
}
