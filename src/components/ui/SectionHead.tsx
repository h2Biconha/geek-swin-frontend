import Link from "next/link";

export default function SectionHead({ eyebrow, title, text, href, cta, className = "" }: { eyebrow?: string; title: React.ReactNode; text?: string; href?: string; cta?: string; className?: string }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-10 gap-y-6 ${className}`}>
      <div className="max-w-3xl" data-reveal>
        {eyebrow && <p className="eyebrow mb-4 text-muted">{eyebrow}</p>}
        <h2 className="font-display text-d3">{title}</h2>
        {text && <p className="mt-5 max-w-[46ch] text-muted">{text}</p>}
      </div>
      {href && cta && (
        <Link href={href} className="btn btn-ghost" data-reveal>
          <span>{cta}</span>
        </Link>
      )}
    </div>
  );
}
