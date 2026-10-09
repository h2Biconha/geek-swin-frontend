# GEEK SWIM · Streetwear nascido da cultura gamer

Loja da GEEK SWIM, organizada em drops numerados. Next.js com front e back-end no mesmo projeto: catálogo, drops com fases reais, bag, checkout com Pix e cartão pelo Mercado Pago, pedidos, estoque com reserva, conta por link mágico, lista de avisos, painel e LGPD.

**Hoje o site está em modo prévia**: nada é salvo nem cobrado, e a interface diz isso. Para ligar a loja, veja [BACKEND.md](BACKEND.md).

## Rodar

Precisa de Node 22.12 ou mais novo.

```bash
npm install
npm run dev          # http://localhost:3000 (modo prévia)
npm run check        # lint + tipos + testes + build
npm test             # unidade e integração
npm run e2e          # navegador (Playwright), sobe servidor de teste na porta 3100
npm run db:migrate   # aplica migrações no banco de DATABASE_URL (ou no PGlite local)
npm run standalone   # gera standalone-dist/ABRIR-GEEK-SWIM.html (abre com duplo clique, sem servidor)
npm run art          # regenera os desenhos técnicos das peças em public/art/
```

Para testar compras sem cobrar nada: `cp .env.example .env.local`, troque para `NEXT_PUBLIC_STORE_MODE=test` e rode `npm run dev`. O pagamento de teste é simulado na página do pedido.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind CSS 4 com tokens em `src/app/globals.css` |
| Movimento | Só CSS (transições e animação ligada à rolagem). Respeita `prefers-reduced-motion` |
| Fontes | Archivo variável (peso e largura) + JetBrains Mono, via `next/font` |
| Dados | `src/lib/catalog.json` (catálogo e regras comerciais) + Postgres (pedidos, estoque, lista) |
| Pagamento | Mercado Pago (Pix pela API de Orders, cartão pelo Checkout Pro), REST sem SDK |
| Testes | Vitest (unidade e integração com PGlite) + Playwright + axe-core |

## Rotas

| Rota | O que é |
|---|---|
| `/` | Home: hero do drop, peças, manifesto, como funcionam os drops, linha Core, próximo drop |
| `/shop` | Todas as peças. Busca (`?q=`), filtros e ordenação na URL |
| `/product/[slug]` | Peça: galeria com zoom, tamanhos reais, guia de medidas, pré-venda, avise-me, barra fixa no celular |
| `/drops` · `/drops/[slug]` | Linha do tempo, arquivo de esgotados e página de cada drop |
| `/checkout` | Dados, entrega e pagamento (Pix ou cartão). Total sempre calculado no servidor |
| `/order/[id]` | Status do pedido, Pix com QR e copia e cola, confirmação |
| `/account` | Login por link no e-mail, pedidos, favoritos, tamanhos salvos |
| `/wishlist` | Favoritos (no navegador) |
| `/about` · `/help` | Manifesto · envio, trocas, pré-venda, pagamento e contato |
| `/privacy` · `/terms` | Política de privacidade e termos (versão preliminar) |
| `/unsubscribe` · `/admin` | Sair da lista · painel da loja |

Endereços antigos (`/loja`, `/produto/*`, `/sobre`, `/lookbook`, `/carrinho`, `/members`, `/arquivo`) redirecionam em `next.config.ts`.

## Estrutura

```
src/app/                 rotas, metadata, sitemap, robots, imagem de compartilhamento
src/app/api/             back-end (ver BACKEND.md)
src/server/              regras do servidor: banco, estoque, pedidos, pagamento, e-mail, auth, segurança
src/components/ui/       design system: botões, Modal, Drawer, Countdown, Accordion, Price, StockMeter...
src/components/product/  card, grid, galeria, seletor de tamanho, guia de medidas, BuyBox
src/components/drop/     hero, vitrine do drop, timeline, próximo drop, "por que drops"
src/components/layout/   header, menu, busca, bag, rodapé, aviso de cookies
src/components/views/    uma view por página (usadas pelo Next e pelo arquivo único)
src/lib/catalog.*        catálogo, tipos e regras (fase do drop, disponibilidade, preço)
src/lib/commerce/        preço puro (cliente e servidor), tipos e cliente da API de checkout
src/lib/consent.ts       escolha de cookies; analytics.ts só envia evento com consentimento
tests/                   unit/, integration/ (Vitest) e e2e/ (Playwright)
docs/                    auditoria, decisões da reconstrução, lista de fotos
```

## Regras que não se quebram

- Nada de estoque, avaliação, foto de cliente, desconto "de/por" ou dado técnico inventado. Sem dado real, a interface mostra o estado vazio ou "em validação".
- Preço, frete, cupom e estoque são decididos no servidor. O navegador só mostra.
- Pedido só vira pago por confirmação do gateway (webhook + consulta). Nunca pelo retorno do navegador.
- Nenhum script de terceiros antes do consentimento de cookies.
- Cores só pelos tokens de `globals.css`; seções escuras usam `theme-dark`. Texto nunca menor que 11 px.

## Qualidade medida em 09/10/2026

- `eslint`, `tsc` e build de produção limpos.
- 42 testes de unidade e integração e 28 testes de navegador passando (ver BACKEND.md > Testes).
- axe-core (WCAG 2.0/2.1/2.2 A e AA) sem violações sérias em 13 páginas.
- Sem rolagem horizontal em 375, 768, 1024, 1440 e 1920 px.
- Lighthouse (laboratório, celular simulado, servidor local): ver [docs/03-RECONSTRUCAO.md](docs/03-RECONSTRUCAO.md#desempenho). Não é dado de usuários reais.
