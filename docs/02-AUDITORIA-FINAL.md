# Auditoria final · seis perspectivas

Feita em 08/10/2026 sobre o site reconstruído (commit "GEEK SWIM: reconstrução completa do e-commerce").
O que foi **verificado** (testado) está marcado como tal. O resto é avaliação de quem fez, e deve ser confirmado com gente de verdade (ver "Como validar" no fim).

## Verificado por teste

- Build de produção, `eslint` e `tsc` sem erro.
- 13 páginas sem rolagem horizontal em 375, 390, 430, 768, 1024, 1440 e 1920 px.
- axe-core (WCAG 2.1 AA): zero violações.
- Fluxo no celular (390 px): erro de tamanho, bag, guia de medidas, busca, menu, filtros pela URL, wishlist e checkout completo (4 etapas, CEP preenchido por ViaCEP).
- Arquivo único `ABRIR-GEEK-SWIM.html`: todas as rotas abrem por `file://`, voltar do navegador funciona, sem erros de console.

## 1. Cliente comum (quer comprar uma peça)

**Consegue comprar sem atrito? Sim, até o pagamento.** Preço, 6x e Pix aparecem juntos. O tamanho é obrigatório, com erro claro. A bag mostra quanto falta para o frete grátis. O checkout tem 4 etapas, com o CEP preenchendo o endereço.
**O que ainda trava:** sem foto no corpo, a pessoa não sabe como a peça veste. Esse é o maior risco de conversão hoje (ver `FOTOS.md`). A política de troca grátis precisa estar confirmada, porque ela derruba a objeção "e se não servir?".

## 2. Designer

**Coerente? Sim.** São 3 neutros e 1 acento azul usado só em ação e estado. O sistema tem uma família tipográfica com largura variável (títulos condensados e interface na mesma Archivo) e mono para dados. A grade é editorial, com seções escuras trocando tokens, sem cor solta.
**Pontos fracos:** os desenhos técnicos sustentam a linguagem, mas cansam em 8 peças seguidas. A foto real resolve isso. No hero, de 1024 a 1279 px o desenho fica atrás do título (decisão para manter a leitura). Só a partir de 1280 px ele sobe na frente.

## 3. Desenvolvedor (seu amigo do back)

**Dá para plugar sem reescrever? Sim.** Cada integração é uma variável de ambiente (lista, checkout, frete, analytics), com contrato em `BACKEND.md`. Os tipos do checkout estão em `commerce/types.ts`, e a interface do gateway (Mercado Pago ou Stripe) é `server-only`. As rotas `/api/*` já existem e respondem 501. O catálogo é um JSON com o mesmo formato que a API deve devolver.
**Dívida consciente:** estoque e catálogo ainda vêm do JSON no build. A conta é exemplo. O evento `purchase` do analytics depende do pedido pago.

## 4. Dono da marca (Henrique)

**Parece marca, e não loja de produto gamer? Sim.** A linguagem é de drop (número, tiragem, status, contagem, arquivo de esgotados), o manifesto vem antes da peça e o vocabulário gamer aparece só como tempero ("Insert coin", "Player not found", GEEK LEVEL). Não tem neon, pixel art nem controle de videogame na cara.
**Decisões que são suas, ainda em aberto:**
1. Nome: **GEEK SWIM**, confirmado pelo Henrique em 08/10 (o projeto antigo usava GEEK SWIN). Fica em `src/lib/brand.ts`.
2. Políticas exibidas no site: primeira troca grátis em 30 dias, frete grátis acima de R$ 349, 6x sem juros, 5% no Pix. Vieram do site anterior: confirme ou mude em `catalog.json`.
3. Datas e tiragem: abertura em 10/10 às 20h, envio a partir de 14/10 (provisório), 850 peças no Drop 001.
4. WhatsApp, e-mail e CNPJ reais (hoje ficam escondidos).

## 5. Cliente gamer

**Reconhece a cultura sem se sentir num produto infantil? Sim.** As referências são de quem joga: lobby, respawn, lag zero, GG WP, ranked, lan house, níveis PLAYER→LEGEND, "Your inventory is empty". Elas estão no microtexto, não na estética. Peça numerada e drop com hora marcada funcionam como item raro com evento de lançamento, que é exatamente a lógica que esse público valoriza.
**Risco:** se o GEEK LEVEL e o acesso antecipado de members prometidos não forem entregues de verdade, esse público percebe rápido. O back precisa checar o nível **no checkout**.

## 6. Cliente que não joga

**Compraria? SIM.** A home abre com "Não é merch. É uniforme." e "Você não precisa jogar para fazer parte.". Nenhuma referência gamer é necessária para entender o produto: as peças têm nome, tecido, gramatura, modelagem e medidas. Os termos em inglês são poucos e sempre ao lado do português. O visual é de marca de roupa, não de loja de jogo.
**Condição:** isso vale quando houver foto real no corpo. Com só desenho técnico, esse cliente entende a peça, mas não se imagina usando.

## Como validar (barato, antes do drop)

1. Mostre o site a 5 pessoas (2 que jogam e 3 que não jogam) e peça: "compre uma peça no seu tamanho". Observe onde travam, sem ajudar.
2. Pergunte a quem não joga: "isso é marca de quê?". Se responder "loja de jogo", algo falhou.
3. Quando a lista estiver ligada, meça a taxa de cadastro no aviso de drop. Abaixo de 2% dos visitantes indica oferta ou chamada fraca.
4. No dia do drop, meça: visitas → bag → checkout → pago. A maior queda mostra o que corrigir primeiro.
