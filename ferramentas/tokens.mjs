/**
 * Regenera `tokens/atual.json` a partir do produto.
 *
 *   node ferramentas/tokens.mjs ../tyego
 *
 * ⛔ Os tokens deste repositório são EXTRAÍDOS, nunca digitados. Valor digitado
 * à mão envelhece calado: o produto muda e o estojo passa a ensinar uma cor que
 * já não existe — que é pior que não ter estojo.
 *
 * ⚠️ **A armadilha que me pegou:** pular os valores `var(--x)` fez o token do
 * tema CLARO vencer no lugar do ESCURO, em silêncio (`--in-bg` saiu `#FFFFFF`
 * numa tela escura). Os `var()` são resolvidos DENTRO do tema, e cada `:root`
 * é lido como um tema separado.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const RAIZ = process.argv[2] || "../tyego";
const FONTES = {
  app:       ["web/src/styles.css", "o aplicativo web e o Flutter (o «Cream»)"],
  paginas:   ["api/src/okmigo/routers/estilo_vitrine.py", "as 8 páginas públicas de apresentação"],
  documento: ["api/src/okmigo/routers/sobre.py", "as páginas-documento (/sobre, /integracao)"],
  negocio:   ["api/src/okmigo/pagina_html.py", "a página pública de cada negócio"],
};

/** Cada `:root` é um tema; devolve [[seletor, {token: valor}]]. */
function roots(texto) {
  const fora = [];
  const re = /(:root[^{]*)\{/g;
  let m;
  while ((m = re.exec(texto))) {
    let i = re.lastIndex, nivel = 1, j = i;
    while (j < texto.length && nivel) {
      if (texto[j] === "{") nivel++;
      else if (texto[j] === "}") nivel--;
      j++;
    }
    const pares = {};
    for (const p of texto.slice(i, j - 1).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g))
      pares[p[1]] = p[2].trim();
    if (Object.keys(pares).length) fora.push([m[1].trim(), pares]);
  }
  return fora;
}
/** Troca var(--x) pelo valor de --x, no MESMO tema. */
function resolver(vals) {
  const out = { ...vals };
  for (let n = 0; n < 12; n++) {
    let mudou = false;
    for (const [k, v] of Object.entries(out)) {
      const m = /^var\((--[a-z0-9-]+)\)$/.exec(v.trim());
      if (m && out[m[1]] && out[m[1]] !== v) { out[k] = out[m[1]]; mudou = true; }
    }
    if (!mudou) break;
  }
  return out;
}

const saida = {};
for (const [nome, [rel, serve]] of Object.entries(FONTES)) {
  const arq = resolve(RAIZ, rel);
  const temas = {};
  for (const [sel, vals] of roots(readFileSync(arq, "utf8"))) {
    const tema = /claro/.test(sel) ? "claro" : sel === ":root" ? "escuro" : sel;
    temas[tema] = { ...(temas[tema] || {}), ...vals };
  }
  for (const k of Object.keys(temas)) temas[k] = resolver(temas[k]);
  saida[nome] = { de: rel, serve, temas };
  const conta = Object.entries(temas).map(([t, v]) => `${t} ${Object.keys(v).length}`).join(" · ");
  console.log(`  ${nome.padEnd(10)} ${conta.padEnd(24)} ${rel}`);
}
writeFileSync("tokens/atual.json", JSON.stringify(saida, null, 2) + "\n");
console.log("\n→ tokens/atual.json");
