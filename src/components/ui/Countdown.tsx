"use client";

import { splitCountdown, useNow } from "@/lib/time";

const pad = (n: number) => String(n).padStart(2, "0");

/** Contador do drop. Os dígitos trocam com um pequeno "flip" (só o número que mudou). */
export default function Countdown({ target, size = "lg", onDoneLabel = "AO VIVO" }: { target: number; size?: "lg" | "md"; onDoneLabel?: string }) {
  const now = useNow(1000);
  const t = splitCountdown(target, now);
  const units: [number, string][] = [
    [t.d, "Dias"],
    [t.h, "Horas"],
    [t.m, "Min"],
    [t.s, "Seg"],
  ];
  if (t.done) return <p className={`font-display ${size === "lg" ? "text-d2" : "text-d4"}`}>{onDoneLabel}</p>;
  return (
    <div role="timer" aria-label={`${t.d} dias, ${t.h} horas, ${t.m} minutos`} className="flex items-start gap-2 sm:gap-4">
      {units.map(([v, l], i) => (
        <div key={l} className="flex items-start gap-2 sm:gap-4">
          <div className="text-center">
            <span key={v} aria-hidden className={`font-display num block animate-[rise_.35s_var(--ease-out)] ${size === "lg" ? "text-[clamp(3.25rem,12vw,9.5rem)] leading-[0.82]" : "text-[clamp(2.25rem,6vw,3.5rem)] leading-[0.85]"}`}>
              {pad(v)}
            </span>
            <span className="eyebrow mt-2 block text-muted">{l}</span>
          </div>
          {i < 3 && (
            <span aria-hidden className={`font-display text-muted ${size === "lg" ? "text-[clamp(2.5rem,9vw,7rem)] leading-[0.9]" : "text-[clamp(1.75rem,5vw,2.75rem)]"}`}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
