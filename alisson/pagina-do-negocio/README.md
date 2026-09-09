# A página pública de um negócio — os quatro casos

    node alisson/pagina-do-negocio/gerar.mjs

Escreve `saida/`, um arquivo por caso. Abra `saida/index.html` e **estreite a
janela até 390px** — é onde a decisão foi tomada.

Sem dependência, como o resto da casa. A saída não vai versionada pela razão que
o README de vocês dá: saída de build no repositório é uma segunda fonte da mesma
coisa, e a segunda envelhece calada.

---

## ⭐⭐ A decisão que governa a página: bloco vazio não existe

Não vira estado vazio, não vira «ainda não há nada por aqui», não vira caixa
pontilhada. **Some do documento.**

O motivo não é estética, é quem lê. Um estranho, no celular, vindo de um link que
a **dona** mandou. Uma página que anuncia «este negócio não escreveu nada» usa o
espaço público da dona para falar mal dela — para um leitor que nem sabia que
existiam blocos. O vazio só é informação para quem conhece o formulário por trás;
para quem chegou pelo WhatsApp é um negócio que parece abandonado.

E é isto que faz **`recem-criada` e `um-bloco-so` caírem no mesmo layout**, sem
uma linha de CSS a mais. Quando sobra o contato, a página é um cartão de contato
— e é um cartão de contato bem feito, não uma página cheia de buracos.

A Serralheria do Bairro tem nome, handle e um telefone. Não tem cidade, endereço,
horário, vitrine, feitos nem avisos. A página dela mostra as iniciais, o nome, o
telefone como ação, e o caminho para dentro do produto. **Nada ali parece
defeito**, e essa era a pergunta do caso.

## ⛔ O achado: falta uma REGRA de borda de controle, não um token

O app tem `--line-controle` (`#8E867B`, **5,21:1** sobre o fundo dele) separado
de `--line`. A página pública **não tem equivalente**. Os dois tokens de linha
que ela tem, medidos no escuro, sobre `--papel`:

| token | neutro | forja | forno | cuidado | tinta | campo | piso |
|---|---|---|---|---|---|---|---|
| `--linha` | 1,30 | 1,29 | 1,33 | 1,30 | 1,26 | 1,31 | 3,0 |
| `--grade` | 2,59 | 2,55 | 2,62 | 2,59 | 2,58 | 2,59 | 3,0 |
| `--apoio` | 6,47 | 6,50 | 6,85 | 6,71 | 6,54 | 6,85 | 3,0 |

O teto dos dois tokens de linha é **2,62:1**, contra piso de 3,0 para borda de
controle. Mas `--apoio` já está na paleta e passa com folga. **Não falta um
valor: falta a regra.** E ela tem a mesma forma da que vocês já têm para o texto
na faixa tingida — «neste papel, use aquele outro token».

É a mesma forma do problema que o README da casa registra: alguém alinhou o
acento e não os neutros; alguém deu ao app uma borda de controle e não deu à
página pública. A superfície de **maior alcance** é a que ficou sem.

Onde morde: `avisos-primeiro-com-formulario` é o único caso com formulário
ligado, e é o único lugar da página onde uma borda é a única pista de um
controle. Aqui os campos usam `--apoio`.

## A faixa tingida: a regra virou herança, não disciplina

O conteúdo manda trocar o tom de texto mais fraco quando o fundo é `--tinte`. Ela
existe porque o token reprova: `--fraco` sobre `--tinte` dá entre **3,93 e 4,09**
nas seis paletas, contra piso de 4,5.

Em vez de pedir que alguém lembre disso em cada bloco novo, existe um
`--texto-fraco` que vale `--fraco` na página e `--apoio` dentro de `.tingido`.
Uma linha de CSS, e quem escrever um bloco tingido daqui a um ano acerta sem
saber que a regra existe.

## ⭐⭐ A travessia: o botão de entrar usa o azul do produto

Vocês registram que atravessar da página para dentro do app parece trocar de
produto, porque os neutros têm temperatura oposta (`#09090b` azulado nas páginas,
`#131211` quente no app) e só o acento foi alinhado.

Não mexi nos neutros — não é meu para decidir, e um redesenho de neutro é uma
conversa, não um PR. Mas **este botão é literalmente a porta**: é o único
elemento da página que leva para o outro lado. Pintá-lo com `#6EA8FE`, a única
cor que os dois conjuntos já compartilham, faz a troca ser **anunciada** em vez
de ser um susto.

Nos cinco ramos coloridos ele destoa de propósito. No neutro ele coincide com o
acento do ramo — e isso também está certo: negócio sem ramo tem a cara do
produto.

## O que quebrou no meio do caminho, e como

São três, e os três só apareceram porque a coisa foi medida em vez de olhada.

**O corte do carrossel virou 3px.** A regra de vocês diz que o corte ensina que
dá para arrastar. Eu tinha escrito `.feito figure { margin: 0 }` — só que
`.feito` **é** o `<figure>`. O seletor procurava um figure dentro do cartão, não
casava com nada, e os 40px de margem que o navegador dá a todo `figure`
continuaram de pé. O vão entre cartões virou 94px em vez de 14, e em 390px
sobravam **3px** do próximo cartão. Um seletor que não casa com nada falha
calado.

**E o corte tem de ser proporção, não medida.** Com base fixa de 280px existiam
larguras em que os cartões cabiam quase exatos e a fatia sumia: **0px em 768px**,
4px em 1200px. Em porcentagem a fração é garantida. Hoje: 76px em 360, 83px em
390, 92px em 430, 79px em 768, 198px em 1200.

**O topo era de vidro fosco, e eu tirei.** Uma barra fixa translúcida tem atrás
dela o que estiver rolando naquele instante: o texto dela não tem *um* contraste,
tem um por posição de rolagem, e nenhum deles se pode afirmar. É a mesma
armadilha do rgba sobre rgba. Troquei um efeito por um número defensável.

Além desses: a foto do aviso tinha `max-width:420px`, que **anula** o
`max-width:100%` e estourava a tela; o link do telefone tinha 27px de altura
dentro de uma linha de 44 (o dedo acerta a linha, e nada acontece); e o botão
«Entrar» do topo apontava para `#b-entrar`, que **não existe** em `um-bloco-so`,
porque a dona desligou aquele bloco. O caso extremo achou o defeito.

## O que eu tirei em vez de consertar

O selo do rodapé era um link de 17px de altura para o mesmo lugar que o botão do
topo e o bloco «entrar» já apontam. Inflar um terceiro caminho até 44px seria
consertar o número e manter o excesso. Virou assinatura, sem link.

## Os números, nos quatro casos, a 390px

| | cheia | recem-criada | um-bloco-so | avisos+form |
|---|---|---|---|---|
| textos medidos | 36 | 12 | 14 | 27 |
| abaixo do piso | 0 | 0 | 0 | 0 |
| pior que passa | 4,95:1 | 4,94:1 | 4,97:1 | 4,88:1 |
| alvos abaixo de 44×44 | 0 | 0 | 0 | 0 |
| paradas de Tab | 4 | 3 | 2 | 7 |
| sem indicador de foco | 0 | 0 | 0 | 0 |
| rolagem horizontal | não | não | não | não |
| fundo semitransparente | nenhum | nenhum | nenhum | nenhum |

O pior texto que passa é `--fraco` sobre `--bg`, entre 4,88 e 4,97 — o teto do
token, não uma escolha minha. **`--fraco` sobre `--papel` passa por 4,53**, com
três centésimos de margem: está no fio, e qualquer mexida em `--papel` o derruba.

⚠️ Medido no Chromium, a 390×844, DPR 3, escuro. **Não no Firefox** — o build do
Playwright dele não sobe nesta máquina (`mozglue` como assembly lado a lado, sem
erro útil). Isso importa aqui por um motivo específico: no Firefox o anel de foco
herda o `color` do elemento quando não há cor declarada, e é assim que um anel
passa com folga no Chromium e reprova no Firefox. **Neste CSS o anel tem cor
própria declarada** (`outline: 2px solid var(--apoio)`), que é justamente o que
impede a divergência entre os dois. Mas quem mede é vocês, e o número de vocês
vale mais que o meu.

## ⚠️ Três coisas que eu preciso perguntar

**1. «Se está aberto» não dá para responder com o conteúdo que existe.** O
`o_que_faz` promete que quem abre sabe, em segundos, **se o negócio está
aberto**. Mas `horario` é texto livre («Terça a domingo, 6h às 19h», «Com hora
marcada»). Não dá para dizer «aberto agora» a partir disso sem adivinhar, e
adivinhar errado numa página pública manda a pessoa até a porta de um lugar
fechado. Então eu **não** inventei o selo. Ou o produto tem horário estruturado e
o estojo não trouxe, ou a promessa não está sendo cumprida hoje. Qual dos dois?

**2. O bloco `formulario` diz «quatro campos», e o único caso traz três.**
`seu nome`, `telefone ou e-mail`, `o que você precisa`. Qual é o quarto?

**3. Não há token de família tipográfica para esta superfície** — só `--mono`. O
app usa Montserrat. Usei a pilha do sistema, porque esta página é aberta por um
estranho no celular vindo de um link e a primeira coisa que ela precisa é
aparecer: uma webfont custa uma requisição bloqueante ou um salto de texto. Essa
conta é de vocês, não minha para gastar calado. Se a continuidade de marca vale o
custo, é trocar uma linha.

## O que não fiz

Não desenhei as outras quatro superfícies, e não mexi em nada fora de
`alisson/`. Não propus mudança nos neutros. Não desenhei o estado de erro do
formulário nem o de sucesso — não estão no conteúdo, e inventar contrato de
superfície é o tipo de coisa que o README de vocês separa como «não seu».

E as fotos: o estojo diz `foto: true` e não traz arquivo. Os cartões trazem um
marcador SVG gerado da paleta do ramo, inline. **Não é foto** — é o lugar dela,
com a proporção certa (4:5, retrato, que é o formato de celular), para que a
decisão de layout possa ser julgada sem que uma imagem bonita empreste qualidade
que o desenho não tem.
