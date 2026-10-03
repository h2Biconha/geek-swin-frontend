import Link from "next/link";
import type { ReactNode } from "react";

/** Peças pequenas reaproveitadas em todas as páginas. */

export function SectionHead({ title, sub, aside, as: Tag = "h2" }: { title: string; sub: string; aside?: ReactNode; as?: "h1" | "h2" }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
      <div>
        <Tag className="font-display text-section font-extrabold uppercase">{title}</Tag>
        <p className="mt-3 text-muted">{sub}</p>
      </div>
      {aside}
    </div>
  );
}

export function Breadcrumb({ trail }: { trail: [string, string?][] }) {
  return (
    <nav aria-label="Você está em" className="mb-6 font-mono text-micro uppercase tracking-[0.16em] text-muted">
      {trail.map(([label, href], i) => (
        <span key={label}>
          {i > 0 && " / "}
          {href ? (
            <Link href={href} className="inline-block py-2 hover:text-ink">
              {label}
            </Link>
          ) : (
            <span aria-current="page" className="text-ink">{label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

const PERKS = [
  ["Frete grátis", "Acima de R$ 349 para todo o Brasil."],
  ["6x sem juros", "No cartão, em qualquer peça. 5% off no Pix."],
  ["Troca em 30 dias", "Primeira troca por nossa conta."],
  ["Certificado da peça", "Número e QR de autenticidade na etiqueta."],
];

export function Perks() {
  return (
    <section aria-label="Benefícios" className="border-t border-line/15">
      <ul className="grid grid-cols-2 gap-8 px-gutter py-12 md:grid-cols-4">
        {PERKS.map(([t, d]) => (
          <li key={t}>
            <p className="font-mono text-hud uppercase text-acid-ink">{t}</p>
            <p className="mt-2 text-sm text-muted">{d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BigTitle({ lines }: { lines: [string, string] }) {
  return (
    <h1 className="font-display text-hero font-extrabold">
      <span className="block">{lines[0]}</span>
      <span className="block">
        {lines[1]}
        <span className="text-acid-ink">.</span>
      </span>
    </h1>
  );
}
