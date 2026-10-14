'use client';

// a expansão que continua o manifesto da home nova, fiel ao anúncio de referência (Base44,
// "Build apps that scale"). A frase deixa a palavra da escala no meio exato da linha do meio, então, quando ela se
// monta, a palavra já está no meio da tela. Daí a rolagem segue presa na mesma tela, o resto da frase se apaga (quem
// apaga é o manifesto, no trecho APAGA_FRASE) e a palavra fica. Em volta dela vem o ato do anúncio: barras que se
// abrem dos lados, os < > e um anel de barras e asteriscos (alguns em laranja, rosa e lilás), trechos de código que se
// espalham pela tela e imagens que surgem do centro, crescem e saem pelas bordas.
// A palavra troca e cresce com a rolagem: vira, um a um, os verbos que completam a frase (AtoContexto), voltando aos
// pontos e nascendo deles como as palavras do manifesto, e cresce até caber na tela. No fim a tela passa para o claro
// (FUNDO_CLARO) e a página segue nele: a última palavra cresce em volta da haste de uma letra dela (o "l"), que vem
// para o meio da tela e a cobre com o claro. É texto, então o navegador redesenha as letras no tamanho novo e a borda
// fica nítida em qualquer tamanho.
// Os sinais e o código também nascem dos pontos: cada letra começa como um ponto solto, que incha, se junta aos
// vizinhos e vira a letra.
// As imagens são mockups (prévias de projetos antigos e degradês em public/nova-escala), só para ver o efeito.
// Tudo depende só do progresso, então a rolagem para trás desfaz igual
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import type { ContinuacaoProps } from '../../_comum/Manifesto';
import { Palco, PRANCHA } from './Palco';
import DemoSaas from './demos/DemoSaas';
import DemoBranding from './demos/DemoBranding';

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const trecho = (v: number, [a, b]: readonly number[]) => limitar((v - a) / (b - a));
const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const chega = (t: number) => 1 - Math.pow(1 - t, 3);
const misturar = (a: number, b: number, t: number) => a + (b - a) * t;
const sorteio = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
};

export const APAGA_FRASE = [0, 0.08] as const;

// as palavras que a da frase vira no ato, na ordem dele (o anel, o código, as imagens e o crescimento)
export const AtoContexto = createContext<{ palavras: string[] }>({ palavras: [] });
// o fundo do tema claro, que cobre a tela no fim do ato e em que a página segue
export const FUNDO_CLARO = '#E4E4E4';

// as cores do anúncio, no fundo escuro
const COR = {
    laranja: '#F26B3A',
    pessego: '#F4A27C',
    rosa: '#E58AD8',
    lilas: '#B49CF0',
    tinta: '#F2F2F2',
    apagada: 'rgba(242,242,242,0.4)',
    codigo: 'rgba(242,242,242,0.8)',
};
type Cor = keyof typeof COR;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// o anel em volta da palavra: barras, < > e asteriscos, numa elipse mais larga que alta (como no anúncio). As medidas
// vão na unidade dos sinais
const SINAIS = Array.from({ length: 18 }, (_, i) => {
    const r = sorteio(i + 40);
    const c = r < 0.62 ? '/' : r < 0.8 ? (sorteio(i + 3) < 0.5 ? '<' : '>') : '*';
    const tom = sorteio(i + 9);
    const cor: Cor = tom < 0.55 ? 'tinta' : tom < 0.68 ? 'laranja' : tom < 0.78 ? 'pessego' : tom < 0.88 ? 'lilas' : tom < 0.94 ? 'rosa' : 'apagada';
    const angulo = (i / 18) * Math.PI * 2 + (sorteio(i + 17) - 0.5) * 0.5;
    return { c, cor, angulo, rx: 2.6 + 2.6 * sorteio(i + 23), ry: 1.4 + 1.7 * sorteio(i + 29), sai: 0.1 + 0.24 * (i / 17) };
});

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

// as imagens (mockups) e duas demonstrações dos serviços: lugar e largura em fração da tela, deitada e em pé
type Quadro = { img?: string; demo?: 'saas' | 'branding'; razao: number; deitada: [number, number, number]; empe: [number, number, number] };
const QUADROS: Quadro[] = [
    { img: 'filmes', razao: 541 / 900, deitada: [-0.28, -0.27, 0.3], empe: [-0.18, -0.33, 0.6] },
    { img: 'roupa', razao: 495 / 900, deitada: [0.3, -0.28, 0.28], empe: [0.2, -0.17, 0.55] },
    { img: 'degrade-laranja', razao: 600 / 900, deitada: [-0.3, 0.29, 0.24], empe: [-0.22, 0.1, 0.48] },
    { img: 'academia', razao: 474 / 900, deitada: [0.31, 0.29, 0.27], empe: [0.2, 0.3, 0.58] },
    { img: 'cartazes', razao: 700 / 500, deitada: [-0.05, -0.36, 0.09], empe: [0.32, 0.05, 0.26] },
    { img: 'degrade-lilas', razao: 800 / 600, deitada: [0.07, 0.35, 0.1], empe: [-0.3, 0.38, 0.28] },
    { demo: 'saas', razao: PRANCHA.h / PRANCHA.w, deitada: [-0.46, 0.0, 0.11], empe: [-0.33, -0.1, 0.3] },
    { demo: 'branding', razao: PRANCHA.h / PRANCHA.w, deitada: [0.46, 0.0, 0.11], empe: [0.34, -0.41, 0.28] },
];

// as medidas: os sinais (barras, < > e o anel) têm um tanto da letra da palavra, como no anúncio, e o anel mais aberto
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
// transform só entra quando ela anda ou muda de tamanho, em volta do meio dela
function colocar(el: HTMLElement, x: number, y: number, dx: number, dy: number, e: number) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transformOrigin = '50% 50%';
    el.style.transform = dx === 0 && dy === 0 && e === 1 ? 'none' : `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${e.toFixed(4)})`;
}

// ---------------------------------------------------------------------------------------------------------------------
// os pontos nos sinais e no código: o efeito da entrada do manifesto. Cada letra nasce como um ponto da cor dela, que
// incha; depois a letra acende no lugar dele, e ele encolhe. Um filtro SVG desfoca e corta o desfoque num limiar (o que
// passa vira mancha de borda nítida), então o ponto e a letra se fundem, e os vizinhos se juntam quando as letras tomam
// o lugar dos pontos. No fim o desfoque some e o limiar afrouxa, para a letra chegar com a borda normal
const PONTOS = {
    diametro: 0.4, // em
    desfoque: 0.12, // em, no começo (cai devagar no início, para o ponto e a letra se fundirem)
    limiar: 0.4,
    duro: 30, // inclinação do limiar: alto = borda nítida
    nitido: 0.25, // trecho final em que o limiar amolece
    incha: 0.3, // até aqui do nascimento de cada letra o ponto só incha
    espalha: 0.5, // no código, o quanto as letras se atrasam umas das outras (da esquerda para a direita)
};

const matrizDoLimiar = (s: number, duro: number, limiar: number) =>
    `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${(1 + (duro - 1) * s).toFixed(2)} ${(s * (0.5 - duro * limiar)).toFixed(2)}`;

// uma peça que nasce dos pontos: a caixa (que anda e leva o filtro) e as letras dela, cada uma com o seu ponto
type Nascente = {
    caixa: HTMLElement;
    letras: { letra: HTMLElement; ponto: HTMLElement; atraso: number }[];
    filtro: string;
    desfoque: SVGFEGaussianBlurElement | null;
    limiar: SVGFEColorMatrixElement | null;
    fonte: number;
    espalha: number;
    t: number;
    ligado: boolean;
};

function lerNascente(caixa: HTMLElement, filtro: string, espalha: number, semente: number): Nascente {
    const f = document.getElementById(filtro);
    const letras = [...caixa.querySelectorAll<HTMLElement>('[data-letra]')];
    return {
        caixa,
        // da esquerda para a direita, com um pouco de sorteio
        letras: letras.map((letra, j) => ({
            letra,
            ponto: letra.nextElementSibling as HTMLElement,
            atraso: letras.length > 1 ? espalha * (0.75 * (j / (letras.length - 1)) + 0.25 * sorteio(j + semente * 31)) : 0,
        })),
        filtro,
        desfoque: f?.querySelector('feGaussianBlur') ?? null,
        limiar: f?.querySelector('feColorMatrix') ?? null,
        fonte: parseFloat(getComputedStyle(caixa).fontSize) || 16,
        espalha,
        t: -1,
        ligado: caixa.style.filter !== '',
    };
}

// a peça no ponto t (0 a 1) do nascimento. O filtro só fica ligado enquanto ela nasce: desfoque em muita coisa pesa
function nascer(n: Nascente, t: number) {
    if (t === n.t) return;
    n.t = t;
    for (const l of n.letras) {
        const q = limitar((t - l.atraso) / (1 - n.espalha));
        // a letra acende enquanto o ponto ainda está cheio, e ele só encolhe depois: os dois se fundem no filtro
        const incha = chega(limitar(q / PONTOS.incha));
        const encolhe = suave(trecho(q, [0.45, 0.95]));
        l.ponto.style.transform = `translate(-50%, -50%) scale(${(incha * (1 - encolhe)).toFixed(3)})`;
        l.letra.style.opacity = suave(trecho(q, [0.25, 0.75])).toFixed(3);
    }
    const viva = t > 0 && t < 1;
    if (viva && n.desfoque && n.limiar) {
        n.desfoque.setAttribute('stdDeviation', (n.fonte * PONTOS.desfoque * (1 - t * t)).toFixed(2));
        n.limiar.setAttribute('values', matrizDoLimiar(limitar((1 - t) / PONTOS.nitido), PONTOS.duro, PONTOS.limiar));
    }
    if (viva !== n.ligado) {
        n.caixa.style.filter = viva ? `url(#${n.filtro})` : '';
        n.ligado = viva;
    }
}

// a letra com o seu ponto no meio
function LetraDePonto({ letra }: { letra: string }) {
    return (
        <span className="relative inline-block">
            <span data-letra style={{ opacity: 0 }}>{letra}</span>
            <span
                data-ponto
                className="absolute left-1/2 top-[55%] rounded-full bg-current"
                style={{ width: `${PONTOS.diametro}em`, height: `${PONTOS.diametro}em`, transform: 'translate(-50%, -50%) scale(0)' }}
            />
        </span>
    );
}

// a palavra do "troca", que volta aos pontos e nasce deles igual às palavras do manifesto (as letras grandes e pesadas
// viram pontos sozinhas no desfoque com limiar): t = 1 é a palavra pronta e 0, nada. Cada letra acende no seu tempo e
// sobe um pouco no caminho
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

// as letras com a haste reta no meio dela: o ponto do fim pela letra fica no meio da haste
const HASTES = ['l', 'i', 'I', 'ı'];

function lerPalavraDePontos(el: HTMLElement, filtro: string, semente: number): PalavraDePontos {
    const f = document.getElementById(filtro);
    const letras = [...el.querySelectorAll<HTMLElement>('[data-letra]')];
    const fonte = parseFloat(getComputedStyle(el).fontSize) || 80;
    const base = el.querySelector<HTMLElement>('[data-base]');
    const comHaste = letras.find(l => HASTES.includes(l.textContent ?? ''));
    return {
        el,
        letras,
        haste: {
            x: comHaste ? comHaste.offsetLeft + comHaste.offsetWidth / 2 : el.offsetWidth / 2,
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

function formar(n: PalavraDePontos, t: number) {
    if (t === n.t) return;
    n.t = t;
    const tl = t >= 1 ? null : 0.2 + 0.8 * t;
    n.letras.forEach((l, j) => {
        const o = tl === null ? 1 : limitar((tl - n.atraso[j]) / PALAVRA.acende);
        const y = tl === null ? 0 : (1 - chega(limitar((tl - n.atraso[j]) / PALAVRA.chega))) * PALAVRA.sobe * n.fonte;
        l.style.opacity = o.toFixed(3);
        l.style.top = `${y.toFixed(2)}px`;
    });
    const viva = t > 0 && t < 1;
    if (viva && n.desfoque && n.limiar) {
        n.desfoque.setAttribute('stdDeviation', (n.fonte * PALAVRA.desfoque * (1 - (0.2 + 0.8 * t))).toFixed(2));
        n.limiar.setAttribute('values', matrizDoLimiar(limitar((1 - t) / PALAVRA.nitido), PALAVRA.duro, PALAVRA.limiar));
    }
    if (viva !== n.ligado) {
        n.el.style.filter = viva ? `url(#${n.filtro})` : '';
        n.ligado = viva;
    }
    n.el.style.visibility = t > 0 ? 'visible' : 'hidden';
}


// ---------------------------------------------------------------------------------------------------------------------
// o ato do anúncio, desenhado em volta do meio da tela a partir do progresso dele (0 a 1)
const GRUPOS = { barras: 2, chaves: 2, sinais: SINAIS.length, codigo: CODIGO.length } as const;
type Grupo = keyof typeof GRUPOS;

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
    quadros: [0.46, 0.6], // as imagens saem do centro, uma depois da outra
    cresce: [0.6, 0.82], // tudo cresce (a escala)
    sai: [0.8, 1], // e continua crescendo, cada vez mais rápido, até sair pelas bordas
} as const;

// g: a unidade dos sinais; gx e gy: a do anel, apertada dos lados para caber no celular e mais alta em tela em pé
type MedidasAto = { w: number; h: number; g: number; gx: number; gy: number; codigo: number; quadros: { x: number; y: number; w: number; h: number }[] };

function medirAto(w: number, h: number, largura: number, fonte: number): MedidasAto {
    const deitada = w >= h;
    const g = fonte * SINAL;
    return {
        w,
        h,
        g,
        gx: Math.max(0.3 * g, Math.min(g, (w / 2 - 0.6 * g - largura / 2) / ABERTO)),
        gy: deitada ? g : 1.5 * g,
        codigo: letraDoCodigo(w, h),
        quadros: QUADROS.map(q => {
            const [fx, fy, fw] = deitada ? q.deitada : q.empe;
            return { x: fx * w, y: fy * h, w: fw * w, h: fw * w * q.razao };
        }),
    };
}

// acha as peças na camada (os tamanhos já valem: vêm das variáveis da camada) e dá às imagens o tamanho delas
function montarAto(camada: HTMLElement, prefixo: string, m: MedidasAto): Ato {
    const grupo = (nome: Grupo, espalha: number) =>
        [...camada.querySelectorAll<HTMLElement>(`[data-grupo="${nome}"]`)].map((caixa, i) => lerNascente(caixa, `${prefixo}-${nome}-${i}`, espalha, i));
    const quadros = [...camada.querySelectorAll<HTMLElement>('[data-quadro]')];
    quadros.forEach((q, i) => {
        q.style.width = `${m.quadros[i].w.toFixed(1)}px`;
        q.style.height = `${m.quadros[i].h.toFixed(1)}px`;
    });
    return {
        barras: grupo('barras', 0),
        chaves: grupo('chaves', 0),
        sinais: grupo('sinais', 0),
        codigo: grupo('codigo', PONTOS.espalha),
        quadros,
    };
}

const mover = (el: HTMLElement, x: number, y: number, e = 1) => {
    el.style.transform = `translate(calc(${x.toFixed(1)}px - 50%), calc(${y.toFixed(1)}px - 50%))${e === 1 ? '' : ` scale(${e.toFixed(3)})`}`;
};

// meia: a meia largura da palavra agora (ela muda de tamanho e de peso); e: o quanto os sinais crescem com ela
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
    // os < >: nascem junto da palavra, em tinta, e ganham cor (rosa e laranja)
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
    // fundo quando as letras já estão quase prontas
    const codigoSome = 1 - trecho(a, A.codigoSome);
    ato.codigo.forEach((n, i) => {
        const d = CODIGO[i];
        const sai = misturar(A.codigo[0], A.codigo[1] - 0.08, limitar(Math.hypot(d.x, d.y) / 0.6));
        const t = trecho(a, [sai, sai + 0.09]);
        const k = 0.35 + 0.65 * chega(t);
        mover(n.caixa, d.x * m.w * k, d.y * m.h * k);
        n.caixa.style.opacity = String(codigoSome * (d.cor === 'apagada' ? 0.5 : 1));
        if (d.realce) n.caixa.style.backgroundColor = `rgba(242, 107, 58, ${trecho(t, [0.75, 1]).toFixed(3)})`;
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

function AtoElementos({ prefixo, ativas }: { prefixo: string; ativas: boolean }) {
    return (
        <>
            <svg aria-hidden width="0" height="0" className="absolute">
                {(Object.keys(GRUPOS) as Grupo[]).flatMap(nome =>
                    Array.from({ length: GRUPOS[nome] }, (_, i) => (
                        <filter key={`${nome}-${i}`} id={`${prefixo}-${nome}-${i}`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                            <feGaussianBlur stdDeviation="0" />
                            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
                        </filter>
                    )),
                )}
            </svg>
            {QUADROS.map((q, i) => (
                <div key={i} data-quadro className="absolute left-1/2 top-1/2 overflow-hidden rounded-[3px]" style={{ width: 200, height: 200 * q.razao, opacity: 0 }}>
                    {q.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/nova-escala/${q.img}.jpg`} alt="" className="h-full w-full object-cover" draggable={false} />
                    ) : (
                        <Palco className="rounded-[3px]">{q.demo === 'saas' ? <DemoSaas ativo={ativas} /> : <DemoBranding ativo={ativas} />}</Palco>
                    )}
                </div>
            ))}
            <div style={{ fontFamily: MONO, fontSize: 'calc(var(--codigo) * 1px)', color: COR.codigo, lineHeight: 1 }}>
                {CODIGO.map((c, i) => (
                    <span
                        key={i}
                        data-grupo="codigo"
                        className="absolute left-1/2 top-1/2 whitespace-nowrap"
                        style={{ color: c.realce ? '#fff' : c.cor && c.cor !== 'apagada' ? COR[c.cor] : undefined, padding: c.realce ? '0.1em 0.3em' : undefined }}
                    >
                        {[...c.t].map((l, j) => (l === ' ' ? ' ' : <LetraDePonto key={j} letra={l} />))}
                    </span>
                ))}
            </div>
            <div style={{ fontSize: 'calc(var(--g) * 1px)', fontWeight: 700, lineHeight: 1, color: COR.tinta }}>
                {SINAIS.map((s, i) => (
                    <span key={i} data-grupo="sinais" className="absolute left-1/2 top-1/2" style={{ color: COR[s.cor] }}>
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

// liga o desenho ao progresso e à mudança de tamanho da tela. A frase só fica pronta quando a continuação começa, então
// mede ali (e de novo a cada mudança de tamanho)
function useDesenho(progresso: ContinuacaoProps['progresso'], medir: () => boolean, desenhar: (v: number) => void, deps: unknown[]) {
    useEffect(() => {
        let antes = -1;
        let medido = false;
        const quadro = (v: number) => {
            if (v > 0 && (antes <= 0 || !medido)) medido = medir();
            antes = v;
            desenhar(v);
        };
        const aoMudar = () => {
            medido = medir();
            desenhar(progresso.get());
        };
        medido = medir();
        desenhar(progresso.get());
        window.addEventListener('resize', aoMudar);
        const parar = progresso.on('change', quadro);
        return () => {
            parar();
            window.removeEventListener('resize', aoMudar);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progresso, ...deps]);
}

// ---------------------------------------------------------------------------------------------------------------------
// a palavra no ato: troca e cresce. Ela vira, uma a uma, as palavras das características (voltando aos pontos e
// nascendo deles, como no manifesto) e vai crescendo com a rolagem, cada uma até no máximo caber na tela. As trocas
// ficam entre o começo do anel e o começo do crescimento das imagens, uma janela curta cada: a palavra volta aos
// pontos nos primeiros 60% dela e a próxima nasce dos 40% em diante, então as duas se cruzam e a tela não fica vazia.
// Devolve [começo, fim do sai, começo do entra, fim]
const TROCA = { de: 0.15, ate: 0.5, janela: 0.045 };
const janelaDaTroca = (j: number, n: number) => {
    const ini = n > 1 ? TROCA.de + ((TROCA.ate - TROCA.de) * j) / (n - 1) : TROCA.de;
    return [ini, ini + 0.6 * TROCA.janela, ini + 0.4 * TROCA.janela, ini + TROCA.janela] as const;
};
const CRESCE = { ate: 2, trecho: [0.04, 0.8], cabe: 0.8 } as const;
const crescer = (a: number) => 1 + (CRESCE.ate - 1) * suave(trecho(a, CRESCE.trecho));

// o fim pela letra: a última palavra cresce em volta da haste, cada vez mais rápido (mergulha), e a haste vem para o
// meio no primeiro terço, até cobrir a tela. Para saber o quanto crescer, a haste conta por baixo: largura (em em) e o
// dobro da distância do ponto à linha de base (alto, em em)
const LETRA = { mergulha: [0.8, 0.97], largura: 0.12, alto: 0.6 } as const;

// janelas: o ato no fundo escuro, em volta da palavra da frase. Os trechos do progresso da continuação: a palavra
// desliza até o meio se a tela tiver quebrado a frase de outro jeito (normalmente ela já está lá); e o ato
const JANELAS = { centra: [0.02, 0.1], ato: [0.06, 1] } as const;

// mergulho: a escala em que a haste da última palavra cobre a tela
type MedidasJanelas = { p: Palavra; ato: MedidasAto; desliza: boolean; cabe: number; palavras: PalavraDePontos[]; mergulho: number };

export function ExpansaoJanelas({ progresso, texto, palavra, tamanho, estilo }: ContinuacaoProps) {
    const { palavras: novas } = useContext(AtoContexto);
    const chaveNovas = novas.join('|');
    const camada = useRef<HTMLDivElement>(null);
    const soltas = useRef<HTMLDivElement>(null);
    const ato = useRef<Ato | null>(null);
    const medidas = useRef<MedidasJanelas | null>(null);
    const ligadas = useRef(false);
    const prefixo = `escala-${useId().replace(/[^\w-]/g, '')}`;
    const [copiaTexto, setCopiaTexto] = useState('');
    const [ativas, setAtivas] = useState(false);

    useDesenho(progresso, () => {
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
        ato.current = montarAto(el, prefixo, m);
        // a cópia vai em cima da palavra; as outras, centradas nela, na mesma altura
        const palavras = spans.map((s, i) => lerPalavraDePontos(s, `${prefixo}-palavra-${i}`, i));
        const fonte = palavras[palavras.length - 1].fonte;
        medidas.current = {
            p,
            ato: m,
            desliza: Math.hypot(w / 2 - (p.x + p.w / 2), h / 2 - (p.y + p.h / 2)) > 1,
            cabe: CRESCE.cabe * w,
            palavras,
            mergulho: 1.25 * Math.max(w / (LETRA.largura * fonte), h / (LETRA.alto * fonte)),
        };
        return true;
    }, v => {
        const m = medidas.current;
        if (!m || !ato.current) return;
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
            // quanto ela nasceu: entra na troca anterior e sai na seguinte (a primeira já começa pronta; a última sai
            // pelo fim)
            const antes = janelaDaTroca(j - 1, n);
            const depois = janelaDaTroca(j, n);
            const entra = j === 0 ? 1 : trecho(a, [antes[2], antes[3]]);
            const sai = j < n ? trecho(a, [depois[0], depois[1]]) : 0;
            formar(q, Math.min(entra, 1 - sai));
            const x = j === 0 ? m.p.x : m.p.x + (m.p.w - q.w) / 2;
            let s = escala(q);
            let ex = 0;
            let ey = 0;
            if (q === ultima && mergulha > 0) {
                // a palavra cresce em volta do meio dela (que está no meio da tela), e o deslocamento leva a haste de
                // onde ela estava para o meio enquanto tudo cresce; a cor vai do branco ao claro do fundo
                const base = s;
                s = base * Math.pow(m.mergulho / base, Math.pow(mergulha, 3));
                const hx = q.haste.x - q.w / 2;
                const hy = q.haste.y - q.h / 2;
                const vem = suave(Math.min(1, mergulha * 3));
                ex = misturar(base * hx, 0, vem) - s * hx;
                ey = misturar(base * hy, 0, vem) - s * hy;
                q.el.style.color = `color-mix(in srgb, ${FUNDO_CLARO} ${(suave(trecho(mergulha, [0.3, 0.9])) * 100).toFixed(1)}%, #ffffff)`;
            } else if (q === ultima) q.el.style.color = '';
            colocar(q.el, x, m.p.y, dx + ex, dy + ey, s);
            q.el.style.opacity = v <= 0 ? '0' : '1';
            // coberta a tela, a palavra some (e formar() a repõe se a rolagem voltar)
            if (q === ultima && mergulha >= 1) {
                q.el.style.visibility = 'hidden';
                q.t = -1;
            }
        });
        // coberta a tela, o claro fica no fundo da camada
        const camadaEl = camada.current;
        if (camadaEl) camadaEl.style.background = mergulha >= 1 ? FUNDO_CLARO : '';

        // a meia largura que os < > e as barras seguem: a da palavra da vez (já no tamanho dela) e, numa troca, no meio
        // do caminho entre as duas
        const largura = (j: number) => m.palavras[j].w * escala(m.palavras[j]);
        let meia = largura(0) / 2;
        for (let j = 0; j < n; j++) {
            const [ini, , , fim] = janelaDaTroca(j, n);
            if (a >= ini) meia = misturar(largura(j), largura(j + 1), suave(trecho(a, [ini, fim]))) / 2;
        }
        desenharAto(ato.current, a, m.ato, meia, e);

        const visiveis = v > JANELAS.ato[0] && v < 1;
        if (visiveis !== ligadas.current) {
            ligadas.current = visiveis;
            setAtivas(visiveis);
        }
    }, [texto, palavra, copiaTexto, prefixo, chaveNovas]);

    return (
        <div ref={camada} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ ['--g' as string]: 40, ['--codigo' as string]: 14 }}>
            <AtoElementos prefixo={prefixo} ativas={ativas} />
            <svg aria-hidden width="0" height="0" className="absolute">
                {Array.from({ length: 1 + novas.length }, (_, i) => (
                    <filter key={i} id={`${prefixo}-palavra-${i}`} x="-20%" y="-60%" width="140%" height="220%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur stdDeviation="0" />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
                    </filter>
                ))}
            </svg>
            <div ref={soltas} className={tamanho} style={estilo}>
                <PalavraSolta texto={copiaTexto} visivel />
                {novas.map((t, i) => <PalavraSolta key={`${i}-${t}`} texto={t} visivel={false} />)}
            </div>
        </div>
    );
}
