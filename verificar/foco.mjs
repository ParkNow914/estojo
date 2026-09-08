/**
 * Mede o INDICADOR DE FOCO e reprova o que não passa.
 *
 *   node verificar/foco.mjs telas/*.html
 *
 * ⭐⭐ **Por que um TERCEIRO arquivo.** O `contraste.mjs` mede a cor de um
 * estado parado e o `alvo.mjs` mede a caixa. O foco não é nenhum dos dois: é um
 * estado que **só existe enquanto alguém navega pelo teclado**, não aparece em
 * captura de tela, e por isso escapa inteiro dos outros dois. O README já dizia
 * que foco não era medido — este arquivo é essa linha saindo da lista.
 *
 * ⭐⭐ **A pergunta que ele força: o foco MUDA alguma coisa na tela?**
 * Um indicador de foco não é uma cor, é uma DIFERENÇA. Regra de `:focus` que
 * existe e não altera pixel nenhum passa em qualquer leitura de CSS e falha com
 * a pessoa na frente. Então aqui não se lê folha de estilo: aperta-se **Tab**,
 * e compara-se o computado de antes com o de depois.
 *
 *     2.4.7 Focus Visible      (AA)   → tem que haver indicador
 *     2.4.11 Focus Appearance  (AAA)  → e ele tem que ser perceptível: 3,0:1
 *
 * ⛔ **`outline: none` sem substituto é o modo de falha que este arquivo existe
 * para acabar.** É uma linha que alguém escreve para tirar a moldura feia do
 * navegador, e ela apaga a única pista de onde a pessoa está. O verificador
 * separa os dois casos, porque o conserto é diferente: quem nunca teve
 * indicador precisa ganhar um; quem tinha e desligou precisa devolver.
 *
 * ⚠️ **Tab de verdade, e não `el.focus()`.** O `:focus-visible` depende da
 * ÚLTIMA interação: foco por programa pode não casar a mesma regra que o
 * teclado casa, e aí o relatório mediria um estado que ninguém vê. A varredura
 * anda com Tab a partir do topo, exatamente como a pessoa anda.
 *
 * ⚠️ **A ordem do Tab é a do DOM, e ela também é achado.** Quando a posição
 * visual vem do CSS, o foco pula pela tela — este arquivo imprime a sequência
 * para que isso apareça, mas não reprova por ela: julgar ordem exige saber a
 * intenção do desenho, e adivinhar é o que os outros dois se recusam a fazer.
 *
 * ⛔ **O que ele NÃO mede:** área mínima do indicador (a 2.4.11 pede o
 * equivalente a 2px de perímetro), foco dentro de `iframe`, e o `hit-slop` do
 * Flutter — lá o indicador é do framework e não deste HTML.
 *
 * A válvula é a mesma dos outros dois, e o atributo é PRÓPRIO:
 *
 *     <button data-reprova-foco="OMINFRA-000: sem indicador, ação de linha">
 *
 * ⛔ São TRÊS atributos agora, e não um por comodidade: um perdão de cor não
 * pode calar um alvo pequeno, e nenhum dos dois pode calar um foco invisível.
 * Três réguas, três desculpas. E exceção que PASSA continua sendo falha.
 */
import pw from "playwright";
import { resolve } from "node:path";

const PISO = 3.0;          // 2.4.11 / 1.4.11 — indicador é objeto gráfico
const MAX_TAB = 120;       // trava de volta: formulário com laço não trava a suíte
const arquivos = process.argv.slice(2);
if (!arquivos.length) {
  console.error("uso: node verificar/foco.mjs telas/*.html");
  process.exit(2);
}

/** Luminância relativa, WCAG 2.x. Mesma do contraste, de propósito. */
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
let falhas = 0, medidos = 0, conhecidas = 0, semIndicador = 0, desligados = 0;

for (const arq of arquivos) {
  const p = await (await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2, colorScheme: "dark", isMobile: true, hasTouch: true,
  })).newPage();
  await p.goto("file://" + resolve(arq), { waitUntil: "load" });
  await p.waitForTimeout(200);

  // ⚠️ O retrato de cada elemento ANTES de qualquer foco. Sem esta linha de
  // base não existe «diferença»: só dá para dizer que o foco mudou algo
  // comparando com o que havia antes dele.
  await p.evaluate(() => {
    window.__antes = new Map();
    const alvo = "a[href],button,input,select,textarea,[tabindex],[role=button]";
    for (const el of document.querySelectorAll(alvo)) {
      const e = getComputedStyle(el);
      window.__antes.set(el, {
        outline: `${e.outlineStyle} ${e.outlineWidth} ${e.outlineColor}`,
        sombra: e.boxShadow,
        borda: `${e.borderColor} ${e.borderWidth}`,
        fundo: e.backgroundColor,
        cor: e.color,
      });
    }
  });

  const achados = [];

  await p.locator("body").click({ position: { x: 1, y: 1 } }).catch(() => {});

  for (let i = 0; i < MAX_TAB; i++) {
    await p.keyboard.press("Tab");
    const r = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      // ⛔ Identidade por MARCA no elemento, e não por rótulo. A primeira
      // versão comparava tag + classe + texto para saber se o Tab tinha dado a
      // volta — e duas ações iguais em linhas diferentes da lista têm
      // exatamente o mesmo rótulo. A varredura parava na segunda e o relatório
      // dizia «7 paradas» numa tela com 12. Contagem a menos é silêncio, que é
      // o que estes arquivos existem para acabar.
      if (el.hasAttribute("data-foco-visto")) return { jaVisto: true };
      el.setAttribute("data-foco-visto", "1");
      const antes = window.__antes.get(el);
      const e = getComputedStyle(el);
      const cx = el.getBoundingClientRect();
      const c = (el.getAttribute("class") || "").split(" ")[0];

      // ⛔⛔ **O fundo do indicador é o do PAI, e essa linha custou uma volta.**
      // O outline é desenhado FORA da caixa do elemento. Medindo a partir do
      // próprio elemento, um botão preenchido com o acento e focado com uma
      // cor parecida dava **1,01:1** — a moldura comparada com o próprio
      // recheio, que é o mesmo erro que o README já registra para a borda.
      // Aqui a diferença é pior: o outline nunca fica sobre o preenchimento,
      // nem parcialmente. Sempre o de trás.
      const num = (v) => {
        const cm = v.match(/color\(\s*srgb\s+([^)]+)\)/);
        if (cm) {
          const n = cm[1].split(/[\s/]+/).filter(Boolean).map(Number);
          return { rgb: n.slice(0, 3).map((x) => x * 255), a: n.length > 3 ? n[3] : 1 };
        }
        const m = v.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const n = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        return { rgb: n.slice(0, 3), a: n.length > 3 ? n[3] : 1 };
      };
      const fundoDe = (x) => {
        for (let e2 = x; e2; e2 = e2.parentElement) {
          const cc = num(getComputedStyle(e2).backgroundColor);
          if (cc && cc.a === 1) return cc.rgb;
        }
        return [0, 0, 0];
      };

      const depois = {
        outline: `${e.outlineStyle} ${e.outlineWidth} ${e.outlineColor}`,
        sombra: e.boxShadow,
        borda: `${e.borderColor} ${e.borderWidth}`,
        fundo: e.backgroundColor,
        cor: e.color,
      };
      const mudou = antes
        ? Object.keys(depois).filter((k) => depois[k] !== antes[k])
        : [];

      // ⛔ `outline-style: none` é a assinatura de quem desligou de propósito.
      // Separado de «nunca teve» porque o conserto é outro: aqui existe uma
      // linha de CSS para apagar, ali falta desenho.
      const desligado = e.outlineStyle === "none" && !mudou.length;
      const larg = parseFloat(e.outlineWidth) || 0;

      return {
        alvo: (el.tagName + (c ? "." + c : "")).slice(0, 26),
        texto: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 22),
        mudou, desligado,
        outlineCor: num(e.outlineColor)?.rgb || null,
        outlineLarg: larg,
        fundo: fundoDe(el.parentElement || el),
        caixa: `${Math.round(cx.width)}×${Math.round(cx.height)}`,
        reprova: el.dataset.reprovaFoco || null,
      };
    });
    if (!r) break;
    if (r.jaVisto) break;   // deu a volta: o Tab voltou a um elemento já medido
    achados.push(r);
  }

  medidos += achados.length;
  console.log(`\n── ${arq}  ·  ${achados.length} paradas de Tab`);
  if (!achados.length) console.log("  ⛔ nenhuma parada: não há nada alcançável por teclado nesta tela");

  for (const a of achados) {
    const nome = a.alvo.padEnd(26);
    const semNada = !a.mudou.length;
    const mensuravel = a.outlineCor && a.outlineLarg > 0;
    const r = mensuravel ? razao(a.outlineCor, a.fundo) : null;

    // ⛔⛔ **O veredito vem ANTES da declaração, e as duas réguas contam.**
    // A primeira versão perguntava só «tem indicador?» para decidir se um
    // perdão tinha ficado velho — e aí um botão cujo anel EXISTE e reprova no
    // contraste era acusado de ter declaração sobrando. O CI no Firefox pegou:
    // dois botões declarados por 1,07 e 1,45 vinham como «apague a declaração»
    // e derrubavam o job. Perdão só está velho quando o elemento passa nas
    // DUAS: tem indicador e ele é perceptível.
    const passa = !semNada && (!mensuravel || r >= PISO);

    if (a.reprova) {
      if (passa) { falhas++;
        console.log(`  ⛔ ${nome} declara reprova conhecida e PASSA — apague a declaração`);
      } else { conhecidas++;
        console.log(`  ⚠️ ${nome} ${a.reprova}`); }
      continue;
    }

    if (a.desligado) { falhas++; desligados++;
      console.log(`  ⛔ ${nome} ${a.texto} — outline desligado e nada no lugar (2.4.7)`);
      continue; }
    if (semNada) { falhas++; semIndicador++;
      console.log(`  ⛔ ${nome} ${a.texto} — foco não muda pixel nenhum (2.4.7)`);
      continue; }

    if (mensuravel) {
      if (r < PISO) falhas++;
      console.log(`  ${r >= PISO ? "·" : "⛔"} ${nome} outline ${a.outlineLarg}px  ${r.toFixed(2)}:1 ` +
                  `${r >= PISO ? "" : `— abaixo de ${PISO.toFixed(1)} (2.4.11)`}`);
      continue;
    }
    // ⚠️ Mudou por sombra, borda ou fundo. Dizer o QUE mudou é honesto;
    // dizer o número não é — a diferença percebida de uma sombra empilhada
    // tem o mesmo problema do `rgba` sobre `rgba` que o contraste recusa.
    console.log(`  ⚠️ ${nome} muda ${a.mudou.join(", ")} — sem número, confira por olho`);
  }
}
await navegador.close();

console.log(`\n${falhas ? "⛔" : "✅"} ${medidos} paradas medidas · ${falhas} reprovadas ` +
            `· ${desligados} com outline desligado · ${semIndicador} sem indicador nenhum ` +
            `· ${conhecidas} reprova(s) conhecida(s)`);
if (semIndicador || desligados)
  console.log(`   ⛔ Sem indicador de foco, quem navega por teclado não sabe onde está. É 2.4.7, nível AA.`);
process.exit(falhas ? 1 : 0);
