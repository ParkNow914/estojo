# O que temos hoje — e não é o alvo

Estes dois arquivos reproduzem, fielmente, o que está no ar. Eles existem por
**dois** motivos, e nenhum deles é «conserte isto»:

1. para você ver de onde estamos partindo, sem precisar de conta no produto;
2. porque são o que os verificadores medem quando se quer saber o número de hoje.

⛔ **Não trabalhe em cima deles.** O material é [`../conteudo/`](../conteudo/) e
[`../casca/`](../casca/). Uma reprodução é uma resposta pronta, e responder a uma
resposta dá conserto — não desenho.

⚠️ **E o que está aqui não é todo errado.** Parte é decisão cara, comprada com
defeito em produção, e precisa sobreviver ao redesenho:

- a página pública crava **44px** de alvo em botão, link de menu e campo;
- na faixa tingida ela troca o `--fraco` pelo `--apoio`, porque um terceiro fundo
  derruba um tom afinado contra dois;
- o carrossel corta o cartão seguinte de propósito: é o corte que ensina que dá
  para arrastar;
- o item ativo da barra usa `--muted` na legenda, não `--fraco` — medido em
  3,65:1 no fundo do item selecionado.

## Os três defeitos que estas telas revelaram

Estão declarados no markup com `data-reprova` / `data-reprova-alvo`, e são do
**produto**, não da reprodução:

| onde | medido | piso |
|---|---|---|
| moldura de todo campo de texto, nos dois clientes (`--line`/`kLine`) | 1,19–1,39:1 | 3,0 |
| `--grade` da página de negócio, nas seis paletas | 2,25–2,84:1 | 3,0 |
| ações por linha da lista densa | 27×18 px | 24×24 |

⭐ E o comparativo é o achado: a **página pública**, escrita à mão sem framework,
tem **zero** alvos abaixo de 44. O aplicativo, que tem sistema de desenho, tinha 23.
