/**
 * Mede contraste NO PIXEL RENDERIZADO e reprova o que não passa.
 *
 *   node verificar/contraste.mjs telas/conversa.html
 *   node verificar/contraste.mjs telas/*.html
 *
 * ⭐⭐ **A pergunta que este verificador força: esta cor é FILL ou é TEXTO?**
 * É a lição mais cara do desenho deste produto. Uma cor pode estar CERTA num
 * papel e ERRADA no outro, porque os pisos são diferentes:
 *
 *     texto, e ícone que carrega informação   →  4,5:1   (WCAG 1.4.3)
 *     objeto gráfico, borda de controle       →  3,0:1   (WCAG 1.4.11)
 *
 * ⛔ **Por que não adivinho o papel.** Um `<div>` com borda pode ser um cartão
 * decorativo (3,0) ou o limite de um campo de formulário (3,0 também, mas
 * medido contra outro fundo), e um `<span>` cinza pode ser legenda (4,5) ou
 * ornamento (isento). Adivinhar erra em silêncio — e silêncio é exatamente o
 * modo de falha que este arquivo existe para acabar.
 *
 * ⭐ Então o PAPEL SE DECLARA no markup, e declarar é o trabalho de desenho:
 *
 *     <p>                              → texto (4,5) — o padrão
 *     <span data-papel="grafico">      → objeto gráfico (3,0)
 *     <hr data-papel="ornamento">      → isento, e você disse que é
 *
 * ⚠️ **O fundo é MEDIDO, não declarado.** Ele sobe a árvore até achar quem
 * pinta de fato — porque `transparent` é o caso comum e o valor herdado é o que
 * o olho vê. Duas vezes no desenho deste produto um valor calibrado contra o
 * painel reprovou dentro da bolha, que tem outro fundo.
 *
 * ⛔ **E ele NÃO resolve `rgba` sobre `rgba`.** Quando acha translucidez
 * empilhada, ele diz que não sabe em vez de inventar um número — medir errado
 * é pior que não medir, porque produz um ✅ que ninguém confere depois.
 */
import pw from "playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ⭐⭐ TRÊS papéis, e o terceiro nasceu de uma tela: **o ícone que INFORMA**.
// A tabela deste repositório sempre disse «texto, e ícone que carrega
// informação → 4,5:1», e o verificador não tinha como dizer isso: `texto` só
// media elemento com nó de texto próprio (um `<svg>` não tem nenhum) e
// `grafico` aplica 3,0. Então o ícone da barra de apps — o que distingue uma
// tela NOSSA de uma que veio de um serviço de terceiro — não tinha declaração
// possível: ou escapava da medição, ou era medido contra a régua errada.
// ⚠️ E a régua errada aqui é a FROUXA: 3,0 num ícone de 18px que carrega a
// única pista de procedência da tela.
const PISO = { texto: 4.5, grafico: 3.0, icone: 4.5 };
const arquivos = process.argv.slice(2);
if (!arquivos.length) {
  console.error("uso: node verificar/contraste.mjs telas/*.html");
  process.exit(2);
}

/** Luminância relativa, WCAG 2.x. */
function luz([r, g, b]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function razao(a, b) {
  const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const navegador = await pw.firefox.launch();
let falhas = 0, medidas = 0, incertos = 0, conhecidas = 0;

for (const arq of arquivos) {
  const p = await (await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    isMobile: true,
    hasTouch: true,
  })).newPage();
  await p.goto("file://" + resolve(arq), { waitUntil: "load" });
  await p.waitForTimeout(200);

  const achados = await p.evaluate(({ PISO }) => {
    // ⛔⛔ **`color-mix` NÃO computa como `rgb()`, e a diferença era um buraco
    // calado.** O Firefox devolve `color(srgb 1 0.478431 0.478431 / 0.14)` —
    // outra função E outra escala (0 a 1, não 0 a 255). A versão anterior desta
    // regex casava só `rgb`/`rgba`, então todo fundo feito com `color-mix`
    // devolvia `null`, era tratado como TRANSPARENTE, e a medida saía contra um
    // ancestral mais fundo — com ✅ e o número errado, que é o pior resultado
    // possível. ⚠️ E não é hipótese: o conjunto `app` tem
    // `--chip-na-bolha: color-mix(in srgb, currentColor 8%, transparent)`, o
    // fundo do chip DENTRO da bolha, e a faixa de erro usa a mesma função.
    const num = (c) => {
      const cm = c.match(/color\(\s*srgb\s+([^)]+)\)/);
      if (cm) {
        const v = cm[1].split(/[\s/]+/).filter(Boolean).map(Number);
        return { rgb: v.slice(0, 3).map((x) => x * 255), a: v.length > 3 ? v[3] : 1 };
      }
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const v = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      return { rgb: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 };
    };
    // ⚠️ Sobe a árvore até achar quem PINTA. `transparent` é o caso comum.
    const fundoDe = (el) => {
      const pilha = [];
      for (let e = el; e; e = e.parentElement) {
        const c = num(getComputedStyle(e).backgroundColor);
        if (!c || c.a === 0) continue;
        pilha.push(c);
        if (c.a === 1) return { rgb: c.rgb, certo: pilha.length === 1 };
      }
      return { rgb: [0, 0, 0], certo: false };
    };
    const res = [];
    // ⛔ `el.className` num elemento SVG é um `SVGAnimatedString`, não uma
    // string: o rótulo do ícone saía como «svg.[object». Só o atributo serve
    // aos dois mundos — e um rótulo ilegível é um achado que ninguém localiza.
    const nomear = (el) => {
      const c = (el.getAttribute("class") || "").split(" ")[0];
      return (el.tagName + (c ? "." + c : "")).slice(0, 34);
    };
    document.querySelectorAll("*").forEach((el) => {
      const papel = el.dataset.papel || "texto";
      if (papel === "ornamento") return;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) {
        // ⛔⛔ Quem DECLAROU um papel e não tem tamanho é ERRO, não «nada a
        // medir». Foi assim que a trilha do player escapou: `flex:1` numa
        // bolha que encolhe até o conteúdo dá largura ZERO, e a primeira
        // versão deste arquivo simplesmente não imprimia a linha — o
        // relatório dizia «0 reprovadas» sobre um objeto invisível.
        if (el.dataset.papel && el.dataset.papel !== "ornamento")
          res.push({ semTamanho: true, papel: el.dataset.papel,
                     alvo: nomear(el),
                     caixa: `${r.width.toFixed(1)}×${r.height.toFixed(1)}` });
        return;
      }
      const est = getComputedStyle(el);
      if (est.visibility === "hidden" || est.opacity === "0") return;

      const proprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      let cor = null, oquee = null;
      if (papel === "icone") {
        // ⚠️ A ordem é a que o desenho usa: um ícone traçado (`stroke`) com
        // `fill: none` é o caso comum no material outlined, e ler o `fill`
        // primeiro devolveria «nenhuma cor» e o ícone sairia da medição.
        const eSvg = el instanceof SVGElement;
        const f = eSvg ? num(est.fill) : null;
        const t = eSvg ? num(est.stroke) : null;
        const c = num(est.color);
        if (f && f.a > 0) { cor = f; oquee = "ícone"; }
        else if (t && t.a > 0) { cor = t; oquee = "ícone (traço)"; }
        else { cor = c; oquee = "ícone (herda)"; }
      } else if (papel === "grafico") {
        // ⭐⭐ UM objeto gráfico se define por BORDA ou por PREENCHIMENTO, e o
        // segundo caso é o que dá nome à lição — «esta cor é FILL ou é TEXTO?».
        // A primeira versão deste arquivo só olhava a borda, e a trilha do
        // player de áudio (que é só fundo) escapava da medição sem aviso: um ✅
        // que não media nada. Se há borda, ela é o objeto; se não, o fundo dele
        // é o objeto, medido contra o fundo de QUEM ESTÁ ATRÁS.
        // ⛔⛔ **AS QUATRO BORDAS, e não só a de cima.** A primeira versão lia
        // `borderTopColor` — e a página pública de um negócio é feita de FAIXAS
        // separadas por um traço de 2px que é `border-bottom`. Nelas o topo é
        // zero, a leitura caía no `color` do elemento (a cor do TEXTO de dentro)
        // e o traço estrutural saía do relatório medido como se fosse letra:
        // um ✅ sobre um número que não é do objeto. Mesma família da trilha do
        // player — o verificador olhando um lugar só.
        //
        // ⚠️ Quando mais de um lado pinta, vale o PIOR: uma caixa com moldura
        // clara em cima e escura embaixo é tão ilegível quanto o pior lado dela.
        const lados = [["top", "cima"], ["right", "direita"],
                       ["bottom", "baixo"], ["left", "esquerda"]]
          .map(([l, pt]) => [num(est[`border${l[0].toUpperCase() + l.slice(1)}Color`]),
                             parseFloat(est[`border${l[0].toUpperCase() + l.slice(1)}Width`]), pt])
          .filter(([c, w]) => c && c.a > 0 && w > 0);
        if (lados.length) {
          // O pior lado se escolhe DEPOIS de saber o fundo, então guardo todos
          // e o desempate acontece fora do navegador (ver `pior`).
          cor = lados[0][0]; oquee = "borda";
          // ⛔⛔ **E o fundo de uma BORDA é o de trás, nunca o de dentro.** Um
          // botão preenchido com a cor de acento e contornado com a MESMA cor
          // dava **1,00:1** — o verificador comparava a moldura com o próprio
          // recheio. O que faz uma moldura ser perceptível é o que está do lado
          // de fora dela; medir por dentro reprova todo controle sólido e
          // aprova o que desaparece contra a página.
          el.dataset.__fundoDoPai = "1";
          if (lados.length > 1)
            el.dataset.__lados = JSON.stringify(lados.map(([c, w, pt]) => [c.rgb, pt]));
          else if (lados[0][2] !== "cima") oquee = `borda (${lados[0][2]})`;
        }
        else {
          // ⛔⛔ **SVG não pinta com `background-color`, pinta com `fill`.** A
          // barra de um gráfico é o objeto gráfico canônico da 1.4.11 — e a
          // versão anterior deste arquivo lia `backgroundColor` (transparente
          // num `<rect>`), caía no `color` HERDADO do painel e imprimia ✅ com
          // 13,33: o número da cor do TEXTO, não o da barra. Três vezes seguidas
          // o mesmo defeito de forma: o verificador olhando uma propriedade só.
          // ⛔ **E `fill` só vale se o elemento for SVG.** `getComputedStyle`
          // devolve `fill: rgb(0,0,0)` em QUALQUER elemento HTML — é a inicial
          // da propriedade, não uma pintura. Sem esta guarda a trilha do player
          // (um `<span>` com fundo `--line-controle`) passou a ser medida como
          // PRETO e caiu de 3,59 para 1,63: eu troquei um falso ✅ por um falso
          // ⛔ na mesma linha. Foi rodar as cinco telas de novo que pegou.
          const eSvg = el instanceof SVGElement;
          const svg = eSvg ? num(est.fill) : null;
          const traco = eSvg ? num(est.stroke) : null;
          const f = (svg && svg.a > 0) ? svg
                  : (traco && traco.a > 0) ? traco
                  : num(est.backgroundColor);
          if (f && f.a > 0) {
            cor = f;
            oquee = (svg && svg.a > 0) ? "preenchimento (fill)"
                  : (traco && traco.a > 0) ? "traço (stroke)" : "preenchimento";
            // ⛔ e aqui o fundo é o do PAI, não o próprio: comparar o
            // preenchimento consigo mesmo daria 1,00 sempre.
            el.dataset.__fundoDoPai = "1";
          } else { cor = num(est.color); oquee = "objeto"; }
        }
      } else if (proprio) {
        cor = num(est.color);
        oquee = "texto";
      }
      if (!cor) return;

      const fundo = fundoDe(el.dataset.__fundoDoPai ? el.parentElement : el);
      delete el.dataset.__fundoDoPai;
      const lados = el.dataset.__lados ? JSON.parse(el.dataset.__lados) : null;
      delete el.dataset.__lados;
      res.push({
        papel, oquee, lados,
        // ⭐ A reprova DECLARADA — ver o bloco «reprova conhecida» no fim.
        reprova: el.dataset.reprova || null,
        alvo: nomear(el),
        texto: (el.textContent || "").trim().slice(0, 30),
        cor: cor.rgb, translucido: cor.a < 1, fundo: fundo.rgb, fundoCerto: fundo.certo,
        piso: PISO[papel],
        px: parseFloat(est.fontSize), peso: est.fontWeight,
      });
    });
    return res;
  }, { PISO });

  console.log(`\n── ${arq}`);
  const vistos = new Set();
  for (const a of achados) {
    // ⚠️ Um valor por combinação: repetir a mesma cor cem vezes treina quem lê
    // a ignorar a tela.
    // ⛔ `oquee` ENTRA na chave. Sem ele, a trilha do player (preenchimento
    // #8E867B sobre a bolha) foi engolida como duplicata do chip (BORDA da
    // mesma cor sobre a mesma bolha) — dois papéis diferentes com o mesmo par
    // de cores, e o segundo desaparecia do relatório sem aviso.
    const chave = a.semTamanho ? `sem|${a.alvo}`
      // ⛔⛔ **`translucido` e `fundoCerto` ENTRAM na chave.** Sem eles, um caso
      // que o verificador NÃO SABE medir era engolido como duplicata de um que
      // ele mede: a `.tag` (texto `--muted` sobre fundo translúcido) tinha a
      // mesma cor e o mesmo fundo-de-trás que um parágrafo comum, e a linha «?»
      // simplesmente não saía — o relatório dizia «0 não medidas» sobre duas
      // combinações que ele não mediu. É a terceira vez que esta chave curta
      // apaga um achado; da primeira foi a trilha do player.
      : `${a.papel}|${a.oquee}|${a.cor}|${JSON.stringify(a.lados)}|${a.fundo}` +
        `|${!!a.reprova}|${a.translucido}|${a.fundoCerto}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    if (a.semTamanho) { falhas++;
      console.log(`  ⛔ ${a.alvo.padEnd(34)} declara papel «${a.papel}» e tem caixa ${a.caixa} — objeto sem tamanho não é objeto`);
      continue; }
    if (a.translucido) { incertos++;
      console.log(`  ?  ${a.alvo.padEnd(34)} cor translúcida — não meço empilhamento, declare a cor final`);
      continue; }
    if (!a.fundoCerto) { incertos++;
      console.log(`  ?  ${a.alvo.padEnd(34)} fundo herdado de um ancestral translúcido — não sei o valor real`);
      continue; }

    // ⚠️ Moldura com lados de cores diferentes: mede-se o PIOR. Uma caixa que
    // desaparece em um dos lados é uma caixa que não delimita nada.
    let cor = a.cor, oquee = a.oquee;
    if (a.lados) {
      const pior = a.lados.reduce((m, [c, pt]) =>
        razao(c, a.fundo) < razao(m[0], a.fundo) ? [c, pt] : m);
      cor = pior[0]; oquee = `borda (${pior[1]}, o pior de ${a.lados.length})`;
    }
    const r = razao(cor, a.fundo);
    medidas++;
    // ⭐ Texto GRANDE tem piso menor (WCAG 1.4.3): 18,66px negrito ou 24px.
    const grande = a.papel === "texto" && (a.px >= 24 || (a.px >= 18.66 && +a.peso >= 700));
    const piso = grande ? 3.0 : a.piso;
    const ok = r >= piso;
    // ⭐⭐ **REPROVA CONHECIDA — a válvula, e por que ela é segura.**
    //
    // Esta tela reproduz o produto que está NO AR. Quando o produto tem um
    // defeito de contraste, a tela fiel reprova — e aí há duas saídas ruins e
    // uma boa. As ruins: mexer na cor da reprodução (a tela passa a ensinar uma
    // cor que não existe, e o defeito fica invisível justamente aqui, no único
    // lugar que o mediria) ou baixar o piso (mentira sobre a régua). A boa é
    // DECLARAR, com o número do card:
    //
    //     <input data-papel="grafico" data-reprova="OMINFRA-000: motivo">
    //
    // ⛔ **E a trava que impede a válvula de virar vazamento: exceção que
    // PASSA é falha.** Consertado o produto, a tela sobe de 2,83 para acima do
    // piso e o verificador exige que a declaração saia — senão em um ano o
    // arquivo estaria cheio de perdões para defeitos que já não existem, e
    // ninguém saberia quais ainda valem.
    if (a.reprova && ok) { falhas++;
      console.log(`  ⛔ ${a.alvo.padEnd(34)} declara reprova conhecida «${a.reprova}» e PASSOU (${r.toFixed(2)}) — apague a declaração`);
      continue; }
    if (a.reprova && !ok) { conhecidas++;
      console.log(`  ⚠️ ${r.toFixed(2).padStart(5)} / ${piso.toFixed(1)}  ${oquee.padEnd(12)} ${a.alvo.padEnd(30)} ${a.reprova}`);
      continue; }
    if (!ok) falhas++;
    const nota = grande ? " (texto grande, piso 3,0)" : "";
    console.log(`  ${ok ? "✅" : "⛔"} ${r.toFixed(2).padStart(5)} / ${piso.toFixed(1)}  ${oquee.padEnd(12)} ${a.alvo.padEnd(30)} ${a.texto}${nota}`);
  }
}
await navegador.close();

console.log(`\n${falhas ? "⛔" : "✅"} ${medidas} combinações medidas · ${falhas} reprovadas · ` +
            `${conhecidas} reprova(s) conhecida(s) do produto · ${incertos} não medidas`);
if (conhecidas)
  console.log("   ⚠️ reprova CONHECIDA é defeito do produto reproduzido de propósito, com card. Não é licença: some quando o produto for consertado, e o verificador cobra.");
if (incertos)
  console.log("   ⚠️ «não medida» NÃO é aprovada: é translucidez empilhada, e o número honesto exige a cor final.");
process.exit(falhas ? 1 : 0);
