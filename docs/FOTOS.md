# Fotos que faltam produzir

Hoje as peças aparecem como **desenho técnico** (SVG em `public/art/`). Isso é intencional e honesto, e funciona como linguagem de "ficha técnica". Mas nenhuma marca de streetwear vende moletom de R$ 389 sem foto de corpo e de tecido. **Foto real é o item de maior impacto na conversão que ainda falta**, mais do que qualquer ajuste de layout.

Prioridade: faça o **Bloco A** antes de abrir o drop (10/10). O resto pode vir depois.

## Padrão técnico (vale para tudo)

| | |
|---|---|
| Proporção | **4:5 vertical** (ex.: 2000 × 2500 px). É o formato de card, galeria e Instagram feed |
| Fundo de still | cinza-claro liso, próximo de `#E9E8E3` (o "estúdio" do site), luz suave, sombra curta embaixo |
| Fundo de editorial | locação real (escadas, lan house, rua à noite, quarto com setup) — luz dura ou de tela, sem filtro colorido |
| Arquivo | JPG qualidade 85 ou WebP, até ~600 KB. O Next gera AVIF/WebP no deploy |
| Nome | `public/fotos/<slug>-<vista>.jpg` (ex.: `obsidian-shell-hoodie-modelo.jpg`) |
| Rostos | pode mostrar ou cortar; o que importa é **autorização de uso de imagem assinada** de cada modelo |
| Proibido | foto de banco de imagem passando por cliente, mockup gerado por IA como se fosse a peça real |

## Bloco A · antes do drop (mínimo para vender)

Para **cada uma das 5 peças do Drop 001** (Obsidian Shell Hoodie, Phantom Frame Tee, Respawn Cap, Respawn Cargo, Lag Zero Socks):

1. **Still frente** · peça no fundo cinza, sem modelo (substitui `-front.svg`).
2. **Still costas** · mostra a arte das costas (substitui `-back.svg`; é a imagem que aparece no hover do card).
3. **Detalhe de tecido** · macro de 15 a 20 cm: textura do moletom, costura, etiqueta numerada `N° ___/150`, aba do boné. Prova de qualidade.
4. **No corpo, frente** · modelo de corpo inteiro, de pé, neutro. Anote altura e tamanho vestido e acrescente no campo `fit` do catálogo (ex.: "O modelo tem 1,82 m e veste G"). Hoje o `fit` só descreve a modelagem, porque ainda não há modelo fotografado.
5. **No corpo, costas** · mesma pose, de costas.

Mais, uma vez só:

6. **Hero do drop** · 1 foto horizontal **16:9** (ex.: 2880 × 1620) + 1 vertical **4:5** para celular. O look completo do drop em locação. Vira `drop.heroMedia` e substitui o desenho no topo da home.

Total do Bloco A: **27 fotos** (5 × 5 + 2).

## Bloco B · logo depois (aumenta conversão e ticket)

7. **Looks do drop** · as 3 combinações do catálogo (Ranked, Off-line, Lan House), 1 foto cada, corpo inteiro em locação. Alimentam a seção de looks e puxam venda de mais de uma peça.
8. **Linha Core** (GGWP Core Tee, Void Wide Pant, Kit Squad 3 Tees): still frente, costas, detalhe e 1 no corpo.
9. **Prova de tamanho** · a mesma peça em 2 corpos diferentes (ex.: 1,65 m vestindo M e 1,85 m vestindo GG). Reduz troca por tamanho, que é a maior causa de devolução em moda online.
10. **Vídeo curto** · 6 a 10 s, vertical, loop, sem áudio, até 4 MB (MP4 H.264). Peça em movimento. Vira `drop.video`.

## Bloco C · comunidade (só com material real)

11. **Seen in the wild** · fotos de clientes reais usando as peças, **com autorização por escrito** (DM com "autorizo o uso no site" já serve como registro). A seção fica vazia, com convite para marcar @geekswim, até existir a primeira foto. Não preencha com fotos de modelo fingindo ser cliente.

## Como trocar no site

No `src/lib/catalog.json`, em cada produto, troque `media`:

```json
"media": [
  { "src": "/fotos/obsidian-shell-hoodie-frente.jpg", "view": "Frente", "alt": "Moletom preto Obsidian Shell, frente" },
  { "src": "/fotos/obsidian-shell-hoodie-costas.jpg", "view": "Costas", "alt": "Costas com a frase INSERT COIN" },
  { "src": "/fotos/obsidian-shell-hoodie-modelo.jpg", "view": "Modelo", "alt": "Modelo de 1,82 m vestindo G" },
  { "src": "/fotos/obsidian-shell-hoodie-tecido.jpg", "view": "Detalhe", "alt": "Detalhe da etiqueta numerada" }
]
```

A ordem importa: a 1ª é a capa do card, a 2ª aparece no hover. Para o drop, preencha `heroMedia`, `gallery` e `video` do mesmo jeito. Os desenhos técnicos podem continuar como última imagem da galeria ("Ficha técnica"), porque reforçam a linguagem da marca.

## Custo e caminho mais barato (estimativa)

- **Faça você mesmo:** os stills (1 a 3) saem bem com celular bom, 2 softboxes baratos e um fundo de papel cinza. O custo é baixo e leva um dia de trabalho.
- **Contrate:** o hero e os looks (6 e 7) são onde um fotógrafo de moda faz diferença. Uma diária com 1 modelo cobre o Bloco A de corpo + hero.
- A faixa de preço de diária varia muito por cidade. Peça 2 ou 3 orçamentos com a lista acima em mãos (ela já é o briefing).
