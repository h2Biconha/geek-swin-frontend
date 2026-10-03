import Link from "next/link";
import SignupForm from "./SignupForm";

const COLS = [
  ["Loja", [["Todas as peças", "/loja"], ["Moletons", "/loja#moletons"], ["Camisetas", "/loja#camisetas"], ["Calças", "/loja#calcas"], ["Kits", "/loja#kits"]]],
  ["Marca", [["Drop Genesis", "/drops"], ["Lookbook", "/lookbook"], ["Sobre a GEEK SWIN", "/sobre"]]],
  ["Ajuda", [["Trocas e devoluções", "/sobre#faq"], ["Guia de medidas", "/sobre#faq"], ["Fale com a gente", "/sobre#contato"]]],
] as const;

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-line/15">
      <div className="grid gap-12 px-gutter py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-display text-2xl font-extrabold tracking-[0.06em]">
            GEEK<span className="text-acid-ink">/</span>SWIN
          </Link>
          <p className="mt-4 mb-6 max-w-[34ch] text-sm text-muted">Gamer streetwear de corte premium. Drops numerados, sem reposição.</p>
          <div className="max-w-sm">
            <SignupForm id="foot-email" source="rodape" />
          </div>
        </div>
        {COLS.map(([title, links]) => (
          <div key={title}>
            <p className="font-mono text-hud uppercase text-muted">{title}</p>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="inline-block py-1 hover:text-acid-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/15 px-gutter py-6 font-mono text-micro uppercase tracking-[0.16em] text-muted">
        <span>© 2026 GEEK SWIN · Gamer Streetwear</span>
        <span>Imagens ilustrativas · pagamento ainda desligado</span>
      </div>
    </footer>
  );
}
