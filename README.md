# GEEK SWIN · Luxury Gamer Streetwear

Front-end da loja da GEEK SWIN: vitrine clara, drop numerado, página por produto e bag.
O front está pronto; **o back-end ainda não existe**. Tudo o que hoje é simulado está listado abaixo e detalhado em [BACKEND.md](BACKEND.md).

## Rodar

Precisa de Node 20 ou mais novo.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção (gera as 8 páginas de produto estáticas)
npm run lint
```

Copie `.env.example` para `.env.local` quando o back-end começar a usar variáveis.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind CSS 4 lendo `tailwind.config.ts` via `@config` |
| Animação | framer-motion 14, scroll suave com `lenis/react` |
| Dados | `src/lib/catalog.json` (fonte única, sem banco) |

## Estrutura

```
src/app/                  rotas: / · /loja · /produto/[slug] · /lookbook · /drops · /sobre · /carrinho
src/lib/catalog.json      catálogo: peças, preços, estoque, tamanhos, tabelas de medidas, looks, data do drop
src/lib/products.ts       tipos e funções de preço (6x, Pix, desconto, relacionados)
src/lib/cart.ts           bag no navegador (localStorage "gs-cart")
src/lib/subscribe.ts      cadastro de e-mail (simulado)
src/lib/motion.ts         curvas e tempos das animações
src/components/           componentes de UI
public/products/          imagens ilustrativas (SVG) das peças e modelos
prototipo/                versão HTML estática do mesmo site (abre com dois cliques, gerada por build.py)
docs/GUIA-NEXTJS.md       guia de uso do front (como adicionar peça, trocar fotos, popup etc.)
```

## O que é de mentira (mock)

| Item | Onde está hoje | O que o back precisa fazer |
|---|---|---|
| Catálogo e preços | `src/lib/catalog.json` | servir via API ou CMS |
| Estoque ("Restam 37 de 150") | número fixo no JSON | estoque real, baixa a cada venda paga |
| Cadastro de e-mail (popup, rodapé, /drops) | `src/lib/subscribe.ts` finge sucesso | salvar com consentimento (LGPD) |
| Bag | `localStorage` no navegador | carrinho no servidor ao iniciar o checkout |
| Checkout | botão "Finalizar compra" desligado em `src/components/CartView.tsx` | pagamento (Pix, cartão parcelado) |
| Frete | só a regra "grátis acima de R$ 349" no front | cálculo por CEP |
| Contatos, CNPJ e fotos | textos fictícios em `/sobre` e no rodapé | dados reais |

## Acessibilidade e design

O site passou por auditoria WCAG 2.1 AA (axe-core sem violações em todas as rotas, desktop e celular). Regras para manter:

- Cores só pelos tokens do `tailwind.config.ts` (`text-danger`, `text-acid-ink`...), nada de hex solto no JSX.
- Verde neon `acid` só como fundo, com texto preto. Texto verde usa `acid-ink`.
- Texto pequeno usa a escala `text-micro` (11px), `text-label` (12px) e `text-small` (13px). Não use tamanhos abaixo de 11px.
- Toda imagem dentro de link precisa de nome acessível (`aria-label` no link ou `alt` na imagem).
- Números que vêm do catálogo (tiragem, desconto) são calculados, nunca digitados no texto.
