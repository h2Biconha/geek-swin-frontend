import { LEVELS } from "@/lib/levels";
import { BRAND } from "@/lib/brand";
import SignupForm from "../sections/SignupForm";
import Accordion from "../ui/Accordion";

const PERKS = [
  ["Early access", "Entra no drop uma hora antes de abrir para todo mundo."],
  ["Drops secretos", "Peças que não aparecem no site. O link chega só para quem é member."],
  ["Descontos específicos", "Nada de cupom genérico. Benefício de aniversário e de nível."],
  ["Conteúdo", "Processo de criação, provas de peça e votação do próximo drop."],
  ["Prioridade", "Reserva na pré-venda e prioridade em troca e atendimento."],
];

export default function MembersView() {
  return (
    <>
      <section className="theme-dark grain relative -mt-header overflow-hidden pt-header">
        <div className="wrap relative pt-16 pb-section lg:pt-24">
          <p className="eyebrow text-accent-fg">{BRAND.name} Members</p>
          <h1 className="font-display mt-6 max-w-[14ch] animate-[rise_.9s_var(--ease-out)_both] text-d1">Alguns drops não chegam para todo mundo.</h1>
          <p className="mt-10 max-w-[44ch] text-[1.125rem] text-muted">Members é o círculo de dentro. Você sobe de nível comprando drops, e cada nível destrava acesso, não pontos.</p>
          <p className="eyebrow mt-8 inline-block border border-line px-3 py-2 text-muted">Em construção · benefícios valem quando as contas abrirem</p>
        </div>
      </section>

      <section aria-labelledby="perks" className="wrap py-section">
        <h2 id="perks" className="font-display text-d2" data-reveal>
          O que destrava
        </h2>
        <ul className="mt-12 grid border-t border-line md:grid-cols-5">
          {PERKS.map(([t, d], i) => (
            <li key={t} className="border-b border-line py-6 md:border-r md:border-b-0 md:px-5 md:first:pl-0 md:last:border-r-0" data-reveal style={{ "--i": i } as React.CSSProperties}>
              <span className="eyebrow num text-muted">0{i + 1}</span>
              <h3 className="font-display mt-3 text-[1.5rem] leading-none">{t}</h3>
              <p className="mt-3 text-small text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="levels" className="theme-dark py-section">
        <div className="wrap">
          <p className="eyebrow text-muted">Geek level</p>
          <h2 id="levels" className="font-display mt-4 text-d2" data-reveal>
            Quatro níveis. Sem barrinha de XP.
          </h2>
          <ol className="mt-12 grid gap-px bg-line md:grid-cols-4">
            {LEVELS.map((l, i) => (
              <li key={l.n} className="flex flex-col gap-6 bg-bg p-6 md:min-h-[22rem] md:p-8" data-reveal style={{ "--i": i } as React.CSSProperties}>
                <span className="eyebrow num text-muted">Nível {l.n}</span>
                <h3 className={`font-display text-[2.75rem] leading-none ${i === 3 ? "text-accent-fg" : ""}`}>{l.name}</h3>
                <p className="text-small text-fg">{l.rule}</p>
                <ul className="mt-auto grid gap-2 border-t border-line pt-4 text-small text-muted">
                  {l.perks.map((p) => (
                    <li key={p}>— {p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="join" className="wrap grid gap-12 py-section lg:grid-cols-2">
        <div data-reveal>
          <h2 id="join" className="font-display text-d2">
            Entre na lista de members
          </h2>
          <p className="mt-6 max-w-[40ch] text-muted">As contas abrem junto com o próximo drop. Quem está na lista vira PLAYER no primeiro dia.</p>
        </div>
        <div data-reveal>
          <SignupForm source="members" cta="Quero ser member" withWhatsapp done="Você está na fila." />
        </div>
      </section>

      <section aria-label="Perguntas" className="wrap pb-section">
        <Accordion
          defaultOpen={-1}
          items={[
            { title: "Precisa pagar para ser member?", content: <p>Não. Você sobe de nível comprando drops. Não existe assinatura.</p> },
            { title: "Os níveis expiram?", content: <p>Não. O que você conquistou fica. Drops novos só somam.</p> },
            { title: "O que é um drop secreto?", content: <p>Uma tiragem pequena que não aparece no site. O link vai só para quem tem o nível exigido.</p> },
          ]}
        />
      </section>
    </>
  );
}
