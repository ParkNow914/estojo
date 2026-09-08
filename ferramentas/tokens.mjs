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
 *
 * ⛔⛔ **E a SEGUNDA armadilha, da mesma família e pior: um `:root` pode não
 * ser texto.** As seis paletas da página de negócio são CALCULADAS em Python
 * (`paletas.py`: `_misturar()` deriva `--tinte` e `--grade`) e chegam ao CSS por
 * interpolação. Lendo só o CSS literal, o conjunto `negocio` saía com os SEIS
 * tokens de medida e **nenhuma cor** — e o relatório dizia «negocio 6», que se
 * lê como "essa página usa poucos tokens" em vez de "o extrator não achou os
 * dela". Ausência com número ao lado parece medida. Por isso as cores daquela
 * página são extraídas RODANDO o módulo do produto, que é a única fonte delas.
 *
 * ⚠️ Isso acrescenta `python3` às dependências DESTE extrator — nunca do
 * estojo: quem desenha consome o JSON e não roda nada disto.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const RAIZ = process.argv[2] || "../tyego";
const FONTES = {
  app:       ["web/src/styles.css", "o aplicativo web e o Flutter (o «Cream»)"],
  paginas:   ["api/src/okmigo/routers/estilo_vitrine.py", "as 8 páginas públicas de apresentação"],
  documento: ["api/src/okmigo/routers/sobre.py", "as páginas-documento (/sobre, /integracao)"],
  negocio:   ["api/src/okmigo/pagina_html.py", "a página pública de cada negócio"],
};
//: ⭐ A página do negócio tem DUAS naturezas de token, e misturá-las mentiria:
//: as medidas são as mesmas para todo negócio (vêm do CSS), e a COR é por RAMO
//: e por tema (vem do módulo). São seis paletas × dois temas, não um tema.
const PALETAS_PY = "api/src/okmigo/paletas.py";

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
      pares[p[1]] = descosturar(p[2]);
    if (Object.keys(pares).length) fora.push([m[1].trim(), pares]);
  }
  return fora;
}
/** ⛔ **Um valor pode chegar COSTURADO, e a costura não é do CSS.** Nas fontes
 *  que são Python, uma regra longa atravessa duas literais de string e o
 *  extrator lê a emenda (`",` fim de linha, `f"`) como se fosse parte do valor:
 *  o `--mono` da página de negócio saía com `monospace" f"\"Liberation Mono\"`
 *  no meio. Valor mutilado é pior que ausente — ele desenha, e desenha errado.
 */
function descosturar(v) {
  return v.replace(/"\s*\n?\s*f"/g, "").replace(/\\"/g, '"').trim();
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

/** As seis paletas da página de negócio, pedidas ao módulo que as calcula.
 *
 *  ⛔ **Reescrever `_misturar()` aqui seria a segunda fonte da mesma cor** — a
 *  armadilha que o próprio `paletas.py` documenta no topo (*"elas divergiriam no
 *  dia em que alguém ajustasse um tom aqui"*). O `--tinte` sai de uma mistura em
 *  sRGB com peso diferente por tema; copiar aquela conta para JavaScript é
 *  garantir que um dia os dois números discordem e ninguém saiba qual vale.
 */
function paletasDoProduto() {
  const arq = resolve(RAIZ, PALETAS_PY);
  const py = `
import importlib.util, json
e = importlib.util.spec_from_file_location("p", ${JSON.stringify(arq)})
m = importlib.util.module_from_spec(e); e.loader.exec_module(m)
print(json.dumps({
  n: {"quando": p["quando"], **{t: {f"--{k.replace('_','-')}": v
       for k, v in {**p[t], **m.derivados(p[t], t)}.items()} for t in ("claro", "escuro")}}
  for n, p in m.PALETAS.items()}))`;
  return JSON.parse(execFileSync("python3", ["-c", py], { encoding: "utf8" }));
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

  if (nome === "negocio") {
    // ⛔ Os tokens literais daquele arquivo NÃO são de um tema: eles moram no
    // `:root` compartilhado (largura, vãos, mono) e valem nos dois. Chamá-los
    // de "escuro" — que é o que a regra geral fazia — é rótulo errado num
    // valor certo, e rótulo errado é o que faz alguém procurar o par claro que
    // não existe.
    const medida = temas.escuro || {};
    const paletas = paletasDoProduto();
    saida[nome] = { de: `${rel} + ${PALETAS_PY}`, serve, medida, paletas };
    const cores = Object.keys(paletas.neutro.escuro).length;
    console.log(`  ${nome.padEnd(10)} ${`medida ${Object.keys(medida).length} · ` +
      `${Object.keys(paletas).length} paletas × 2 temas × ${cores}`.padEnd(38)} ${rel}`);
    continue;
  }

  saida[nome] = { de: rel, serve, temas };
  const conta = Object.entries(temas).map(([t, v]) => `${t} ${Object.keys(v).length}`).join(" · ");
  console.log(`  ${nome.padEnd(10)} ${conta.padEnd(38)} ${rel}`);
}
writeFileSync("tokens/atual.json", JSON.stringify(saida, null, 2) + "\n");
console.log("\n→ tokens/atual.json");
