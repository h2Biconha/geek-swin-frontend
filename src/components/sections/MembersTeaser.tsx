import Link from "next/link";
import { LEVELS } from "@/lib/levels";
import { BRAND } from "@/lib/brand";

export default function MembersTeaser() {
  return (
    <section aria-labelledby="members-t" className="theme-dark py-section">
      <div className="wrap grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div data-reveal>
          <p className="eyebrow text-accent-fg">{BRAND.name} Members</p>
          <h2 id="members-t" className="font-display mt-4 text-d3">
            Alguns drops não chegam para todo mundo.
          </h2>
          <Link href="/members" className="btn btn-primary btn-lg mt-8">
            Conhecer Members
          </Link>
        </div>
        <ol className="border-t border-line">
          {LEVELS.map((l, i) => (
            <li key={l.n} data-reveal style={{ "--i": i } as React.CSSProperties} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
              <span className="eyebrow num text-muted">Nível {l.n}</span>
              <span className="font-display flex-1 text-[1.75rem] leading-none">{l.name}</span>
              <span className="hidden text-right text-small text-muted sm:block">{l.perks[0]}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
