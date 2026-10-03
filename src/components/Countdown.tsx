"use client";

import { useEffect, useState } from "react";
import { DROP_OPENS_AT } from "@/lib/products";

const DAY = 86_400_000;

export function useCountdown(target = DROP_OPENS_AT) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [target]);
  if (left === null) return ["--", "--", "--", "--"];
  return [left / DAY, (left / 3_600_000) % 24, (left / 60_000) % 60, (left / 1000) % 60].map((v) => String(Math.floor(v)).padStart(2, "0"));
}

export default function Countdown({ size = "lg" }: { size?: "md" | "lg" }) {
  const parts = useCountdown();
  const labels = ["dias", "horas", "min", "seg"];
  // o número muda todo segundo: o leitor de tela recebe um resumo fixo em vez de ouvir cada tique
  const summary = parts[0] === "--" ? "Contagem para o drop" : `Faltam ${+parts[0]} dias e ${+parts[1]} horas para o drop`;
  return (
    <div role="timer" aria-label={summary} className="grid max-w-full grid-cols-4 gap-3 tabular-nums sm:gap-5">
      {parts.map((v, i) => (
        <div key={labels[i]} aria-hidden className="min-w-0">
          <span className={`block font-display font-extrabold leading-none ${size === "lg" ? "text-[clamp(2.2rem,4.6vw,4.5rem)]" : "text-[clamp(2rem,5vw,3rem)]"} ${i === 3 ? "text-acid-ink" : ""}`}>{v}</span>
          <span className="font-mono text-micro uppercase tracking-[0.16em] text-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
