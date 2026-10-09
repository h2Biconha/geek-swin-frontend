import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { categoryHref, SITE } from "@/lib/catalog";
import { navCategories } from "@/lib/merch/listings";
import Lobby from "../sections/Lobby";
import ConsentLink from "./ConsentLink";

const COLS: [string, [string, string][]][] = [
  ["Loja", [["Tudo", "/shop"], ["Novidades", "/shop/novidades"], ...navCategories().map((c) => [c.name, categoryHref(c.slug)] as [string, string]), ["Linha Core", "/shop/core"]]],
  ["Marca", [["Drops", "/drops"], ["Loadout", "/loadout"], ["Arquivo", "/drops#arquivo"], ["Sobre", "/about"], ["Lista do drop", "/#lista"]]],
  ["Ajuda", [["Envio e prazos", "/help#envio"], ["Trocas e devoluções", "/help#trocas"], ["Pré-venda", "/help#pre-venda"], ["Contato", "/help#contato"]]],
  ["Legal", [["Privacidade", "/privacy"], ["Termos de uso", "/terms"]]],
];

export default function Footer() {
  return (
    <footer className="theme-dark">
      <Lobby />
      <div className="wrap grid gap-10 border-t border-line pt-12 pb-10 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_1.2fr]">
        {COLS.map(([t, links]) => (
          <nav key={t} aria-label={t}>
            <p className="eyebrow text-muted">{t}</p>
            <ul className="mt-4 grid gap-1">
              {links.map(([l, h]) => (
                <li key={h}>
                  <Link href={h} className="link-u inline-flex min-h-9 items-center">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <p className="eyebrow text-muted">Comunidade</p>
          <a href={`https://instagram.com/${BRAND.instagram}`} target="_blank" rel="noopener noreferrer" className="font-display mt-4 inline-block text-d4 hover:text-accent-fg">
            @{BRAND.instagram}
          </a>
          <p className="mt-3 max-w-[30ch] text-small text-muted">Marque a gente usando a peça.</p>
        </div>
      </div>
      <div className="wrap overflow-hidden" aria-hidden>
        {/* decorativo: o texto vem de um atributo via CSS, então leitor de tela e auditoria de contraste ignoram */}
        <p data-word={BRAND.name} className="font-display -mb-[0.12em] text-center text-[clamp(4rem,19.5vw,25rem)] leading-[0.8] whitespace-nowrap text-fg/[0.07] before:content-[attr(data-word)]" />
      </div>
      <div className="wrap flex flex-col gap-3 border-t border-line py-6 text-small text-muted md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {BRAND.name} · {BRAND.cnpj ? `CNPJ ${BRAND.cnpj}` : "CNPJ a definir"}
        </p>
        <p>Pix · Cartão</p>
        <ConsentLink />
        {SITE.preview && <p className="text-fg">Prévia · dados de exemplo</p>}
      </div>
    </footer>
  );
}
