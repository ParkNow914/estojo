/**
 * Gera `casca/` a partir de `conteudo/`: o mesmo conteúdo em HTML NU.
 *
 *   node ferramentas/casca.mjs
 *
 * ⭐⭐ **Por que HTML sem uma linha de CSS.** Este repositório já entregou telas
 * prontas uma vez, e o que voltou foram consertos: trocas de token e mais um
 * verificador. Tela é RESPOSTA — quem recebe resposta corrige a resposta. A
 * casca é a PERGUNTA: o documento pelado, com a informação na ordem em que ela
 * importa e nenhuma decisão visual tomada.
 *
 * ⚠️ Se o documento pelado não faz sentido, nenhum CSS conserta. É por isso que
 * ele vem primeiro: a hierarquia se prova antes da primeira cor.
 *
 * ⛔ NÃO acrescente `<style>` aqui. O feio é intencional e é o recado.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";

const e = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const lista = (xs, f = e) => xs?.length ? `<ul>${xs.map((x) => `<li>${f(x)}</li>`).join("")}</ul>` : "";

/** Um par rótulo/valor. `null` vira «(não preenchido)» em vez de sumir — o vazio
 *  é um caso de desenho, e sumir esconderia justamente esse caso. */
const dl = (pares) => `<dl>${pares.map(([k, v]) =>
  `<dt>${e(k)}</dt><dd>${v == null || v === "" ? "<em>(não preenchido)</em>" : e(v)}</dd>`).join("")}</dl>`;

const tabela = (colunas, linhas) =>
  `<table><thead><tr>${colunas.map((c) => `<th scope="col">${e(c)}</th>`).join("")}</tr></thead>` +
  `<tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${e(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

// ── como cada superfície vira documento ──────────────────────────────────────
const COMO = {
  "pagina-do-negocio": (c, d) => {
    const n = c.negocio;
    let s = dl([["nome", n.nome], ["endereço", "okmigo.com/@" + n.handle], ["cidade", n.cidade], ["ramo (define a paleta)", n.ramo]]);
    s += `<p>A dona ligou, nesta ordem: <b>${c.ordem.join(" · ")}</b>` +
         (c.ordem.length < Object.keys(d.blocos).length
           ? ` — e deixou de fora: ${Object.keys(d.blocos).filter((b) => !c.ordem.includes(b)).join(", ")}.` : ".") + `</p>`;
    for (const b of c.ordem) {
      s += `<section><h4>${e(b)}</h4><p><i>${e(d.blocos[b])}</i></p>`;
      if (b === "contato") s += dl(Object.entries(c.contato || {}));
      else if (b === "vitrine") s += c.vitrine?.length ? lista(c.vitrine) : "<p><em>(vazio)</em></p>";
      else if (b === "feitos") s += c.feitos?.length
        ? `<ul>${c.feitos.map((f) => `<li>${e(f.texto)}${f.foto ? " <small>[tem foto]</small>" : " <small>[sem foto]</small>"}</li>`).join("")}</ul>`
        : "<p><em>(vazio)</em></p>";
      else if (b === "avisos") s += c.avisos?.length
        ? c.avisos.map((a) => `<article><p>${e(a.texto)}</p><p><time>${e(a.quando)}</time>${a.foto ? " <small>[tem foto]</small>" : ""}</p></article>`).join("")
        : "<p><em>(vazio)</em></p>";
      else if (b === "formulario") s += `<form>${(c.formulario?.campos || []).map((x) =>
          `<p><label>${e(x)} <input name="${e(x)}"></label></p>`).join("")}<p><button>Enviar</button></p></form>` +
          `<p><small>Cai em: ${e(c.formulario?.onde_cai)}</small></p>`;
      else if (b === "entrar") s += `<p><a href="#">falar pelo okmigo</a></p>`;
      s += `</section>`;
    }
    return s;
  },
  "barra-de-apps": (c) =>
    `<p>${e(c.quem)} — <b>${c.quantas} entradas</b>.</p><ul>` +
    c.itens.map((i) => `<li><a href="#">${e(i.titulo)}</a> — ${e(i.hint)}` +
      (i.agente ? ` <small>[vem do serviço ${e(i.agente)}]</small>` : ` <small>[tela nossa${i.tipo === "condicional" ? ", condicional" : ""}]</small>`) +
      `</li>`).join("") + `</ul>`,
  "conversa": (c) => c.mensagens.length
    ? c.mensagens.map((m) => {
        if (m.tipo === "marco") return `<p><time>${e(m.texto)}</time></p>`;
        const quem = m.de === "eu" ? "eu" : m.de === "amigo" ? "o amigo" : `${e(m.nome)} (outra pessoa)`;
        let corpo = "";
        if (m.tipo === "texto") corpo = m.texto.split("\n\n").map((p) => `<p>${e(p)}</p>`).join("");
        else if (m.tipo === "voz") corpo = `<p>[mensagem de voz, ${e(m.duracao)}]</p><blockquote><p>${e(m.transcrito)}</p></blockquote>`;
        else if (m.tipo === "documento") corpo = `<p>[documento ${e(m.formato)}] ${e(m.arquivo)}</p>`;
        else if (m.tipo === "foto") corpo = `<p>[foto${m.legenda ? ": " + e(m.legenda) : ", sem legenda"}]</p>`;
        return `<article><h4>${quem}${m.hora ? ` <time>${e(m.hora)}</time>` : ""}</h4>${corpo}</article>`;
      }).join("")
    : `<p><em>(nenhuma mensagem — é a primeira tela de quem acabou de criar a conta)</em></p>`,
  "tarefas": (c) => {
    if (c.estados) return lista(c.estados);
    if (!c.itens.length) return `<p><em>(nenhuma tarefa)</em></p>`;
    const linha = (t) => `<li>${t.fechada ? `<s>${e(t.texto)}</s>` : e(t.texto)}` +
      (t.etiqueta ? ` <small>[${e(t.etiqueta)}]</small>` : "") +
      `<br><small>prometido ${e(t.prometido)}${t.prazo ? ` · ${t.vencida ? "era para" : "para"} ${e(t.prazo)}` : " · sem prazo"}` +
      `${t.fechada ? ` · fechada em ${e(t.fechada)}` : ""}</small></li>`;
    const venc = c.itens.filter((t) => t.vencida && !t.fechada);
    const abertas = c.itens.filter((t) => !t.vencida && !t.fechada);
    const fech = c.itens.filter((t) => t.fechada);
    return (venc.length ? `<h4>já passou</h4><ul>${venc.map(linha).join("")}</ul>` : "") +
           (abertas.length ? `<h4>em aberto</h4><ul>${abertas.map(linha).join("")}</ul>` : "") +
           (fech.length ? `<h4>fechadas</h4><ul>${fech.map(linha).join("")}</ul>` : "");
  },
  "superficie-declarada": (c) => {
    let s = `<p>Telas deste serviço: <b>${c.menus.join(" · ")}</b> — vem de <code>${e(c.via)}</code>.</p>`;
    if (!c.blocos.length) return s + `<p><em>(o serviço respondeu e não há bloco nenhum)</em></p>`;
    for (const b of c.blocos) {
      if (b.tipo === "caixa") s += `<section><h4>${e(b.titulo)}</h4>${dl(b.linhas)}</section>`;
      else if (b.tipo === "tabela") s += `<section><h4>tabela · ${b.colunas.length} colunas</h4>${tabela(b.colunas, b.linhas)}</section>`;
      else if (b.tipo === "grafico") s += `<section><h4>${e(b.titulo)}</h4>` +
        `<p>gráfico de ${e(b.forma)}, séries: ${b.series.map((x) => `${e(x.nome)} (${e(x.cor)})`).join(", ")}</p>` +
        tabela(["quando", ...b.series.map((x) => x.nome)], b.pontos) + `</section>`;
      else if (b.tipo === "campo") s += `<p><label>${e(b.rotulo)} <input value="${e(b.valor)}"></label></p>`;
      else if (b.tipo === "escolha") s += `<p><label>${e(b.rotulo)} <select>${b.opcoes.map((o) => `<option>${e(o)}</option>`).join("")}</select></label></p>`;
      else if (b.tipo === "acoes") s += `<p>${b.botoes.map((x) => `<button>${e(x)}</button>`).join(" ")}</p><p><small>${e(b.nota)}</small></p>`;
    }
    return s;
  },
};

mkdirSync("casca", { recursive: true });
const feitos = [];
for (const arq of readdirSync("conteudo").filter((f) => f.endsWith(".json")).sort()) {
  const chave = basename(arq, ".json");
  const d = JSON.parse(readFileSync(resolve("conteudo", arq), "utf8"));
  const como = COMO[chave];
  if (!como) { console.error(`  ⛔ sem renderizador para ${chave}`); process.exitCode = 1; continue; }

  let h = `<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    `<title>${e(d.superficie)} — o conteúdo, sem desenho</title>\n</head><body>\n` +
    `<p><a href="index.html">← todas as superfícies</a></p>\n` +
    `<h1>${e(d.superficie)}</h1>\n` +
    `<p><b>Isto não é uma tela.</b> É a informação que esta superfície precisa mostrar, ` +
    `em HTML sem uma linha de CSS. Gerado de <code>conteudo/${e(arq)}</code> — não edite este arquivo.</p>\n` +
    `<h2>o que ela faz</h2><p>${e(d.o_que_faz)}</p>\n` +
    `<h2>quem abre</h2><p>${e(d.quem_abre)}</p>\n` +
    (d.o_que_varia ? `<h2>o que varia</h2>${lista(d.o_que_varia)}\n` : "") +
    (d.vocabulario ? `<h2>o vocabulário</h2>${lista(d.vocabulario)}\n` : "") +
    `<h2>o que precisa sobreviver ao redesenho</h2>${lista(d.regras_que_precisam_sobreviver)}\n` +
    `<hr>\n<h2>os casos</h2>\n`;
  for (const c of d.casos)
    h += `<section><h3>${e(c.nome)}</h3><p><i>${e(c.por_que)}</i></p>\n${como(c, d)}\n<hr></section>\n`;
  h += `</body></html>\n`;
  writeFileSync(`casca/${chave}.html`, h);
  feitos.push([chave, d.superficie, d.casos.length]);
  console.log(`  casca/${chave}.html`.padEnd(42) + `${d.casos.length} casos`);
}

writeFileSync("casca/index.html",
  `<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">\n` +
  `<meta name="viewport" content="width=device-width,initial-scale=1">\n` +
  `<title>O conteúdo do okmigo, sem desenho</title>\n</head><body>\n` +
  `<h1>O conteúdo do okmigo, sem desenho</h1>\n` +
  `<p>Cada página abaixo é uma superfície do produto: o que ela precisa mostrar, ` +
  `quem a abre, o que varia, e os casos — inclusive os extremos. <b>Sem uma linha de CSS</b>, ` +
  `de propósito: o desenho é o que falta, e é o que estamos pedindo.</p>\n` +
  `<ul>${feitos.map(([k, t, n]) => `<li><a href="${k}.html">${e(t)}</a> — ${n} casos</li>`).join("")}</ul>\n` +
  `<p>O que existe hoje está em <code>telas/</code>. ⚠️ Aquilo é <b>referência do que temos</b>, ` +
  `não o alvo — e não é o arquivo para editar.</p>\n</body></html>\n`);
console.log(`  casca/index.html`.padEnd(42) + `${feitos.length} superfícies\n→ casca/`);
