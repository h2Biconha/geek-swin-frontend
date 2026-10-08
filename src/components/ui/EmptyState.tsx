import Link from "next/link";

export default function EmptyState({ code, title, text, cta, href, onClick }: { code?: string; title: string; text: string; cta: string; href?: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-5 py-10">
      {code && <span className="eyebrow text-muted">{code}</span>}
      <h3 className="font-display text-d4">{title}</h3>
      <p className="max-w-[36ch] text-muted">{text}</p>
      {href ? (
        <Link href={href} onClick={onClick} className="btn btn-primary">
          {cta}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className="btn btn-primary">
          {cta}
        </button>
      )}
    </div>
  );
}
