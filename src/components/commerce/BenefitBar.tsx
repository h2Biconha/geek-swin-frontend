"use client";

import { brl } from "@/lib/catalog";
import { benefitProgress, type BenefitLine } from "@/lib/commerce/benefits";
import { useNow } from "@/lib/time";

/**
 * Barra de benefício progressivo. Só existe com regra ligada (commerce.benefits).
 * Mostra o que falta, a regra completa (região, opção de frete) e atualiza na hora quando a meta é atingida.
 * Não adiciona nada sozinha: o botão só leva às sugestões.
 */
export default function BenefitBar({ lines, cep, onFind, compact }: { lines: BenefitLine[]; cep?: string | null; onFind?: () => void; compact?: boolean }) {
  const now = useNow(60_000);
  const all = benefitProgress(lines, now, cep);
  if (!all.length) return null;
  const next = all.find((b) => !b.reached);
  const done = all.filter((b) => b.reached);
  return (
    <div className="flex flex-col gap-3" data-testid="benefit-bar">
      {next && (
        <div>
          <p className="text-small" aria-live="polite">
            {next.message}
          </p>
          <div
            className="mt-2.5 h-[2px] bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={next.thresholdCents / 100}
            aria-valuenow={Math.min(next.eligibleCents, next.thresholdCents) / 100}
            aria-valuetext={`${brl(next.eligibleCents / 100)} de ${brl(next.thresholdCents / 100)}`}
            aria-label={`Progresso: ${next.label}`}
          >
            <div className="h-full origin-left bg-accent transition-transform duration-500 ease-out" style={{ transform: `scaleX(${Math.min(1, next.eligibleCents / next.thresholdCents)})` }} />
          </div>
          {!compact && (
            <p className="mt-2 text-small text-muted">
              {next.condition}
              {next.region === null ? " Confirmado no CEP." : next.region === false ? " Seu CEP não entra nessa regra." : ""}
            </p>
          )}
          {onFind && (
            <button type="button" onClick={onFind} className="btn btn-ghost mt-1 min-h-10">
              <span>Encontre algo para completar seu pedido</span>
            </button>
          )}
        </div>
      )}
      {done.map((b) => (
        <p key={b.id} className="flex items-center gap-2 text-small text-accent-fg" aria-live="polite">
          <span aria-hidden className="size-1.5 bg-accent" /> {b.message}
          {b.region === null ? <span className="text-muted"> (confirmado no CEP)</span> : b.region === false ? <span className="text-muted"> (não vale para o seu CEP)</span> : null}
        </p>
      ))}
    </div>
  );
}
