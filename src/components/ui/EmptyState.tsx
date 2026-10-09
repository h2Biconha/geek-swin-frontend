import Link from "next/link";

/** Estado vazio. `level` define o título (h1 quando é o conteúdo principal da página, como o checkout sem itens). */
export default function EmptyState({ code, title, text, cta, href, onClick, level = 3 }: { code?: string; title: string; text: string; cta: string; href?: string; onClick?: () => void; level?: 1 | 2 | 3 }) {
  const H = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div className="flex flex-col items-start gap-5 py-10">
      {code && <span className="eyebrow text-muted">{code}</span>}
      <H className="font-display text-d4">{title}</H>
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
