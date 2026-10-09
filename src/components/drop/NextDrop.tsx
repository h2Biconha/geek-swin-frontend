"use client";

import { DROPS, dateLabel, dropTitle, getDrop, timeLabel } from "@/lib/catalog";
import { useNow } from "@/lib/time";
import { dropPhase } from "@/lib/catalog";
import Countdown from "../ui/Countdown";
import SignupForm from "../sections/SignupForm";

/**
 * Bloco "Next drop": conta até o próximo evento real.
 * Drop 001 ainda não abriu → conta até a abertura. Abriu → próximo drop com data; sem data → só a lista.
 */
export default function NextDrop({ id = "aviso", fixed }: { id?: string; fixed?: string }) {
  const now = useNow(30_000);
  const next = fixed ? getDrop(fixed)! : DROPS.find((d) => ["presale", "upcoming"].includes(dropPhase(d, now))) ?? DROPS.find((d) => dropPhase(d, now) === "coming-soon") ?? DROPS[DROPS.length - 1];
  const dated = next.opensAtUTC && Date.parse(next.opensAtUTC) > now;

  return (
    <section id={id} aria-labelledby={`${id}-t`} className="theme-dark grain relative overflow-hidden py-section">
      <div className="wrap relative">
        <div className="flex flex-wrap items-baseline justify-between gap-4" data-reveal>
          <p className="eyebrow text-accent-fg">Próximo drop</p>
          <p className="eyebrow text-muted">{dated ? `${dateLabel(next.opensAtUTC!)} · ${timeLabel(next.opensAtUTC!)} · horário de Brasília` : "Sem data definida"}</p>
        </div>
        <h2 id={`${id}-t`} className="font-display mt-6 text-d2" data-reveal>
          Drop {next.number} {next.name ? `· ${dropTitle(next)}` : "· em breve"}
        </h2>
        <div className="mt-10 lg:mt-14" data-reveal>
          {dated ? <Countdown target={Date.parse(next.opensAtUTC!)} /> : <p className="font-display text-[clamp(2.5rem,8vw,6rem)] leading-[0.9] text-muted">Data a anunciar</p>}
        </div>
        <div className="mt-14 grid gap-10 border-t border-line pt-10 lg:grid-cols-[1fr_1.3fr]">
          <p className="max-w-[38ch] text-[1.125rem] text-muted" data-reveal>
            {dated ? "Quem está na lista recebe o aviso por e-mail com o link do drop. WhatsApp é opcional." : next.concept}
          </p>
          <div data-reveal>
            <SignupForm source={`aviso-drop-${next.number}`} cta="Quero ser avisado" withWhatsapp done="Pronto, você será avisado." />
          </div>
        </div>
      </div>
    </section>
  );
}
