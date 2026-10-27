'use client';

// o ato da escala, que continua o manifesto: porte do da home em produção (portfolio:
// src/app/_ideias/nova/_components/Expansao.tsx) para a tela do rumo. A frase deixa a palavra da escala no meio exato
// da linha do meio; quando ela se monta, a rolagem segue presa na mesma tela, o resto da frase sai (quem tira é o
// manifesto) e a palavra fica.
// Em volta dela vem o ato: barras que se abrem dos lados, os < > e um anel de barras e asteriscos, trechos de código que
// se espalham pela tela e imagens que surgem do centro, crescem e saem pelas bordas. A palavra troca e cresce com a
// rolagem: vira, um a um, os verbos que completam a frase, saindo e entrando pelo desfoque das palavras do hero, e
// cresce até caber na tela. No fim a última palavra cresce em volta da haste de uma letra dela (o "l"),
// que vem para o meio e cobre a tela. Os sinais e o código também nascem dos pontos. Tudo depende só do progresso,
// então a rolagem para trás desfaz igual.
// O que mudou da produção, para o estilo novo:
// - os acentos laranja, pêssego, rosa e lilás viraram o turquesa, a menta e o verde-água da rampa das ondas, e a
//   tinta é o creme da abertura;
// - o código sai na serifa itálica da tela (a do índice e das palavras soltas), não na mono (a mono está fora do site);
// - as outras palavras da frase saem com o desfoque das palavras do hero (no manifesto); a última palavra nasce com a
//   haste do "l" no meio da tela e o mergulho é só crescimento em volta dela;
// - as imagens são as capas dos conceitos novos (Turno, Aurora, Pulso, Tipografia e o site) e degradês na paleta, no
//   lugar das prévias dos projetos antigos e das duas demonstrações dos serviços;
// - a haste cobre a tela com a cor da própria letra (`corDoFim`, o creme), e a seção segue nela;
// - o fim pela letra acha a haste do "l" (e, se o texto vier em caixa alta, a do L, à esquerda dele);
// - o desenho roda no laço da página (o do Lenis), lendo o progresso que o manifesto passa
import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { aCadaQuadro, geo } from '../_fa/laco';

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const trecho = (v: number, [a, b]: readonly number[]) => limitar((v - a) / (b - a));
const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const chega = (t: number) => 1 - Math.pow(1 - t, 3);
const misturar = (a: number, b: number, t: number) => a + (b - a) * t;
const sorteio = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
};


// as cores do ato, no navy: a tinta creme e os acentos da rampa das ondas (no lugar do laranja, do pêssego, do rosa e
// do lilás da produção, na mesma ordem; as chaves guardam esses nomes)
const COR = {
    laranja: '#4EC9AC',
    pessego: '#B5DEB8',
    rosa: '#219296',
    lilas: '#C8EBC9',
    tinta: '#FFFDE2',
    apagada: 'rgba(255,253,226,0.4)',
    codigo: 'rgba(255,253,226,0.8)',
};
type Cor = keyof typeof COR;

// o anel em volta da palavra: barras, < > e asteriscos, numa elipse mais larga que alta. As medidas vão na unidade dos
// sinais. O sorteio põe dois asteriscos quase no mesmo ponto à esquerda (o 9, apagado, e o 10), e o de trás aparecia
// como uma sombra duplicada do outro: o 9 sai
const SINAIS = Array.from({ length: 18 }, (_, i) => {
    const r = sorteio(i + 40);
    const c = r < 0.62 ? '/' : r < 0.8 ? (sorteio(i + 3) < 0.5 ? '<' : '>') : '*';
    const tom = sorteio(i + 9);
    const cor: Cor = tom < 0.55 ? 'tinta' : tom < 0.68 ? 'laranja' : tom < 0.78 ? 'pessego' : tom < 0.88 ? 'lilas' : tom < 0.94 ? 'rosa' : 'apagada';
    const angulo = (i / 18) * Math.PI * 2 + (sorteio(i + 17) - 0.5) * 0.5;
    return { c, cor, angulo, rx: 2.6 + 2.6 * sorteio(i + 23), ry: 1.4 + 1.7 * sorteio(i + 29), sai: 0.1 + 0.24 * (i / 17) };
}).filter((_, i) => i !== 9);

// os trechos de código, espalhados pela tela (fração da largura e da altura, a partir do meio)
const CODIGO: { x: number; y: number; t: string; cor?: Cor; realce?: boolean }[] = [
    { x: -0.3, y: -0.4, t: '>' },
    { x: -0.27, y: -0.34, t: '○ const  express();' },
    { x: 0.14, y: -0.41, t: 'client_id=' },
    { x: 0.11, y: -0.33, t: '> ●' },
    { x: -0.17, y: -0.24, t: 'const orgs' },
    { x: 0.04, y: -0.25, t: 'req.q', cor: 'laranja' },
    { x: 0.29, y: -0.24, t: 'express();●○' },
    { x: -0.07, y: -0.17, t: 'express();', cor: 'rosa' },
    { x: 0.39, y: -0.36, t: 'const app = express();' },
    { x: 0.34, y: -0.29, t: 'const { code } =', cor: 'laranja' },
    { x: -0.41, y: -0.2, t: 'orgsResponse = await axios' },
    { x: 0.0, y: -0.33, t: 'console.error' },
    { x: -0.35, y: 0.0, t: '(req, res) => {●' },
    { x: 0.27, y: 0.0, t: '-      <' },
    { x: 0.13, y: 0.07, t: '●{ const', cor: 'rosa' },
    { x: 0.2, y: 0.11, t: '●{REDIRECT', cor: 'lilas' },
    { x: -0.39, y: 0.12, t: '●', cor: 'rosa' },
    { x: -0.36, y: 0.17, t: '>' },
    { x: 0.33, y: 0.17, t: '>' },
    { x: -0.15, y: 0.21, t: '=' },
    { x: -0.29, y: 0.25, t: '434bU' },
    { x: 0.18, y: 0.24, t: '/' },
    { x: 0.21, y: 0.33, t: ':', cor: 'laranja' },
    { x: 0.25, y: 0.38, t: '●user,re' },
    { x: -0.21, y: 0.37, t: "('axios')", cor: 'pessego' },
    { x: -0.31, y: 0.41, t: 'userResponse = await' },
    { x: 0.37, y: 0.3, t: "app.get('/connect/github'," },
    { x: 0.32, y: 0.23, t: '=> { const { code }', cor: 'laranja' },
    { x: -0.33, y: 0.31, t: 'res.redirect(authUrl);', cor: 'laranja' },
    { x: 0.31, y: 0.13, t: 'REDIRECT_URI', realce: true },
];

// no celular o ato fica com menos peças (a tela pequena embolava a palavra): só as capas, os trechos de código e os
// sinais destas listas aparecem; os outros recebem fa-so-grande e somem abaixo de 768 px (fa.css). O código fica com os
// trechos curtos, que não cortam nas bordas, e o anel com um sinal sim, um não
const NO_CELULAR = {
    quadros: new Set([0, 1, 2, 3, 4, 6]),
    // os lugares das imagens no celular (fração da largura e da altura, a partir do meio): três acima da palavra e três
    // abaixo, em ziguezague, alternando os lados, sem uma encostar na outra; ao crescer elas se afastam do meio
    lugares: {
        0: [-0.23, -0.39],
        1: [0.22, -0.29],
        4: [-0.21, -0.19],
        2: [0.22, 0.19],
        3: [-0.22, 0.29],
        6: [0.21, 0.39],
    } as Record<number, [number, number]>,
    codigo: new Set([0, 2, 4, 5, 7, 11, 14, 19, 20, 23, 24, 29]),
    sinal: (i: number) => i % 2 === 0,
};
const soGrande = (fica: boolean) => (fica ? '' : ' fa-so-grande');

// as imagens: capas falsas (public/nova-escala/falsas, geradas para o teste), todas 1600 × 900 e do mesmo tamanho na
// tela (LARGURA_DO_QUADRO, fração da largura, deitada e em pé), em lugares fixos em volta do meio (x, y deitada; x, y
// em pé)
type Quadro = { img: string; razao: number; deitada: [number, number, number]; empe: [number, number, number] };
const LARGURA_DO_QUADRO = { deitada: 0.2, empe: 0.5 };
const RAZAO_DO_QUADRO = 900 / 1600;
const LUGARES: [number, number, number, number][] = [
    [-0.28, -0.27, -0.18, -0.33],
    [0.3, -0.28, 0.2, -0.17],
    [-0.3, 0.29, -0.22, 0.1],
    [0.31, 0.29, 0.2, 0.3],
    [-0.05, -0.36, 0.32, 0.05],
    [0.07, 0.35, -0.3, 0.38],
    [-0.46, 0.0, -0.33, -0.1],
    [0.46, 0.0, 0.34, -0.41],
];
const QUADROS: Quadro[] = LUGARES.map(([dx, dy, ex, ey], i) => ({
    img: `/nova-escala/falsas/capa-${i + 1}.jpg`,
    razao: RAZAO_DO_QUADRO,
    deitada: [dx, dy, LARGURA_DO_QUADRO.deitada],
    empe: [ex, ey, LARGURA_DO_QUADRO.empe],
}));

// as medidas: os sinais (barras, < > e o anel) têm um tanto da letra da palavra (SINAL), e o anel mais aberto
// (o maior rx, já aberto) cabe na tela; o código vai pelo tamanho da tela, bem menor que a palavra
const SINAL = 0.7;
const ABERTO = 5.2 * 1.25;
const letraDoCodigo = (w: number, h: number) => (w >= h ? Math.min(22, Math.max(12, w * 0.011)) : Math.max(9, w * 0.026));

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
// os sinais e o código nascem pelo desfoque, como as palavras do hero (na produção nasciam dos pontos): a peça sai de
// 8 px de desfoque e as letras dela acendem uma depois da outra (no código, da esquerda para a direita, com um pouco
// de sorteio), presas à rolagem
const NASCE = {
    desfoque: 8, // px, no começo
    espalha: 0.5, // no código, o quanto as letras se atrasam umas das outras
};

// uma peça que nasce: a caixa (que anda e leva o desfoque) e as letras dela, cada uma com o seu atraso
type Nascente = {
    caixa: HTMLElement;
    letras: { letra: HTMLElement; atraso: number }[];
    espalha: number;
    t: number;
};

function lerNascente(caixa: HTMLElement, espalha: number, semente: number): Nascente {
    const letras = [...caixa.querySelectorAll<HTMLElement>('[data-letra]')];
    return {
        caixa,
        letras: letras.map((letra, j) => ({
            letra,
            atraso: letras.length > 1 ? espalha * (0.75 * (j / (letras.length - 1)) + 0.25 * sorteio(j + semente * 31)) : 0,
        })),
        espalha,
        t: -1,
    };
}

// a peça no ponto t (0 a 1) do nascimento; o desfoque só fica ligado enquanto ela nasce
function nascer(n: Nascente, t: number) {
    if (t === n.t) return;
    n.t = t;
    for (const l of n.letras) l.letra.style.opacity = suave(limitar((t - l.atraso) / (1 - n.espalha))).toFixed(3);
    n.caixa.style.filter = t > 0 && t < 1 ? `blur(${(NASCE.desfoque * (1 - suave(t))).toFixed(2)}px)` : '';
}

// uma letra da peça (apagada até nascer)
function LetraDePonto({ letra }: { letra: string }) {
    return <span data-letra style={{ opacity: 0 }}>{letra}</span>;
}

// a palavra do "troca", que volta aos pontos e nasce deles igual às palavras do manifesto: t = 1 é a palavra pronta e
// 0, nada. Cada letra acende no seu tempo e sobe um pouco no caminho
const PALAVRA = { desfoque: 0.22, limiar: 0.4, duro: 60, nitido: 0.16, acende: 0.25, sobe: 0.45, chega: 0.4, espalha: 0.45 };

type PalavraDePontos = {
    el: HTMLElement;
    letras: HTMLElement[];
    atraso: number[];
    filtro: string;
    desfoque: SVGFEGaussianBlurElement | null;
    limiar: SVGFEColorMatrixElement | null;
    fonte: number;
    w: number;
    h: number;
    // um ponto dentro da haste de uma letra de haste reta no meio (o "l"), da borda de cima e da esquerda da palavra
    haste: { x: number; y: number };
    t: number;
    ligado: boolean;
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

function lerPalavraDePontos(el: HTMLElement, filtro: string, semente: number): PalavraDePontos {
    const f = document.getElementById(filtro);
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
        letras,
        haste: {
            x,
            y: base ? base.offsetTop - 0.3 * fonte : el.offsetHeight / 2,
        },
        atraso: letras.map((_, j) => sorteio(j + semente * 50) * PALAVRA.espalha),
        filtro,
        desfoque: f?.querySelector('feGaussianBlur') ?? null,
        limiar: f?.querySelector('feColorMatrix') ?? null,
        fonte,
        w: el.offsetWidth,
        h: el.offsetHeight,
        t: -1,
        ligado: el.style.filter !== '',
    };
}

// a palavra do "troca" na linguagem do hero: entra e sai pelo desfoque (opacidade e até 10 px de desfoque), preso à
// rolagem; t = 1 é a palavra pronta e 0, nada (os sinais e o código continuam nascendo dos pontos)
function formar(n: PalavraDePontos, t: number) {
    if (t === n.t) return;
    n.t = t;
    const q = suave(t);
    n.el.style.opacity = q.toFixed(3);
    n.el.style.filter = t > 0 && t < 1 ? `blur(${(10 * (1 - q)).toFixed(2)}px)` : '';
    n.el.style.visibility = t > 0 ? 'visible' : 'hidden';
}

// ---------------------------------------------------------------------------------------------------------------------
// o ato, desenhado em volta do meio da tela a partir do progresso dele (0 a 1)
type Grupo = 'barras' | 'chaves' | 'sinais' | 'codigo';

type Ato = {
    barras: Nascente[];
    chaves: Nascente[];
    sinais: Nascente[];
    codigo: Nascente[];
    quadros: HTMLElement[];
};

// os trechos do ato
const A = {
    abre: [0, 0.09], // as duas barras nascem rente à palavra e se afastam dela
    chaves: [0.08, 0.16], // os < > nascem junto da palavra
    anelSome: [0.38, 0.46], // o anel e os < > se apagam
    codigo: [0.32, 0.5], // os trechos de código saem, do mais perto ao mais longe
    codigoSome: [0.54, 0.64],
    codigoSomeNoCelular: [0.42, 0.5], // no celular o código já sumiu quando as imagens chegam
    quadros: [0.46, 0.6], // as imagens saem do centro, uma depois da outra
    cresce: [0.6, 0.82], // tudo cresce (a escala)
    sai: [0.8, 1], // e continua crescendo, cada vez mais rápido, até sair pelas bordas
} as const;

// g: a unidade dos sinais; gx e gy: a do anel, apertada dos lados para caber no celular e mais alta em tela em pé
type MedidasAto = { celular: boolean; w: number; h: number; g: number; gx: number; gy: number; codigo: number; quadros: { x: number; y: number; w: number; h: number }[] };

function medirAto(w: number, h: number, largura: number, fonte: number): MedidasAto {
    const deitada = w >= h;
    const g = fonte * SINAL;
    const celular = w < 768;
    return {
        celular,
        w,
        h,
        g,
        gx: Math.max(0.3 * g, Math.min(g, (w / 2 - 0.6 * g - largura / 2) / ABERTO)),
        gy: deitada ? g : 1.5 * g,
        codigo: letraDoCodigo(w, h),
        quadros: QUADROS.map((q, i) => {
            const [fx0, fy0, fw0] = deitada ? q.deitada : q.empe;
            // no celular as imagens ficam menores e num arranjo próprio, longe da faixa da palavra (NO_CELULAR.lugares)
            const lugar = celular ? NO_CELULAR.lugares[i] : undefined;
            const [fx, fy] = lugar ?? [fx0, fy0];
            const fw = celular ? fw0 * 0.55 : fw0;
            return { x: fx * w, y: fy * h, w: fw * w, h: fw * w * q.razao };
        }),
    };
}

// acha as peças na camada (os tamanhos já valem: vêm das variáveis da camada) e dá às imagens o tamanho delas
function montarAto(camada: HTMLElement, prefixo: string, m: MedidasAto): Ato {
    const grupo = (nome: Grupo, espalha: number) =>
        [...camada.querySelectorAll<HTMLElement>(`[data-grupo="${nome}"]`)].map((caixa, i) => lerNascente(caixa, espalha, i));
    const quadros = [...camada.querySelectorAll<HTMLElement>('[data-quadro]')];
    quadros.forEach((q, i) => {
        q.style.width = `${m.quadros[i].w.toFixed(1)}px`;
        q.style.height = `${m.quadros[i].h.toFixed(1)}px`;
    });
    return {
        barras: grupo('barras', 0),
        chaves: grupo('chaves', 0),
        sinais: grupo('sinais', 0),
        codigo: grupo('codigo', NASCE.espalha),
        quadros,
    };
}

const mover = (el: HTMLElement, x: number, y: number, e = 1) => {
    el.style.transform = `translate(calc(${x.toFixed(1)}px - 50%), calc(${y.toFixed(1)}px - 50%))${e === 1 ? '' : ` scale(${e.toFixed(3)})`}`;
};

// meia: a meia largura da palavra agora (ela muda de tamanho); e: o quanto os sinais crescem com ela
function desenharAto(ato: Ato, a: number, m: MedidasAto, meia: number, e: number) {
    const g = m.g * e;
    const gx = m.gx * e;
    const gy = m.gy * e;
    const anelSome = String(1 - trecho(a, A.anelSome));

    // as duas barras: nascem rente à palavra, se afastam dela e depois vão para o anel
    const abre = trecho(a, A.abre);
    const vaiAoAnel = suave(trecho(a, [0.1, 0.22]));
    ato.barras.forEach((n, i) => {
        const lado = i === 0 ? -1 : 1;
        mover(n.caixa, misturar(lado * (meia + (0.25 + 1.1 * chega(abre)) * g), lado * (meia + 1.7 * g), vaiAoAnel), misturar(0, lado * -1.45 * g, vaiAoAnel), e);
        n.caixa.style.opacity = anelSome;
        nascer(n, abre);
    });
    // os < >: nascem junto da palavra, em tinta, e ganham cor (verde-água e turquesa)
    const corChaves = trecho(a, [0.2, 0.24]) > 0.5;
    ato.chaves.forEach((n, i) => {
        const lado = i === 0 ? -1 : 1;
        mover(n.caixa, lado * (meia + 0.7 * g), 0, e);
        n.caixa.style.opacity = anelSome;
        n.caixa.style.color = corChaves ? (i === 0 ? COR.rosa : COR.laranja) : COR.tinta;
        nascer(n, trecho(a, A.chaves));
    });
    // o anel: cada sinal nasce no seu momento, chega ao lugar e vai se abrindo devagar
    ato.sinais.forEach((n, i) => {
        const d = SINAIS[i];
        const t = trecho(a, [d.sai, d.sai + 0.07]);
        const r = (0.6 + 0.4 * chega(t)) * (1 + 0.25 * trecho(a, [d.sai, 0.42]));
        mover(n.caixa, Math.cos(d.angulo) * (meia + d.rx * gx) * r, Math.sin(d.angulo) * d.ry * gy * r, e);
        n.caixa.style.opacity = anelSome;
        nascer(n, t);
    });
    // o código: do mais perto ao mais longe, cada trecho nasce perto do meio e vai para o seu lugar; o realce ganha o
    // fundo turquesa quando as letras já estão quase prontas
    const codigoSome = 1 - trecho(a, m.celular ? A.codigoSomeNoCelular : A.codigoSome);
    ato.codigo.forEach((n, i) => {
        const d = CODIGO[i];
        const sai = misturar(A.codigo[0], A.codigo[1] - 0.08, limitar(Math.hypot(d.x, d.y) / 0.6));
        const t = trecho(a, [sai, sai + 0.09]);
        const k = 0.35 + 0.65 * chega(t);
        mover(n.caixa, d.x * m.w * k, d.y * m.h * k);
        n.caixa.style.opacity = String(codigoSome * (d.cor === 'apagada' ? 0.5 : 1));
        if (d.realce) n.caixa.style.backgroundColor = `rgba(78, 201, 172, ${trecho(t, [0.75, 1]).toFixed(3)})`;
        nascer(n, t);
    });
    // as imagens: saem do centro pequenas, chegam ao lugar e crescem todas juntas; no fim continuam crescendo e são
    // empurradas para fora, cada uma na direção dela e cada vez mais rápido, até todas saírem da tela (o empurrão passa
    // da diagonal, então até a que está perto do meio sai)
    const s = 1 + 0.9 * suave(trecho(a, A.cresce));
    const fora = Math.pow(trecho(a, A.sai), 2);
    const empurra = fora * 0.8 * (m.w + m.h);
    ato.quadros.forEach((q, i) => {
        const d = m.quadros[i];
        const sai = misturar(A.quadros[0], A.quadros[1] - 0.08, i / (QUADROS.length - 1));
        const k = chega(trecho(a, [sai, sai + 0.08]));
        const r = Math.hypot(d.x, d.y) || 1;
        const x = d.x * k * s + (d.x / r) * empurra;
        const y = d.y * k * s + (d.y / r) * empurra;
        q.style.transform = `translate(calc(${x.toFixed(1)}px - 50%), calc(${y.toFixed(1)}px - 50%)) scale(${((0.2 + 0.8 * k) * s * (1 + 1.5 * fora)).toFixed(3)})`;
        q.style.opacity = String(trecho(a, [sai, sai + 0.02]) * (1 - trecho(a, [0.96, 1])));
    });
}

function AtoElementos() {
    return (
        <>
            {QUADROS.map((q, i) => (
                <div key={i} data-quadro className={`fa-ato-quadro absolute left-1/2 top-1/2 overflow-hidden rounded-[3px]${soGrande(NO_CELULAR.quadros.has(i))}`} style={{ width: 200, height: 200 * q.razao, opacity: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.img} alt="" className="h-full w-full object-cover" draggable={false} />
                </div>
            ))}
            {/* o código na serifa itálica da tela, um quarto maior que a mono era (a serifa tem o olho menor) */}
            <div style={{ fontFamily: 'var(--ff-serifa), Georgia, serif', fontStyle: 'italic', fontSize: 'calc(var(--codigo) * 1.25px)', fontWeight: 400, letterSpacing: '0', color: COR.codigo, lineHeight: 1 }}>
                {CODIGO.map((c, i) => (
                    <span
                        key={i}
                        data-grupo="codigo"
                        className={`absolute left-1/2 top-1/2 whitespace-nowrap${soGrande(NO_CELULAR.codigo.has(i))}`}
                        style={{ color: c.realce ? '#051236' : c.cor && c.cor !== 'apagada' ? COR[c.cor] : undefined, padding: c.realce ? '0.1em 0.3em' : undefined }}
                    >
                        {[...c.t].map((l, j) => (l === ' ' ? ' ' : <LetraDePonto key={j} letra={l} />))}
                    </span>
                ))}
            </div>
            <div style={{ fontSize: 'calc(var(--g) * 1px)', fontWeight: 700, letterSpacing: '0', lineHeight: 1, color: COR.tinta }}>
                {SINAIS.map((s, i) => (
                    <span key={i} data-grupo="sinais" className={`absolute left-1/2 top-1/2${soGrande(NO_CELULAR.sinal(i))}`} style={{ color: COR[s.cor] }}>
                        <LetraDePonto letra={s.c} />
                    </span>
                ))}
                {['/', '/'].map((c, i) => (
                    <span key={`b${i}`} data-grupo="barras" className="absolute left-1/2 top-1/2">
                        <LetraDePonto letra={c} />
                    </span>
                ))}
                {['<', '>'].map((c, i) => (
                    <span key={`c${i}`} data-grupo="chaves" className="absolute left-1/2 top-1/2">
                        <LetraDePonto letra={c} />
                    </span>
                ))}
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------------------------------------------------
// a palavra no ato: troca e cresce. Ela vira, uma a uma, os verbos (saindo e entrando pelo desfoque, como as palavras
// do hero) e vai crescendo com a rolagem, cada uma até no máximo caber na tela. As trocas ficam entre o começo do anel
// e o começo do crescimento das imagens, uma janela curta cada: a palavra sai pelo desfoque nos primeiros 60% dela e a
// próxima nasce dos 40% em diante, então as duas se cruzam e a tela não fica vazia. Devolve [começo, fim do sai, começo
// do entra, fim]
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
type MedidasJanelas = { p: Palavra; ato: MedidasAto; desliza: boolean; cabe: number; palavras: PalavraDePontos[]; mergulho: number };

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
    const prefixo = `escala-${useId().replace(/[^\w-]/g, '')}`;
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
            const m = medirAto(w, h, p.w, parseFloat(getComputedStyle(spans[0]).fontSize) || p.h);
            // os tamanhos vão direto nas variáveis da camada, para as peças já terem o tamanho certo quando são lidas
            el.style.setProperty('--g', m.g.toFixed(2));
            el.style.setProperty('--codigo', m.codigo.toFixed(2));
            ato = montarAto(el, prefixo, m);
            // a cópia vai em cima da palavra; as outras, centradas nela, na mesma altura
            const palavras = spans.map((s, i) => lerPalavraDePontos(s, `${prefixo}-palavra-${i}`, i));
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

        const desenhar = (v: number) => {
            const m = medidas;
            if (!m || !ato) return;
            const a = trecho(v, JANELAS.ato);
            const k = m.desliza ? suave(trecho(v, JANELAS.centra)) : 0;
            const dx = (m.ato.w / 2 - m.p.w / 2 - m.p.x) * k;
            const dy = (m.ato.h / 2 - m.p.h / 2 - m.p.y) * k;
            const e = crescer(a);
            const escala = (q: PalavraDePontos) => Math.min(e, m.cabe / q.w);
            const n = m.palavras.length - 1;
            const ultima = m.palavras[n];
            const mergulha = trecho(a, LETRA.mergulha);

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
            desenharAto(ato, a, m.ato, meia, e);
        };

        let antes = -1;
        let medido = false;
        let versao = -1;
        let vAntes = NaN;
        const desligar = aCadaQuadro(() => {
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
            if (v === vAntes) return;
            vAntes = v;
            desenhar(v);
        });
        return () => {
            desligar();
            voltar();
        };
    }, [progresso, texto, palavra, copiaTexto, prefixo, chaveNovas, corDoFim, tintaDoFim, fundo, tinta]);

    return (
        <div ref={camada} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ ['--g' as string]: 40, ['--codigo' as string]: 14 }}>
            <AtoElementos />
            <svg aria-hidden width="0" height="0" className="absolute">
                {Array.from({ length: 1 + novas.length }, (_, i) => (
                    <filter key={i} id={`${prefixo}-palavra-${i}`} x="-20%" y="-60%" width="140%" height="220%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation="0" />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
                    </filter>
                ))}
            </svg>
            {/* as palavras na tinta do ato, sem herdar a da página */}
            <div ref={soltas} style={{ ...estilo, color: tinta }}>
                <PalavraSolta texto={copiaTexto} visivel />
                {novas.map((t, i) => <PalavraSolta key={`${i}-${t}`} texto={t} visivel={false} />)}
            </div>
        </div>
    );
}
