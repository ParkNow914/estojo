# estojo — onde o desenho do okmigo se faz e se mede

Este repositório existe para uma pessoa de fora poder **redesenhar o okmigo sem
ter acesso ao okmigo**. Ele tem os valores de verdade que estão no ar, telas
representativas reproduzidas, e um verificador que reprova o que não passa.

⛔ **O que NÃO está aqui, de propósito:** código do produto, banco, credencial,
segredo, dado de gente real. Se você precisou de algum deles para trabalhar,
diga — provavelmente falta uma tela aqui, não um acesso.

## Comece por aqui

    node verificar/contraste.mjs telas/*.html

Ele mede **no pixel renderizado** e sai com código 1 se algo reprovar. Rode antes
de entregar qualquer coisa.

## ⭐⭐ A pergunta que este repositório existe para forçar

**Esta cor é FILL ou é TEXTO?**

É a lição mais cara do desenho deste produto. Uma cor pode estar **certa num
papel e errada no outro**, porque os pisos são diferentes:

| papel | piso | regra |
|---|---|---|
| texto, e ícone que carrega informação | **4,5:1** | WCAG 1.4.3 |
| objeto gráfico, borda ou preenchimento de controle | **3,0:1** | WCAG 1.4.11 |
| texto grande (24px, ou 18,66px negrito) | 3,0:1 | WCAG 1.4.3 |

Duas vezes, no desenho deste produto, isso derrubou um valor que parecia
conferido — porque tinha sido calibrado contra o painel, e vivia dentro da
bolha, que tem outro fundo.

⭐ **Então o papel se DECLARA no markup**, e declarar é trabalho de desenho:

```html
<p>algum texto</p>                     <!-- texto (4,5) — é o padrão -->
<span data-papel="grafico"></span>     <!-- objeto gráfico (3,0) -->
<hr data-papel="ornamento">            <!-- isento, e você disse que é -->
```

⚠️ **O fundo é MEDIDO, não declarado** — o verificador sobe a árvore até achar
quem pinta de fato, porque `transparent` é o caso comum.

## O que o verificador recusa a fazer

Ele diz «não sei» em vez de inventar número, e isso é decisão:

- **translucidez empilhada** (`rgba` sobre `rgba`) — o valor honesto exige a cor
  final; ele pede que você a declare;
- **objeto sem tamanho** — quem declara `data-papel` e tem caixa `0×4`
  **reprova**. Foi assim que a trilha do player escapou da primeira versão:
  `flex:1` numa bolha que encolhe até o conteúdo dá largura zero, e o relatório
  dizia «0 reprovadas» sobre um objeto invisível.

⛔ **«Não medida» nunca conta como aprovada.**

## Os tokens são EXTRAÍDOS, não digitados

[`tokens/atual.json`](tokens/atual.json) tem os valores que estão em produção
hoje, tirados dos quatro lugares onde eles vivem:

| conjunto | serve |
|---|---|
| `app` | o aplicativo web e o Flutter — 56 tokens no tema escuro, 29 no claro |
| `paginas` | as 8 páginas públicas de apresentação |
| `documento` | as páginas-documento (`/sobre`, `/integracao`) |
| `negocio` | a página pública de cada negócio |

⛔ **E é aqui que está o problema de fundo do produto: são QUATRO conjuntos, e os
dois principais têm temperatura oposta.**

| | fundo | texto |
|---|---|---|
| páginas públicas | `#09090b` — R9 **G9 B11**, azulado | `#fafafa`, branco neutro |
| app | `#131211` — **R19** G18 B17, quente | `#EDEAE5`, creme |

O acento é o **mesmo** nos dois (`#6EA8FE`). Alguém alinhou o acento e não os
neutros — então quem vem da página inicial e entra no app **atravessa uma
mudança de temperatura**. É a principal razão de o produto não parecer um
produto só, e nenhum framework conserta isso.

⚠️ **Uma armadilha da extração, registrada porque me pegou:** pular os valores
`var()` fez o token do tema **claro** vencer no lugar do escuro, em silêncio —
`--in-bg` saiu `#FFFFFF` numa tela escura. Os `var()` são resolvidos **dentro do
tema**.

## As telas

| tela | o que ela exercita |
|---|---|
| [`telas/conversa.html`](telas/conversa.html) | a tela mais usada e a menos desenhada: bolha dos dois lados, player de voz, chip de arquivo, o campo de escrever |

⚠️ São reproduções **estáticas** e fiéis ao que está no ar — não são o produto.
Servem para você mexer sem depender de nada, e para o verificador ter o que
medir. Quando faltar uma, pede.

## O que o produto tem que restringe o desenho

**1 · Parte das telas é DECLARATIVA.** Serviços integrados descrevem a superfície
deles num contrato **sem campo de cor, de fonte ou de medida**, e o okmigo a
desenha nativamente — nunca roda código de terceiro dentro do app. Consequência:
parte do trabalho é desenhar o **vocabulário** (tabela, gráfico, ficha,
formulário, lista com ação), não telas individuais.

⚠️ E o vocabulário tem limites que moldam a arquitetura: **uma superfície mostra
uma lista**, e **não existe aba**.

**2 · Cada peça precisa desenhar IGUAL em dois clientes** — o web (React +
TypeScript) e o celular (Flutter). Uma peça que difere transforma o contrato em
sugestão.

**3 · As páginas públicas são HTML e CSS escritos no servidor, sem framework.**
Não há React nem biblioteca de componentes nelas.

**4 · Alvo de toque tem mínimo.** 44×44 é a régua deste repositório. Já
corrigimos pontos de carrossel com **9×9** de área clicável.

## Como entregar

Trabalhe aqui, em PR neste repositório. Cada PR:

1. roda `node verificar/contraste.mjs telas/*.html` sem reprovar;
2. diz **o que estava errado antes** e o que mudou — não só o que ficou bonito;
3. se mexeu em token, diz qual e por quê.

A integração no produto é nossa. O que você constrói aqui é o que vai portado,
sem tradução no meio.

## Dependência

O verificador usa [Playwright](https://playwright.dev) com **Firefox**.

    npm i -D playwright && npx playwright install firefox

⚠️ **Firefox, e não Chromium** — o Chromium empacotado pelo Playwright não
decodifica AAC, e o produto tem mensagem de voz em AAC/M4A. Numa tela com áudio,
o Chromium mostra erro de reprodução que é do navegador de teste, não do
produto.
