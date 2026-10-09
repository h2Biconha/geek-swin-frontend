# Back-end da GEEK SWIM

O back-end mora **dentro do próprio Next** (rotas em `src/app/api/*`, regras em `src/server/*`). Não existe serviço separado. Este documento é o guia para quem vai continuar: como roda, o que já está pronto, o que falta configurar e o que **não foi testado contra serviços reais**.

> Estado em 09/10/2026: pedidos, estoque, reserva, Pix e cartão via Mercado Pago, webhook, conta por link mágico, lista de avisos, painel e e-mails estão implementados e cobertos por testes locais (PGlite + Mercado Pago simulado). **Nada foi testado com credenciais reais do Mercado Pago, Resend, Neon ou Melhor Envio.**

## 1. Modos da loja

`NEXT_PUBLIC_STORE_MODE` decide tudo. É lido **no build** (o Next embute variáveis `NEXT_PUBLIC_`), então trocar o modo exige novo build.

| Modo | Banco | Pagamento | Uso |
|---|---|---|---|
| `preview` (padrão) | nenhum | nenhum | vitrine. Toda rota `/api/*` da loja responde 503 e a interface diz "prévia". É o modo do arquivo único |
| `test` | PGlite local (ou `DATABASE_URL`) | `mock` (botões "simular") ou Mercado Pago com credenciais de teste | desenvolvimento, e2e, homologação |
| `live` | Postgres obrigatório | Mercado Pago obrigatório | venda real. `src/server/env.ts > configProblems()` recusa operar se faltar banco, `APP_SECRET`, Mercado Pago, Resend ou https |

`GET /api/health` mostra o modo e o que falta configurar (sem expor valores).

## 2. Rodar local com back-end

```bash
cp .env.example .env.local
# no .env.local: NEXT_PUBLIC_STORE_MODE=test  e  ADMIN_PASSWORD=uma-senha-longa
npm run dev
```

Sem `DATABASE_URL`, o banco é um Postgres em WebAssembly (PGlite) gravado em `.data/pglite`. As migrações rodam sozinhas no primeiro acesso. Para zerar: apague `.data/`.

Fluxo de teste: adicione uma peça, finalize com Pix e, na página do pedido, use **Simular pagamento aprovado**. Isso passa pelo mesmo `applyPaymentUpdate` do webhook real. Login: em modo teste com e-mail `console`, a tela de conta mostra o link mágico (em produção ele só vai por e-mail).

Painel: `/admin` com `ADMIN_PASSWORD`.

## 3. Mapa do código

```
src/server/env.ts            variáveis, modos e checagem de configuração
src/server/db/               conexão (pg ou PGlite), migrações (só ADICIONE no fim), singleton
src/server/inventory.ts      estoque: reserva atômica, baixa, liberação, sincronização com o catálogo
src/server/orders.ts         cotação, criação de pedido, confirmação de pagamento, visão pública
src/server/payments/         mercadopago.ts (REST, sem SDK), mock.ts (só modo teste), index.ts
src/server/shipping.ts       frete: tabela do catálogo ou Melhor Envio
src/server/email.ts          console ou Resend; modelos de e-mail
src/server/auth.ts           link mágico, sessão (cookie httpOnly), admin
src/server/security.ts       hash/HMAC, mesma origem (CSRF), rate limit, leitura de JSON com limite
src/server/http.ts           storeRoute(): 503 em prévia, 403 fora da origem, 500 sem vazar detalhe
src/server/validation.ts     zod: checkout, cotação, itens
src/lib/commerce/pricing.ts  cálculo de preço PURO, usado no navegador (prévia) e no servidor (autoridade)
src/lib/catalog.json         catálogo e regras comerciais (commerce.*)
```

Novo drop ou peça: edite `src/lib/catalog.json` (formato em `src/lib/catalog.ts`). Páginas, sitemap, busca, filtros, estoque (`syncCatalog`) e JSON-LD se ajustam sozinhos. A fase do drop (em breve, pré-venda, próximo, ao vivo, esgotado, arquivo) é calculada pelas datas e pelo estoque real (`dropPhase`), com `status` opcional para forçar.

## 4. Rotas

| Rota | Método | O que faz |
|---|---|---|
| `/api/health` | GET | modo e pendências de configuração |
| `/api/stock?slugs=a,b` | GET | disponível por tamanho e por tiragem (null = sob demanda/sem limite) |
| `/api/checkout/quote` | POST | itens + CEP + método → linhas, frete, cupom, Pix, problemas de estoque. Não reserva |
| `/api/checkout` | POST | cria pedido. Header `Idempotency-Key` (16 a 80 caracteres). 201 / 400 campos / 409 sem estoque ou fora de venda / 502 gateway |
| `/api/orders/:id?t=token` | GET | visão do pedido. Token do link OU sessão com o mesmo e-mail; senão 404. Se pendente, consulta o gateway (no máximo a cada 15 s) |
| `/api/webhooks/mercadopago` | POST | valida `x-signature`, deduplica, **consulta a API** e aplica o estado |
| `/api/dev/mock-payment` | POST | só `test` + `mock`: simula aprovado/recusado |
| `/api/subscribe` | POST | lista (201 novo, 200 já estava). Honeypot `website`, rate limit, grava data e texto do consentimento |
| `/api/unsubscribe` | POST | sai da lista com token assinado (página `/unsubscribe`) |
| `/api/auth/link` | POST | envia link mágico (15 min, uso único) |
| `/api/auth/callback?token=` | GET | troca o link por sessão (cookie `gs_session`, 30 dias) |
| `/api/auth/logout` · `/api/me` | POST · GET | sair · cliente e pedidos (inclusive os feitos antes de criar conta, pelo e-mail) |
| `/api/admin/session` | POST/DELETE | entrar/sair do painel (cookie `gs_admin`, 12 h) |
| `/api/admin/orders` · `/api/admin/orders/:id` | GET · PATCH | lista; `ship` (com rastreio), `deliver`, `cancel` (pendente), `note` |
| `/api/admin/inventory` | GET/PATCH | estoque bruto; define estoque físico por tamanho (não aceita abaixo de vendido + reservado) |

Toda rota que muda estado exige `Origin` igual ao site (CSRF). Erro inesperado responde 500 genérico; o detalhe fica só no log, sem dados do comprador.

## 5. Regras de dinheiro e estoque

- **Preço vem do catálogo, nunca do navegador.** O cliente manda `slug`, `size`, `qty`; o servidor recalcula com `computeTotals()`. Teste: `tests/integration/orders.test.ts > preço enviado pelo navegador é ignorado`.
- Centavos inteiros. Ordem: subtotal → cupom → desconto Pix (só sobre itens, não sobre frete) → frete.
- Duas travas, ambas por `UPDATE ... WHERE disponível >= qtd` (atômico, sem corrida):
  - `inventory` por tamanho: `stock` null = **produção sob demanda** (sem limite físico, caso de Savvy Print/Dimona). Número = unidades físicas.
  - `editions` por peça de drop: teto da tiragem numerada (`edition` no catálogo).
- Reserva de `commerce.reservationMinutes` (30) ao criar o pedido. Vencida, o pedido vira `expired` e a peça volta (liberação preguiçosa a cada leitura; ver "O que ainda não existe").
- Pagamento confirmado → reserva vira venda e **cada peça recebe seu número** (`order_items.edition_from/to`), na ordem de confirmação.
- Pago depois de expirar: tenta vender do disponível; se não houver peça, o pedido vai para `needs_review` e o admin recebe e-mail para estornar.
- Valor pago diferente do total → `needs_review`.
- Confirmação repetida não faz nada (idempotente). O e-mail de pago sai uma vez.

Status do pedido: `pending → paid → shipped → delivered`, ou `pending → expired | canceled`, `paid → refunded`, e `needs_review` (manual).

## 6. Mercado Pago (o que configurar)

Implementado em `src/server/payments/mercadopago.ts`, via REST:

- **Pix**: API de Orders (`POST /v1/orders`, `processing_mode: automatic`, `X-Idempotency-Key`). O QR e o copia e cola aparecem na página do pedido, com contagem até expirar.
- **Cartão**: Checkout Pro (`POST /checkout/preferences`), só cartão, até `commerce.installments` parcelas, expira junto com a reserva. A pessoa digita o cartão no ambiente do Mercado Pago. **O site nunca recebe dado de cartão.**
- **Confirmação**: só pelo webhook assinado + consulta à API (`GET /v1/orders/:id` ou `/v1/payments/:id`), ou pela consulta ativa da página do pedido. O retorno do navegador (`back_urls`) nunca marca pago.

Passo a passo:

1. mercadopago.com.br/developers → Suas integrações → criar aplicação (Checkout Pro + Checkout API via Orders).
2. Copie o **Access Token de teste** para `MERCADOPAGO_ACCESS_TOKEN`, `PAYMENT_PROVIDER=mercadopago`, `NEXT_PUBLIC_STORE_MODE=test`.
3. Webhooks → URL `https://SEU-DOMINIO/api/webhooks/mercadopago`, eventos **Order** e **Pagamentos**. Copie a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`.
4. Teste com os usuários e cartões de teste da documentação do Mercado Pago. Para receber webhook localmente, use um túnel (ex.: `cloudflared tunnel --url http://localhost:3000`) e ponha a URL pública em `NEXT_PUBLIC_SITE_URL`.
5. Só depois: credenciais de produção e `NEXT_PUBLIC_STORE_MODE=live`.

**Não verificado contra a API real** (a rede do ambiente onde isto foi escrito bloqueia o Mercado Pago): formato exato das respostas de Orders em produção, `statement_descriptor`, comportamento de `expiration_date_to` no Checkout Pro. Os testes usam respostas simuladas com os campos da documentação (`tests/integration/webhook.test.ts`). Faça um pagamento de teste ponta a ponta antes de abrir.

## 7. Outros serviços

| Serviço | Variáveis | Estado |
|---|---|---|
| Postgres (Neon recomendado: tem plano grátis e é serverless) | `DATABASE_URL`; em produção `DB_AUTO_MIGRATE=false` + `npm run db:migrate` no deploy | migrações testadas em PGlite; **não testado em Neon** |
| E-mail transacional (Resend) | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` (domínio verificado com SPF/DKIM) | implementado, **não testado com conta real** |
| Frete (Melhor Envio) | `SHIPPING_PROVIDER=melhorenvio`, `MELHORENVIO_TOKEN`, `SHIP_FROM_CEP` | adaptador escrito pela documentação pública, **não testado**. Pesos e medidas por categoria (`shipping.ts > PACK`) são estimativas. Sem ele vale a tabela `commerce.shippingTable` |
| Hospedagem | Vercel (ou qualquer Node 22.12+) | `next build && next start`. Defina as variáveis do `.env.example` |
| Medição | `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | carregam só depois do aceite no aviso de cookies. `purchase` sai uma vez por pedido, na página do pedido pago |

## 8. Pendências que não são código

- Confirmar com a produção (Savvy Print/Dimona ou outra): composição, gramatura, medidas, prazo. Depois, `site.specsConfirmed: true` no catálogo (tira os avisos "em validação").
- Confirmar regras comerciais em `catalog.json > commerce`: troca em 30 dias, frete grátis acima de R$ 349, 6x sem juros, 5% no Pix, tabela de frete, prazo de postagem (`handlingDays`) e envio do Drop 001 a partir de 14/10.
- Tiragens (`edition`) do Drop 001: hoje 150 / 300 / 200 / 200. Confirme antes de abrir; depois de vender, só aumente.
- Dados da empresa em `src/lib/brand.ts`: CNPJ, razão social, WhatsApp, e-mail. Encarregado de dados (LGPD) na política de privacidade.
- Revisão jurídica de `/privacy` e `/terms` (marcados como versão preliminar).
- Nota fiscal: não implementada. Emita pelo emissor da empresa a partir do painel (ou integre Bling/Tiny depois).

## 9. O que ainda não existe

- **Cron**: a liberação de reservas vencidas é preguiçosa (acontece a cada leitura de estoque ou pedido). Para e-mail de "Pix expirou" ou relatórios, crie um cron (Vercel Cron) chamando uma rota protegida.
- Avaliações de compra verificada (tabela e convite pós-entrega). Hoje a seção some quando não há avaliação.
- Envio de campanhas para a lista: exporte `subscribers` com `unsubscribed_at is null` para a ferramenta de e-mail marketing e inclua o link de descadastro (`unsubscribeLink()`).
- Estorno pelo painel (hoje: estorne no Mercado Pago; o webhook muda o pedido para `refunded`).
- Cupons pelo painel (hoje: SQL, exemplo em `src/server/coupons.ts`).
- Favoritos e tamanhos salvos no servidor (hoje ficam no navegador).

## 10. Testes

```bash
npm test          # unidade + integração (PGlite em memória, Mercado Pago simulado): preço, fases do drop,
                  # validações, assinatura do webhook, reserva, idempotência, tiragem, expiração, rotas
npm run e2e       # navegador (Playwright) contra build de produção em modo teste: compra com Pix de teste,
                  # peça esgotada, busca vazia, formulário inválido, teclado, axe (WCAG 2.2 AA), SEO, 375 a 1920 px
npm run check     # lint + tipos + testes + build
```

O e2e sobe o próprio servidor na porta 3100 com um banco novo em `.data/e2e`. Numa máquina sem o Chromium do Playwright, rode `npx playwright install chromium` antes.
