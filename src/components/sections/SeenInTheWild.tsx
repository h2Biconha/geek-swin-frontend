import { BRAND } from "@/lib/brand";
import { asset, COMMUNITY } from "@/lib/catalog";
import Icon from "../ui/Icon";

/**
 * Grid da comunidade. Só aparece quando COMMUNITY.posts tiver fotos reais (com autorização de quem aparece).
 * Integração futura: Instagram Graph API (ver BACKEND.md > Instagram).
 */
export default function SeenInTheWild() {
  const posts = COMMUNITY.posts;
  if (!posts.length) return null; // sem fotos reais de clientes, a seção não aparece
  const slots = Array.from({ length: 5 }, (_, i) => posts[i] ?? null);
  return (
    <section aria-labelledby="wild-t" className="wrap py-section">
      <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
        <div>
          <p className="eyebrow text-muted">Comunidade</p>
          <h2 id="wild-t" className="font-display mt-4 text-d2">
            Na rua
          </h2>
        </div>
        <a href={`https://instagram.com/${BRAND.instagram}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          <Icon name="instagram" size={18} /> @{BRAND.instagram}
        </a>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-1 md:grid-cols-4 md:grid-rows-2">
        <a
          href={`https://instagram.com/${BRAND.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          data-reveal
          className="theme-dark group relative col-span-2 row-span-2 flex aspect-square flex-col justify-between p-6 md:aspect-auto md:p-10"
        >
          <span className="eyebrow text-accent-fg">Player 1</span>
          <span>
            <span className="font-display block text-d3 transition-colors group-hover:text-accent-fg">Sua foto aqui.</span>
            <span className="mt-4 block max-w-[30ch] text-muted">Vestiu? Marque @{BRAND.instagram}.</span>
          </span>
        </a>
        {slots.slice(0, 4).map((p, i) =>
          p ? (
            <div key={i} className="studio aspect-square overflow-hidden" data-reveal>
              <img src={asset(p.src)} alt={p.alt ?? "Foto da comunidade"} className="size-full object-cover" loading="lazy" />
            </div>
          ) : (
            <div key={i} data-reveal style={{ "--i": i } as React.CSSProperties} className="flex aspect-square flex-col justify-between border border-dashed border-line-strong p-4">
              <span className="eyebrow num text-muted">Slot 0{i + 2}</span>
              <span className="eyebrow text-muted">Vazio · aguardando player</span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
