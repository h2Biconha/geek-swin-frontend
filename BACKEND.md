# Back-end: o que o front espera

Este documento é o contrato entre o front (pronto) e o back (a fazer). Os endpoints são **sugestões**: se preferir outro formato, mude aqui e no arquivo do front indicado em "Onde o front liga em cada coisa".

O front já está preparado: cada integração é **uma variável de ambiente**. Sem ela, a interface roda em prévia e diz isso ao cliente. Com ela, chama a URL.

## Antes de codar: construir ou plugar?

1. **Plataforma como motor (headless)**: Shopify (Storefront API) ou Nuvemshop. Checkout, Pix, parcelamento, antifraude, nota fiscal e estoque vêm prontos; o back só faz a ponte. Menos código e menos risco, com mensalidade mais taxa por venda.
2. **Back próprio**: Postgres + gateway (Mercado Pago ou Stripe) + frete (Melhor Envio). Mais controle e mais trabalho; segurança, antifraude e LGPD ficam por sua conta.

Os contratos abaixo servem para os dois: no caso 1, as rotas `/api/*` do Next viram adaptadores da plataforma.

## Regras que valem para qualquer caminho

- **Preço e estoque vêm sempre do servidor.** O front manda `slug`, `size` e `qty`; o servidor recalcula tudo.
- Valores em **centavos inteiros** no back. O front usa reais e calcula Pix e parcela em centavos (`src/lib/catalog.ts`).
- Regras comerciais em `catalog.json > commerce`: frete grátis a partir de R$ 349 (`freeShippingFrom`), 6x sem juros (`installments`), 5% no Pix (`pixDiscount`). Pix = `total - round(total × 0,05)`, em centavos.
- Peças de drop são numeradas (`edition`) e **sem reposição**. Peças Core (`drop: null`) podem repor.
- Nunca inventar estoque, avaliação ou foto de cliente. Se o dado não existe, o front mostra o estado vazio.

## Pré-venda (decidido em 03/10/2026)

Antes de `drop.opensAtUTC` (`2026-10-10T23:00:00Z`, 20h de Brasília), quem compra peça de um drop com `presale: true` está na pré-venda. O front mostra isso no card, na página, na bag e no checkout, e para sozinho quando o drop abre. Envio a partir de `drop.shipsFrom` (`2026-10-14`, **data provisória, confirme com o Henrique**).

O back precisa garantir:

1. **Estoque:** a pré-venda consome a mesma tiragem. O número da peça (ex.: 037/150) é atribuído no pagamento confirmado, em ordem.
2. **Reserva:** curta durante o pagamento, baixa definitiva no webhook de pago. Nunca vender acima de `edition`.
3. **Pagamento:** cobrado na hora. Guarde `presale: true` e `ships_from` no pedido.
4. **Envio:** pedido com item de pré-venda sai inteiro a partir de `shipsFrom` (é o que a bag promete, em `src/components/layout/CartDrawer.tsx`).
5. **E-mails:** confirmação dizendo que é pré-venda e a data de envio; aviso quando postar.
6. **Cancelamento:** reembolso integral antes do envio (prometido em `/help#pre-venda`). Depois de receber, 7 dias de arrependimento (CDC).
7. **Atraso:** se passar de `shipsFrom`, avisar e oferecer cancelamento com estorno.

## Modelo de dados (mínimo)

```
Product      slug (PK), number, name, category, price_cents, compare_at_cents?, color, specs, drop?, edition?,
             size_table, description, fabric[], fit, media[], added_at, rank, featured
Stock        product_slug, size, qty                     -- esgotado = qty 0
Drop         number (PK), slug, name?, tagline, opens_at, closes_at?, presale, ships_from?, ...textos
Order        id, status (pending|paid|canceled|shipped|refunded), presale, ships_from?, customer (email, name, cpf, phone),
             address, items[], subtotal_cents, shipping_cents, discount_cents, total_cents, payment_method,
             installments?, coupon?, provider, provider_ref, created_at
Reservation  product_slug, size, qty, order_id, expires_at
Subscriber   email (unique), whatsapp?, source, product?, size?, consent_at, ip, unsubscribed_at?
Customer     email (unique), name, level (0..3), created_at          -- para conta e GEEK LEVEL
Wishlist     customer_email, product_slug, created_at                -- opcional; hoje vive no navegador
Review       id, product_slug, order_id, rating, text, size_bought, fit, photo?, approved_at   -- só de compra verificada
```

Os tipos que o front lê estão em `src/lib/catalog.ts` (`Product`, `Drop`, `Review`, `Media`).

## catalog.json (v2): formato que a API deve devolver

```jsonc
{
  "site": { "preview": true, "previewNote": "..." },          // preview=false tira os avisos de estoque ilustrativo
  "commerce": { "freeShippingFrom": 349, "installments": 6, "pixDiscount": 0.05 },
  "categories": [{ "slug": "moletons", "name": "Moletons" }],
  "sizeTables": { "top": { "label": "...", "columns": [...], "rows": [[...]] } },
  "drops": [{
    "number": "001", "slug": "001-insert-coin", "name": "INSERT COIN", "tagline": "...", "quote": "...",
    "concept": "...", "manifesto": [], "story": [], "opensAtUTC": "2026-10-10T23:00:00Z", "closesAtUTC": null,
    "presale": true, "shipsFrom": "2026-10-14", "heroArt": "/art/hoodie-line.svg", "heroMedia": null,
    "gallery": [], "video": null, "looks": [{ "name": "Ranked", "items": ["slug", "slug"] }]
  }],
  "products": [{
    "slug": "obsidian-shell-hoodie", "number": "001", "name": "Obsidian Shell Hoodie", "category": "moletons",
    "price": 389.9, "compareAt": null, "color": "Preto", "specs": "...", "drop": "001", "edition": 150,
    "stockLeft": 37, "sizes": ["P","M","G","GG","XG"], "soldOut": ["P"], "sizeTable": "top",
    "addedAt": "2026-10-03", "rank": 1, "featured": true,
    "media": [{ "src": "/art/hoodie-front.svg", "view": "Frente" }],   // foto real: { "src": "/fotos/x.jpg", "alt": "...", "view": "Modelo" }
    "description": "...", "fabric": ["..."], "fit": "..."
  }],
  "reviews": [],                                   // { id, product, name, rating, text, size?, date, verified: true }
  "community": { "instagram": "geekswim", "posts": [] }   // { src, alt, view } só com autorização escrita de quem aparece
}
```

Fase do drop (calculada no front em `dropPhase`, a partir das datas): `coming-soon` (sem data), `presale`, `upcoming`, `live`, `sold-out`, `closed`.
Status da peça (`availability`): `available`, `low` (poucas unidades, limites `LOW_ABS`/`LOW_PCT` em `catalog.ts`), `sold-out`, `coming-soon`.

## Endpoints

### Catálogo

`GET /api/products` devolve `products` no formato acima, com `stockLeft` e `soldOut` já calculados. `GET /api/products/:slug` devolve um produto ou `404`. `GET /api/drops` devolve `drops`.

As páginas de produto e de drop são geradas no build (`generateStaticParams` + `dynamicParams = false`). Com a API, use `revalidate` (ISR) para texto e preço e busque **estoque no cliente**.

### Estoque em tempo real

`GET /api/stock?slugs=obsidian-shell-hoodie,respawn-cap`

```json
{ "obsidian-shell-hoodie": { "P": 0, "M": 4, "G": 12, "GG": 9, "XG": 12 }, "respawn-cap": { "Único": 64 } }
```

O front usa isso para riscar tamanhos, atualizar "Restam X" e marcar itens indisponíveis na bag (`isUnavailable` em `src/lib/cart.ts`).

### Lista (e-mail e WhatsApp)

`POST {NEXT_PUBLIC_SUBSCRIBE_URL}` (sugestão: `/api/subscribe`, já existe respondendo 501)

```json
{ "email": "nome@gmail.com", "whatsapp": "11987654321", "consent": true, "source": "aviso-drop-002",
  "product": "obsidian-shell-hoodie", "size": "P" }
```

`whatsapp`, `product` e `size` são opcionais. `source` diz de onde veio: `lobby` (rodapé), `aviso-drop-<n>` (próximo drop), `drop-abertura` (aviso não bloqueante), `members`, `avise-me` (tamanho/peça esgotada, com `product` e `size`).
Respostas: `201` cadastrado, `200` já estava (não é erro), `400 { "error": "email_invalido" }`, `429`. Guarde `consent_at`, ofereça descadastro em todo envio (LGPD) e só mande WhatsApp para quem informou o número com consentimento.

### Frete

`POST {NEXT_PUBLIC_SHIPPING_URL}` (sugestão: `/api/shipping/quote`)

```json
{ "cep": "01310100" }
```

```json
{ "options": [ { "id": "pac", "name": "Econômico", "days": "6 a 9 dias úteis", "price": 0 },
               { "id": "sedex", "name": "Expresso", "days": "2 a 4 dias úteis", "price": 39.9 } ] }
```

A regra de grátis acima de R$ 349 é aplicada no servidor. O endereço é preenchido pelo ViaCEP no navegador (público, sem chave).

### Checkout

`POST {NEXT_PUBLIC_CHECKOUT_URL}` (sugestão: `/api/checkout`, já existe respondendo 501). Tipos em `src/lib/commerce/types.ts`.

```json
{ "items": [{ "slug": "obsidian-shell-hoodie", "size": "G", "qty": 1 }],
  "customer": { "email": "nome@gmail.com", "name": "Nome Sobrenome", "cpf": "52998224725", "phone": "11987654321" },
  "address": { "cep": "01310100", "street": "Avenida Paulista", "number": "1000", "complement": "", "district": "Bela Vista", "city": "São Paulo", "state": "SP" },
  "shippingId": "pac", "payment": { "method": "pix", "installments": 1 }, "coupon": "OPCIONAL" }
```

O servidor valida itens e estoque, recalcula preço, frete, desconto Pix e cupom, cria o pedido `pending`, reserva as peças (sugestão: 10 min) e cria o pagamento pelo adaptador de `PAYMENT_PROVIDER`.

Resposta de sucesso (uma das duas formas):

```json
{ "orderId": "GS-000128", "redirectUrl": "https://www.mercadopago.com.br/checkout/..." }
{ "orderId": "GS-000128", "pix": { "qrCode": "data:image/png;base64,...", "copyPaste": "000201...", "expiresAt": "2026-10-10T23:30:00Z" } }
```

Erros: `409` sem estoque (o front pede para revisar a bag), `400 { "error": "dados_invalidos", "message": "..." }`, `402 { "error": "pagamento_recusado", "message": "..." }`.

### Pagamento (adaptadores)

`src/lib/commerce/providers/index.ts` (marcado `server-only`) define a interface `PaymentProvider` com `createPayment` e `verifyWebhook`. Implemente:

- **Mercado Pago** (`PAYMENT_PROVIDER=mercadopago`, `MERCADOPAGO_ACCESS_TOKEN`): Pix com QR e copia e cola, cartão em até 6x sem juros, boleto. SDK `mercadopago`.
- **Stripe** (`PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`): cartão, Pix e boleto no Brasil. SDK `stripe`.

`POST /api/webhooks/payment`: chamado pelo gateway, nunca pelo front. Valide a assinatura (`PAYMENT_WEBHOOK_SECRET`). Pago: pedido `paid`, reserva vira baixa, número da peça atribuído, e-mail enviado. Expirado ou recusado: libera a reserva.

`GET /api/orders/:id`: status para a tela de confirmação e para a conta.

### Cupom

`POST /api/coupon { "code": "X", "subtotal": 389.9 }` → `{ "ok": true, "discount": 38.99, "message": "10% aplicado" }` ou `{ "ok": false, "message": "Cupom inválido ou expirado." }`. O valor final é sempre recalculado no checkout. Front: `validateCoupon` em `src/lib/commerce/checkout.ts`.

### Conta, GEEK LEVEL e members

Login sem senha (link mágico por e-mail) é o recomendado. Endpoints sugeridos: `POST /api/auth/link`, `GET /api/me` (nome, e-mail, nível, drops que tem, pedidos, endereços), `PUT /api/me/sizes` (tamanhos favoritos, hoje em `localStorage`).
Níveis em `src/lib/levels.ts`: PLAYER (criou conta), MEMBER (primeira compra entregue), OG (peças de 3 drops), LEGEND (6 drops ou convite). Calcule no servidor a partir dos pedidos entregues. O acesso antecipado de MEMBER (1 h antes do drop) precisa ser checado **no checkout**, não só escondido na interface.

### Wishlist

Hoje fica no navegador (`gs-wishlist`). Com conta: `GET/PUT /api/me/wishlist` e mesclar a lista local no primeiro login. O "avisar-me" de peça esgotada usa a lista (`source: "avise-me"`).

### Analytics

`src/lib/analytics.ts` envia para `dataLayer` (GTM) e `fbq` (Meta Pixel) só se `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_META_PIXEL_ID` existirem. Eventos: `view_item`, `add_to_cart`, `add_to_wishlist`, `search`, `begin_checkout`, `sign_up`. Falta `purchase`, que deve sair da página de confirmação com o pedido pago (ou via Conversions API no webhook). Exige banner de cookies antes de ligar (LGPD).

## Onde o front liga em cada coisa

| Arquivo | Hoje | Para ligar |
|---|---|---|
| `src/lib/subscribe.ts` | responde `not_connected` | `NEXT_PUBLIC_SUBSCRIBE_URL` |
| `src/lib/commerce/checkout.ts` | demonstração (não cobra) | `NEXT_PUBLIC_CHECKOUT_URL`, `NEXT_PUBLIC_SHIPPING_URL` |
| `src/lib/commerce/providers/` | lança "não implementado" | adaptador Mercado Pago ou Stripe |
| `src/lib/catalog.json` + `catalog.ts` | JSON importado | buscar a API no servidor com `revalidate` |
| `src/components/product/BuyBox.tsx` | `soldOut`/`stockLeft` do JSON | `/api/stock` ao abrir a página |
| `src/components/views/AccountView.tsx` | conta de exemplo | `/api/auth/link` e `/api/me` |
| `src/lib/brand.ts` | `whatsapp`, `cnpj` nulos | dados reais (o site passa a exibir) |
| `src/lib/cart.ts` | bag no `localStorage` (`gs-cart`) | pode continuar; o servidor valida no checkout |

## Segurança e variáveis

- Segredos só em variáveis do servidor (lista em `.env.example`). Nada secreto com prefixo `NEXT_PUBLIC_`.
- Webhook com assinatura; rotas públicas com rate limit; captcha invisível se aparecer spam.
- Antes de vender: política de privacidade, termos, política de trocas, CNPJ e contato reais no rodapé e em `/help`.
