/**
 * Mede o TAMANHO DO ALVO DE TOQUE e reprova o que não passa.
 *
 *   node verificar/alvo.mjs telas/*.html
 *
 * ⭐⭐ **Por que este arquivo existe separado do contraste:** o `contraste.mjs`
 * mede COR e diz ✅ sobre uma tela cujos botões têm 18 pixels de altura. As duas
 * coisas reprovam por motivos diferentes e se consertam em lugares diferentes —
 * um verificador que mede as duas juntas vira «o verificador», e quem lê o
 * relatório deixa de saber qual régua falou.
 *
 * ⚠️ **DOIS pisos, e os dois são da WCAG** — a mesma forma da lição do
 * contraste, onde um valor pode estar certo num papel e errado no outro:
 *
 *     24×24 CSS px  →  SC 2.5.8 Target Size (Minimum), nível AA, WCAG 2.2
 *     44×44 CSS px  →  SC 2.5.5 Target Size, nível AAA — e a régua DAQUI
 *
 * Abaixo de 24 é REPROVA. Entre 24 e 44 é AVISO: não bloqueia, mas conta e
 * aparece, porque 44 é o compromisso deste produto e não uma aspiração.
 *
 * ⛔ **O que ele NÃO mede, e é preciso saber:** área de toque ampliada por
 * `::before` invisível, `hit-slop` do Flutter, e distância entre alvos vizinhos
 * (a 2.5.8 perdoa um alvo pequeno que tenha espaçamento suficiente em volta —
 * aqui isso é conferido por olho). Um ✅ deste arquivo é sobre a CAIXA do
 * elemento, nada além dela.
 *
 * A saída de escape é a mesma do contraste, e pelo mesmo motivo: estas telas
 * reproduzem o que está NO AR, então defeito do produto se DECLARA em vez de
 * ser consertado na reprodução — e exceção que passa é falha.
 *
 *     <button data-reprova-alvo="OMINFRA-000: 27×18, ação por linha da lista">
 */
import pw from "playwright";
import { resolve } from "node:path";

const AA = 24, RÉGUA = 44;
const arquivos = process.argv.slice(2);
if (!arquivos.length) {
  console.error("uso: node verificar/alvo.mjs telas/*.html");
  process.exit(2);
}
const SELETOR = "a[href],button,input,select,textarea,[tabindex],[role=button]";

const navegador = await pw.firefox.launch();
let falhas = 0, avisos = 0, medidos = 0, conhecidas = 0;

for (const arq of arquivos) {
  const p = await (await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2, colorScheme: "dark", isMobile: true, hasTouch: true,
  })).newPage();
  await p.goto("file://" + resolve(arq), { waitUntil: "load" });
  await p.waitForTimeout(200);

  const achados = await p.evaluate(({ SELETOR, RÉGUA }) =>
    [...document.querySelectorAll(SELETOR)].map((el) => {
      const r = el.getBoundingClientRect();
      const est = getComputedStyle(el);
      const c = (el.getAttribute("class") || "").split(" ")[0];
      return {
        alvo: (el.tagName + (c ? "." + c : "")).slice(0, 26),
        texto: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24),
        w: r.width, h: r.height,
        // ⚠️ Alvo escondido não é alvo pequeno: `display:none` dá caixa zero, e
        // reprovar isso encheria o relatório de fantasma. O que interessa é o
        // que está na tela AGORA — quem esconde por `@media` prova na largura
        // em que aparece.
        oculto: r.width < 1 || r.height < 1 || est.visibility === "hidden",
        // ⛔ Atributo PRÓPRIO, e não o `data-reprova` do contraste: um perdão
        // de COR não pode calar um alvo pequeno. Duas réguas, duas desculpas.
        reprova: el.dataset.reprovaAlvo || null,
      };
    }).filter((x) => !x.oculto && (x.w < RÉGUA || x.h < RÉGUA)),
  { SELETOR, RÉGUA });

  const total = await p.locator(SELETOR).count();
  medidos += total;
  console.log(`\n── ${arq}  ·  ${total} alvos, ${achados.length} abaixo de ${RÉGUA}`);
  if (!achados.length) console.log("  ✅ todos com pelo menos 44×44");

  for (const a of achados) {
    const caixa = `${Math.round(a.w)}×${Math.round(a.h)}`.padStart(7);
    const ruim = a.w < AA || a.h < AA;
    if (a.reprova && !ruim && a.w >= RÉGUA && a.h >= RÉGUA) { falhas++;
      console.log(`  ⛔ ${caixa}  ${a.alvo.padEnd(26)} declara reprova conhecida e PASSOU — apague a declaração`);
      continue; }
    if (a.reprova) { conhecidas++;
      console.log(`  ⚠️ ${caixa}  ${a.alvo.padEnd(26)} ${a.reprova}`);
      continue; }
    if (ruim) { falhas++;
      console.log(`  ⛔ ${caixa}  ${a.alvo.padEnd(26)} ${a.texto} — abaixo de ${AA}×${AA} (SC 2.5.8, AA)`);
      continue; }
    avisos++;
    console.log(`  ·  ${caixa}  ${a.alvo.padEnd(26)} ${a.texto} — passa a 2.5.8, abaixo da régua de ${RÉGUA}`);
  }
}
await navegador.close();

console.log(`\n${falhas ? "⛔" : "✅"} ${medidos} alvos medidos · ${falhas} reprovados ` +
            `· ${conhecidas} reprova(s) conhecida(s) do produto · ${avisos} entre ${AA} e ${RÉGUA}`);
if (avisos)
  console.log(`   ⚠️ «entre ${AA} e ${RÉGUA}» passa na WCAG e NÃO passa na régua deste produto. Não é aprovado: é um débito com número.`);
process.exit(falhas ? 1 : 0);
