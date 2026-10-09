# Reconstrução de 09/10/2026: de vitrine a loja

Este documento registra o que mudou na reconstrução pedida no "Master Project Brief", por quê, e o que ainda depende de decisão ou configuração externa. Para operar o back-end, veja [BACKEND.md](../BACKEND.md).

## 1. O que a auditoria encontrou

| Problema | Por que importava |
|---|---|
| Não havia back-end: checkout, lista, conta e cupom eram demonstração | a loja não vendia |
| Estoque inventado no catálogo ("Restam 37", "293 / 850", tamanhos esgotados fixos) | escassez falsa: risco de CDC (art. 37, publicidade enganosa) e de confiança |
| Preço "de/por" (`compareAt`) sem histórico de venda; Kit Squad mais caro que 3 camisetas avulsas | desconto fictício e oferta incoerente |
| Ficha técnica (gramatura, composição) não confirmada com a produção, exibida como fato | promessa que a produção sob demanda pode não cumprir |
| Programa GEEK LEVEL / Members com benefícios ("entra 1 h antes") que nada implementava | prometia acesso que o sistema não dava |
| GTM e Meta Pixel carregavam sem consentimento | LGPD |
| Nenhum teste automatizado | nada garantia que o checkout funcionasse |
| Microcopy em inglês ("Player not found", "Why drops?", "Sold out") e efeitos que atrapalhavam (tela de loading, cursor custom, popup de drop, barra que girava, conteúdo escondido até o JS rodar) | leitura, acessibilidade (WCAG 2.2.2) e desempenho |

## 2. Referências consultadas

Só o que foi de fato acessado (a pesquisa foi seletiva, não um levantamento de mercado):

- **Kith** (navegação e páginas de coleção): coleções como capítulos com nome, desenho no app, programa de fidelidade separado da compra.
- **Stüssy** (navegação por categoria, selo "SOLD OUT" no card, preço promocional explícito).
- **Patta** (drops sazonais numerados, ex. "AW26 Drop 3", tag "Coming soon", revista e comunidade integradas à loja).
- **Supreme**: só os metadados da página responderam. **GG DZN**: bloqueado por robots. Nada foi concluído a partir deles.
- Referências locais já conhecidas: Fallen Wear e a collab Kings Sneakers × Street Fighter.

O que foi aproveitado: drop como capítulo numerado com página própria; esgotado visível (e não escondido) como parte da história; navegação curta; editorial e loja na mesma experiência.

## 3. Decisões

- **Identidade mantida**: off-white/preto + Hyperlink Blue `#2E2EFF`, Archivo (largura variável) + JetBrains Mono. A marca já tinha uma direção consistente; o problema era honestidade e função, não visual.
- **Linha de marca**: "Não é merch. É cultura." (do brief "NOT MERCH. CULTURE."). Interface em português; URLs continuam em inglês (`/shop`, `/product`) para não quebrar links já compartilhados.
- **Navegação**: Loja · Drops · Sobre. "Members" saiu; `/members` redireciona para a lista do drop (`/#lista`).
- **Escassez só com dado real**: sem estoque real conectado, o site mostra a tiragem total ("Tiragem numerada · 150 peças · sem reposição"), nunca "restam X". Com o back-end ligado, mostra o disponível de verdade.
- **Produção sob demanda é cidadã de primeira classe**: estoque `null` = sem limite físico; a tiragem numerada continua sendo o teto do drop.
- **Boleto removido**: não combina com reserva de 30 minutos de peça numerada.
- **Avaliações e comunidade**: as seções somem enquanto não houver conteúdo real.
- **Ficha técnica**: aparece com o selo "em validação" até `site.specsConfirmed: true`. As anotações de gramatura no hero só aparecem confirmadas.
- **Movimento só em CSS** e ligado à rolagem, sem esconder conteúdo antes do JavaScript.
- **Back-end no próprio Next**, Postgres + Mercado Pago por REST (sem SDK), PGlite para desenvolvimento e testes. Motivo: um repositório só para o amigo que vai continuar, sem infraestrutura extra para começar.

## 4. Fases do drop

`src/lib/catalog.ts > dropPhase()`, função pura (recebe o "agora" e o estoque):

1. `status` forçado no catálogo (decisão administrativa);
2. encerrado por data → `archived`;
3. sem data ou sem peças → `coming-soon`;
4. todas as peças esgotadas no estoque real → `sold-out`;
5. antes da abertura → `presale` (drop com pré-venda) ou `upcoming`;
6. senão → `live`.

A contagem regressiva nunca fica negativa (`splitCountdown`). O servidor usa a mesma função para recusar compra fora de fase. Novo drop = nova entrada em `catalog.json`.

## 5. Desempenho

Medição de **laboratório**: Lighthouse 12.8.2, Chromium headless, servidor local (`next start`, build de produção em modo teste), em 09/10/2026. Não é dado de usuário real (CrUX); repita no domínio final.

| Página | Celular (desempenho · LCP · CLS · TBT) | Desktop (desempenho · LCP · CLS) |
|---|---|---|
| `/` | 85 · 3,7 s · 0 · 210 ms | 100 · 0,6 s · 0 |
| `/shop` | 80 · 4,0 s · 0 · 270 ms | 100 · 0,6 s · 0 |
| `/product/obsidian-shell-hoodie` | 84 · 3,5 s · 0 · 290 ms | 100 · 0,8 s · 0 |
| `/drops/001-insert-coin` | 84 · 3,0 s · 0 · 420 ms | 100 · 0,7 s · 0 |
| `/checkout` | 93 · 3,1 s · 0 · 120 ms | 100 · 0,7 s · 0 |

Acessibilidade, boas práticas e SEO: 100 em todas, exceto SEO 66 no `/checkout` (é `noindex` de propósito).

Duas correções saíram dessa medição: o `loading.tsx` da raiz e um `<Suspense>` na loja faziam o React adiar o conteúdo da página e o rodapé "pulava" (CLS 0,29 a 0,89 → 0). O LCP no celular simulado (4G lento) ainda fica acima da meta de 2,5 s; o próximo passo é medir no domínio final com CDN antes de otimizar mais (fontes e CSS são os recursos bloqueantes).

## 6. Pendências de negócio

Ver [BACKEND.md > Pendências que não são código](../BACKEND.md#8-pendências-que-não-são-código). Em resumo: confirmar condições comerciais (troca 30 dias, frete grátis R$ 349, 6x, 5% Pix, envio a partir de 14/10), tiragens, ficha técnica com a produção, CNPJ/WhatsApp/e-mail, encarregado de dados, revisão jurídica de privacidade e termos, fotos reais ([FOTOS.md](FOTOS.md)).

## 7. Configuração externa (ordem sugerida)

1. **Neon**: criar projeto, copiar `DATABASE_URL`, rodar `npm run db:migrate`.
2. **Mercado Pago**: aplicação, credenciais de teste, webhook (eventos Order e Pagamentos), assinatura secreta. Pagar um pedido de teste ponta a ponta.
3. **Resend**: verificar o domínio (SPF/DKIM), `RESEND_API_KEY`, `EMAIL_FROM`.
4. **Vercel**: variáveis do `.env.example`, `NEXT_PUBLIC_STORE_MODE=test` primeiro; `live` só depois do teste ponta a ponta.
5. **Melhor Envio** (opcional): token, CEP de origem, pesos reais por peça.
6. **GTM/GA4 e Meta Pixel** (opcional): IDs nas variáveis; o aviso de cookies aparece sozinho.
