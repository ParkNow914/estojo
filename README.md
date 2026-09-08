# estojo — onde o desenho do okmigo se faz e se mede

Este repositório existe para uma pessoa de fora poder **redesenhar o okmigo sem
ter acesso ao okmigo**. Ele tem os valores de verdade que estão no ar, telas
representativas reproduzidas, e um verificador que reprova o que não passa.

⛔ **O que NÃO está aqui, de propósito:** código do produto, banco, credencial,
segredo, dado de gente real. Se você precisou de algum deles para trabalhar,
diga — provavelmente falta uma tela aqui, não um acesso.

## Comece por aqui

    npm i
    npm run verificar

São **dois** verificadores, e eles são separados de propósito:

| | mede | pisos |
|---|---|---|
| `verificar/contraste.mjs` | contraste, **no pixel renderizado** | 4,5 texto e ícone · 3,0 objeto gráfico |
| `verificar/alvo.mjs` | **tamanho do alvo de toque** | 24×24 (SC 2.5.8, AA) · 44×44 (a régua daqui) |

⭐ **Por que dois arquivos e não um.** O `.linkish` que fecha uma tarefa passa
folgado no contraste (**9,27:1**) e reprova no alvo (**27×18**). As duas réguas
discordam sobre o mesmo elemento, se consertam em lugares diferentes, e um
verificador que medisse as duas juntas viraria «o verificador» — quem lê o
relatório deixaria de saber qual régua falou.

Os dois saem com código 1 se algo reprovar. Rode antes de entregar qualquer
coisa.

## ⭐⭐ A pergunta que este repositório existe para forçar

**Esta cor é FILL ou é TEXTO?**

É a lição mais cara do desenho deste produto. Uma cor pode estar **certa num
papel e errada no outro**, porque os pisos são diferentes:

| papel | piso | regra |
|---|---|---|
| texto | **4,5:1** | WCAG 1.4.3 |
| **ícone que carrega informação** | **4,5:1** | WCAG 1.4.3 |
| objeto gráfico, borda ou preenchimento de controle | **3,0:1** | WCAG 1.4.11 |
| texto grande (24px, ou 18,66px negrito) | 3,0:1 | WCAG 1.4.3 |

Duas vezes, no desenho deste produto, isso derrubou um valor que parecia
conferido — porque tinha sido calibrado contra o painel, e vivia dentro da
bolha, que tem outro fundo.

⭐ **Então o papel se DECLARA no markup**, e declarar é trabalho de desenho:

```html
<p>algum texto</p>                     <!-- texto (4,5) — é o padrão -->
<span data-papel="grafico"></span>     <!-- objeto gráfico (3,0) -->
<svg data-papel="icone">…</svg>        <!-- ícone que INFORMA (4,5) -->
<hr data-papel="ornamento">            <!-- isento, e você disse que é -->
```

⚠️ **O `icone` nasceu de uma tela**, não de teoria: o ícone da barra de apps do
aplicativo é a única pista de que uma tela veio de um serviço de terceiro
(⧉) e não de nós (⊕). Sem um papel próprio ele ou escapava da medição (um
`<svg>` não tem nó de texto) ou era medido contra 3,0 — a régua frouxa, num
ícone de 18px que carrega a procedência da tela.

⚠️ **O fundo é MEDIDO, não declarado** — o verificador sobe a árvore até achar
quem pinta de fato, porque `transparent` é o caso comum.

⭐ **E o fundo de uma BORDA é o de trás, nunca o de dentro.** Um botão preenchido
com a cor de acento e contornado com a mesma cor dava **1,00:1**: a moldura
comparada com o próprio recheio. O que faz uma moldura ser perceptível é o que
está do lado de fora dela.

## O que o verificador recusa a fazer

Ele diz «não sei» em vez de inventar número, e isso é decisão:

- **translucidez empilhada** (`rgba` sobre `rgba`, ou `color-mix` com
  `transparent`) — o valor honesto exige a cor final; ele pede que você a
  declare. Hoje **duas** combinações do produto caem aqui: a `.tag` e a faixa de
  erro (ver «o que estas telas acharam»);
- **objeto sem tamanho** — quem declara `data-papel` e tem caixa `0×4`
  **reprova**. Foi assim que a trilha do player escapou da primeira versão:
  `flex:1` numa bolha que encolhe até o conteúdo dá largura zero, e o relatório
  dizia «0 reprovadas» sobre um objeto invisível.

⛔ **«Não medida» nunca conta como aprovada.**

⚠️ **E o que ele ainda NÃO mede:** foco de teclado, e `::placeholder` —
pseudo-elemento não entra na varredura do DOM. O `alvo.mjs`, por sua vez, mede a
CAIXA do elemento e nada além: área ampliada por `::before` invisível, `hit-slop`
do Flutter e o espaçamento entre alvos vizinhos (que a 2.5.8 perdoa) seguem
sendo conferidos por olho.

### ⭐⭐ A válvula: reprova CONHECIDA

Estas telas reproduzem o produto que **está no ar**. Quando o produto tem um
defeito de contraste, a tela fiel reprova — e aí há duas saídas ruins e uma boa.
As ruins: mexer na cor da reprodução (a tela passa a ensinar uma cor que não
existe, e o defeito fica invisível justamente aqui, no único lugar que o mediria)
ou baixar o piso. A boa é **declarar**:

```html
<input  data-papel="grafico" data-reprova="OMINFRA-000: --line como moldura de controle">
<button data-reprova-alvo="OMINFRA-000: 27×18, ação por linha da lista">feito</button>
```

⛔ **São dois atributos, e não um por descuido:** um perdão de COR não pode calar
um alvo pequeno. Duas réguas, duas desculpas.

⛔ **A trava que impede a válvula de virar vazamento: exceção que PASSA é
falha.** Consertado o produto, o verificador exige que a declaração saia — senão
em um ano o arquivo estaria cheio de perdões para defeitos que já não existem, e
ninguém saberia quais ainda valem.

## Os tokens são EXTRAÍDOS, não digitados

[`tokens/atual.json`](tokens/atual.json) tem os valores que estão em produção
hoje, tirados dos quatro lugares onde eles vivem:

    node ferramentas/tokens.mjs ../tyego     # exige o produto ao lado + python3

| conjunto | serve | o que tem |
|---|---|---|
| `app` | o aplicativo web e o Flutter (o «Cream») | 56 no escuro, 29 no claro |
| `paginas` | as 8 páginas públicas de apresentação | 12 |
| `documento` | as páginas-documento (`/sobre`, `/integracao`) | 10 |
| `negocio` | a página pública de cada negócio | 6 de medida + **6 paletas × 2 temas × 11 cores** |

⚠️ **O `negocio` tem forma diferente dos outros, e não é capricho:** ali as
MEDIDAS são as mesmas para todo negócio, e a COR é por **ramo** (padaria, oficina,
clínica, estúdio, agro, e o neutro) e por tema. Duas das onze cores são
**derivadas** por regra (`--tinte` e `--grade`), não escritas: mexer numa paleta
é mexer no acento e na tinta.

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

⚠️ **Duas armadilhas da extração, registradas porque me pegaram.** A primeira:
pular os valores `var()` fez o token do tema **claro** vencer no lugar do escuro,
em silêncio — `--in-bg` saiu `#FFFFFF` numa tela escura. A segunda é pior, porque
tinha número ao lado: **um `:root` pode não ser texto.** As paletas da página de
negócio são CALCULADAS em Python, e lendo só o CSS literal o conjunto saía com
seis medidas e **nenhuma cor** — o relatório dizia «negocio 6», que se lê como
«essa página usa poucos tokens» em vez de «o extrator não achou os dela».

## As telas

| tela | o que ela exercita |
|---|---|
| [`telas/negocio.html`](telas/negocio.html) | ⭐ **a superfície de maior alcance**: a página pública de um negócio, a única que um estranho abre sem conta. Faixas, caixa de lista, carrossel, contato e o formulário que cai em Recebidos. Paleta `forno` |
| [`telas/barra.html`](telas/barra.html) | ⭐ a barra de apps **nos dois clientes, lado a lado** — e a divergência entre eles |
| [`telas/conversa.html`](telas/conversa.html) | a tela mais usada e a menos desenhada: bolha dos dois lados, player de voz, chip de arquivo, o campo de escrever |
| [`telas/lista.html`](telas/lista.html) | uma lista densa (as Tarefas) com seções, etiquetas e ações — **e os três estados** (carregando, vazio, erro) como estão hoje |
| [`telas/declarada.html`](telas/declarada.html) | uma **superfície declarada**: menus do serviço, ficha, gráfico, a tabela virando ficha no estreito, campo, escolha e ações |

⚠️ São reproduções **estáticas** e fiéis ao que está no ar — não são o produto.
Servem para você mexer sem depender de nada, e para o verificador ter o que
medir. Quando faltar uma, pede.

⚠️ A coluna do Flutter em `barra.html` é reprodução **aproximada**: as medidas
são as do `ListTile` denso que o código usa, mas a altura final é do layout do
Flutter, não do HTML.

## ⭐ O que estas telas ACHARAM no produto

Não é lista de opinião: é o que o verificador mediu ao reproduzir o que está no
ar. Os três primeiros estão declarados como **reprova conhecida** no markup.

**1 · A moldura de campo reprova, nos DOIS clientes.** Todo campo de texto
desenha a borda com `--line` / `kLine`: **1,19 a 1,39:1** no escuro, 1,27 a 1,61
no claro, contra um piso de 3,0 (WCAG 1.4.11 cobre o limite de componente de
interface). ⭐ E o mais importante: **o token certo existe e foi calibrado** —
`--line-controle` dá 5,21 no escuro e 3,69 no claro. Ele é usado no campo de
escrever da conversa e na trilha do player, e **não** na regra global de `input`
do web nem no `campo` da superfície declarada. Não é «o desenho está ruim»: é uma
regra usando o token errado, nos dois clientes.

**2 · A linha estrutural da página de negócio reprova, nas seis paletas.**
`--grade` dá **2,77 a 2,84:1** sobre o fundo e **2,25 a 2,33:1** na faixa
tingida, no escuro. Ela é o traço de 2px entre faixas, a moldura da caixa de
lista, a borda dos cartões **e a moldura dos campos** do formulário de contato.
⛔ O auditor do próprio produto não pega porque o par `grade`/`bg` **não está na
lista de pares dele** — mesma família do defeito que já foi corrigido ali, onde o
alvo de um par estava escrito ao contrário.

**3 · A barra de apps DIVERGIU entre os clientes.** No web o item não tem ícone;
no Flutter tem, e o ícone é o que distingue uma tela nossa de uma que veio de um
serviço. Não existe «o item da barra»: existem dois, e um deles carrega uma
informação que o outro não dá. ⛔ E a coluna do web **não existe no navegador do
celular** — abaixo de 720px a barra de apps e a lista de conversas desaparecem
sem nada no lugar.

**4 · A ação de cada linha da lista mais densa tem 18px de altura.** `feito` é
**27×18** e `adiar` é **31×18** — abaixo do piso **AA** de 24×24 (SC 2.5.8), não
só da régua de 44. ⭐ E o contraste comparativo é o achado: a **página pública**
tem **zero** alvos abaixo de 44 (ela crava `min-height:44px` em botão, link de
menu e campo, porque isso já custou um defeito em produção), enquanto o
aplicativo tem 23 abaixo de 44 nas telas reproduzidas aqui — os 6 menus de
serviço com 37px, o «+ serviços» com 35 e as 12 ações de linha com 18. A
superfície escrita à mão obedece à régua; a que tem sistema de desenho, não.

**5 · Dois fundos translúcidos atrás de texto pequeno não têm número.** A
etiqueta (`rgba(127,140,170,.18)`) e a faixa de erro (`color-mix(--danger 14%,
transparent)`). Compondo à mão os dois passam; mas «passa quando eu componho na
calculadora» não é o mesmo que «está declarado», e o próximo ajuste de fundo move
os dois sem aviso.

## O que o produto tem que restringe o desenho

**1 · Parte das telas é DECLARATIVA.** Serviços integrados descrevem a superfície
deles num contrato **sem campo de cor, de fonte ou de medida**, e o okmigo a
desenha nativamente — nunca roda código de terceiro dentro do app. Consequência:
parte do trabalho é desenhar o **vocabulário** (texto · caixa · colunas · imagem ·
campo · escolha · calendário · arquivo · documento · tabela · gráfico · copiar ·
autorizar · ações · fatos), não telas individuais.

⚠️ E o vocabulário tem limites que moldam a arquitetura: **uma superfície mostra
uma lista**, e **não existe aba**. Uma tela com três seções independentes quer
navegação — e navegação não está no vocabulário. Decidir o que fazer com isso é
parte do trabalho.

⭐ A única cor que um serviço escolhe é a de uma série de gráfico, e ele escolhe
por **nome semântico** (`positivo`/`negativo`/`neutro`/`atenção`), nunca por
valor. ⛔ E não existe token de dado «neutro» no sistema: `--muted` é tinta de
texto apagado e uma barra nessa cor lê como desligada, então o neutro cai no
acento. É uma lacuna, não uma escolha.

**2 · Cada peça precisa desenhar IGUAL em dois clientes** — o web (React +
TypeScript) e o celular (Flutter). Uma peça que difere transforma o contrato em
sugestão, e `telas/barra.html` mostra o que acontece quando difere.

**3 · As páginas públicas são HTML e CSS escritos no servidor, sem framework.**
Não há React nem biblioteca de componentes nelas.

**4 · Alvo de toque tem mínimo, e agora ele é MEDIDO** (`verificar/alvo.mjs`).
44×44 é a régua deste repositório; 24×24 é o piso da WCAG abaixo do qual é
reprova. Já corrigimos pontos de carrossel com **9×9** de área clicável, e o
botão «Entrar» da página de negócio saiu com 40px em produção.

## Como entregar

Trabalhe aqui, em PR neste repositório. Cada PR:

1. roda `npm run verificar` sem reprovar — os dois;
2. diz **o que estava errado antes** e o que mudou — não só o que ficou bonito;
3. se mexeu em token, diz qual e por quê.

A integração no produto é nossa. O que você constrói aqui é o que vai portado,
sem tradução no meio.

## Dependência

O verificador usa [Playwright](https://playwright.dev) com **Firefox**.

    npm i && npx playwright install firefox

⚠️ **Firefox, e não Chromium** — o Chromium empacotado pelo Playwright não
decodifica AAC, e o produto tem mensagem de voz em AAC/M4A. Numa tela com áudio,
o Chromium mostra erro de reprodução que é do navegador de teste, não do
produto.

⚠️ O extrator de tokens também usa **python3** (as paletas da página de negócio
são calculadas em Python). Isso é dependência de quem REGENERA os tokens, tendo o
produto ao lado — nunca de quem desenha.
