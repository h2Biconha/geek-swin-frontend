# GEEK SWIN Luxury · Next.js multipágina (Framer Motion + Lenis)

Testado aqui com: Next 16.3.8 (App Router), React 19.2, Tailwind 4, framer-motion 14, lenis 1.3.26.
`npm run build`, `tsc` e `eslint` passam sem erro; as 7 rotas e as 8 páginas de produto foram testadas no navegador.

## 0. Antes de tudo
Se `D:\GEEK_SWIN\frontend` já tem o site v1 (da outra conversa), renomeie para não perder nada:

```powershell
cd D:\GEEK_SWIN
Rename-Item frontend frontend-v1
```

## 1. Criar o projeto

```powershell
cd D:\GEEK_SWIN
npx create-next-app@latest frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd frontend
npm i framer-motion lenis
```

> **Atenção:** `@studio-freight/react-lenis` está **depreciado** (o próprio npm avisa: "renamed to 'lenis'").
> O substituto é o pacote `lenis`, e o componente React vem de `lenis/react`. A API é a mesma (`<ReactLenis root />`).
> Se instalar o antigo, funciona hoje, mas não recebe mais correções.

## 2. Copiar os arquivos
Extraia `geek-swin-luxury-nextjs.zip` dentro de `D:\GEEK_SWIN\frontend` e aceite substituir. Se você já tinha uma versão anterior, apague `src/components/ThemeToggle.tsx` e `src/components/Lookbook.tsx` (viraram a página /lookbook). Ele traz:

```
tailwind.config.ts                   cores via variáveis CSS, fontes, escala
public/products/*.svg                8 peças + 3 modelos ilustrados (troque por fotos .webp)
src/app/globals.css                  paleta (só tema claro), fundo de estúdio, backdrop do popup
src/app/layout.tsx                   topo, rodapé, toast da bag, popup do drop (valem para todas as páginas)
src/app/page.tsx                     /            home
src/app/loja/page.tsx                /loja        filtro por categoria (/loja#calcas) e ordenar por preço
src/app/produto/[slug]/page.tsx      /produto/... uma página por peça, gerada no build
src/app/lookbook/page.tsx            /lookbook    3 looks com "Comprar o look"
src/app/drops/page.tsx               /drops       contagem, calendário 001/002/003, cadastro
src/app/sobre/page.tsx               /sobre       manifesto, FAQ (#faq) e contato (#contato)
src/app/carrinho/page.tsx            /carrinho    bag com quantidade, frete grátis, Pix e 6x
src/lib/catalog.json                 FONTE ÚNICA: peças, preços, estoque, tamanhos, tabelas, looks, drop
src/lib/products.ts                  tipos + funções (preço, 6x, Pix, relacionados) que leem o catalog.json
src/lib/cart.ts                      a bag (localStorage, sem Provider)
src/lib/subscribe.ts                 onde o e-mail é enviado (hoje só simula, ver abaixo)
src/lib/motion.ts                    TODAS as curvas, durações e staggers (ajuste aqui)
src/components/Header.tsx            topo fixo que encolhe, marca a página atual, contador da bag
src/components/Footer.tsx            rodapé com cadastro
src/components/ProductGallery.tsx    galeria da página de produto (produto / modelo / detalhe)
src/components/BuyBox.tsx            tamanho, adicionar, comprar agora, barra fixa no celular
src/components/ShopClient.tsx        filtros e ordenação da loja
src/components/CartView.tsx          conteúdo da bag
src/components/AddedToast.tsx        aviso "adicionado à bag"
src/components/Countdown.tsx         contagem regressiva (usada no popup e em /drops)
src/components/SignupForm.tsx        formulário de e-mail reutilizável
src/components/ui.tsx                SectionHead, Breadcrumb, Perks, BigTitle
src/components/DropModal.tsx         popup do drop (não abre na bag, para não atrapalhar a compra)
src/components/ProductCard.tsx       card com reveal, troca para o modelo no hover, link para a peça
src/components/ProductGrid.tsx       grid de 4 colunas que dispara o stagger
src/components/Hero.tsx, Collections.tsx, AnnouncementBar.tsx, MagneticButton.tsx,
src/components/LuxuryCursor.tsx, SmoothScroll.tsx
```

## Páginas de produto: como funciona
- `generateStaticParams()` lista os slugs do catálogo e o Next gera um HTML estático por peça no build (rápido e bom para SEO). `dynamicParams = false` faz um slug que não existe dar 404 em vez de tentar gerar na hora.
- `generateMetadata()` dá a cada peça título, descrição e imagem de compartilhamento próprios. No deploy, defina `NEXT_PUBLIC_SITE_URL` (ex.: `https://geekswin.com.br`) para os links de compartilhamento saírem certos.
- No Next 16, `params` é uma Promise: por isso o `await params`. Erro comum: ler `params.slug` direto.

## Adicionar ou editar uma peça
Edite só o `src/lib/catalog.json`: copie um item de `products`, troque `slug` (vira a URL), nome, preço, `sizes`, `soldOut` e as imagens. A loja, o card, a página da peça, os relacionados e a bag pegam tudo dali. O protótipo HTML (`prototipo/build.py`) lê o mesmo JSON, então o catálogo dos dois fica igual: copie o arquivo de `prototipo/data/` para `src/lib/` ou vice-versa.

## A bag
Fica no navegador (`localStorage`, chave `gs-cart`) e é lida com `useSyncExternalStore`, então qualquer componente usa `useCart()` sem Provider, e duas abas ficam sincronizadas. Ela não reserva estoque e o botão "Finalizar compra" está desligado: é vitrine.

## O que falta para vender de verdade
Em ordem de prioridade:
1. **Pagamento.** O caminho mais barato e rápido é não construir checkout: plugar o site num checkout pronto. Opções: Mercado Pago Checkout Pro ou Pagar.me (Pix + cartão parcelado, taxa por venda), ou usar Shopify/Nuvemshop só como "motor" (estoque, checkout, frete) com este site na frente (headless). Para uma marca começando, eu iria de Nuvemshop ou Shopify: checkout, antifraude e nota já resolvidos.
2. **Frete.** Cálculo por CEP com Melhor Envio ou Correios (API) e a regra de grátis acima de R$ 349 aplicada no servidor.
3. **Estoque real.** Hoje "Restam 37" é um número fixo no JSON. Precisa morar num banco (ou na plataforma) e baixar a cada venda paga; no drop, reserve por alguns minutos ao iniciar o pagamento para não vender a mesma peça duas vezes.
4. **Lista de e-mails** (seção abaixo) e **LGPD**: política de privacidade, termos, trocas (CDC: 7 dias de arrependimento em compra online).
5. **Dados reais**: CNPJ, contato e endereço no rodapé e em /sobre (hoje são fictícios), e fotos de verdade.

Apague `src/app/page.module.css` se existir. No `package.json`, adicione `"type": "module"` (some o aviso de "MODULE_TYPELESS" ao ler o `tailwind.config.ts`).

## Cores
- Site só no tema claro. As cores ficam no `:root` do `globals.css` como canais RGB (`--ink: 11 11 11`), e o Tailwind lê via `rgb(var(--ink) / <alpha-value>)`, então `bg-ink/10` funciona.
- **Regra do verde:** `bg-acid` (#39FF14) só como preenchimento, com texto preto em cima. Texto verde no claro usa `text-acid-ink` (#1B7A0A). Neon direto em fundo claro tem contraste de 1.3:1 e some.

## Popup do drop (DropModal)
- Abre 1.2s depois de carregar, num `<dialog>` nativo: Esc fecha, o foco fica preso dentro e o resto da página fica inerte, sem biblioteca.
- Quem se cadastra nunca mais vê. Quem só fecha vê de novo depois de 24h (`localStorage`, chave `gs-drop-popup`). Para testar de novo, rode `localStorage.removeItem("gs-drop-popup")` no console.
- A data do drop está em `drop.opensAtUTC` no `src/lib/catalog.json` (em UTC: 23:00Z = 20h de Brasília).

## Salvar os e-mails de verdade
Hoje o formulário **só valida e mostra sucesso. Nenhum e-mail é salvo.** Para guardar:
1. Escolha um serviço de lista com API (Brevo, Mailchimp, Klaviyo, Resend Audiences...). Para drop de moda, Klaviyo e Brevo já trazem automação de "lançamento".
2. Crie `src/app/api/subscribe/route.ts` com um `POST` que valida o e-mail e chama a API do serviço, usando a chave em `.env.local`. A chave nunca vai pro navegador.
3. Em `src/lib/subscribe.ts`, troque a simulação pelo `fetch("/api/subscribe")` que já está no comentário.
4. Para LGPD, guarde a data e a origem do consentimento (`source: "popup-drop-001"`) e ofereça descadastro em todo e-mail.

## 3. Rodar

```powershell
npm run dev
```
Abra http://localhost:3000 e teste: /loja, /produto/obsidian-shell-hoodie, /carrinho.

## Por que Tailwind 4 + tailwind.config.ts?
O create-next-app atual instala Tailwind 4, que é "CSS-first" e não lê o config sozinho.
A linha `@config "../../tailwind.config.ts";` no `globals.css` faz ele usar o seu arquivo. Você mantém o `tailwind.config.ts` que pediu sem fazer downgrade.

## Como o stagger funciona (ProductGrid → ProductCard)
1. `ProductGrid` tem `initial="hidden"` e `whileInView="show"`, e a variante `gridStagger` com `staggerChildren: 0.22`.
2. Cada `ProductCard` só declara `variants={cardReveal}`. Ele herda o estado do pai, então entra 0.22s depois do anterior.
3. Dentro do card, `cardReveal` tem o próprio `staggerChildren: 0.12`: a foto abre como cortina (`clipPath`), depois nome, preço e estoque sobem.
4. `whileHover="hover"` no card propaga para a foto (scale 1.05 em 1.5s easeOut) e para a barra "Adicionar à bag".

Erro comum: colocar `initial`/`animate` nos filhos. Isso quebra a herança e o stagger para de funcionar.

## Custom Cursor Fluorescente
- `useMotionValue` guarda a posição real do mouse; `useSpring` cria a versão "atrasada". O atraso suave é a mola, não um `setTimeout`.
- Um único `pointerover` no `document` procura o `[data-cursor]` mais próximo. Qualquer elemento novo funciona sem registrar nada:
  - `data-cursor="view"` → disco verde de 84px com "VER" em preto (já está nos cards e coleções)
  - `data-cursor="link"` → anel de 44px (já está no botão magnético)
- Só ativa com `(pointer: fine)`; no celular ele não existe. Com `prefers-reduced-motion`, a mola é desligada.
- Para ajustar o "peso": `CURSOR_SPRING` em `src/lib/motion.ts`. Stiffness menor = mais lento; damping menor = mais elástico.

## Trocar placeholders por fotos
Coloque `hoodie.webp` em `public/products/` e mude `image` da peça em `src/lib/catalog.json`.
Foto recomendada: 1600×2000 (4:5), fundo neutro claro (#E9E9E4) ou recorte PNG/WebP transparente, sombra suave no chão. Para os modelos, troque `modelImage` (hover do card) e `image` em `looks`. `next/image` otimiza sozinho.
