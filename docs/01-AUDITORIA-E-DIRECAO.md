# GEEK SWIM · Auditoria do site atual e nova direção

Data: 08/10/2026. Base auditada: este repositório (commit `60e8f0f`, "Pré-venda do Drop 001 até a abertura").

## 1. O que existe hoje

| Item | Situação |
|---|---|
| Stack | Next.js 16.3.8 (App Router) + React 19.2 + TypeScript, Tailwind 4 via `@config`, framer-motion 14, lenis (scroll suave) |
| Páginas | `/` · `/loja` · `/produto/[slug]` (8, SSG) · `/lookbook` · `/drops` · `/sobre` · `/carrinho` |
| Funcionalidades | bag em `localStorage` (`gs-cart`), pré-venda do Drop 001 por relógio (`presale.ts`), popup de e-mail do drop, contagem regressiva, filtro por categoria, toast de "adicionado", tabela de medidas |
| Dados | `src/lib/catalog.json` (fonte única, sem banco) |
| Banco de dados | nenhum |
| APIs / integrações | nenhuma. Contratos sugeridos em `BACKEND.md` |
| Duplicação | `prototipo/` é uma segunda implementação do site inteiro em HTML + JS gerada por Python. Toda mudança tinha que ser feita duas vezes |

## 2. Problemas encontrados

**Marca e direção**
- Visual de "loja gamer": verde ácido #39FF14 em todo CTA, bonecos ilustrados com cara de desenho, títulos com fonte arredondada. Contradiz o pedido de parecer marca de moda.
- Nome antigo (GEEK SWIN) espalhado em ~40 lugares, sem constante única.

**UX e conversão**
- Popup de e-mail bloqueia a tela 1,2 s depois de abrir qualquer página (inclusive produto). No celular cobre tudo; o Google penaliza interstitial intrusivo.
- Carrinho é uma página separada: tira a pessoa do fluxo de compra.
- Sem busca, wishlist, conta, checkout, página de drop individual, arquivo de esgotados, 404 própria e estado "esgotado/coming soon" dos produtos.
- "Finalizar compra" desligado sem caminho seguinte.
- Hero com 4 informações concorrendo na primeira dobra.

**Responsividade**
- Página de produto em 375 px tem 5 px de rolagem horizontal (o documento mede 380 px).
- Menu do celular é um acordeão no topo, sem acesso rápido a busca e conta.

**Performance**
- framer-motion + lenis + cursor customizado global carregam em todas as páginas (≈ 60 KB gz de JS que não vende nada). Scroll "suave" atrasa a resposta do dedo no celular.
- Imagens SVG de 9 KB cada com 6 KB de metadados.

**SEO**
- Sem sitemap, robots, Open Graph, dados estruturados (Product, Organization, BreadcrumbList) e títulos próprios para o drop.

**Dados que parecem reais e não são**
- Estoque ("Restam 37 de 150"), preços, contatos e CNPJ são fictícios, sem aviso visível ao visitante.

## 3. O que foi preservado

Bag em `localStorage` (mesma chave, ninguém perde o carrinho), lógica de pré-venda, preços em centavos para o parcelamento, tabelas de medidas, `catalog.json` como fonte única e o contrato do `BACKEND.md` (estendido, não substituído). As URLs antigas redirecionam para as novas.

## 4. Nova direção

**Conceito:** "uma marca de roupa que nasceu da cultura gamer". A referência gamer está na linguagem (INSERT COIN, LOBBY, PLAYER NOT FOUND, cursor `_`) e na lógica de drop, nunca em neon ou personagem.

**Cor.** Preto, off-white e cinza fazem 95% do site. Uma única cor de destaque, o **Hyperlink Blue #2E2EFF**: o azul do link da internet antiga, uma referência de cultura digital que não é clichê de e-sports e dá contraste AA com texto branco. Uso exclusivo em CTA, preço, status e interação.

| Token | Hex | Uso |
|---|---|---|
| ink | #0B0B0C | texto, fundo das seções escuras |
| carbon | #151517 | superfícies escuras |
| bone | #EEECE6 | fundo claro principal |
| paper | #F7F6F2 | cartões, campos |
| studio | #E4E2DB | fundo das imagens de produto |
| mute | #5E5E64 / smoke #8C8C92 | texto secundário (claro / escuro) |
| accent | #2E2EFF | CTA, preço, status |
| accent-soft | #A6A6FF | texto de destaque sobre preto |

**Tipografia.** Archivo variável (uma família só): condensada e pesada nos títulos e números do drop, largura normal na interface. JetBrains Mono para microcopy, SKU e contadores. Duas famílias, servidas pelo próprio domínio.

**Forma.** Cantos retos, linhas finas, grid editorial, muito espaço negativo. Seções alternam claro e escuro para dar ritmo.

**Imagem.** Sem fotos reais ainda, os produtos viram **desenhos técnicos (flats) de frente, costas e detalhe**, o padrão de ficha técnica da moda. Parecem projeto de marca, não ilustração infantil, e não fingem ser fotografia. Cada produto e drop tem slots de foto e vídeo que entram sozinhos quando o arquivo existir (lista de fotos em `docs/FOTOS.md`).

**Movimento.** CSS puro, 150 a 500 ms, sem biblioteca. Tudo desliga com "reduzir movimento".

## 5. Arquitetura de informação

```
/                      Home (hero, drop atual, contagem, why drops, linha core, comunidade, members, lobby)
/shop                  todos os produtos, filtros e ordenação sem recarregar
/product/[slug]        página editorial do produto
/drops                 timeline da marca + ARCHIVE de esgotados
/drops/[slug]          landing de cada drop
/wishlist              favoritos
/account               MINHA GEEK SWIM (visitante / logado)
/members               GEEK SWIM MEMBERS e GEEK LEVEL
/about                 manifesto
/help                  envio, trocas, pré-venda, contato
/checkout              checkout em 4 passos, sem menu
+ cart drawer, busca, guia de tamanhos, 404, loading
```

Funil: social → home/drop → produto → drawer → checkout → conta/members → próximo drop. Cada etapa tem um CTA principal só.
