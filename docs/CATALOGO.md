# Catálogo: como cadastrar sem mexer em código

Tudo o que a loja vende e mostra sai de **`src/lib/catalog.json`**. Os tipos com comentários estão em `src/lib/catalog.ts`, `src/lib/commerce/bundles.ts` e `src/lib/commerce/benefits.ts`.

Fluxo: edite o JSON no GitHub (botão de lápis) ou no editor → `npm test` → commit → o deploy gera as páginas.
O teste `tests/unit/catalog.test.ts` funciona como um painel de validação. Ele quebra se houver slug repetido, categoria inexistente, kit apontando para peça que não existe, imagem faltando, preço "de" menor que o preço, periférico de terceiro sem fabricante ou título de SEO repetido.

## Por que não há painel de catálogo (CMS)

- Hoje são 8 peças e 1 drop por mês. Um painel completo (login, upload, banco de catálogo, permissões, pré-visualização) custa semanas e cria uma segunda fonte de verdade.
- O JSON no git já dá histórico, revisão, desfazer e deploy automático, de graça.
- O que muda todo dia **já é no painel** (`/admin`): pedidos, estoque por tamanho e demanda de "avise-me".
- **Quando trocar:** se outra pessoa (não técnica) for cadastrar peças toda semana, ligue o **Decap CMS** (gratuito, edita este mesmo JSON pelo navegador, com login do GitHub). É meio dia de trabalho, e as páginas não mudam.

## Peça (`products[]`)

| Campo | Para que serve |
|---|---|
| `slug` | URL `/product/<slug>`. Não troque depois de publicar |
| `category` | categoria principal: breadcrumb e listagem canônica |
| `categories` | categorias secundárias (ex.: boné também em Acessórios) |
| `price`, `compareAt` | preço; `compareAt` só se a peça **já foi vendida** por esse valor. Com ele a peça entra em `/shop/sale` |
| `drop`, `edition` | número do drop (ou null = linha Core) e tiragem numerada |
| `sizes`, `sizeTable` | tamanhos e tabela de medidas |
| `attrs` | filtros reais: `modelagem`, `modelo`, `tipo`, `marca`... Só valores verdadeiros |
| `tags` | termos extras para a busca |
| `pairsWith` | combinações escolhidas à mão (somam aos looks do drop no "Complete o look") |
| `featured`, `rank` | destaque e ordem editorial |
| `status` | `published`; `draft` ou `hidden` tiram do site, da busca, do sitemap e do checkout |
| `maker` | **periféricos e itens de terceiros**: `brand`, `authored: false`, `warranty`, `compatibility`, `specs`. A página mostra "Produto {marca}, vendido pela GEEK SWIM" e a ficha técnica |

Estoque **não** fica no catálogo. Ele é definido no `/admin` (vazio = sob demanda).

## Categoria (`categories[]`)

`slug` (URL `/shop/<slug>`), `name` (H1), `seoTitle` (até 70 caracteres), `description` (meta description, 50 a 170), `headline`, `intro`, `art`, `highlights` (três pares título/texto), `facets` (filtros que a página oferece), `role` (`top`, `bottom`, `head`, `accessory`, `setup`, `pack`; é o que impede o "Complete o look" de sugerir duas calças) e `spotlight`, o bloco da personalidade:

- `looks`: camisetas e moletons
- `silhouettes`: calças, comparação de modelos
- `details`: bonés
- `types`: acessórios
- `specs`: periféricos
- `bundles`: kits

**Categoria sem peça** continua com página (estado vazio + "me avise quando chegar"). Ela fica fora do menu principal, do sitemap e do índice do Google (`noindex`), e volta sozinha quando a primeira peça for publicada.

## Listagens especiais (`listings[]`)

`novidades` (`days`: a janela do último lote), `core` (coleção) e `sale` (só existe com `compareAt` real).

## Looks do drop (`drops[].looks[]`)

`{ n, name, products, text }`. Os looks alimentam o "Complete o look" (primeira escolha), o Loadout (`/loadout?look=001-03`) e as recomendações.

## Kit (`bundles[]`)

```json
{ "slug": "starter-loadout", "name": "Starter Loadout", "tagline": "...",
  "slots": [ { "label": "Camiseta", "products": ["phantom-frame-tee", "ggwp-core-tee"] },
             { "label": "Boné", "categories": ["bones"], "qty": 1 } ],
  "discount": null, "active": true, "startsAtUTC": null, "endsAtUTC": null }
```

- `discount: null` → o kit custa a soma das peças, e a loja **não** fala em economia.
- `{ "kind": "percent", "value": 10 }` (teto de 50%) ou `{ "kind": "fixed", "value": 30 }` (reais). A economia mostrada é a real.
- Um espaço sem peça publicada esconde o kit inteiro. É o caso do SETUP DROP enquanto não houver periféricos.

## Acesso antecipado (`drops[].earlyAccess`)

```json
"earlyAccess": { "enabled": true, "opensAtUTC": "2026-11-07T23:00:00Z", "audience": "list", "sources": ["drop-002"] }
```

`list` = quem está na lista (dessas fontes) e não se descadastrou. `customers` = quem já tem pedido pago. A regra é conferida no servidor. Quem não tem acesso vê "acesso antecipado" e o botão de entrar na conta, nunca uma "área VIP" de mentira.

## Benefício progressivo (`commerce.benefits[]`)

```json
{ "id": "frete-gratis", "kind": "free_shipping", "enabled": true, "label": "Frete grátis",
  "threshold": 349, "shippingOptions": ["economico"], "regions": null, "categories": null,
  "excludeProducts": [], "startsAtUTC": null, "endsAtUTC": null, "stacksWithCoupon": true,
  "messages": { "before": "Faltam {gap} para o frete grátis na opção Econômico.",
                "after": "Frete grátis desbloqueado na opção Econômico.",
                "condition": "Frete grátis na opção Econômico acima de {threshold}{regions}." } }
```

- `kind: "discount"` usa `percent` **ou** `amount` (reais) no lugar de `shippingOptions`.
- `regions`: `["sudeste", "PR"]` (regiões ou UFs, pelo CEP).
- `stacksWithCoupon: false`: vale o maior entre a regra e o cupom.
- Com `enabled: false` (ou fora do prazo), a regra some da barra da bag, do anúncio do topo, da ajuda e dos termos.
