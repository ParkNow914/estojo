# estojo — o conteúdo do okmigo, para quem vai desenhar

Este repositório existe para uma pessoa de fora **projetar as telas do okmigo sem
ter acesso ao okmigo**.

⭐⭐ **Ele não entrega telas. Entrega o conteúdo.** É a diferença entre receber
uma resposta e receber a pergunta — e é uma correção: a primeira versão daqui
mandava as telas prontas, e o que voltou foram consertos. Quem recebe uma tela
conserta a tela.

⛔ **O que NÃO está aqui, de propósito:** código do produto, banco, credencial,
segredo, dado de gente real. Se você precisou de algum deles, diga — provavelmente
falta um caso aqui, não um acesso.

## Comece por aqui

    npm i && npm run casca

Isso escreve `casca/` — cinco superfícies do produto em **HTML sem uma linha de
CSS**: o que cada uma precisa mostrar, quem a abre, o que varia, e os casos. Abra
`casca/index.html` no navegador.

⚠️ Ela é **gerada** de [`conteudo/`](conteudo/) e não vem versionada: saída de
build no repositório é uma segunda fonte da mesma coisa, e a segunda envelhece
calada. Se preferir ler o modelo direto, os JSON têm o mesmo texto.

O feio é intencional e é o recado. Se o documento pelado não faz sentido, nenhum
CSS conserta — a hierarquia se prova antes da primeira cor.

## As cinco superfícies

| superfície | o que ela é | casos |
|---|---|---|
| [`pagina-do-negocio`](conteudo/pagina-do-negocio.json) | ⭐ **a de maior alcance**: o endereço que a dona manda no WhatsApp, aberto por quem não tem conta | 4 |
| [`barra-de-apps`](conteudo/barra-de-apps.json) | o índice do que existe para aquela conta, nos dois clientes | 3 |
| [`conversa`](conteudo/conversa.json) | a tela mais usada do produto e a menos desenhada | 3 |
| [`tarefas`](conteudo/tarefas.json) | a lista densa, e as **quatro** aparências dela | 4 |
| [`superficie-declarada`](conteudo/superficie-declarada.json) | o vocabulário que todo serviço integrado usa | 3 |

Cada arquivo traz **o que ela faz**, **quem abre**, **o que varia**, **o que
precisa sobreviver ao redesenho** e os **casos**. O JSON é a fonte; a casca é
gerada dele (`npm run casca`) e não se edita à mão.

## ⛔ Os casos extremos são o trabalho

Com quatro itens confortáveis e um nome de catorze caracteres, qualquer layout
parece bom. A decisão de desenho só aparece no extremo — e é por isso que cada
superfície traz os seus:

- a barra com **3** entradas (conta nova) e com **14**, somando 26 telas de
  serviço. Não se resolve trocando cor nenhuma;
- a página de um negócio **recém-criado**: pública, e ainda sem uma linha escrita;
- a mesma página com **um bloco só**, porque a dona desligou o resto — é direito dela;
- a conversa com uma mensagem de **«?»** e outra de quatro parágrafos, áudio de
  9 minutos e PDF com nome que não cabe;
- dezoito tarefas vencidas de uma vez;
- uma tabela declarada de **nove colunas** num aparelho de 390px.

⚠️ **Nós vamos rodar o seu layout contra casos que você não viu.** É a única prova
que separa desenho de decoração.

## O que é seu para decidir, e o que não é

**Seu:** hierarquia, ritmo, densidade, onde cada coisa mora, o que aparece
primeiro, o que se esconde, como a pessoa navega no celular, tipografia, escala
de espaço, estados, e as peças que faltam.

**Não seu** — são regras do produto, e cada arquivo de conteúdo lista as suas:
por exemplo, o formulário da página pública **nasce desligado**; «Conversas» nunca
some da barra; **não existe aba** no contrato de superfície declarada; e a
transcrição de um áudio **é** a mensagem, não uma legenda escondida.

## As restrições que moldam o desenho

**1 · Duas telas, dois clientes, uma peça.** O web é React + TypeScript e o
celular é Flutter. Uma peça que desenha diferente nos dois transforma o contrato
em sugestão — e isso já aconteceu aqui: uma proposta trouxe o estado recolhido da
coluna inteiro no Flutter e resumido a `width: 72px` no CSS.

**2 · As páginas públicas são HTML e CSS escritos no servidor, sem framework.**
Não há React nem biblioteca de componentes nelas.

**3 · Parte das telas é declarativa.** Serviços descrevem a superfície num
contrato sem campo de cor, fonte ou medida, e nós a desenhamos nativamente. Parte
do trabalho é o **vocabulário**, não telas individuais.

**4 · O celular é a prioridade.** É de onde vem a maior parte de quem chega.

## As cores de verdade

[`tokens/atual.json`](tokens/atual.json) tem **244 valores extraídos do produto**
— não digitados. Quatro conjuntos: o aplicativo (56 no escuro, 29 no claro), as
páginas de apresentação, as páginas-documento, e a página de negócio (6 medidas
mais **6 paletas × 2 temas × 11 cores**, uma por ramo).

⛔ **Use estes.** Uma proposta com paleta inventada não é portável, e o produto é
**escuro por padrão** — uma casca branca não serve.

⛔ **E aqui está o problema de fundo:** os dois conjuntos principais têm
temperatura oposta. As páginas usam `#09090b` (azulado); o aplicativo usa
`#131211` (quente). O acento é o **mesmo** nos dois. Alguém alinhou o acento e não
os neutros, e é por isso que atravessar da página inicial para dentro do app
parece trocar de produto. Nenhum framework conserta isso.

## Sobre acessibilidade

Contraste e alvo de toque são critério de aceitação, não capítulo final. Há
**dois** pisos de contraste — 4,5:1 para texto e para ícone que informa, 3,0:1
para objeto gráfico e borda de controle — e alvo de toque mínimo de 44×44. A mesma
cor pode estar certa num papel e errada no outro.

⚠️ **Nós medimos, no pixel renderizado, quando você entrega** — a ferramenta é
nossa e roda do nosso lado. Ela não fica aqui de propósito: régua à vista faz
otimizar para a régua, e foi o que aconteceu nas duas primeiras propostas que
recebemos. Se algo reprovar, você recebe o número e o elemento.

⭐ **E passar nela nunca foi o trabalho.** Ela não sabe dizer se a arquitetura
ficou boa — só reprova o que é indefensável.

## Como entregar

Em PR neste repositório, numa pasta sua. Cada PR:

1. diz **para qual superfície e quais casos** — inclusive como se comporta nos
   extremos;
2. diz **o que estava errado antes** e o que mudou;
3. roda as duas réguas sem reprovar;
4. usa os tokens de `tokens/atual.json`, com **tema escuro**.

⚠️ **Não há tela pronta neste repositório, e isso é escolha.** Uma reprodução do
que já existe é uma resposta pronta, e responder a uma resposta dá conserto, não
desenho — foi exatamente o que aconteceu nas duas primeiras propostas que
recebemos. Se quiser ver como o produto resolve alguma destas superfícies hoje,
**pergunte**: mandamos a captura, com o que naquela tela é decisão cara e precisa
sobreviver. Cada arquivo de conteúdo já lista as regras da superfície dele.

A integração no produto é nossa. O que você constrói aqui é o que vai portado,
sem tradução no meio.

## Dependência

**Nenhuma.** `npm run casca` e `npm run tokens` são node puro, sem `npm i`.

⚠️ O extrator de tokens exige o produto ao lado e é gesto nosso, nunca de quem
desenha: você consome o JSON.
