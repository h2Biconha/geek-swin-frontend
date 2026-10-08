import SignupForm from "./SignupForm";

/** Newsletter com cara de marca: ENTER THE LOBBY. */
export default function Lobby() {
  return (
    <section aria-labelledby="lobby-title" className="wrap grid gap-10 py-section lg:grid-cols-[1.2fr_1fr] lg:items-end">
      <div data-reveal>
        <p className="eyebrow text-accent-fg">Lista de acesso</p>
        <h2 id="lobby-title" className="font-display mt-4 text-d2">
          Enter the lobby
        </h2>
        <p className="mt-6 max-w-[34ch] text-[1.125rem] text-muted">Os próximos drops não serão anunciados duas vezes.</p>
      </div>
      <div data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        <SignupForm source="lobby" cta="Entrar" />
      </div>
    </section>
  );
}
