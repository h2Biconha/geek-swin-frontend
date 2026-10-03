"""Gera o protótipo multipágina da GEEK SWIN a partir de data/catalog.json.

    python3 build.py

Saída nesta pasta: index.html, loja.html, produto-<slug>.html, lookbook.html,
drops.html, sobre.html, carrinho.html. Tudo funciona com duplo clique.
Header, rodapé, popup e scripts são os mesmos em todas as páginas (definidos aqui uma vez).
"""
import html, json, pathlib, sys

HERE = pathlib.Path(__file__).parent
C = json.loads((HERE / "data/catalog.json").read_text())
P = {p["slug"]: p for p in C["products"]}
CAT = {c["slug"]: c["name"] for c in C["categories"]}
# Para o Artifact, a home é servida na raiz: o link "index.html" vira "./"
HOME = sys.argv[1] if len(sys.argv) > 1 else "index.html"
e = html.escape


def brl(v):
    s = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"


def inst(v):
    return brl((round(v * 100) // C["installments"]) / 100)


# pré-venda: datas em horário de Brasília (o JS esconde os avisos [data-presale] depois da abertura)
OPENS_LABEL = "10/10 às 20h"  # = drop.opensAtUTC 2026-10-10T23:00:00Z
SHIPS_FROM_LABEL = "/".join(reversed(C["drop"]["shipsFrom"].split("-")[1:]))


def discount(p):
    return round((1 - p["price"] / p["compareAt"]) * 100) if p.get("compareAt") else 0


def url(p):
    return f"produto-{p['slug']}.html"


# ---------------------------------------------------------------- layout comum

HEAD = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Syne:wght@600;700;800&display=swap">
<link rel="stylesheet" href="assets/site.css">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {{ theme: {{ extend: {{
    colors: {{ bg: 'var(--bg)', surface: 'var(--surface)', card: 'var(--card)', ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)',
      acid: 'var(--acid)', 'acid-ink': 'var(--acid-ink)', 'on-acid': 'var(--on-acid)', invert: 'var(--invert-bg)', 'on-invert': 'var(--invert-fg)', danger: 'var(--danger)' }},
    fontSize: {{ micro: ['0.6875rem', {{ lineHeight: '1.5' }}], label: ['0.75rem', {{ lineHeight: '1.5' }}], small: ['0.8125rem', {{ lineHeight: '1.5' }}] }},
    fontFamily: {{ display: ['Syne', 'Arial Black', 'sans-serif'], sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'] }},
    letterSpacing: {{ hud: '0.2em' }} }} }} }};
</script>
</head>
<body{body_attr}>
"""

NAV = [("Loja", "loja.html", "loja"), ("Drop Genesis", "drops.html", "drops"), ("Lookbook", "lookbook.html", "lookbook"),
       ("Kits", "loja.html#kits", "kits"), ("Sobre", "sobre.html", "sobre")]
MARQUEE = ["Frete grátis acima de R$ 349", "6x sem juros no cartão", "Drop 001 · Genesis · 10/10 às 20h", "5% off no Pix", "Troca grátis em 30 dias"]


CUR = ' aria-current="page"'


def topbar(active):
    items = "".join(f"<span>{t}</span><span>✦</span>" for t in MARQUEE)
    nav = "".join(
        f'<a href="{h}" class="nav-link py-2 hover:text-acid-ink"{CUR if k == active else ""}>{t}</a>' for t, h, k in NAV)
    mnav = "".join(f'<a href="{h}" class="block border-b border-line py-4 font-display text-2xl font-bold"{CUR if k == active else ""}>{t}</a>' for t, h, k in NAV)
    return f"""<div class="cursor" id="cursor" aria-hidden="true"><span>VER</span></div>
<a href="#conteudo" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-acid focus:px-4 focus:py-2">Pular para o conteúdo</a>
<header id="topbar" class="topbar">
  <div class="overflow-hidden bg-invert py-2.5 font-mono text-micro font-medium uppercase tracking-hud text-on-invert">
    <p class="sr-only">{'. '.join(MARQUEE)}</p>
    <div class="marquee" aria-hidden="true"><div class="flex shrink-0 gap-12 pr-12">{items}</div><div class="flex shrink-0 gap-12 pr-12">{items}</div></div>
  </div>
  <div class="site-header border-b border-line">
    <div class="wrap header-row flex items-center justify-between gap-6">
      <a href="{HOME}" class="font-display text-lg font-extrabold tracking-[0.08em]">GEEK<span class="text-acid-ink">/</span>SWIN</a>
      <nav class="hidden gap-8 text-sm font-medium lg:flex" aria-label="Principal">{nav}</nav>
      <div class="flex items-center gap-5 font-mono text-label uppercase tracking-[0.14em]">
        <a href="sobre.html#contato" class="hidden py-2 sm:inline">Ajuda</a>
        <a href="carrinho.html" class="flex items-center gap-2 py-2"{CUR if active == "bag" else ""}>Bag <span class="bag-count tick grid size-5 place-items-center rounded-full bg-invert text-micro text-on-invert">0</span></a>
        <button id="menu-btn" type="button" class="rounded-full border border-line px-4 py-2 lg:hidden" aria-expanded="false" aria-controls="mobile-nav">Menu</button>
      </div>
    </div>
    <div id="mobile-nav" class="mobile-nav lg:hidden" inert><div><nav class="wrap pb-6" aria-label="Principal (celular)">{mnav}</nav></div></div>
  </div>
</header>
<main id="conteudo" tabindex="-1" style="outline:none">
"""


def footer():
    cols = [
        ("Loja", [("Todas as peças", "loja.html"), ("Moletons", "loja.html#moletons"), ("Camisetas", "loja.html#camisetas"), ("Calças", "loja.html#calcas"), ("Kits", "loja.html#kits")]),
        ("Marca", [("Drop Genesis", "drops.html"), ("Lookbook", "lookbook.html"), ("Sobre a GEEK SWIN", "sobre.html")]),
        ("Ajuda", [("Trocas e devoluções", "sobre.html#faq"), ("Guia de medidas", "sobre.html#faq"), ("Fale com a gente", "sobre.html#contato")]),
    ]
    links = "".join(
        f'<div><p class="font-mono text-micro uppercase tracking-hud text-muted">{t}</p><ul class="mt-4 grid gap-2.5 text-sm">' +
        "".join(f'<li><a href="{h}" class="inline-block py-1 hover:text-acid-ink">{n}</a></li>' for n, h in ls) + "</ul></div>" for t, ls in cols)
    return f"""</main>
<footer class="mt-8 border-t border-line">
  <div class="wrap grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
    <div>
      <a href="{HOME}" class="font-display text-2xl font-extrabold tracking-[0.06em]">GEEK<span class="text-acid-ink">/</span>SWIN</a>
      <p class="mt-4 max-w-[34ch] text-sm text-muted">Gamer streetwear de corte premium. Drops numerados, sem reposição.</p>
      <form data-signup="footer" data-success="foot-ok" class="mt-6 flex max-w-sm gap-2" novalidate>
        <label for="foot-email" class="sr-only">Seu e-mail</label>
        <input id="foot-email" type="email" autocomplete="email" placeholder="seu@email.com" class="min-w-0 flex-1 rounded-full border border-line bg-surface px-5 py-3 text-sm focus:border-ink">
        <button class="btn-ink !px-5 !py-3" type="submit">Entrar</button>
        <p data-error hidden class="sr-only" role="alert">E-mail inválido</p>
      </form>
      <p id="foot-ok" hidden class="mt-6 text-sm font-medium text-acid-ink" role="status">Pronto, você está na lista do próximo drop ✓</p>
    </div>
    {links}
  </div>
  <div class="wrap flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 font-mono text-micro uppercase tracking-[0.16em] text-muted">
    <span>© 2026 GEEK SWIN · Gamer Streetwear</span><span>Protótipo · imagens ilustrativas · pagamento desligado</span>
  </div>
</footer>
"""


TOAST = """<div id="toast" class="toast" role="status" aria-live="polite">
  <div class="flex items-center gap-4 rounded-3xl bg-invert p-3 pr-5 text-on-invert shadow-2xl">
    <div class="studio size-16 shrink-0 rounded-2xl"><img id="toast-img" src="" alt=""></div>
    <div class="min-w-0 flex-1"><p class="font-mono text-micro uppercase tracking-[0.16em] text-acid">Adicionado à bag ✓</p>
      <p id="toast-name" class="truncate font-display font-bold"></p><p id="toast-meta" class="tick text-xs opacity-70"></p></div>
    <a href="carrinho.html" class="btn-acid !px-4 !py-2.5 !text-micro">Ver bag</a>
  </div>
</div>
"""


def popup():
    cd = "".join(
        f'<div><span data-cd="{k}" class="block text-[clamp(2rem,5vw,3rem)] leading-none{" text-acid-ink" if k == "s" else ""}">00</span>'
        f'<span class="font-mono text-micro font-medium uppercase tracking-[0.16em] text-muted">{l}</span></div>'
        for k, l in [("d", "dias"), ("h", "horas"), ("m", "min"), ("s", "seg")])
    return f"""<dialog id="drop-modal" class="drop-modal" aria-labelledby="drop-title">
  <div class="grid md:grid-cols-[1fr_1.1fr]">
    <div class="studio relative hidden min-h-[30rem] !bg-acid md:block" style="background: var(--acid)">
      <img src="products/model-tee.svg" alt="">
      <span class="absolute left-5 top-5 rounded-full bg-invert px-3 py-1.5 font-mono text-micro font-bold uppercase tracking-[0.16em] text-on-invert">Drop 001 · Genesis</span>
    </div>
    <div class="relative flex flex-col justify-center gap-6 p-7 sm:p-10">
      <button type="button" data-close class="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-line text-lg hover:border-ink" aria-label="Fechar">✕</button>
      <span class="inline-flex w-fit items-center gap-2 rounded-full bg-acid px-3 py-1.5 font-mono text-micro font-bold uppercase tracking-[0.16em] text-on-acid"><i class="block size-1.5 animate-pulse rounded-full" style="background: var(--on-acid)"></i>Abre em</span>
      <div class="tick flex gap-3 font-display font-extrabold">{cd}</div>
      <div>
        <h2 id="drop-title" class="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em]">Entre 1 hora antes de todo mundo</h2>
        <p class="mt-3 max-w-[40ch] text-muted">São {total} peças numeradas e não vai ter reposição. Quem está na lista recebe o link do Drop 001 às 19h, uma hora antes da abertura.</p>
      </div>
      <form data-signup="popup" data-success="modal-success" class="flex flex-col gap-3" novalidate>
        <label for="modal-email" class="font-mono text-micro uppercase tracking-[0.16em] text-muted">Seu melhor e-mail</label>
        <input id="modal-email" type="email" autofocus autocomplete="email" placeholder="seu@email.com" class="rounded-full border border-line bg-bg px-6 py-4 text-base focus:border-ink">
        <p data-error hidden class="text-sm" style="color: var(--danger)" role="alert">Digite um e-mail válido, tipo nome@gmail.com.</p>
        <button type="submit" class="btn-ink">Quero acesso antecipado</button>
        <p class="text-xs text-muted">Só aviso de drop. Sem spam. Sai quando quiser.</p>
      </form>
      <div id="modal-success" hidden role="status">
        <p class="font-display text-2xl font-extrabold uppercase">Você está na lista ✓</p>
        <p class="mt-2 text-muted">No dia 10/10, às 19h, o link chega no seu e-mail.</p>
        <button type="button" data-close data-focus class="btn-acid mt-6">Ver as peças</button>
      </div>
      <button type="button" data-close class="w-fit font-mono text-micro uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink">Agora não</button>
    </div>
  </div>
</dialog>
"""


def page(name, title, desc, active, body, no_popup=False):
    head = HEAD.format(title=e(title), desc=e(desc), body_attr=' data-no-popup="1"' if no_popup else "")
    doc = head + topbar(active) + body + footer() + TOAST + popup() + \
        '<script src="assets/catalog.js"></script>\n<script src="assets/site.js"></script>\n</body>\n</html>\n'
    (HERE / name).write_text(doc)


# ---------------------------------------------------------------- componentes

def section_head(title, sub, aside="", tag="h2"):
    return f"""<div class="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
      <div><{tag} class="section-title">{title}</{tag}><p class="mt-3 text-muted">{sub}</p></div>{aside}
    </div>"""


def card(p, i=0):
    off = discount(p)
    badge = f"-{off}%" if off else p.get("badge")
    badge_html = ""
    if badge:
        cls = "bg-acid text-on-acid" if off else "bg-invert text-on-invert"
        badge_html = f'<span class="absolute left-3 top-3 rounded-full {cls} px-2.5 py-1 font-mono text-micro font-bold uppercase tracking-[0.12em]">{badge}</span>'
    old = f'<span class="tick font-mono text-label text-muted line-through">{brl(p["compareAt"])}</span>' if p.get("compareAt") else ""
    if p.get("edition"):
        pct = round(p["stockLeft"] / p["edition"] * 100)
        stock = f'<div class="mt-4"><div class="stock"><i style="width:{pct}%"></i></div><span class="tick mt-2 block font-mono text-micro uppercase tracking-[0.14em] text-acid-ink">Restam {p["stockLeft"]} de {p["edition"]}</span>' + (f'<span data-presale class="mt-1 block font-mono text-micro uppercase tracking-[0.14em] text-muted">Pré-venda · abre {OPENS_LABEL}</span>' if p.get("drop") else "") + '</div>'
    else:
        stock = (f'<span class="mt-4 block font-mono text-micro uppercase tracking-[0.14em] text-muted">Drop {C["drop"]["number"]} · {C["drop"]["name"]}</span><span data-presale class="mt-1 block font-mono text-micro uppercase tracking-[0.14em] text-muted">Pré-venda · abre {OPENS_LABEL}</span>' if p.get("drop")
                 else '<span class="mt-4 block font-mono text-micro uppercase tracking-[0.14em] text-muted">Linha permanente</span>')
    return f"""<article class="card" data-cursor="view" data-cat="{p['category']}" data-price="{p['price']}" data-order="{i}">
        <a href="{url(p)}" class="block" aria-label="{e(p['name'])}, {brl(p['price'])}">
          <div class="studio aspect-[4/5] rounded-[22px]">
            <img class="photo" src="products/{p['image']}" alt="{e(p['name'])}" loading="lazy">
            <img class="photo photo-alt" src="products/{p['modelImage']}" alt="" loading="lazy">
            {badge_html}
            <span class="absolute right-4 top-4 font-mono text-micro uppercase tracking-hud text-muted">Nº {p['number']}</span>
            <span class="quick absolute inset-x-3 bottom-3 rounded-full bg-invert py-3 text-center font-mono text-micro font-bold uppercase tracking-[0.16em] text-on-invert">Ver tamanhos →</span>
          </div>
          <h3 class="mt-4 font-display text-[clamp(0.98rem,1.3vw,1.15rem)] font-bold leading-tight">{e(p['name'])}</h3>
          <p class="mt-1 font-mono text-micro uppercase tracking-[0.12em] text-muted">{e(p['specs'])}</p>
          <div class="mt-3 flex flex-wrap items-baseline gap-x-2.5"><span class="tick font-display text-lg font-bold">{brl(p['price'])}</span>{old}</div>
          <p class="tick text-small text-muted">ou {C['installments']}x de {inst(p['price'])} sem juros</p>
          {stock}
        </a>
      </article>"""


def grid(products):
    return '<div class="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">' + "\n".join(card(p, i) for i, p in enumerate(products)) + "</div>"


def magnetic(href, label):
    zones = "".join(f'<span class="zone z{i}"></span>' for i in range(1, 10))
    return f'<a href="{href}" class="magnetic" aria-label="{label}">{zones}<span class="btn"><span class="label">{label}</span><span class="arrow" aria-hidden="true">→</span></span></a>'


drop_items = [p for p in C["products"] if p.get("drop")]
left = sum(p.get("stockLeft", 0) for p in drop_items)
total = sum(p.get("edition", 0) for p in drop_items)

# ---------------------------------------------------------------- HOME

tech = [("VoidBlack™", "O preto que não desbota depois de 50 lavagens."), ("LockNeck™", "Gola com ribana dupla que não abre."),
        ("520 g/m²", "Moletom pesado, caimento estruturado."), ("ZeroShrink™", "Algodão pré-encolhido: o tamanho fica.")]
perks = [("Frete grátis", "Acima de R$ 349 para todo o Brasil."), ("6x sem juros", "No cartão, em qualquer peça. 5% off no Pix."),
         ("Troca em 30 dias", "Primeira troca por nossa conta."), ("Certificado da peça", "Número e QR de autenticidade na etiqueta.")]


def perks_html():
    return '<section class="border-t border-line" aria-label="Benefícios"><ul class="wrap grid grid-cols-2 gap-8 py-12 md:grid-cols-4">' + "".join(
        f'<li><p class="font-mono text-micro uppercase tracking-hud text-acid-ink">{t}</p><p class="mt-2 text-sm text-muted">{d}</p></li>' for t, d in perks) + "</ul></section>"


tiles = [("Genesis Drop", "Tiragem numerada", "model-hoodie.svg", "drops.html", False),
         ("Oversized Core", "Básico de alto padrão", "model-tee.svg", "loja.html#camisetas", False),
         ("Kits Squad", "Até 20% off", "model-cap.svg", "loja.html#kits", True)]
tiles_html = "".join(f"""<a href="{h}" class="tile relative block" data-cursor="view">
        <div class="studio aspect-[4/5] rounded-[22px]"><img class="photo" src="products/{img}" alt=""></div>
        <div class="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl {'bg-acid text-on-acid' if acc else 'bg-invert text-on-invert'} px-5 py-4">
          <span><span class="block font-display text-xl font-bold">{t}</span><span class="font-mono text-micro uppercase tracking-hud opacity-70">{s}</span></span><span aria-hidden="true">→</span>
        </div></a>""" for t, s, img, h, acc in tiles)

hero = P["obsidian-shell-hoodie"]
kit = P["kit-squad-3-tees"]
home = f"""
  <section class="wrap grid items-center gap-10 pb-16 pt-10 md:pt-14 lg:grid-cols-12 lg:gap-6 lg:pb-24">
    <div class="lg:col-span-7">
      <div class="fade-in mb-7 inline-flex items-center gap-3 rounded-full bg-acid px-3.5 py-1.5 font-mono text-micro font-bold uppercase tracking-hud text-on-acid"><i class="block size-1.5 animate-pulse rounded-full" style="background: var(--on-acid)"></i> Drop 001 · abre 10/10 às 20h</div>
      <h1 class="hero-title"><span class="reveal-line"><span>Drop</span></span><span class="reveal-line"><span>Genesis<span class="text-acid-ink">.</span></span></span></h1>
      <p class="fade-in mt-8 max-w-[40ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-relaxed text-muted">Streetwear de corte premium para quem vive o jogo. Tecido pesado, gola que não abre, preto que não desbota. <strong class="font-medium text-ink">{total} peças numeradas. Sem reposição.</strong></p>
      <div class="fade-in mt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
        {magnetic("loja.html", "Comprar o drop")}
        <a href="lookbook.html" class="font-mono text-label font-medium uppercase tracking-[0.16em] underline decoration-1 underline-offset-[6px] hover:text-acid-ink">Ver lookbook</a>
      </div>
    </div>
    <div class="fade-in relative lg:col-span-5">
      <a href="{url(hero)}" class="zoomable studio block aspect-[4/5] rounded-[28px]" data-cursor="view">
        <img class="photo" src="products/model-hoodie.svg" alt="Modelo vestindo o {hero['name']}">
        <span class="absolute left-5 top-5 font-mono text-micro uppercase tracking-hud text-muted">Nº 001 / 150</span>
        <span class="absolute bottom-5 left-5 rounded-full px-3 py-1.5 font-mono text-micro uppercase tracking-[0.14em] shadow-sm" style="background: var(--surface)">Veste: {hero['name']} · G</span>
      </a>
      <svg class="sticker pointer-events-none absolute -top-6 right-2 size-24 sm:-right-6 sm:size-32" viewBox="0 0 120 120" aria-hidden="true">
        <defs><path id="circ" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/></defs>
        <circle cx="60" cy="60" r="58" fill="#39FF14"/>
        <text font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700" letter-spacing="3" fill="#0B0B0B"><textPath href="#circ">EDIÇÃO LIMITADA ✦ SEM REPOSIÇÃO ✦</textPath></text>
        <text x="60" y="66" text-anchor="middle" font-family="Syne, sans-serif" font-size="20" font-weight="800" fill="#0B0B0B">001</text>
      </svg>
    </div>
  </section>

  <section class="border-y border-line" aria-label="Tecnologias do tecido">
    <ul class="wrap grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4">{''.join(f'<li><p class="font-display text-lg font-bold">{t}</p><p class="mt-1 text-sm text-muted">{d}</p></li>' for t, d in tech)}</ul>
  </section>

  <section class="wrap py-20 md:py-28">
    {section_head("Escolha sua classe", "Três linhas, um mesmo padrão de tecido.", '<a href="loja.html" class="font-mono text-label uppercase tracking-[0.16em] underline underline-offset-[6px] hover:text-acid-ink">Ver loja</a>')}
    <div class="grid gap-4 md:grid-cols-3">{tiles_html}</div>
  </section>

  <section class="wrap pb-20 md:pb-28">
    {section_head("Genesis Drop", "Cada peça sai numerada. Quando o contador zera, acabou.", f'<a href="drops.html" class="flex items-center gap-2 font-mono text-micro uppercase tracking-[0.16em] text-acid-ink"><i class="block size-1.5 animate-pulse rounded-full bg-acid"></i><span class="tick">{left} de {total} restantes</span></a>')}
    {grid(drop_items[:4])}
  </section>

  <section class="wrap pb-20 md:pb-28">
    <div class="grid overflow-hidden rounded-[28px] bg-invert text-on-invert md:grid-cols-2">
      <div class="flex flex-col justify-between gap-10 p-8 md:p-14">
        <div>
          <span class="font-mono text-micro uppercase tracking-hud opacity-70">Kits feitos pro squad</span>
          <h2 class="mt-4 font-display text-[clamp(1.9rem,3.6vw,3.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">3 oversized.<br>{discount(kit)}% off no kit.</h2>
          <p class="mt-5 max-w-[38ch] opacity-75">Preta, cimento e off-white no mesmo tamanho. Sai por {brl(kit['price'] / 3)} cada.</p>
        </div>
        <div class="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div><span class="tick block font-mono text-sm line-through opacity-60">{brl(kit['compareAt'])}</span><span class="tick font-display text-4xl font-extrabold">{brl(kit['price'])}</span><span class="tick block font-mono text-label opacity-70">ou 6x de {inst(kit['price'])} sem juros</span></div>
          <a href="{url(kit)}" class="btn-acid">Montar meu kit</a>
        </div>
      </div>
      <a href="{url(kit)}" aria-label="Ver o {e(kit['name'])}" class="tile studio relative grid aspect-[5/4] grid-cols-3 md:aspect-auto" style="border-radius:0" data-cursor="view">
        <div class="relative -mr-[30%]"><img src="products/model-hoodie.svg" alt=""></div><div class="relative z-[1]"><img src="products/model-tee.svg" alt=""></div><div class="relative -ml-[30%]"><img src="products/model-cap.svg" alt=""></div>
      </a>
    </div>
  </section>

  <section class="wrap pb-20 md:pb-28">
    {section_head("Lookbook Genesis", "Como o drop veste na rua.", '<a href="lookbook.html" class="font-mono text-label uppercase tracking-[0.16em] underline underline-offset-[6px] hover:text-acid-ink">Ver os 3 looks</a>')}
    <div class="grid gap-4 md:grid-cols-3">{''.join(f'<a href="lookbook.html#look-{l["n"]}" class="tile block" data-cursor="view"><div class="studio aspect-[3/4] rounded-[22px]"><img class="photo" src="products/{l["image"]}" alt="Look {l["n"]}"><span class="absolute left-4 top-4 font-mono text-micro uppercase tracking-hud text-muted">Look {l["n"]}</span></div><h3 class="mt-4 font-display text-xl font-bold">{l["name"]}</h3></a>' for l in C["looks"])}</div>
  </section>

  {perks_html()}
"""
page("index.html", "GEEK SWIN Genesis Luxe", "GEEK SWIN: gamer streetwear premium. Drop 001 Genesis com peças numeradas, frete grátis acima de R$ 349 e 6x sem juros.", "home", home)

# ---------------------------------------------------------------- LOJA

chips = '<button type="button" class="chip" data-cat="todos" aria-pressed="true">Todos</button>' + "".join(
    f'<button type="button" class="chip" data-cat="{c["slug"]}" aria-pressed="false">{c["name"]}</button>' for c in C["categories"])
shop = f"""
  <section class="wrap pb-20 pt-12 md:pt-16">
    <nav class="fade-in-fast mb-6 font-mono text-micro uppercase tracking-[0.16em] text-muted" aria-label="Você está em"><a href="{HOME}" class="inline-block py-2 hover:text-ink">Início</a> / <span class="text-ink" aria-current="page">Loja</span></nav>
    {section_head("Loja", "Drop Genesis e linha permanente. Tudo com o mesmo padrão de tecido.", '<span id="shop-count" class="tick font-mono text-micro uppercase tracking-[0.16em] text-muted" aria-live="polite"></span>', tag="h1")}
    <div class="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">{chips}</div>
      <label class="flex items-center gap-3 font-mono text-micro uppercase tracking-[0.14em] text-muted">Ordenar
        <select id="sort" class="rounded-full border border-line bg-surface px-4 py-2.5 text-label text-ink focus:border-ink">
          <option value="rel">Relevância</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option>
        </select></label>
    </div>
    <h2 class="sr-only">Peças</h2>
    <div id="shop-grid" class="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">{''.join(card(p, i) for i, p in enumerate(C['products']))}</div>
  </section>
  {perks_html()}
"""
page("loja.html", "Loja · GEEK SWIN", "Todas as peças da GEEK SWIN: moletons, camisetas, calças, acessórios e kits.", "loja", shop)

# ---------------------------------------------------------------- PRODUTOS

for p in C["products"]:
    off = discount(p)
    table = C["sizeTables"][p["sizeTable"]]
    sizes = "".join(
        f'<button type="button" role="radio" aria-checked="false" tabindex="-1" class="size-btn" data-size="{s}"'
        + (f' disabled aria-label="{s}, esgotado"' if s in p["soldOut"] else "") + f">{s}</button>" for s in p["sizes"])
    views = [("produto", p["image"], "Peça"), ("modelo", p["modelImage"], "No modelo"), ("detalhe", p["image"], "Detalhe")]
    mains = "".join(
        f'<img class="photo{" detail" if v == "detalhe" else ""}{" is-active" if i == 0 else ""}" data-view="{v}" src="products/{src}" alt="{e(p["name"])}, {lab.lower()}">'
        for i, (v, src, lab) in enumerate(views))
    thumbs = "".join(
        f'<button type="button" class="thumb studio aspect-[4/5]" data-view="{v}" aria-pressed="{"true" if i == 0 else "false"}" aria-label="Ver {lab.lower()}">'
        f'<img class="{"detail" if v == "detalhe" else ""}" src="products/{src}" alt=""></button>'
        for i, (v, src, lab) in enumerate(views))
    if p.get("edition"):
        pct = round(p["stockLeft"] / p["edition"] * 100)
        stock = f'<div><div class="flex justify-between font-mono text-micro uppercase tracking-[0.14em]"><span class="text-acid-ink">Restam {p["stockLeft"]} de {p["edition"]}</span><span class="text-muted">Sem reposição</span></div><div class="stock mt-2"><i style="width:{pct}%"></i></div></div>'
        kicker = f"Drop {C['drop']['number']} · {C['drop']['name']} · Nº {p['number']} / {p['edition']}"
    else:
        stock = f'<p class="font-mono text-micro uppercase tracking-[0.14em] text-muted">{"Drop " + C["drop"]["number"] + " · enquanto durar o estoque" if p.get("drop") else "Linha permanente · volta ao estoque sempre"}</p>'
        kicker = f"Drop {C['drop']['number']} · {C['drop']['name']} · Nº {p['number']}" if p.get("drop") else f"Linha permanente · Nº {p['number']}"
    rows = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in table["rows"])
    related = [P[s] for l in C["looks"] if p["slug"] in l["products"] for s in l["products"] if s != p["slug"]]
    related += [q for q in C["products"] if q["slug"] != p["slug"] and q not in related]
    pix = brl(p["price"] * (1 - C["pixDiscount"]))
    body = f"""
  <section id="pdp" data-slug="{p['slug']}" class="wrap pb-16 pt-8 md:pt-12">
    <nav class="mb-6 font-mono text-micro uppercase tracking-[0.16em] text-muted" aria-label="Você está em"><a href="{HOME}" class="inline-block py-2 hover:text-ink">Início</a> / <a href="loja.html" class="inline-block py-2 hover:text-ink">Loja</a> / <a href="loja.html#{p['category']}" class="inline-block py-2 hover:text-ink">{CAT[p['category']]}</a> / <span class="text-ink" aria-current="page">{e(p['name'])}</span></nav>
    <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div class="fade-in-fast lg:col-span-7">
        <div class="gallery-main zoomable studio aspect-[4/5] rounded-[28px]" data-cursor="view">{mains}
          {f'<span class="absolute left-4 top-4 rounded-full bg-acid px-3 py-1.5 font-mono text-micro font-bold uppercase tracking-[0.12em] text-on-acid">-{off}%</span>' if off else (f'<span class="absolute left-4 top-4 rounded-full bg-invert px-3 py-1.5 font-mono text-micro font-bold uppercase tracking-[0.12em] text-on-invert">{p["badge"]}</span>' if p.get("badge") else "")}
        </div>
        <div class="mt-4 grid grid-cols-3 gap-3 sm:w-2/3">{thumbs}</div>
      </div>

      <div class="lg:col-span-5">
        <div class="flex flex-col gap-7 lg:sticky lg:top-32">
          <div class="fade-in-fast">
            <p class="font-mono text-micro uppercase tracking-[0.16em] text-muted">{kicker}</p>
            <h1 class="mt-3 font-display text-[clamp(2rem,3.6vw,3.2rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">{e(p['name'])}</h1>
            <p class="mt-2 font-mono text-micro uppercase tracking-[0.14em] text-muted">{e(p['specs'])}</p>
          </div>
          <div class="fade-in-fast">
            <div class="flex flex-wrap items-baseline gap-x-3"><span class="tick font-display text-3xl font-extrabold">{brl(p['price'])}</span>{f'<span class="tick font-mono text-sm text-muted line-through">{brl(p["compareAt"])}</span>' if p.get('compareAt') else ''}</div>
            <p class="tick mt-1 text-sm text-muted">ou {C['installments']}x de {inst(p['price'])} sem juros · <strong class="font-medium text-ink">{pix} no Pix</strong></p>
          </div>
          {stock}
          <div id="sizes">
            <div class="mb-3 flex items-center justify-between font-mono text-micro uppercase tracking-[0.14em]"><span>Tamanho: <strong id="size-chosen" class="text-ink">escolha</strong></span><a href="#medidas" class="text-muted underline underline-offset-4 hover:text-ink" onclick="document.getElementById('medidas').open=true">Guia de medidas</a></div>
            <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Tamanho">{sizes}</div>
            <p id="size-error" hidden class="mt-3 text-sm" style="color: var(--danger)" role="alert">Escolha um tamanho para continuar.</p>
            <p class="mt-3 text-xs text-muted">{e(p['model'])}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            {f'<div data-presale class="sm:col-span-2 rounded-2xl border border-line bg-surface p-4 text-sm"><p class="font-mono text-micro font-bold uppercase tracking-[0.16em] text-acid-ink">Pré-venda</p><p class="mt-1 text-muted">Garanta a sua peça numerada agora. O drop abre {OPENS_LABEL} e o envio começa a partir de {SHIPS_FROM_LABEL}.</p></div>' if p.get("drop") else ""}
            <button id="main-add" type="button" data-add class="btn-ink">Adicionar à bag</button>
            <button type="button" data-buy class="btn-line">{'<span data-presale>Comprar na pré-venda</span><span data-after-open hidden>Comprar agora</span>' if p.get("drop") else 'Comprar agora'}</button>
          </div>
          <ul class="grid gap-2 text-sm text-muted">
            <li>✦ Frete grátis acima de R$ 349</li><li>✦ Troca grátis em 30 dias</li><li>✦ {'Peça numerada com certificado e QR' if p.get('edition') else 'Envio em até 2 dias úteis'}</li>
          </ul>
          <div>
            <details class="acc" open><summary>Descrição</summary><div class="acc-body">{e(p['description'])}</div></details>
            <details class="acc"><summary>Tecido e tecnologia</summary><div class="acc-body"><ul class="grid gap-1.5">{''.join(f'<li>· {e(f)}</li>' for f in p['fabric'])}</ul></div></details>
            <details class="acc" id="medidas"><summary>Tabela de medidas</summary><div class="acc-body"><p class="mb-3 text-xs">{table['label']}</p><div class="overflow-x-auto"><table class="size-table"><thead><tr>{''.join(f'<th>{c}</th>' for c in table['columns'])}</tr></thead><tbody>{rows}</tbody></table></div></div></details>
            <details class="acc"><summary>Cuidados</summary><div class="acc-body">Lave do avesso em água fria, com cores parecidas. Não use alvejante. Seque à sombra e passe em temperatura baixa, sem passar sobre a estampa.</div></details>
            <details class="acc border-b border-line"><summary>Envio e trocas</summary><div class="acc-body">{f"Peça do Drop {C['drop']['number']}: comprando na pré-venda (até {OPENS_LABEL}), o envio é a partir de {SHIPS_FROM_LABEL}. Depois da abertura, em até 2 dias úteis após a confirmação." if p.get("drop") else "Envio em até 2 dias úteis após a confirmação."} Frete grátis acima de R$ 349. A primeira troca é por nossa conta em até 30 dias, com a etiqueta e o lacre de numeração intactos.</div></details>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap pb-20 md:pb-28">
    {section_head("Complete o look", "Peças que foram feitas para andar juntas.")}
    {grid(related[:4])}
  </section>

  <div id="buy-bar" class="buy-bar fixed inset-x-0 bottom-0 z-40 border-t border-line lg:hidden" style="background: var(--surface); padding-bottom: env(safe-area-inset-bottom, 0px);">
    <div class="wrap flex items-center justify-between gap-4 py-3">
      <div class="min-w-0"><p class="truncate font-display font-bold">{e(p['name'])}</p><p class="tick text-sm text-muted">{brl(p['price'])}</p></div>
      <button type="button" data-add class="btn-ink shrink-0 !py-3">Adicionar</button>
    </div>
  </div>
"""
    page(url(p), f"{p['name']} · GEEK SWIN", f"{p['name']}: {p['specs']}. {brl(p['price'])} ou {C['installments']}x sem juros.", "loja", body)

# ---------------------------------------------------------------- LOOKBOOK

looks = ""
for i, l in enumerate(C["looks"]):
    items = [P[s] for s in l["products"]]
    rev = i % 2 == 1
    rows = "".join(f"""<li><a href="{url(q)}" class="flex items-center gap-4 border-b border-line py-3 hover:text-acid-ink">
        <span class="studio block size-16 shrink-0 rounded-xl"><img src="products/{q['image']}" alt=""></span>
        <span class="min-w-0 flex-1"><span class="block font-display font-bold">{e(q['name'])}</span><span class="tick font-mono text-micro uppercase tracking-[0.12em] text-muted">{brl(q['price'])}</span></span><span aria-hidden="true">→</span></a></li>""" for q in items)
    looks += f"""
    <article id="look-{l['n']}" class="grid items-center gap-8 py-12 md:grid-cols-12 md:gap-12 md:py-20">
      <div class="tile studio aspect-[3/4] rounded-[28px] md:col-span-6 {'md:order-2 md:col-start-7' if rev else ''}" data-cursor="view"><img class="photo" src="products/{l['image']}" alt="Look {l['n']}, {e(l['name'])}"></div>
      <div class="md:col-span-5 {'md:order-1' if rev else 'md:col-start-8'}">
        <p class="font-mono text-micro uppercase tracking-hud text-muted">Look {l['n']}</p>
        <h2 class="mt-3 font-display text-[clamp(2.4rem,5vw,4.4rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em]">{e(l['name'])}</h2>
        <p class="mt-4 max-w-[38ch] text-muted">{e(l['text'])}</p>
        <ul class="mt-8 border-t border-line">{rows}</ul>
        <p class="tick mt-4 font-mono text-micro uppercase tracking-[0.14em]">Look completo: {brl(sum(q['price'] for q in items))}</p>
      </div>
    </article>"""
lookbook = f"""
  <section class="wrap pt-12 md:pt-16">
    <nav class="mb-6 font-mono text-micro uppercase tracking-[0.16em] text-muted" aria-label="Você está em"><a href="{HOME}" class="inline-block py-2 hover:text-ink">Início</a> / <span class="text-ink" aria-current="page">Lookbook</span></nav>
    <h1 class="hero-title"><span class="reveal-line"><span>Lookbook</span></span><span class="reveal-line"><span>Genesis<span class="text-acid-ink">.</span></span></span></h1>
    <p class="fade-in mt-6 max-w-[44ch] text-muted">Três jeitos de vestir o Drop 001. Ilustrações provisórias, as fotos do ensaio entram aqui.</p>
  </section>
  <div class="wrap">{looks}</div>
  {perks_html()}
"""
page("lookbook.html", "Lookbook · GEEK SWIN", "Lookbook do Drop 001 Genesis: três looks com as peças da coleção.", "lookbook", lookbook)

# ---------------------------------------------------------------- DROPS

cd = "".join(f'<div class="min-w-0" aria-hidden="true"><span data-cd="{k}" class="block font-display text-[clamp(2.2rem,4.6vw,4.5rem)] font-extrabold leading-none{" text-acid-ink" if k == "s" else ""}">00</span><span class="font-mono text-micro uppercase tracking-[0.16em] text-muted">{n}</span></div>' for k, n in [("d", "dias"), ("h", "horas"), ("m", "min"), ("s", "seg")])
drops = f"""
  <section class="wrap pb-16 pt-12 md:pt-16">
    <nav class="mb-6 font-mono text-micro uppercase tracking-[0.16em] text-muted" aria-label="Você está em"><a href="{HOME}" class="inline-block py-2 hover:text-ink">Início</a> / <span class="text-ink" aria-current="page">Drops</span></nav>
    <div class="grid gap-10 lg:grid-cols-12 lg:items-end">
      <div class="lg:col-span-7">
        <span class="inline-flex items-center gap-2 rounded-full bg-acid px-3.5 py-1.5 font-mono text-micro font-bold uppercase tracking-hud text-on-acid"><i class="block size-1.5 animate-pulse rounded-full" style="background: var(--on-acid)"></i>Drop 001 · abre 10/10 às 20h</span>
        <h1 class="hero-title mt-6"><span class="reveal-line"><span>Drop 001</span></span><span class="reveal-line"><span>Genesis<span class="text-acid-ink">.</span></span></span></h1>
      </div>
      <div class="lg:col-span-5"><div class="tick grid max-w-full grid-cols-4 gap-3 sm:gap-5" role="timer" data-cd-summary aria-label="Contagem para o drop">{cd}</div></div>
    </div>
    <div class="mt-12 grid gap-4 rounded-[28px] border border-line p-6 sm:grid-cols-3 md:p-10">
      <div><p class="font-mono text-micro uppercase tracking-hud text-muted">Peças</p><p class="mt-2 font-display text-3xl font-extrabold">{len(drop_items)} modelos</p></div>
      <div><p class="font-mono text-micro uppercase tracking-hud text-muted">Tiragem numerada</p><p class="tick mt-2 font-display text-3xl font-extrabold">{left} de {total}</p></div>
      <div><p class="font-mono text-micro uppercase tracking-hud text-muted">Reposição</p><p class="mt-2 font-display text-3xl font-extrabold">Nenhuma</p></div>
    </div>
  </section>
  <section class="wrap pb-20">{section_head("Peças do drop", "Cada uma sai numerada. Quando o contador zera, acabou.")}{grid(drop_items)}</section>

  <section class="wrap pb-20 md:pb-28">
    {section_head("Próximos drops", "O calendário até o fim do ano. Quem está na lista entra uma hora antes.")}
    <ol class="grid gap-4 md:grid-cols-3">
      <li class="rounded-[22px] bg-invert p-8 text-on-invert"><p class="font-mono text-micro uppercase tracking-hud text-acid">Ao vivo em breve</p><p class="mt-6 font-display text-3xl font-extrabold uppercase">001 · Genesis</p><p class="mt-2 opacity-70">10 de outubro, 20h. Moletons, camisetas, cargo e acessórios.</p></li>
      <li class="rounded-[22px] border border-line p-8"><p class="font-mono text-micro uppercase tracking-hud text-muted">Dezembro de 2026</p><p class="mt-6 font-display text-3xl font-extrabold uppercase">002 · Respawn</p><p class="mt-2 text-muted">Jaquetas e peças de inverno. Detalhes saem na lista primeiro.</p></li>
      <li class="rounded-[22px] border border-dashed border-line p-8"><p class="font-mono text-micro uppercase tracking-hud text-muted">2027</p><p class="mt-6 font-display text-3xl font-extrabold uppercase" aria-label="003, nome ainda em segredo">003 · ▒▒▒▒▒</p><p class="mt-2 text-muted">Uma colab que ainda não podemos contar.</p></li>
    </ol>
    <div class="mt-10 grid gap-8 rounded-[28px] bg-acid p-8 text-on-acid md:grid-cols-2 md:items-center md:p-14">
      <h2 class="font-display text-[clamp(2rem,4.4vw,3.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">Entre na lista dos drops</h2>
      <div>
        <form data-signup="drops" data-success="drops-ok" class="flex flex-col gap-3 sm:flex-row" novalidate>
          <label for="drops-email" class="sr-only">Seu e-mail</label>
          <input id="drops-email" type="email" autocomplete="email" placeholder="seu@email.com" class="min-w-0 flex-1 rounded-full border border-black/20 bg-white/70 px-6 py-4 text-base text-on-acid placeholder:text-black/50 focus:bg-white">
          <button type="submit" class="rounded-full bg-invert px-7 py-4 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-invert">Quero acesso</button>
          <p data-error hidden class="text-sm font-medium" role="alert">Digite um e-mail válido.</p>
        </form>
        <p id="drops-ok" hidden class="font-display text-2xl font-extrabold uppercase" role="status">Você está na lista ✓</p>
      </div>
    </div>
  </section>
"""
page("drops.html", "Drops · GEEK SWIN", "Calendário de drops da GEEK SWIN e contagem regressiva do Drop 001 Genesis.", "drops", drops)

# ---------------------------------------------------------------- SOBRE + CONTATO

faq = [("Como funciona a pré-venda?", f"Até {OPENS_LABEL}, as peças do Drop {C['drop']['number']} são vendidas na pré-venda: você paga agora, garante o número da sua peça e o envio começa a partir de {SHIPS_FROM_LABEL}. Se desistir antes do envio, devolvemos o valor integral."),
       ("Quando meu pedido chega?", "Postamos em até 2 dias úteis. Capitais do Sudeste recebem em 2 a 4 dias úteis; o restante do Brasil, em 4 a 9."),
       ("Como funciona a troca?", "Você tem 30 dias. A primeira troca é por nossa conta, desde que a etiqueta e o lacre de numeração estejam intactos."),
       ("Qual tamanho eu escolho?", "Nossa modelagem é oversized. Se gosta de caimento justo, peça um número abaixo. Cada página de produto tem a tabela com as medidas da peça."),
       ("O que é a numeração da peça?", "Cada peça de drop sai com número (ex.: 037/150) e um QR na etiqueta que confirma a autenticidade."),
       ("Vai ter reposição do Genesis?", "Não. Peças de drop não voltam. A linha permanente, como a GG/WP Core Tee, é reposta sempre.")]
about = f"""
  <section class="wrap pb-16 pt-12 md:pt-16">
    <nav class="mb-6 font-mono text-micro uppercase tracking-[0.16em] text-muted" aria-label="Você está em"><a href="{HOME}" class="inline-block py-2 hover:text-ink">Início</a> / <span class="text-ink" aria-current="page">Sobre</span></nav>
    <h1 class="hero-title"><span class="reveal-line"><span>Vestir o</span></span><span class="reveal-line"><span>jogo<span class="text-acid-ink">.</span></span></span></h1>
    <div class="fade-in mt-12 grid gap-10 md:grid-cols-12">
      <p class="font-display text-[clamp(1.4rem,2.6vw,2.2rem)] font-semibold leading-[1.15] md:col-span-7">A GEEK SWIN nasceu de uma pergunta simples: por que a roupa de quem vive games ainda parece fantasia? A gente faz streetwear de corte premium com a língua da comunidade, sem caricatura.</p>
      <div class="studio aspect-[4/5] rounded-[28px] md:col-span-4 md:col-start-9"><img src="products/model-cap.svg" alt=""></div>
    </div>
  </section>
  <section class="border-y border-line"><ul class="wrap grid gap-10 py-14 md:grid-cols-3">
    <li><p class="font-mono text-micro uppercase tracking-hud text-acid-ink">Autenticidade</p><p class="mt-3 text-muted">Referências de quem joga de verdade. Nada de estampa genérica de controle.</p></li>
    <li><p class="font-mono text-micro uppercase tracking-hud text-acid-ink">Tecido primeiro</p><p class="mt-3 text-muted">520 g/m² no moletom, 280 g/m² na camiseta. Peça que aguenta a sessão longa e 50 lavagens.</p></li>
    <li><p class="font-mono text-micro uppercase tracking-hud text-acid-ink">Drop culture</p><p class="mt-3 text-muted">Tiragens numeradas e sem reposição. Quando acaba, vira arquivo.</p></li>
  </ul></section>
  <section id="faq" class="wrap py-20 md:py-28">
    <div class="grid gap-10 md:grid-cols-12">
      <h2 class="section-title md:col-span-4">Perguntas frequentes</h2>
      <div class="md:col-span-7 md:col-start-6">{''.join(f'<details class="acc"><summary>{q}</summary><div class="acc-body">{a}</div></details>' for q, a in faq)}<div class="border-t border-line"></div></div>
    </div>
  </section>
  <section id="contato" class="wrap pb-20 md:pb-28">
    <div class="grid gap-8 rounded-[28px] bg-invert p-8 text-on-invert md:grid-cols-3 md:p-14">
      <h2 class="font-display text-[clamp(2rem,4vw,3.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em] md:col-span-1">Fale com a gente</h2>
      <dl class="grid gap-6 sm:grid-cols-2 md:col-span-2">
        <div><dt class="font-mono text-micro uppercase tracking-hud text-acid">WhatsApp</dt><dd class="mt-2 select-all font-display text-xl font-bold">(11) 90000-0000</dd><dd class="text-sm opacity-70">Seg a sex, 9h às 18h</dd></div>
        <div><dt class="font-mono text-micro uppercase tracking-hud text-acid">E-mail</dt><dd class="mt-2 select-all font-display text-xl font-bold">contato@geekswin.com.br</dd><dd class="text-sm opacity-70">Resposta em até 1 dia útil</dd></div>
        <div><dt class="font-mono text-micro uppercase tracking-hud text-acid">Instagram e TikTok</dt><dd class="mt-2 select-all font-display text-xl font-bold">@geekswin</dd></div>
        <div><dt class="font-mono text-micro uppercase tracking-hud text-acid">Discord</dt><dd class="mt-2 font-display text-xl font-bold">Clube GEEK SWIN</dd><dd class="text-sm opacity-70">Acesso para quem já comprou</dd></div>
      </dl>
    </div>
    <p class="mt-4 font-mono text-micro uppercase tracking-[0.14em] text-muted">Contatos fictícios do protótipo. Troque pelos reais antes de publicar.</p>
  </section>
"""
page("sobre.html", "Sobre · GEEK SWIN", "Sobre a GEEK SWIN, perguntas frequentes e contato.", "sobre", about)

# ---------------------------------------------------------------- BAG

upsell = [P["lag-zero-socks"], P["respawn-cap"], P["ggwp-core-tee"], P["kit-squad-3-tees"]]
bag = f"""
  <section class="wrap pb-16 pt-12 md:pt-16">
    <nav class="mb-6 font-mono text-micro uppercase tracking-[0.16em] text-muted" aria-label="Você está em"><a href="{HOME}" class="inline-block py-2 hover:text-ink">Início</a> / <span class="text-ink" aria-current="page">Bag</span></nav>
    <div id="bag-empty" class="py-16 text-center" hidden>
      <h1 class="section-title">Sua bag está vazia</h1>
      <p class="mt-4 text-muted">O Drop 001 tem {total} peças numeradas. Quando acabar, não volta.</p>
      <a href="loja.html" class="btn-ink mt-8">Ir para a loja</a>
    </div>
    <div id="bag-full" class="grid gap-12 lg:grid-cols-12">
      <div class="lg:col-span-7">
        <div class="flex items-end justify-between border-b border-line pb-6"><h1 class="section-title">Sua bag</h1><span id="bag-count-title" class="tick font-mono text-micro uppercase tracking-[0.16em] text-muted"></span></div>
        <ul id="bag-list"></ul>
      </div>
      <aside class="lg:col-span-5" aria-label="Resumo do pedido">
        <div class="rounded-[28px] p-7 lg:sticky lg:top-32 md:p-9" style="background: var(--surface)">
          <p id="free-msg" class="tick font-mono text-micro uppercase tracking-[0.14em] text-acid-ink"></p>
          <div class="stock mt-3"><i id="free-bar" style="width:0%"></i></div>
          <dl class="mt-8 grid gap-3 text-sm">
            <div class="flex justify-between"><dt class="text-muted">Subtotal</dt><dd id="bag-sub" class="tick"></dd></div>
            <div class="flex justify-between"><dt class="text-muted">Frete</dt><dd id="bag-ship"></dd></div>
            <div class="flex items-baseline justify-between border-t border-line pt-4"><dt class="font-mono text-label font-bold uppercase tracking-[0.14em]">Total</dt><dd id="bag-total" class="tick font-display text-3xl font-extrabold"></dd></div>
          </dl>
          <p id="bag-inst" class="tick mt-1 text-right text-sm text-muted"></p>
          <p id="bag-pix" class="tick text-right text-sm font-medium"></p>
          <p id="bag-presale" hidden class="mt-6 rounded-2xl border border-line p-4 text-sm text-muted">Sua bag tem peças em pré-venda. O drop abre {OPENS_LABEL} e o pedido inteiro é enviado a partir de {SHIPS_FROM_LABEL}.</p>
          <button id="checkout" type="button" class="btn-ink mt-8 w-full">Finalizar compra</button>
          <div id="checkout-note" hidden class="mt-4 rounded-2xl border border-line p-4 text-sm text-muted" role="status">Este é um protótipo: o pagamento ainda não está ligado. Na versão real, este botão leva ao checkout (cartão, Pix e cálculo de frete).</div>
          <ul class="mt-6 grid gap-1.5 text-xs text-muted"><li>✦ Troca grátis em 30 dias</li><li>✦ Pagamento seguro · 6x sem juros · 5% off no Pix</li></ul>
        </div>
      </aside>
    </div>
  </section>
  <section class="wrap pb-20 md:pb-28">
    {section_head("Leve também", "Peças que combinam com qualquer look.")}
    {grid(upsell)}
  </section>
"""
page("carrinho.html", "Bag · GEEK SWIN", "Sua bag na GEEK SWIN.", "bag", bag, no_popup=True)

# ---------------------------------------------------------------- dados para o JS
(HERE / "assets/catalog.js").write_text("/* Gerado por build.py a partir de data/catalog.json. Não edite à mão. */\nwindow.GS_CATALOG = " + json.dumps(C, ensure_ascii=False) + ";\n")
print("ok:", len(C["products"]), "produtos +", 6, "páginas")
