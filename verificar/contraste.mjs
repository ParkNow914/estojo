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

const PISO = { texto: 4.5, grafico: 3.0 };
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
let falhas = 0, medidas = 0, incertos = 0;

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
    const num = (c) => {
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
                     alvo: (el.tagName + "." + String(el.className).split(" ")[0]).slice(0, 34),
                     caixa: `${r.width.toFixed(1)}×${r.height.toFixed(1)}` });
        return;
      }
      const est = getComputedStyle(el);
      if (est.visibility === "hidden" || est.opacity === "0") return;

      const proprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      let cor = null, oquee = null;
      if (papel === "grafico") {
        // ⭐⭐ UM objeto gráfico se define por BORDA ou por PREENCHIMENTO, e o
        // segundo caso é o que dá nome à lição — «esta cor é FILL ou é TEXTO?».
        // A primeira versão deste arquivo só olhava a borda, e a trilha do
        // player de áudio (que é só fundo) escapava da medição sem aviso: um ✅
        // que não media nada. Se há borda, ela é o objeto; se não, o fundo dele
        // é o objeto, medido contra o fundo de QUEM ESTÁ ATRÁS.
        const b = num(est.borderTopColor);
        const temBorda = b && b.a > 0 && parseFloat(est.borderTopWidth) > 0;
        if (temBorda) { cor = b; oquee = "borda"; }
        else {
          const f = num(est.backgroundColor);
          if (f && f.a > 0) {
            cor = f; oquee = "preenchimento";
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
      res.push({
        papel, oquee,
        alvo: (el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : "")).slice(0, 34),
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
    const chave = a.semTamanho ? `sem|${a.alvo}` : `${a.papel}|${a.oquee}|${a.cor}|${a.fundo}`;
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

    const r = razao(a.cor, a.fundo);
    medidas++;
    // ⭐ Texto GRANDE tem piso menor (WCAG 1.4.3): 18,66px negrito ou 24px.
    const grande = a.papel === "texto" && (a.px >= 24 || (a.px >= 18.66 && +a.peso >= 700));
    const piso = grande ? 3.0 : a.piso;
    const ok = r >= piso;
    if (!ok) falhas++;
    const nota = grande ? " (texto grande, piso 3,0)" : "";
    console.log(`  ${ok ? "✅" : "⛔"} ${r.toFixed(2).padStart(5)} / ${piso.toFixed(1)}  ${a.oquee.padEnd(12)} ${a.alvo.padEnd(30)} ${a.texto}${nota}`);
  }
}
await navegador.close();

console.log(`\n${falhas ? "⛔" : "✅"} ${medidas} combinações medidas · ${falhas} reprovadas · ${incertos} não medidas`);
if (incertos)
  console.log("   ⚠️ «não medida» NÃO é aprovada: é translucidez empilhada, e o número honesto exige a cor final.");
process.exit(falhas ? 1 : 0);
