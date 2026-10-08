# GEEK SWIM · Streetwear nascido da cultura gamer

Front-end da loja da GEEK SWIM, organizado em drops numerados. A loja tem uma página editorial por produto, checkout em 4 etapas, wishlist, área de conta e GEEK LEVEL.
**O front está pronto. O back-end ainda não existe.** Tudo o que está simulado aparece na própria interface como "Prévia" e está listado abaixo. Os contratos para o back estão em [BACKEND.md](BACKEND.md).

## Rodar

Precisa de Node 20 ou mais novo.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # build de produção (27 páginas estáticas)
npm run lint
npm run art          # regenera os desenhos técnicos das peças em public/art/
npm run standalone   # gera standalone-dist/ABRIR-GEEK-SWIN.html (abre com duplo clique, sem servidor)
```

Copie `.env.example` para `.env.local` só quando for ligar algum serviço. Sem nenhuma variável, o site funciona inteiro em modo prévia.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind CSS 4 com tokens em `src/app/globals.css` (sem arquivo de config) |
| Animação | Só CSS (transições, keyframes e um IntersectionObserver). Respeita `prefers-reduced-motion` |
| Fontes | Archivo variável (peso e largura) + JetBrains Mono, via `next/font` |
| Dados | `src/lib/catalog.json`, a fonte única até existir API |

## Rotas

| Rota | O que é |
|---|---|
| `/` | Home: hero do drop, peças, como funcionam os drops, próximo drop, members, comunidade, lobby |
| `/shop` | Todas as peças. Filtros (drop, categoria, tamanho, preço, disponível) e ordenação na URL, sem recarregar |
| `/product/[slug]` | Página editorial da peça: galeria com zoom, tamanhos, guia de medidas, pré-venda, avisar-me |
| `/drops` | Linha do tempo dos drops e arquivo das peças esgotadas |
| `/drops/[slug]` | Landing do drop (`001-insert-coin`, `002`) |
| `/wishlist` | Peças salvas no navegador |
| `/account` | MINHA GEEK SWIM: login (prévia) e conta de exemplo com GEEK LEVEL |
| `/members` | Programa de membros e níveis |
| `/about` | Manifesto |
| `/help` | Envio, trocas, pré-venda, pagamento e contato |
| `/checkout` | Checkout em 4 etapas (dados, entrega, pagamento, revisão) |
| 404 | "Player not found" |

Os endereços antigos (`/loja`, `/produto/*`, `/sobre`, `/lookbook`, `/carrinho`) redirecionam para os novos em `next.config.ts`.

## Estrutura

```
src/app/                     rotas, metadata, sitemap, robots, imagem de compartilhamento
src/app/api/                 subscribe e checkout (respondem 501 até o back existir)
src/components/ui/           design system: botões, Modal, Drawer, Media, Countdown, Accordion...
src/components/product/      card, grid, galeria, seletor de tamanho, guia de medidas, BuyBox
src/components/drop/         hero, timeline, próximo drop, "por que drops"
src/components/layout/       header, menu, busca, bag, rodapé, loading, aviso de drop
src/components/views/        uma view por página (usadas pelo Next E pelo arquivo único)
src/lib/catalog.json         peças, preços, estoque, tamanhos, drops, reviews, comunidade
src/lib/catalog.ts           tipos e regras: preço, parcela, Pix, status de estoque, fase do drop
src/lib/brand.ts             nome da marca e contatos (troque o nome aqui e muda no site todo)
src/lib/commerce/            cliente do checkout, frete, cupom e adaptadores de pagamento (servidor)
src/lib/cart.ts · wishlist.ts  bag e wishlist no navegador
src/lib/subscribe.ts         lista de e-mail/WhatsApp (não conectada)
src/lib/analytics.ts         eventos para GTM/Meta Pixel (só disparam se os IDs existirem)
scripts/draw-flats.mjs       gera os desenhos técnicos das peças (SVG)
scripts/build-standalone.mjs gera o arquivo único, com scripts/standalone/ (rota no hash)
docs/                        auditoria e direção, lista de fotos
```

## O que é prévia (mock)

Nada disso finge funcionar. A interface avisa em cada ponto.

| Item | Hoje | Para ligar |
|---|---|---|
| Catálogo, preço e estoque | `catalog.json` (estoque ilustrativo, `site.preview: true`) | API ou plataforma. Ver BACKEND.md > Catálogo e Estoque |
| Lista (lobby, aviso de drop, avisar-me, members) | valida e diz "não conectado" | `NEXT_PUBLIC_SUBSCRIBE_URL` + rota `/api/subscribe` |
| Checkout | modo demonstração: percorre as 4 etapas e não cobra nada | `NEXT_PUBLIC_CHECKOUT_URL` + `/api/checkout` + adaptador Mercado Pago ou Stripe |
| Frete | valores de exemplo; CEP real via ViaCEP | `NEXT_PUBLIC_SHIPPING_URL` (Melhor Envio/Correios) |
| Cupom | sempre recusa com aviso de prévia | validação no servidor |
| Conta e GEEK LEVEL | conta de exemplo, login desligado | auth (link mágico por e-mail) + pedidos |
| Reviews e fotos da comunidade | vazios, com estado honesto | só publicar avaliações e fotos reais e autorizadas |
| Fotos das peças | desenhos técnicos em SVG | fotos reais, ver [docs/FOTOS.md](docs/FOTOS.md) |
| CNPJ, WhatsApp, e-mail | `null` em `brand.ts` (o site esconde o que é nulo) | dados reais antes de vender |

## Regras de design

- Cores só pelos tokens de `globals.css` (`bg`, `fg`, `muted`, `line`, `accent`, `danger`...). Nada de hex solto no JSX.
- O acento (Hyperlink Blue `#2E2EFF`) é para ação e estado. Em fundo escuro, texto usa `accent-fg` (`#A6A6FF`).
- Seções escuras usam a classe `theme-dark`, que troca os tokens. Os componentes não precisam saber disso.
- Texto pequeno: `text-micro` (11px), `text-label`, `text-small`. Nunca menos que 11px.
- Números do catálogo (tiragem, restantes, desconto Pix, parcela) são calculados, nunca digitados em texto.
- Nunca inventar estoque, avaliação, foto de cliente ou depoimento. Sem dado real, o estado vazio aparece.

## Qualidade verificada

- Build de produção sem erros, `eslint` e `tsc` limpos.
- Sem rolagem horizontal em 375, 390, 430, 768, 1024, 1440 e 1920 px nas 13 páginas.
- axe-core (WCAG 2.1 AA) sem violações.
- Fluxos testados no celular: tamanho obrigatório, bag, guia de medidas, busca, menu, filtros, wishlist e checkout completo.
