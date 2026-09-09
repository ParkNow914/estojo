/**
 * A página pública de um negócio — desenho, os quatro casos.
 *
 *   node alisson/pagina-do-negocio/gerar.mjs
 *
 * Escreve `saida/`, um arquivo por caso, cada um completo e sozinho: HTML de
 * verdade com o CSS embutido e ZERO script, porque a restrição 2 do estojo diz
 * que estas páginas são escritas no servidor sem framework, e a regra do
 * conteúdo diz que elas entram no buscador. Uma requisição, e o documento já
 * está pronto quando chega.
 *
 * A saída não vai versionada, pela razão que o README da casa dá: saída de
 * build no repositório é uma segunda fonte da mesma coisa, e a segunda
 * envelhece calada.
 *
 * As decisões estão em alisson/pagina-do-negocio/README.md. Aqui ficam só as
 * que se explicam melhor ao lado do código.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "../..");
const CONTEUDO = JSON.parse(readFileSync(resolve(raiz, "conteudo/pagina-do-negocio.json"), "utf8"));
const TOKENS = JSON.parse(readFileSync(resolve(raiz, "tokens/atual.json"), "utf8"));

const PALETAS = TOKENS.negocio.paletas;
const MEDIDA = TOKENS.negocio.medida;
// O acento do produto. É o mesmo valor no app, nas páginas e na paleta neutra —
// a única cor que os três conjuntos já compartilham. Ver README, «a travessia».
const AZUL_DO_PRODUTO = TOKENS.app.temas.escuro["--accent"];

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Iniciais para a marca tipográfica: as duas primeiras palavras de 3+ letras. */
function iniciais(nome) {
  const p = nome.split(/\s+/).filter((x) => x.replace(/[^\p{L}]/gu, "").length >= 3);
  return (p.slice(0, 2).map((x) => x[0]).join("") || nome.slice(0, 2)).toUpperCase();
}

/**
 * Marcador de foto. NÃO é a foto: o estojo diz `foto: true` e não traz arquivo,
 * então inventar uma imagem seria mentir sobre o que foi desenhado. É um SVG
 * inline, determinístico pelo texto, feito só com cores da paleta do ramo — e
 * inline porque uma requisição a menos numa página aberta no celular vale mais
 * do que a elegância de um arquivo separado.
 */
function marcadorDeFoto(texto, pal, i) {
  const giro = [...texto].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" role="img" aria-label="foto do trabalho">` +
    `<defs><linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${giro} .5 .5)">` +
    `<stop offset="0" stop-color="${pal["--tinte"]}"/><stop offset="1" stop-color="${pal["--papel"]}"/>` +
    `</linearGradient></defs><rect width="320" height="400" fill="url(#g${i})"/>` +
    `<circle cx="${60 + (giro % 200)}" cy="${120 + (giro % 160)}" r="${70 + (giro % 50)}" fill="${pal["--acento"]}" opacity=".13"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * O CSS. Escrito por ramo, porque os valores vêm da paleta daquele negócio.
 *
 * ⭐ A regra da faixa tingida virou HERANÇA, e não disciplina. O conteúdo manda
 * trocar o tom de texto mais fraco quando o fundo é `--tinte`. Em vez de pedir
 * que alguém lembre disso em cada lugar, existe um `--texto-fraco` que vale
 * `--fraco` na página e `--apoio` dentro de `.tingido`. Quem escrever um bloco
 * tingido novo daqui a um ano acerta sem saber que a regra existe.
 * Medido: `--fraco` sobre `--tinte` dá entre 3,93 e 4,09 nas SEIS paletas, e o
 * piso de texto é 4,5. A regra não é gosto — o token reprova sem ela.
 *
 * ⛔ A borda de controle usa `--apoio`, e essa é a correção que vale mais aqui.
 * O app tem `--line-controle` (#8E867B, 5,21:1 sobre o fundo dele). A página
 * pública não tem equivalente: os dois tokens de linha que ela tem chegam a
 * 1,30:1 (`--linha`) e 2,62:1 (`--grade`) sobre `--papel`, contra piso de 3,0
 * para borda de controle. Não falta um token — `--apoio` já está na paleta e dá
 * de 6,47 a 6,85. Falta a REGRA, na mesma forma da que já existe para o texto.
 */
function css(pal) {
  return `
:root{
  --bg:${pal["--bg"]}; --papel:${pal["--papel"]}; --linha:${pal["--linha"]};
  --tinta:${pal["--tinta"]}; --apoio:${pal["--apoio"]}; --fraco:${pal["--fraco"]};
  --acento:${pal["--acento"]}; --fagulha:${pal["--fagulha"]};
  --botao-txt:${pal["--botao-txt"]}; --tinte:${pal["--tinte"]}; --grade:${pal["--grade"]};
  --produto:${AZUL_DO_PRODUTO};
  --largura:${MEDIDA["--largura"]}; --leitura:${MEDIDA["--leitura"]};
  --junto:${MEDIDA["--vao-junto"]}; --bloco:${MEDIDA["--vao-bloco"]}; --secao:${MEDIDA["--vao-secao"]};
  --mono:${MEDIDA["--mono"]};
  --texto-fraco:var(--fraco);
  --toque:44px;
  color-scheme:dark;
}
/* A faixa tingida troca o tom fraco. Uma linha, e a regra passa a se cumprir
   sozinha em tudo que nascer dentro dela. */
.tingido{ --texto-fraco:var(--apoio); }

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; background:var(--bg); color:var(--tinta);
  /* Sem webfont. Esta página é aberta por um estranho no celular, vinda de um
     link, e a primeira coisa que ela precisa é aparecer. O produto usa
     Montserrat; adotar a mesma família aqui custa uma requisição bloqueante ou
     um salto de texto, e essa conta é do okmigo, não minha para gastar calado.
     Está no README como pergunta. */
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  font-size:16px; line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
img,svg{max-width:100%;display:block}

/* ⭐ O indicador de foco existe, e existe uma vez só. A varredura por teclado
   que fiz neste produto não encontrou UMA regra :focus — o foco era o padrão do
   navegador, que falha justamente onde o navegador não tem padrão. --apoio
   sobre o fundo dá de 6,91 a 7,50, muito acima do piso de 3,0 para objeto
   gráfico, e é a mesma cor da borda de controle: um vocabulário, não dois. */
:focus-visible{ outline:2px solid var(--apoio); outline-offset:3px; border-radius:3px; }

.env{max-width:var(--largura);margin:0 auto;padding:0 20px}

/* ── o topo ───────────────────────────────────────────────────────────────
   O botão de entrar FICA em qualquer largura; o menu de âncoras é que sai.
   Perder a âncora custa um atalho para conteúdo que está logo abaixo; perder o
   entrar custa o único caminho para dentro do produto. */
/* ⛔ Fundo OPACO, e o vidro fosco ficou fora de propósito. Uma barra fixa
   translúcida tem, atrás dela, o que estiver rolando naquele instante: o texto
   dela não tem UM contraste, tem um por posição de rolagem, e nenhum deles se
   pode afirmar. É a mesma armadilha do rgba sobre rgba que as réguas da casa se
   recusam a medir. Troquei um efeito por um número defensável. */
.topo{
  position:sticky; top:0; z-index:10;
  background:var(--bg);
  border-bottom:1px solid var(--linha);
}
.topo .env{display:flex;align-items:center;gap:var(--junto);min-height:56px}
.handle{
  font-family:var(--mono); font-size:13px; color:var(--texto-fraco);
  margin-right:auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.ancoras{display:none}
@media (min-width:56rem){
  .ancoras{display:flex;gap:6px;margin-right:var(--junto)}
  .ancoras a{
    display:inline-flex;align-items:center;min-height:36px;padding:0 12px;
    border-radius:999px;color:var(--apoio);text-decoration:none;font-size:14px;
  }
  .ancoras a:hover{background:var(--papel);color:var(--tinta)}
}

/* ⭐⭐ O botão de entrar usa o AZUL DO PRODUTO, não o acento do ramo.
   O README da casa registra que atravessar da página para dentro do app parece
   trocar de produto, porque os neutros têm temperatura oposta e só o acento foi
   alinhado. Eu não mexo nos neutros — não é meu para decidir. Mas este botão é
   literalmente a porta: é o único elemento da página que leva para o outro
   lado. Pintá-lo com a única cor que os dois conjuntos JÁ compartilham faz a
   troca ser anunciada em vez de ser um susto. Nos cinco ramos coloridos ele
   destoa de propósito; no neutro ele coincide com o acento, e isso também está
   certo — negócio sem ramo tem a cara do produto. */
.entrar{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:var(--toque); padding:0 18px; border-radius:999px;
  background:var(--produto); color:#0B1220; text-decoration:none;
  font-weight:650; font-size:15px; white-space:nowrap; flex:none;
}
.entrar:hover{filter:brightness(1.08)}

/* ── a capa ───────────────────────────────────────────────────────────────
   Uma página de negócio não tem logo, e nunca vai ter em massa. Tem nome. As
   iniciais na faixa tingida dão cara a qualquer conta, inclusive à que foi
   criada há cinco minutos e não escreveu nada — que é o caso que mais importa
   e o único que não pode parecer defeito. */
/* Sem padding embaixo: o vão até a primeira seção é da seção, e uma fonte só
   de espaço evita que os dois se somem — que era o que acontecia aqui. */
.capa{padding:36px 0 0}
.marca{
  width:64px;height:64px;border-radius:18px;display:grid;place-items:center;
  background:var(--tinte); color:var(--acento);
  font-size:24px;font-weight:700;letter-spacing:.5px;margin-bottom:var(--bloco);
}
.capa h1{
  margin:0; font-size:clamp(30px,8.5vw,44px); line-height:1.12;
  letter-spacing:-.02em; font-weight:680; max-width:var(--leitura);
}
.lugar{margin:10px 0 0;color:var(--apoio);font-size:16px}

/* ── as seções ────────────────────────────────────────────────────────────
   ⛔ Nada aqui depende de posição. A dona escolhe a ordem e pode desligar o que
   quiser, então uma regra como «a primeira seção não tem margem» quebraria numa
   permutação que ninguém testou. O espaçamento é sempre o mesmo, e o que separa
   é a régua de cima. */
.secao{padding-top:var(--secao)}
.secao > h2{
  margin:0 0 var(--bloco); padding-top:var(--bloco);
  border-top:1px solid var(--linha);
  font-size:13px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:var(--texto-fraco);
}

/* contato: cada linha é uma ação ou um dado, e o telefone é a ação principal.
   Endereço fica texto: mandar para um mapa é escolher um serviço de terceiro
   pela dona, e isso não está no contrato desta superfície. */
.contato{display:grid;gap:var(--junto);margin:0;max-width:var(--leitura)}
.linha{display:flex;gap:14px;align-items:center;min-height:var(--toque)}
.linha .rot{
  font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;
  color:var(--texto-fraco);width:74px;flex:none;
}
.linha .val{color:var(--tinta);font-size:16px}
.linha a.val{
  color:var(--acento);text-decoration:none;font-weight:600;font-size:18px;
  /* O alvo é o LINK, não a linha que o contém. A linha já tinha 44px de altura
     e o link dentro dela tinha 27 — o dedo acerta a linha e não acontece nada.
     É a diferença entre a caixa que se vê e a que responde ao toque. */
  display:inline-flex;align-items:center;min-height:var(--toque);
}
.linha a.val:hover{text-decoration:underline}

/* vitrine: quatro frases curtas não pedem cartão. Cartão para isto é peso sem
   função — e o peso reaparece no caso de duas frases, onde dois cartões num
   grid de três deixam um buraco que ninguém pediu. */
.vitrine{list-style:none;margin:0;padding:0;display:grid;gap:var(--junto);max-width:var(--leitura)}
.vitrine li{display:flex;gap:12px;align-items:baseline;font-size:17px;line-height:1.45}
.vitrine li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--acento);flex:none;transform:translateY(-3px)}

/* ── feitos: o carrossel que corta ────────────────────────────────────────
   ⭐ O corte é regra do produto e eu o mantenho: 78% de largura deixa uma fatia
   do próximo cartão visível, e é o corte que ensina que dá para arrastar.
   Mostrar tudo de uma vez já foi tentado aqui e não funcionou.

   ⛔ E é aqui que ele era uma armadilha. Um div com overflow-x:auto recebe
   foco do teclado porque é rolável, e sem regra de foco o navegador não desenha
   nada: existe uma parada invisível no meio da página de maior alcance do
   produto. A correção não é tirar o foco — quem navega por teclado PRECISA
   rolar a faixa. É declará-la como região, dar nome a ela, e desenhar o foco. */
.faixa{
  display:flex;gap:var(--junto);overflow-x:auto;scroll-snap-type:x mandatory;
  scroll-padding-left:20px; margin:0 -20px; padding:4px 20px 6px;
  -webkit-overflow-scrolling:touch; scrollbar-width:none;
}
.faixa::-webkit-scrollbar{display:none}
.faixa:focus-visible{outline:2px solid var(--apoio);outline-offset:2px;border-radius:14px}
/* ⛔⛔ O corte é uma PROPORÇÃO, e não uma medida — e essa linha custou uma
   medição. Com base fixa (280px) existe uma largura de tela em que os cartões
   cabem quase exatos e a fatia do próximo some: em 1200px sobravam 4px, e em
   768px sobrava ZERO. A pista de que dá para arrastar desaparecia justamente
   por acaso de largura. Em porcentagem a fração é garantida em qualquer tela.
   ⛔ E .feito É o <figure>: a regra era «.feito figure», que procura um figure
   DENTRO do cartão e não existe. Os 40px de margem que o navegador dá a todo
   figure ficaram de pé, o vão entre cartões virou 94px em vez de 14, e o corte
   em 390px caiu para 3px. Um seletor que não casa com nada falha calado. */
.feito{flex:0 0 78%;scroll-snap-align:start;margin:0}
@media (min-width:40rem){ .feito{flex-basis:44%} }
@media (min-width:64rem){ .feito{flex-basis:27%} }
.feito img{aspect-ratio:4/5;object-fit:cover;border-radius:14px;width:100%;background:var(--tinte)}
/* ⚠️ O cartão SEM foto não é um cartão quebrado: é um cartão de outro tipo, e
   ocupa a mesma caixa. A padaria tem sete feitos e um deles não tem foto — se o
   sem-foto encolhesse, a faixa ficaria com um degrau no meio e o arrasto
   perderia o ritmo. Aqui ele vira bloco tingido, e por ser tingido o texto de
   apoio já sobe de tom sozinho pela regra de cima. */
.feito .sofoto{
  aspect-ratio:4/5;border-radius:14px;background:var(--tinte);
  display:flex;align-items:flex-end;padding:18px;
}
.feito .sofoto p{margin:0;font-size:18px;line-height:1.35;color:var(--tinta)}
.feito figcaption{margin-top:10px;font-size:15px;color:var(--apoio);line-height:1.35}
.dica{margin:12px 0 0;font-size:13px;color:var(--texto-fraco)}

/* avisos: recado datado. A data vem em mono e ANTES do texto, porque quem lê um
   aviso decide pela data se ainda vale. */
.avisos{display:grid;gap:var(--bloco);max-width:var(--leitura);margin:0;padding:0;list-style:none}
.aviso{display:grid;gap:8px}
.aviso time{font-family:var(--mono);font-size:12px;color:var(--texto-fraco);letter-spacing:.04em}
.aviso p{margin:0;font-size:17px;line-height:1.5}
.aviso .foto{border-radius:12px;aspect-ratio:16/10;object-fit:cover;margin-top:4px;max-width:min(100%,420px)}

/* ── formulário ───────────────────────────────────────────────────────────
   ⛔ A borda usa --apoio. Ver a nota no topo: --linha dá 1,30:1 e --grade
   dá 2,62:1 sobre o papel, e um controle precisa de 3,0. Este é o único caso do
   estojo com formulário ligado, e é onde o buraco morde.
   ⚠️ E o rótulo fica VISÍVEL, fora do campo. Placeholder como rótulo some no
   instante em que a pessoa começa a digitar, que é exatamente quando ela ainda
   precisa dele. */
.form{display:grid;gap:var(--bloco);max-width:var(--leitura)}
.campo{display:grid;gap:8px}
.campo label{font-size:14px;color:var(--apoio);font-weight:550}
.campo input,.campo textarea{
  font:inherit;font-size:16px; /* 16px evita o zoom automático do iOS ao focar */
  color:var(--tinta);background:var(--papel);
  border:1px solid var(--apoio);border-radius:12px;
  padding:12px 14px;min-height:var(--toque);width:100%;
}
.campo textarea{min-height:104px;resize:vertical}
.campo input::placeholder,.campo textarea::placeholder{color:var(--texto-fraco)}
.enviar{
  min-height:var(--toque);padding:0 22px;border:0;border-radius:999px;
  background:var(--acento);color:var(--botao-txt);font:inherit;font-weight:650;font-size:16px;
  justify-self:start;cursor:pointer;
}
.onde{margin:0;font-size:13px;color:var(--texto-fraco)}

/* ── rodapé ───────────────────────────────────────────────────────────────
   O endereço da página em mono é a assinatura: é isto que a dona mandou no
   WhatsApp, e vê-lo escrito confirma para quem chegou que está no lugar certo. */
.pe{margin-top:var(--secao);border-top:1px solid var(--linha);padding:var(--bloco) 0 var(--secao)}
.pe p{margin:0;font-family:var(--mono);font-size:12px;color:var(--texto-fraco)}
/* ⚠️ O selo NÃO é link, e isso é decisão e não esquecimento. Ele era, com 17px
   de altura — alvo pequeno apontando para o mesmo lugar que o botão do topo e o
   bloco «entrar» já apontam. Inflar um terceiro caminho para 44px seria
   consertar o número e manter o excesso. Tirar é o desenho melhor. */
.pe .selo{margin-top:8px;font-family:inherit;font-size:13px}

/* Quem prefere menos movimento não recebe rolagem animada na âncora. */
@media (prefers-reduced-motion:no-preference){ html{scroll-behavior:smooth} }
html{scroll-padding-top:72px}
`;
}

/**
 * ⭐⭐ A decisão que governa a página inteira: BLOCO VAZIO NÃO EXISTE.
 *
 * Não vira estado vazio, não vira «ainda não há nada por aqui», não vira caixa
 * pontilhada. Some do documento.
 *
 * O motivo não é estética, é quem lê: um estranho, vindo de um link que a DONA
 * mandou. Uma página que anuncia «este negócio não escreveu nada» usa o espaço
 * público da dona para falar mal dela — para um leitor que nem sabia que
 * existiam blocos. O vazio só é informação para quem conhece o formulário de
 * trás; para quem chegou pelo WhatsApp é só um negócio que parece abandonado.
 *
 * E é isto que faz «recem-criada» e «um-bloco-so» caírem no MESMO layout, sem
 * uma linha de CSS a mais: quando sobra contato, a página é um cartão de
 * contato, e ela é um cartão de contato BEM feito, não uma página cheia de
 * buracos. Um layout, dois casos extremos — e é por isso que a regra vale mais
 * do que um estado vazio bonito.
 */
const temConteudo = (c, b) => {
  if (b === "contato") return Object.values(c.contato || {}).some(Boolean);
  if (b === "vitrine") return (c.vitrine || []).length > 0;
  if (b === "feitos") return (c.feitos || []).length > 0;
  if (b === "avisos") return (c.avisos || []).length > 0;
  if (b === "formulario") return Boolean(c.formulario);
  if (b === "entrar") return true; // o convite não depende do que a dona escreveu
  return false;
};

const TITULO = {
  contato: "Contato", vitrine: "O que tem", feitos: "Trabalhos",
  avisos: "Avisos", formulario: "Mandar um recado",
  // O rótulo diz do que a seção trata; o botão diz o que acontece ao tocar. Os
  // dois eram «Falar pelo okmigo», e ler a mesma frase duas vezes em 80px faz a
  // segunda parecer eco em vez de ação.
  entrar: "Conversar",
};

function blocoContato(c) {
  const l = [];
  if (c.contato.telefone)
    l.push(`<div class="linha"><span class="rot">telefone</span>` +
      `<a class="val" href="tel:${esc(c.contato.telefone.replace(/[^\d+]/g, ""))}">${esc(c.contato.telefone)}</a></div>`);
  if (c.contato.endereco)
    l.push(`<div class="linha"><span class="rot">endereço</span><span class="val">${esc(c.contato.endereco)}</span></div>`);
  if (c.contato.horario)
    l.push(`<div class="linha"><span class="rot">horário</span><span class="val">${esc(c.contato.horario)}</span></div>`);
  return `<div class="contato">${l.join("")}</div>`;
}

const blocoVitrine = (c) =>
  `<ul class="vitrine">${c.vitrine.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>`;

function blocoFeitos(c, pal) {
  const cartoes = c.feitos.map((f, i) =>
    `<figure class="feito">` +
    (f.foto
      ? `<img src="${marcadorDeFoto(f.texto, pal, i)}" alt="" loading="lazy" width="320" height="400">` +
        `<figcaption>${esc(f.texto)}</figcaption>`
      : `<div class="sofoto tingido"><p>${esc(f.texto)}</p></div>`) +
    `</figure>`).join("");
  // A região é nomeada e focável de propósito: sem isto, o teclado para aqui e
  // não vê nada. Com isto, para aqui, sabe onde está e consegue rolar.
  return `<div class="faixa" role="region" aria-label="Trabalhos, ${c.feitos.length} itens — arraste para o lado" tabindex="0">${cartoes}</div>` +
         `<p class="dica">Arraste para ver os ${c.feitos.length}</p>`;
}

const blocoAvisos = (c, pal) =>
  `<ul class="avisos">${c.avisos.map((a, i) =>
    `<li class="aviso"><time>${esc(a.quando)}</time><p>${esc(a.texto)}</p>` +
    (a.foto ? `<img class="foto" src="${marcadorDeFoto(a.texto, pal, 90 + i)}" alt="" loading="lazy" width="420" height="262">` : "") +
    `</li>`).join("")}</ul>`;

function blocoFormulario(c) {
  const campos = c.formulario.campos.map((nome, i) => {
    const id = "c" + i;
    const longo = /precisa|mensagem|recado/i.test(nome);
    const tipo = /telefone|e-mail|email/i.test(nome) ? "text" : "text";
    return `<div class="campo"><label for="${id}">${esc(nome)}</label>` +
      (longo ? `<textarea id="${id}" name="${esc(nome)}"></textarea>`
             : `<input id="${id}" name="${esc(nome)}" type="${tipo}">`) + `</div>`;
  }).join("");
  return `<form class="form" method="post" action="#">${campos}` +
    `<button class="enviar" type="submit">Enviar recado</button>` +
    // «Cai direto em» + «a caixa do negócio» dava «em a caixa». O texto vem do
    // conteúdo e começa com artigo, então a frase que o embrulha não pode pedir
    // contração — «vai direto para» aceita qualquer começo.
    `<p class="onde">Vai direto para ${esc(c.formulario.onde_cai)}.</p></form>`;
}

const blocoEntrar = () =>
  `<div class="contato"><p style="margin:0 0 var(--bloco);max-width:var(--leitura);font-size:17px;color:var(--apoio)">` +
  `Prefere conversar por aqui? Dá para falar com este negócio pelo okmigo.</p>` +
  `<a class="entrar" href="#">Falar pelo okmigo</a></div>`;

function pagina(caso) {
  const n = caso.negocio;
  const pal = (PALETAS[n.ramo] || PALETAS.neutro).escuro;
  const blocos = caso.ordem.filter((b) => temConteudo(caso, b));
  // As âncoras listam o que EXISTE. Um menu que aponta para uma seção que não
  // foi renderizada é um link que não leva a lugar nenhum.
  const ancoraveis = blocos.filter((b) => b !== "entrar");

  const corpo = blocos.map((b) => {
    const dentro =
      b === "contato" ? blocoContato(caso) :
      b === "vitrine" ? blocoVitrine(caso) :
      b === "feitos" ? blocoFeitos(caso, pal) :
      b === "avisos" ? blocoAvisos(caso, pal) :
      b === "formulario" ? blocoFormulario(caso) :
      blocoEntrar();
    return `<section class="secao" id="b-${b}"><h2>${TITULO[b]}</h2>${dentro}</section>`;
  }).join("\n");

  const desc = caso.vitrine?.length
    ? caso.vitrine.slice(0, 2).join(". ")
    : `${n.nome}${n.cidade ? " — " + n.cidade : ""}. Fale pelo okmigo.`;

  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="${pal["--bg"]}">
<title>${esc(n.nome)}${n.cidade ? " — " + esc(n.cidade) : ""}</title>
<meta name="description" content="${esc(desc).slice(0, 155)}">
<link rel="canonical" href="https://okmigo.com/@${esc(n.handle)}">
<style>${css(pal)}</style>
</head>
<body>
<header class="topo">
  <div class="env">
    <span class="handle">okmigo.com/@${esc(n.handle)}</span>
    ${ancoraveis.length > 1 ? `<nav class="ancoras" aria-label="Seções desta página">${
      ancoraveis.map((b) => `<a href="#b-${b}">${TITULO[b]}</a>`).join("")}</nav>` : ""}
    <!-- ⛔ Este botão vai para o PRODUTO, não para a âncora do bloco «entrar».
         Ele apontava para #b-entrar, e em «um-bloco-so» a dona desligou esse
         bloco: o link do topo caía num id que não existia. O caso extremo achou
         o defeito. E, pensando bem, âncora estava errado desde sempre — a regra
         da casa diz que este botão é «o único caminho para dentro do produto»,
         e um caminho para dentro não pode terminar na mesma página.
         (rota real do okmigo entra aqui) -->
    <a class="entrar" href="#">Entrar</a>
  </div>
</header>

<main class="env">
  <div class="capa">
    <div class="marca tingido" aria-hidden="true">${esc(iniciais(n.nome))}</div>
    <h1>${esc(n.nome)}</h1>
    ${n.cidade ? `<p class="lugar">${esc(n.cidade)}</p>` : ""}
  </div>
${corpo}
  <footer class="pe">
    <p>okmigo.com/@${esc(n.handle)}</p>
    <p class="selo">Esta página é feita no okmigo.</p>
  </footer>
</main>
</body></html>`;
}

const destino = resolve(aqui, "saida");
mkdirSync(destino, { recursive: true });
const linhas = [];
for (const caso of CONTEUDO.casos) {
  const html = pagina(caso);
  writeFileSync(resolve(destino, caso.nome + ".html"), html, "utf8");
  const blocos = caso.ordem.filter((b) => temConteudo(caso, b));
  const omitidos = caso.ordem.filter((b) => !temConteudo(caso, b));
  linhas.push(`  saida/${(caso.nome + ".html").padEnd(34)} ${caso.negocio.ramo.padEnd(8)} ` +
    `${String(Math.round(html.length / 1024) + " KB").padStart(6)}  ${blocos.length} blocos` +
    (omitidos.length ? `  ·  omitidos por estarem vazios: ${omitidos.join(", ")}` : ""));
}
const indice = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>A página de um negócio — os quatro casos</title>
<style>body{background:#131211;color:#EDEAE5;font:16px/1.6 ui-sans-serif,system-ui,sans-serif;margin:0;padding:40px 20px}
main{max-width:44rem;margin:0 auto}a{color:#6EA8FE}li{margin:.5em 0}code{font-family:ui-monospace,Menlo,Consolas,monospace;color:#A49C93}</style>
</head><body><main><h1>A página pública de um negócio</h1>
<p>Os quatro casos do estojo, tema escuro, desenhados para 390px. Abra cada um e estreite a janela.</p>
<ul>${CONTEUDO.casos.map((c) =>
  `<li><a href="${c.nome}.html">${c.nome}</a> — ${esc(c.negocio.nome)} <code>(${c.negocio.ramo})</code><br><small>${esc(c.por_que)}</small></li>`).join("")}</ul>
<p><small>Gerado por <code>node alisson/pagina-do-negocio/gerar.mjs</code>. As decisões estão no <code>README.md</code> ao lado.</small></p>
</main></body></html>`;
writeFileSync(resolve(destino, "index.html"), indice, "utf8");
console.log(linhas.join("\n"));
console.log(`  saida/index.html\n→ alisson/pagina-do-negocio/saida/`);
