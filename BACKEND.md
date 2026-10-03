# Back-end: o que o front espera

Este documento é o contrato entre o front (pronto) e o back (a fazer). Os endpoints são **sugestões**: se você preferir outro formato, mude aqui e avise quem mexe no front, porque os pontos de troca estão listados no fim.

## Antes de codar: construir ou plugar?

Duas saídas, com custos bem diferentes:

1. **Plataforma como motor (headless)**: Shopify (Storefront API) ou Nuvemshop (API). Checkout, Pix, parcelamento, antifraude, nota fiscal e estoque já vêm prontos; o back só faz a ponte. Menos código e menos risco, com taxa mensal mais taxa por venda.
2. **Back próprio**: banco (Postgres), gateway (Mercado Pago, Pagar.me ou Stripe), frete (Melhor Envio). Mais controle e mais trabalho, e segurança, antifraude e LGPD ficam por sua conta.

Os contratos abaixo servem para os dois casos: no 1, as rotas `/api/*` do Next viram adaptadores para a API da plataforma.

## Regras que valem para qualquer caminho

- **Preço e estoque vêm sempre do servidor.** O front manda só `slug`, `size` e `qty`; o servidor recalcula tudo. Nunca confie em preço vindo do navegador.
- Valores em **centavos inteiros** no back (`38990`, não `389.9`). O front hoje usa reais com casas decimais e converte.
- Parcelamento: 6x sem juros, parcela = `floor(total_em_centavos / 6)`. Pix: 5% de desconto. Frete grátis a partir de R$ 349,00. Hoje esses números estão em `catalog.json` (`installments`, `pixDiscount`, `freeShippingFrom`).
- Peças do drop são numeradas (`edition`) e **sem reposição**: estoque zerado é definitivo.
- Drop abre em `drop.opensAtUTC` (`2026-10-10T23:00:00Z`, 20h de Brasília). **Decisão em aberto:** antes disso o produto pode ser comprado (pré-venda) ou fica bloqueado? Hoje o front deixa adicionar à bag.

## Modelo de dados (mínimo)

```
Product   slug (PK), number, name, category, price_cents, compare_at_cents?, badge?, specs,
          image, model_image, drop (bool), edition?, size_table, description, fabric[], model_note
Stock     product_slug, size, qty                 -- soldOut = qty 0
Order     id, status (pending|paid|canceled|shipped), email, cep, items[], subtotal_cents,
          shipping_cents, discount_cents, total_cents, payment_method, created_at
Reservation  product_slug, size, qty, order_id, expires_at   -- segura a peça durante o pagamento
Subscriber   email (unique), source, consent_at, ip, unsubscribed_at?
```

O formato de `Product` que o front lê está em `src/lib/products.ts` (tipo `Product`) e os dados de exemplo em `src/lib/catalog.json`.

## Endpoints

### Catálogo

`GET /api/products` → lista de produtos, mesmo formato de `catalog.json > products`, com o estoque já somado.

```json
[{ "slug": "obsidian-shell-hoodie", "number": "001", "name": "Obsidian Shell Hoodie",
   "category": "moletons", "price": 389.9, "compareAt": 449.9, "edition": 150, "stockLeft": 37,
   "sizes": ["P","M","G","GG","XG"], "soldOut": ["P"], "...": "demais campos do catalog.json" }]
```

`GET /api/products/:slug` → um produto, ou `404`.

As páginas de produto são geradas no build (`generateStaticParams`). Com catálogo vindo da API, use `revalidate` (ISR) para preço e texto, e busque **estoque no cliente** (abaixo), que muda a cada venda.

### Estoque em tempo real

`GET /api/stock?slugs=obsidian-shell-hoodie,respawn-cap`

```json
{ "obsidian-shell-hoodie": { "P": 0, "M": 4, "G": 12, "GG": 9, "XG": 12 },
  "respawn-cap": { "Único": 64 } }
```

O front usa isso para riscar tamanhos esgotados e atualizar "Restam X de Y".

### Lista de e-mails

`POST /api/subscribe`

```json
{ "email": "nome@gmail.com", "source": "popup-drop-001", "consent": true }
```

Respostas: `201` cadastrado · `200` já estava na lista (não trate como erro) · `400 { "error": "email_invalido" }` · `429` excesso de tentativas.

`source` vem de onde a pessoa se cadastrou: `popup-drop-001`, `pagina-drops`, `rodape`. Guarde `consent_at` e ofereça descadastro em todo e-mail (LGPD). Coloque rate limit por IP e um captcha invisível se aparecer spam.

### Frete

`POST /api/shipping/quote`

```json
{ "cep": "01310-100", "items": [{ "slug": "obsidian-shell-hoodie", "size": "G", "qty": 1 }] }
```

```json
{ "options": [
  { "id": "pac", "name": "PAC", "days": 7, "price": 0, "free": true },
  { "id": "sedex", "name": "SEDEX", "days": 2, "price": 32.9, "free": false } ] }
```

A regra de grátis acima de R$ 349 é aplicada aqui, no servidor.

### Checkout

`POST /api/checkout`

```json
{ "items": [{ "slug": "obsidian-shell-hoodie", "size": "G", "qty": 1 }],
  "email": "nome@gmail.com", "cep": "01310-100", "shippingId": "pac", "paymentMethod": "pix" }
```

O servidor: valida itens e estoque, recalcula preço, frete e desconto Pix, cria o `Order` como `pending`, reserva as peças (sugestão: 10 minutos) e cria o pagamento no gateway.

```json
{ "orderId": "ord_123", "total": 370.41, "checkoutUrl": "https://gateway.exemplo/pagar/abc" }
```

Erros: `409 { "error": "sem_estoque", "items": [{ "slug": "...", "size": "P", "available": 0 }] }` (o front avisa e remove da bag) · `400` dados inválidos.

### Confirmação do pagamento

`POST /api/webhooks/payment`: chamado pelo gateway, nunca pelo front. Valide a assinatura do gateway. Quando pago, `Order → paid`, a reserva vira baixa definitiva de estoque e sai o e-mail de confirmação. Pagamento expirado ou recusado libera a reserva.

`GET /api/orders/:id` → status do pedido para a página de "obrigado" (rota ainda não existe no front).

## Onde o front troca o mock pela API

| Arquivo | Hoje | Trocar por |
|---|---|---|
| `src/lib/subscribe.ts` | espera 600 ms e finge sucesso | `fetch("/api/subscribe")` (o código já está no comentário do arquivo) |
| `src/lib/products.ts` + `src/lib/catalog.json` | importa o JSON | buscar `/api/products` no servidor (com `revalidate`) |
| `src/components/BuyBox.tsx` | usa `soldOut` e `stockLeft` do JSON | consultar `/api/stock` ao abrir a página |
| `src/components/CartView.tsx` | botão "Finalizar compra" desligado, frete "Calculado no checkout" | campo de CEP com `/api/shipping/quote` e botão chamando `/api/checkout`, redirecionando para `checkoutUrl` |
| `src/lib/cart.ts` | bag só no `localStorage` | pode continuar assim; o servidor valida tudo no checkout |

## Segurança e variáveis

- Chaves (gateway, serviço de e-mail, banco) só em `.env.local` / variáveis do servidor. Nada com prefixo `NEXT_PUBLIC_` que seja segredo.
- Nomes sugeridos estão em `.env.example`.
- Webhook com verificação de assinatura; endpoints públicos com rate limit.
- Antes de vender: política de privacidade, termos, política de trocas (o CDC garante 7 dias de arrependimento em compra online), e CNPJ e contato reais no site.
