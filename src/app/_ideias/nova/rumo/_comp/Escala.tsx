'use client';

// o ato da escala, que continua o manifesto: porte do da home em produção (portfolio:
// src/app/_ideias/nova/_components/Expansao.tsx) para a tela do rumo. A frase deixa a palavra da escala no meio exato
// da linha do meio; quando ela se monta, a rolagem segue presa na mesma tela, o resto da frase sai (quem tira é o
// manifesto) e a palavra fica.
// Em volta dela vem o ato, refeito em 27/10 em profundidade: a rolagem é um zoom contínuo para dentro da palavra, a mesma
// câmera que mergulha nas ondas. As barras se abrem dos lados dela e os < > a cercam, no plano dela; depois tudo vem do
// fundo, pelo meio da tela: os sinais (/ < > *), os painéis de vidro com código de verdade, que se digita enquanto
// chega, e as telas dos conceitos. Cada peça nasce longe, pequena e desfocada, passa nítida pelo plano da palavra e sai
// pela câmera, grande e desfocada (o desfoque do site como profundidade), e o mouse dá a cada uma um paralaxe do
// tamanho da distância dela. A palavra troca e cresce com a rolagem: vira, um a um, os verbos que completam a frase,
// saindo e entrando pelo desfoque das palavras do hero, e cresce até caber na tela. No fim a última palavra cresce em
// volta da haste de uma letra dela (o "l"), que vem para o meio e cobre a tela. Tudo depende só do progresso, então a
// rolagem para trás desfaz igual.
// O que mudou da produção, para o estilo novo:
// - as cores são as da rampa das ondas (turquesa, menta, espuma) e a tinta é o creme da abertura;
// - o código vai na sans da tela, com o comentário na serifa itálica (a mono está fora do site);
// - as imagens são recortes dos cases dos conceitos (Turno, Pulso e Aurora), todas do mesmo tamanho;
// - a última palavra nasce com a haste do "l" no meio da tela e o mergulho é só crescimento em volta dela, e a haste
//   cobre a tela com a cor da própria letra (`corDoFim`, o creme);
// - o desenho roda no laço da página (o do Lenis), lendo o progresso que o manifesto passa.
// A versão plana anterior (o anel de sinais e os trechos de código espalhados) está no histórico do repositório
// As mesmas peças em outras três encenações (Órbita, Montagem e Colunas), testadas em 27/10, estão em
// C:/pessoal/ideias/rumo-visual/ato-versoes
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { aCadaQuadro, geo } from '../_fa/laco';
import { useIdioma } from '../../_lib/idioma';
import { luzDoAto } from '../_lib/rumo';

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const trecho = (v: number, [a, b]: readonly number[]) => limitar((v - a) / (b - a));
const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const chega = (t: number) => 1 - Math.pow(1 - t, 3);
const misturar = (a: number, b: number, t: number) => a + (b - a) * t;
const sorteio = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
};

// as cores do ato, no navy: a tinta creme e os acentos da rampa das ondas
const COR = {
    turquesa: '#4EC9AC',
    menta: '#B5DEB8',
    agua: '#219296',
    espuma: '#C8EBC9',
    tinta: '#FFFDE2',
};

// ---------------------------------------------------------------------------------------------------------------------
// a profundidade. Cada peça tem a hora em que passa pelo plano da palavra (chega, no progresso do ato) e, nessa hora, o
// lugar (fração da largura e da altura, a partir do meio) e o tamanho dela. A escala é exp(k·(a − chega)): antes de
// chegar ela vem do meio da tela, pequena, e depois cresce para fora, cada vez mais rápido. ln é o logaritmo da escala:
// ela aparece entre FUNDO e APARECE, fica nítida perto de 0 e some entre PERTO e SOME, passando pela câmera
const PROF = { fundo: -1.4, aparece: -0.7, perto: 0.7, some: 1.4, longe: 7, junto: 16, nitida: 0.12 };

function profundidade(a: number, chegada: number, k: number) {
    const ln = k * (a - chegada);
    const op = suave(trecho(ln, [PROF.fundo, PROF.aparece])) * (1 - suave(trecho(ln, [PROF.perto, PROF.some])));
    const fora = Math.max(0, Math.abs(ln) - PROF.nitida);
    const blur = ln < 0 ? PROF.longe * suave(limitar(fora / 1.5)) : PROF.junto * suave(limitar(fora / 1.2));
    return { s: Math.exp(ln), ln, op, blur };
}

// uma peça do plano da palavra (as barras e os < >) que se solta e entra no zoom a partir de `desde`
function voar(a: number, desde: number, k = 9) {
    const ln = k * Math.max(0, a - desde);
    return { s: Math.exp(ln), op: 1 - suave(trecho(ln, [0.5, 1.3])), blur: PROF.junto * suave(limitar(ln / 1.2)) };
}

// o paralaxe do mouse: no plano da palavra a peça anda PARALAXE px de um canto ao outro da tela, e mais quanto mais perto
const PARALAXE = 36;
// o mouse em fração da tela a partir do meio (no toque fica no meio)
const ponteiro = { x: 0, y: 0 };
const moverPonteiro = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    ponteiro.x = e.clientX / window.innerWidth - 0.5;
    ponteiro.y = e.clientY / window.innerHeight - 0.5;
};

// ---------------------------------------------------------------------------------------------------------------------
// os sinais que vêm do fundo, em volta da palavra: o lugar de cada um sai de uma elipse pelo ângulo de ouro (um
// seguido do outro ficam longe), no computador e na tela em pé; tam é o tamanho em relação à letra dos sinais
const GLIFOS = ['/', '<', '*', '>', '/', '</>', '*', '/', '<', '>', '/', '*', '</>', '/'];
const SINAIS = GLIFOS.map((c, i) => {
    const angulo = i * 2.39996 + 0.6;
    const r = 0.85 + 0.3 * sorteio(i + 23);
    const tom = sorteio(i + 9);
    return {
        c,
        cor: tom < 0.5 ? COR.tinta : tom < 0.75 ? COR.turquesa : tom < 0.9 ? COR.espuma : COR.menta,
        deitada: [Math.cos(angulo) * 0.36 * r, Math.sin(angulo) * 0.31 * r] as const,
        empe: [Math.cos(angulo) * 0.34 * r, Math.sin(angulo) * 0.24 * r] as const,
        // arredondado: vai no estilo da página do servidor, e o sorteio pode diferir nas últimas casas entre ele e o
        // navegador (a hidratação reclamava)
        tam: Math.round(100 * (0.8 + 0.8 * sorteio(i + 5))) / 100,
        chega: 0.16 + (0.26 * i) / (GLIFOS.length - 1),
        giro: (sorteio(i + 11) - 0.5) * 2,
        celular: i % 2 === 0,
    };
});

// os painéis de código: o arquivo, o comentário (o único texto que muda com o idioma) e as linhas. No celular ficam os
// três primeiros, um acima e outro abaixo da palavra
const PAINEIS = [
    { arquivo: 'brand.ts', nota: { pt: 'a mesma marca em todo lugar', en: 'the same brand everywhere' }, linhas: ['export const brand = {', "  name: 'Aurora',", '  colors: tokens.colors,', '}'] },
    { arquivo: 'layout.css', nota: { pt: 'do celular ao telão', en: 'from phone to big screen' }, linhas: ['.hero {', '  font-size: clamp(48px, 8vw, 168px);', '}'] },
    { arquivo: 'schedule.tsx', nota: { pt: 'menos planilha, mais agenda', en: 'less spreadsheet, more schedule' }, linhas: ['<Schedule', '  bookings={bookings}', '  onBook={confirm}', '/>'] },
    { arquivo: 'route.ts', nota: { pt: 'rápido no primeiro clique', en: 'fast on the first click' }, linhas: ['const page = await render(route)', 'cache.set(route, page)'] },
    { arquivo: 'goals.ts', nota: { pt: 'cada número conta', en: 'every number counts' }, linhas: ['const goal = workouts / week', 'dashboard.update({ goal })'] },
    { arquivo: 'scale.ts', nota: { pt: 'cresce sem quebrar', en: 'grows without breaking' }, linhas: ['app.scale({', '  screens: Infinity,', "  essence: 'kept',", '})'] },
].map((p, i) => ({
    ...p,
    deitada: ([[-0.29, -0.25], [0.3, 0.24], [0.31, -0.25], [-0.3, 0.25], [0, -0.31], [0, 0.31]] as const)[i],
    empe: ([[0.03, -0.25], [-0.03, 0.25], [0.02, -0.28], [0, 0.28], [0, -0.28], [0, 0.28]] as const)[i],
    chega: 0.32 + 0.04 * i,
    celular: i < 3,
}));

// as cores do código, por pedaço: comentário, texto entre aspas, palavra-chave, tag e número
type Pedaco = { t: string; cor?: string; nota?: boolean };
const SINTAXE = /(\/\/.*|\/\*.*\*\/)|('[^']*')|\b(const|export|await|return)\b|(<\/?[A-Z]\w*|\/>)|(\b\d+(?:px|vw)?\b|\bInfinity\b)/g;
function colorir(linha: string): Pedaco[] {
    const saida: Pedaco[] = [];
    let ultimo = 0;
    for (const m of linha.matchAll(SINTAXE)) {
        if (m.index > ultimo) saida.push({ t: linha.slice(ultimo, m.index) });
        saida.push({ t: m[0], nota: !!m[1], cor: m[2] ? COR.menta : m[3] ? COR.turquesa : m[4] ? COR.espuma : m[5] ? COR.espuma : undefined });
        ultimo = m.index + m[0].length;
    }
    if (ultimo < linha.length) saida.push({ t: linha.slice(ultimo) });
    return saida;
}

// as telas: recortes dos cases dos conceitos (Turno, Pulso e Aurora) em public/nova-escala/telas, 800 × 500, todas em
// 16:10 e do mesmo tamanho na tela. No celular ficam as cinco primeiras
const TELAS = [
    'turno-abertura',
    'pulso-telas',
    'aurora-painel',
    'turno-agenda',
    'pulso-meta',
    'aurora-embalagem',
    'turno-celular',
    'pulso-abertura',
].map((nome, i) => ({
    src: `/nova-escala/telas/${nome}.jpg`,
    deitada: ([[0.3, -0.26], [-0.3, 0.25], [-0.31, -0.26], [0.31, 0.26], [0.06, -0.33], [-0.06, 0.33], [-0.36, -0.3], [0.36, 0.3]] as const)[i],
    empe: ([[0.12, -0.27], [-0.12, 0.27], [-0.1, -0.3], [0.1, 0.3], [0, -0.27], [0, 0.27], [0, -0.3], [0, 0.3]] as const)[i],
    chega: 0.55 + 0.03 * i,
    celular: i < 5,
}));

// a rapidez do zoom de cada grupo (o k da escala): os sinais passam mais depressa, as telas mais devagar
const K = { sinais: 11, paineis: 9.5, telas: 10 };

const soGrande = (fica: boolean) => (fica ? '' : ' fa-so-grande');

// as medidas: os sinais do plano da palavra (barras e < >) têm um tanto da letra dela (SINAL); os painéis e as telas
// vão pela largura da tela (no celular, mais largos); a letra do código vai pelo painel
const SINAL = 0.7;

type Palavra = { x: number; y: number; w: number; h: number; texto: string };

// onde fica a palavra escolhida na frase pronta, em relação ao palco preso, em fração de pixel (para a cópia cair
// exatamente em cima). Desconta o deslocamento da montagem: no celular a frase se monta por tempo e a palavra pode
// ainda estar subindo quando a continuação começa
function medirPalavra(texto: HTMLDivElement | null, palavra: number, palco: HTMLElement): Palavra | null {
    const real = texto?.querySelectorAll<HTMLElement>('[data-palavra]')[palavra];
    if (!real) return null;
    const r = real.getBoundingClientRect();
    const c = palco.getBoundingClientRect();
    const t = getComputedStyle(real).transform;
    const m = t && t !== 'none' ? new DOMMatrixReadOnly(t) : null;
    return { x: r.left - c.left - (m?.m41 ?? 0), y: r.top - c.top - (m?.m42 ?? 0), w: r.width, h: r.height, texto: real.textContent ?? '' };
}

// uma palavra solta, por cima de tudo, letra por letra como na frase: a cópia da palavra escolhida (que sai igual a
// ela) e as palavras que ela vira. A marca vazia no fim dá a linha de base, para achar a haste do fim pela letra
function PalavraSolta({ texto, visivel }: { texto: string; visivel: boolean }) {
    return (
        <span data-solta className="absolute left-0 top-0 z-20 inline-block whitespace-nowrap" style={{ opacity: 0, visibility: visivel ? 'visible' : 'hidden' }}>
            {[...texto].map((l, i) => <span key={i} data-letra className="relative">{l}</span>)}
            <span data-base className="inline-block h-0 w-0 align-baseline" />
        </span>
    );
}

// a palavra parada fica com left e top no lugar exato e sem transform (o navegador desenha as letras igual à frase); o
// transform só entra quando ela anda ou muda de tamanho, em volta do meio dela (ou de outro ponto: a última cresce em
// volta da haste)
function colocar(el: HTMLElement, x: number, y: number, dx: number, dy: number, e: number, origem = '50% 50%') {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transformOrigin = origem;
    el.style.transform = dx === 0 && dy === 0 && e === 1 ? 'none' : `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${e.toFixed(4)})`;
}

// ---------------------------------------------------------------------------------------------------------------------
// as barras e os < > nascem pelo desfoque, como as palavras do hero: a peça sai de 8 px de desfoque e as letras dela
// acendem uma depois da outra, presas à rolagem
const NASCE = { desfoque: 8 };

// uma peça que nasce: a caixa (que anda e leva o desfoque) e as letras dela
type Nascente = { caixa: HTMLElement; letras: HTMLElement[]; t: number };

const lerNascente = (caixa: HTMLElement): Nascente => ({ caixa, letras: [...caixa.querySelectorAll<HTMLElement>('[data-letra]')], t: -1 });

// o desfoque de uma peça, só escrito quando muda
function desfocar(el: HTMLElement, d: number) {
    const f = d > 0.05 ? `blur(${d.toFixed(2)}px)` : '';
    if (el.style.filter !== f) el.style.filter = f;
}

// a peça no ponto t (0 a 1) do nascimento, com o desfoque do nascimento ou o de outro movimento (extra), o maior
function nascer(n: Nascente, t: number, extra = 0) {
    if (t !== n.t) {
        n.t = t;
        for (const l of n.letras) l.style.opacity = suave(t).toFixed(3);
    }
    desfocar(n.caixa, Math.max(t > 0 && t < 1 ? NASCE.desfoque * (1 - suave(t)) : 0, extra));
}

// uma letra da peça (apagada até nascer)
function LetraQueNasce({ letra }: { letra: string }) {
    return <span data-letra style={{ opacity: 0 }}>{letra}</span>;
}

// a palavra do "troca" na linguagem do hero: entra e sai pelo desfoque (opacidade e até 10 px de desfoque), preso à
// rolagem; t = 1 é a palavra pronta e 0, nada
type PalavraSoltaLida = {
    el: HTMLElement;
    fonte: number;
    w: number;
    h: number;
    // um ponto dentro da haste de uma letra de haste reta no meio (o "l"), da borda de cima e da esquerda da palavra
    haste: { x: number; y: number };
    t: number;
};

// as hastes retas de cada letra: o meio de cada uma, em em a partir do começo da letra, medido a 0,3em da linha de base
// na sans da tela no peso 600 (em caixa alta, text-transform, a do L, do E e do I fica à esquerda; H, M e N têm duas, e
// o T a tem no meio). O mergulho vai na haste mais perto do meio da palavra, para ela crescer centrada: em
// "LANÇAMENTO" é a primeira do M, em "LAUNCH" a primeira do N. No fim do mergulho a palavra fica umas 140 vezes maior,
// então o meio da caixa da letra não serve: com o espaçamento negativo ele cai 0,015em à esquerda da haste, e 1 px de
// erro vira 140 px de creme torto
const HASTES: Record<string, number[]> = { l: [0.111], i: [0.111], ı: [0.111] };
const HASTES_MAIUSCULAS: Record<string, number[]> = {
    b: [0.119], d: [0.119], e: [0.119], h: [0.119, 0.588], i: [0.119], l: [0.119], m: [0.116, 0.754], n: [0.119, 0.585], t: [0.313],
};

function lerPalavraSolta(el: HTMLElement): PalavraSoltaLida {
    const letras = [...el.querySelectorAll<HTMLElement>('[data-letra]')];
    const fonte = parseFloat(getComputedStyle(el).fontSize) || 80;
    const base = el.querySelector<HTMLElement>('[data-base]');
    const maiuscula = getComputedStyle(el).textTransform === 'uppercase';
    const tabela = maiuscula ? HASTES_MAIUSCULAS : HASTES;
    const chave = (l: HTMLElement) => (maiuscula ? (l.textContent ?? '').toLowerCase() : (l.textContent ?? ''));
    // o começo de cada letra em fração de pixel, com o transform da palavra desligado um instante (o offsetLeft
    // arredonda), e a haste mais perto do meio
    let x = el.offsetWidth / 2;
    const antes = el.style.transform;
    el.style.transform = 'none';
    const esquerda = el.getBoundingClientRect().left;
    const meio = el.getBoundingClientRect().width / 2;
    let melhor = Infinity;
    for (const l of letras) {
        const hastes = tabela[chave(l)];
        if (!hastes) continue;
        const inicio = l.getBoundingClientRect().left - esquerda;
        for (const h of hastes) {
            const hx = inicio + h * fonte;
            if (Math.abs(hx - meio) < melhor) {
                melhor = Math.abs(hx - meio);
                x = hx;
            }
        }
    }
    el.style.transform = antes;
    return {
        el,
        haste: { x, y: base ? base.offsetTop - 0.3 * fonte : el.offsetHeight / 2 },
        fonte,
        w: el.offsetWidth,
        h: el.offsetHeight,
        t: -1,
    };
}

function formar(n: PalavraSoltaLida, t: number) {
    if (t === n.t) return;
    n.t = t;
    const q = suave(t);
    n.el.style.opacity = q.toFixed(3);
    n.el.style.filter = t > 0 && t < 1 ? `blur(${(10 * (1 - q)).toFixed(2)}px)` : '';
    n.el.style.visibility = t > 0 ? 'visible' : 'hidden';
}

// ---------------------------------------------------------------------------------------------------------------------
// o ato, desenhado em volta do meio da tela a partir do progresso dele (0 a 1)
type Ato = {
    barras: Nascente[];
    chaves: Nascente[];
    sinais: HTMLElement[];
    paineis: { caixa: HTMLElement; linhas: HTMLElement[] }[];
    telas: HTMLElement[];
};

// os trechos do ato no plano da palavra
const A = {
    abre: [0, 0.09], // as duas barras nascem rente à palavra e se afastam dela
    barrasVoam: 0.13, // e se soltam no zoom
    chaves: [0.08, 0.16], // os < > nascem junto da palavra
    chavesVoam: 0.44,
} as const;

type MedidasAto = { celular: boolean; deitada: boolean; w: number; h: number; g: number; painel: number; codigo: number; tela: number };

function medirAto(w: number, h: number, fonte: number): MedidasAto {
    const deitada = w >= h;
    const painel = deitada ? Math.min(420, Math.max(260, w * 0.23)) : w * 0.66;
    return { celular: w < 768, deitada, w, h, g: fonte * SINAL, painel, codigo: painel / 25, tela: deitada ? w * 0.21 : w * 0.54 };
}

function montarAto(camada: HTMLElement): Ato {
    const todos = (sel: string) => [...camada.querySelectorAll<HTMLElement>(sel)];
    return {
        barras: todos('[data-grupo="barras"]').map(lerNascente),
        chaves: todos('[data-grupo="chaves"]').map(lerNascente),
        sinais: todos('[data-sinal]'),
        paineis: todos('[data-painel]').map(caixa => ({ caixa, linhas: [...caixa.querySelectorAll<HTMLElement>('[data-linha]')] })),
        telas: todos('[data-tela]'),
    };
}

// o transform de uma peça com o meio em (x, y) a partir do meio da tela, na escala e no giro dados
const plano = (x: number, y: number, e = 1, giro = 0) =>
    `translate(calc(${x.toFixed(1)}px - 50%), calc(${y.toFixed(1)}px - 50%))${e === 1 ? '' : ` scale(${e.toFixed(3)})`}${giro ? ` rotate(${giro.toFixed(1)}deg)` : ''}`;

const mover = (el: HTMLElement, x: number, y: number, e = 1, giro = 0) => {
    el.style.transform = plano(x, y, e, giro);
};

// uma peça do zoom no progresso a: escondida fora da janela dela; senão no lugar (que se afasta do meio com a escala),
// com o paralaxe, a opacidade, o desfoque e a ordem (a mais perto por cima). Devolve a profundidade, ou null escondida
function naProfundidade(el: HTMLElement, a: number, d: { chega: number; deitada: readonly [number, number]; empe: readonly [number, number] }, k: number, m: MedidasAto, px: number, py: number, giro = 0) {
    const p = profundidade(a, d.chega, k);
    if (p.op <= 0.002) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
        return null;
    }
    el.style.visibility = 'visible';
    const [fx, fy] = m.deitada ? d.deitada : d.empe;
    mover(el, (fx * m.w + px * PARALAXE) * p.s, (fy * m.h + py * PARALAXE) * p.s, p.s, giro * p.ln * 24);
    el.style.opacity = p.op.toFixed(3);
    desfocar(el, p.blur);
    el.style.zIndex = String(100 + Math.round(p.ln * 20));
    return p;
}

// as linhas de um painel digitadas até v (0 a 1), da primeira à última
function digitar(painel: Ato['paineis'][number], v: number) {
    const digitado = v * painel.linhas.length;
    painel.linhas.forEach((linha, j) => {
        const q = limitar(digitado - j);
        const recorte = q >= 1 ? '' : `inset(0 ${(100 * (1 - q)).toFixed(1)}% 0 0)`;
        if (linha.style.clipPath !== recorte) linha.style.clipPath = recorte;
    });
}

// meia: a meia largura da palavra agora (ela muda de tamanho); e: o quanto as barras e os < > crescem com ela; px e py:
// o mouse, já suavizado
function desenharAto(ato: Ato, a: number, m: MedidasAto, meia: number, e: number, px: number, py: number) {
    const g = m.g * e;

    // as duas barras: nascem rente à palavra, se afastam dela e se soltam no zoom
    const abre = trecho(a, A.abre);
    const vb = voar(a, A.barrasVoam);
    ato.barras.forEach((n, i) => {
        const lado = i === 0 ? -1 : 1;
        mover(n.caixa, lado * (meia + (0.25 + 1.1 * chega(abre)) * g) * vb.s, 0, e * vb.s);
        n.caixa.style.opacity = vb.op.toFixed(3);
        nascer(n, abre, vb.blur);
    });
    // os < >: nascem junto da palavra, em tinta, ganham cor (espuma e turquesa) e se soltam no zoom
    const corChaves = trecho(a, [0.2, 0.24]) > 0.5;
    const vc = voar(a, A.chavesVoam);
    ato.chaves.forEach((n, i) => {
        const lado = i === 0 ? -1 : 1;
        mover(n.caixa, lado * (meia + 0.7 * g) * vc.s, 0, e * vc.s);
        n.caixa.style.opacity = vc.op.toFixed(3);
        n.caixa.style.color = corChaves ? (i === 0 ? COR.espuma : COR.turquesa) : COR.tinta;
        nascer(n, trecho(a, A.chaves), vc.blur);
    });

    // o que vem do fundo: os sinais, girando um pouco enquanto passam
    ato.sinais.forEach((el, i) => naProfundidade(el, a, SINAIS[i], K.sinais, m, px, py, SINAIS[i].giro));
    // os painéis, com as linhas digitadas enquanto chegam (do fundo até o plano da palavra)
    ato.paineis.forEach((painel, i) => {
        const p = naProfundidade(painel.caixa, a, PAINEIS[i], K.paineis, m, px, py);
        if (p) digitar(painel, trecho(p.ln, [-1.3, -0.05]));
    });
    // as telas
    ato.telas.forEach((el, i) => naProfundidade(el, a, TELAS[i], K.telas, m, px, py));
}

function AtoElementos() {
    const { idioma } = useIdioma();
    return (
        <>
            {TELAS.map((t, i) => (
                <div key={i} data-tela className={`fa-ato-tela absolute left-1/2 top-1/2${soGrande(t.celular)}`} style={{ visibility: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.src} alt="" draggable={false} className="block h-full w-full object-cover" />
                </div>
            ))}
            {PAINEIS.map((p, i) => (
                <div key={i} data-painel className={`fa-ato-painel absolute left-1/2 top-1/2${soGrande(p.celular)}`} style={{ visibility: 'hidden' }}>
                    <span className="fa-ato-painel-arquivo">{p.arquivo}</span>
                    {[p.arquivo.endsWith('.css') ? `/* ${p.nota[idioma]} */` : `// ${p.nota[idioma]}`, ...p.linhas].map((linha, j) => (
                        <span key={j} data-linha className="block" style={{ clipPath: 'inset(0 100% 0 0)' }}>
                            {colorir(linha).map((q, k) =>
                                q.nota ? (
                                    <span key={k} className="fa-ato-nota">{q.t}</span>
                                ) : (
                                    <span key={k} style={q.cor ? { color: q.cor } : undefined}>{q.t}</span>
                                ),
                            )}
                        </span>
                    ))}
                </div>
            ))}
            <div style={{ fontSize: 'calc(var(--g) * 1px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: COR.tinta }}>
                {SINAIS.map((s, i) => (
                    <span key={i} data-sinal className={`absolute left-1/2 top-1/2 whitespace-nowrap${soGrande(s.celular)}`} style={{ color: s.cor, fontSize: `${s.tam}em`, visibility: 'hidden' }}>
                        {s.c}
                    </span>
                ))}
                {['/', '/'].map((c, i) => (
                    <span key={`b${i}`} data-grupo="barras" className="absolute left-1/2 top-1/2">
                        <LetraQueNasce letra={c} />
                    </span>
                ))}
                {['<', '>'].map((c, i) => (
                    <span key={`c${i}`} data-grupo="chaves" className="absolute left-1/2 top-1/2">
                        <LetraQueNasce letra={c} />
                    </span>
                ))}
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------------------------------------------------
// a palavra no ato: troca e cresce. Ela vira, uma a uma, os verbos (saindo e entrando pelo desfoque, como as palavras
// do hero) e vai crescendo com a rolagem, cada uma até no máximo caber na tela. As trocas ficam entre o começo dos
// sinais e o começo das telas, uma janela curta cada: a palavra sai pelo desfoque nos primeiros 60% dela e a próxima
// nasce dos 40% em diante, então as duas se cruzam e a tela não fica vazia. Devolve [começo, fim do sai, começo do
// entra, fim]
const TROCA = { de: 0.15, ate: 0.5, janela: 0.07 };
const janelaDaTroca = (j: number, n: number) => {
    const ini = n > 1 ? TROCA.de + ((TROCA.ate - TROCA.de) * j) / (n - 1) : TROCA.de;
    return [ini, ini + 0.6 * TROCA.janela, ini + 0.4 * TROCA.janela, ini + TROCA.janela] as const;
};
const CRESCE = { ate: 2, trecho: [0.04, 0.8], cabe: 0.8 } as const;
const crescer = (a: number) => 1 + (CRESCE.ate - 1) * suave(trecho(a, CRESCE.trecho));

// o fim pela letra: a última palavra cresce em volta da haste, cada vez mais rápido (mergulha), e a haste vem para o
// meio no primeiro terço, até cobrir a tela. Para saber o quanto crescer, a haste conta por baixo: largura (em em; a do
// L da sans da tela no peso 600 mede 0,133) e o dobro da distância do ponto à linha de base (alto, em em)
const LETRA = { mergulha: [0.8, 0.97], largura: 0.12, alto: 0.6 } as const;

// os trechos do progresso da continuação: a palavra desliza até o meio se a tela tiver quebrado a frase de outro
// jeito (normalmente ela já está lá); e o ato
const JANELAS = { centra: [0.02, 0.1], ato: [0.06, 1] } as const;

// mergulho: a escala em que a haste da última palavra cobre a tela
type MedidasJanelas = { p: Palavra; ato: MedidasAto; desliza: boolean; cabe: number; palavras: PalavraSoltaLida[]; mergulho: number };

// progresso: o da continuação (0 a 1), lido a cada quadro; texto: o bloco da frase; palavra: a ordem da palavra da
// escala nele; estilo: a letra da frase, para as palavras soltas saírem iguais; novas: os verbos; corDoFim e
// tintaDoFim: as cores da seção seguinte (a haste cobre a tela com o fundo dela); fundo e tinta: as cores da seção do
// ato, que ela volta a dizer quando a tela descobre (vêm por propriedade: lidas na página, depois de uma remontagem com
// a tela coberta elas já seriam as do fim, e a tinta navy ficava nas palavras); tinta também é a cor das palavras
export function Escala({ progresso, texto, palavra, estilo, novas, corDoFim, tintaDoFim, fundo, tinta }: {
    progresso: () => number;
    texto: RefObject<HTMLDivElement | null>;
    palavra: number;
    estilo: CSSProperties;
    novas: string[];
    corDoFim: string;
    tintaDoFim: string;
    fundo: string;
    tinta: string;
}) {
    const chaveNovas = novas.join('|');
    const camada = useRef<HTMLDivElement>(null);
    const soltas = useRef<HTMLDivElement>(null);
    const [copiaTexto, setCopiaTexto] = useState('');

    useEffect(() => {
        let ato: Ato | null = null;
        let medidas: MedidasJanelas | null = null;
        let coberta = false;
        // a seção do ato começa nas cores dela (uma montagem anterior pode ter saído com a tela coberta)
        const secaoDoAto = camada.current?.closest<HTMLElement>('[data-fundo]');
        const voltar = () => {
            if (!secaoDoAto) return;
            secaoDoAto.dataset.fundo = fundo;
            secaoDoAto.dataset.tinta = tinta;
        };
        voltar();

        // a frase só fica pronta quando a continuação começa, então mede ali (e de novo quando a tela muda)
        const medir = () => {
            const el = camada.current;
            const palco = el?.parentElement;
            const caixa = soltas.current;
            if (!el || !palco || !caixa) return false;
            const p = medirPalavra(texto.current, palavra, palco);
            if (!p) return false;
            setCopiaTexto(p.texto);
            const spans = [...caixa.querySelectorAll<HTMLElement>('[data-solta]')];
            if (!spans[0] || spans[0].querySelectorAll('[data-letra]').length !== [...p.texto].length || spans.length !== 1 + chaveNovas.split('|').filter(Boolean).length) return false;
            const w = palco.clientWidth;
            const h = palco.clientHeight;
            const m = medirAto(w, h, parseFloat(getComputedStyle(spans[0]).fontSize) || p.h);
            // os tamanhos vão direto nas variáveis da camada, para as peças já terem o tamanho certo quando são lidas
            el.style.setProperty('--g', m.g.toFixed(2));
            el.style.setProperty('--codigo', m.codigo.toFixed(2));
            el.style.setProperty('--painel', m.painel.toFixed(1));
            el.style.setProperty('--tela', m.tela.toFixed(1));
            ato = montarAto(el);
            // a cópia vai em cima da palavra; as outras, centradas nela, na mesma altura
            const palavras = spans.map(lerPalavraSolta);
            const fonte = palavras[palavras.length - 1].fonte;
            medidas = {
                p,
                ato: m,
                desliza: Math.hypot(w / 2 - (p.x + p.w / 2), h / 2 - (p.y + p.h / 2)) > 1,
                cabe: CRESCE.cabe * w,
                palavras,
                mergulho: 1.25 * Math.max(w / (LETRA.largura * fonte), h / (LETRA.alto * fonte)),
            };
            return true;
        };

        const desenhar = (v: number, px: number, py: number) => {
            const m = medidas;
            if (!m || !ato) return;
            const a = trecho(v, JANELAS.ato);
            const k = m.desliza ? suave(trecho(v, JANELAS.centra)) : 0;
            const dx = (m.ato.w / 2 - m.p.w / 2 - m.p.x) * k;
            const dy = (m.ato.h / 2 - m.p.h / 2 - m.p.y) * k;
            const e = crescer(a);
            const escala = (q: PalavraSoltaLida) => Math.min(e, m.cabe / q.w);
            const n = m.palavras.length - 1;
            const ultima = m.palavras[n];
            const mergulha = trecho(a, LETRA.mergulha);
            // a luz do fundo debaixo d'água: um passo a cada troca de verbo, junto com a troca (as ondas leem)
            let trocas = 0;
            for (let j = 0; j < n; j++) {
                const [ini, , , fim] = janelaDaTroca(j, n);
                trocas += suave(trecho(a, [ini, fim]));
            }
            luzDoAto.clareia = n ? trocas / n : 0;

            m.palavras.forEach((q, j) => {
                // quanto ela nasceu: entra na troca anterior e sai na seguinte (a primeira já começa pronta; a última
                // sai pelo fim)
                const antes = janelaDaTroca(j - 1, n);
                const depois = janelaDaTroca(j, n);
                const entra = j === 0 ? 1 : trecho(a, [antes[2], antes[3]]);
                const sai = j < n ? trecho(a, [depois[0], depois[1]]) : 0;
                // antes do ato nenhuma aparece (a frase manda); a cópia da palavra da escala entra pronta, idêntica
                formar(q, v <= 0 ? 0 : Math.min(entra, 1 - sai));
                let s = escala(q);
                if (q === ultima) {
                    // a última já nasce com a haste no meio exato da tela e cresce em volta dela, então o mergulho é só
                    // o crescimento, cada vez mais rápido, sem andar para os lados (na produção ela nascia centrada e a
                    // haste vinha para o meio durante o mergulho); a cor vai da tinta à do fim
                    if (mergulha > 0) {
                        s *= Math.pow(m.mergulho / s, Math.pow(mergulha, 3));
                        q.el.style.color = `color-mix(in srgb, ${corDoFim} ${(suave(trecho(mergulha, [0.3, 0.9])) * 100).toFixed(1)}%, ${tinta})`;
                    } else q.el.style.color = tinta;
                    colocar(q.el, m.ato.w / 2 - q.haste.x, m.ato.h / 2 - q.haste.y, 0, 0, s, `${q.haste.x.toFixed(2)}px ${q.haste.y.toFixed(2)}px`);
                } else colocar(q.el, j === 0 ? m.p.x : m.p.x + (m.p.w - q.w) / 2, m.p.y, dx, dy, s);
                // coberta a tela, a palavra some (e formar() a repõe se a rolagem voltar)
                if (q === ultima && mergulha >= 1) {
                    q.el.style.visibility = 'hidden';
                    q.t = -1;
                }
            });
            // coberta a tela, a cor do fim fica no fundo da camada, e a seção passa a dizer essa cor ao fundo de cores da
            // página (que lê o data-fundo a cada quadro): ele chega nela escondido atrás da camada e, quando a seção
            // sai, não sobra emenda. Voltando a rolagem, a seção volta às cores dela
            const camadaEl = camada.current;
            const cobriu = mergulha >= 1;
            if (camadaEl) camadaEl.style.background = cobriu ? corDoFim : '';
            if (secaoDoAto && cobriu !== coberta) {
                coberta = cobriu;
                if (cobriu) {
                    secaoDoAto.dataset.fundo = corDoFim;
                    secaoDoAto.dataset.tinta = tintaDoFim;
                } else voltar();
            }

            // a meia largura que os < > e as barras seguem: a da palavra da vez (já no tamanho dela) e, numa troca, no
            // meio do caminho entre as duas
            const largura = (j: number) => m.palavras[j].w * escala(m.palavras[j]);
            let meia = largura(0) / 2;
            for (let j = 0; j < n; j++) {
                const [ini, , , fim] = janelaDaTroca(j, n);
                if (a >= ini) meia = misturar(largura(j), largura(j + 1), suave(trecho(a, [ini, fim]))) / 2;
            }
            desenharAto(ato, a, m.ato, meia, e, px, py);
        };

        let antes = -1;
        let medido = false;
        let versao = -1;
        let vAntes = NaN;
        // o mouse suavizado (~0,5 s): com a rolagem parada, o ato só se redesenha enquanto ele anda
        const mouse = { x: 0, y: 0 };
        window.addEventListener('pointermove', moverPonteiro, { passive: true });
        const desligar = aCadaQuadro(({ dt }) => {
            const v = progresso();
            // a tela mudou (ou a página remediu): mede de novo
            if (versao !== geo.versao) {
                versao = geo.versao;
                medido = false;
                vAntes = NaN;
            }
            if (!medido && (v > 0 || antes < 0)) medido = medir();
            else if (v > 0 && antes <= 0) medido = medir();
            antes = v;
            const f = 1 - Math.exp(-dt / 0.5);
            const mx = mouse.x + (ponteiro.x - mouse.x) * f;
            const my = mouse.y + (ponteiro.y - mouse.y) * f;
            const mexeu = Math.abs(mx - mouse.x) + Math.abs(my - mouse.y) > 1e-4;
            mouse.x = mx;
            mouse.y = my;
            if (v === vAntes && !(mexeu && v > 0 && v < 1)) return;
            vAntes = v;
            desenhar(v, mx, my);
        });
        return () => {
            desligar();
            window.removeEventListener('pointermove', moverPonteiro);
            luzDoAto.clareia = 0;
            voltar();
        };
    }, [progresso, texto, palavra, copiaTexto, chaveNovas, corDoFim, tintaDoFim, fundo, tinta]);

    return (
        <div ref={camada} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ ['--g' as string]: 40, ['--codigo' as string]: 14, ['--painel' as string]: 320, ['--tela' as string]: 300 }}>
            <AtoElementos />
            {/* as palavras na tinta do ato, sem herdar a da página */}
            <div ref={soltas} className="relative z-[300]" style={{ ...estilo, color: tinta }}>
                <PalavraSolta texto={copiaTexto} visivel />
                {novas.map((t, i) => <PalavraSolta key={`${i}-${t}`} texto={t} visivel={false} />)}
            </div>
        </div>
    );
}
