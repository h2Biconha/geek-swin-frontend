import Link from "next/link";

export default function Breadcrumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Trilha" className="eyebrow text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map(([label, href], i) => (
          <li key={label} className="flex items-center gap-2">
            {href ? (
              <Link href={href} className="link-u hover:text-fg">
                {label}
              </Link>
            ) : (
              <span aria-current="page" className="text-fg">
                {label}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
