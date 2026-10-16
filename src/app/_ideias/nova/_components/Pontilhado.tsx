'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useProgresso, useToque } from '../../_comum/progresso';
import { useIdioma, useTexto } from '../_lib/idioma';
import type { IdServico } from '../_lib/textos';
import { TIPO } from '../_lib/tipo';

// os serviços em pontos: a seção presa e uma nuvem de pontos que muda de forma com a rolagem. Cinco itens, cada um
// com dois estados: o nome feito de pontos e um desenho, também de pontos. Abre com o processo (o painel no ar, com
// barras, a linha subindo e o ponto ao vivo) e segue a ordem de um projeto, da marca até quem usa: a identidade (o
// anel com o tipo e as cores), a interface (uma tela com chave, controle e botão), o produto (no computador e no
// celular) e a experiência (um rosto rindo, com brilhos em volta). Entre um estado e outro, os pontos voam em
// bando, em curva, da esquerda para a direita. No desktop o voo fica preso à rolagem (linear e reversível) e os
// pontos fogem do mouse; no toque, a rolagem só escolhe o estado e o voo anda sozinho. O texto aparece embaixo quando
// a forma assenta. A palavra fica parada por pouco tempo, e o desenho, mais
type P = [number, number];
type Estado = { id: 'processo' | IdServico; palavra: boolean; nome: string; texto: string };
// depois do processo, os serviços na ordem de um projeto
const ORDEM: IdServico[] = ['branding', 'ui', 'saas', 'ux'];
// a rolagem de cada trecho, em vh: a palavra fica parada por pouco tempo, o desenho fica mais e o voo leva o resto. A
// seção soma os trechos e mais uma tela, a que fica presa
const PALAVRA = 8;
const DESENHO = 26;
const VOO = 30;
// num trecho entre dois estados, o bando voa de 0,22 a 0,88 (com o atraso de cada ponto); antes e depois, a forma
// fica parada
const VOO_INICIO = 0.22;
const VOO_FIM = 0.88;

const TINTA = '#050505';

const limitar = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const trecho = (t: number, a: number, b: number) => limitar((t - a) / (b - a));
const entraESai = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sorteio = (i: number) => {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
};

// os nós da rolagem: quanto da seção (em vh) leva até cada ponto da linha dos estados, de 0 a E - 1. Cada estado fica
// parado o tempo dele, e entre dois estados vai um voo
function rolagem(estados: Estado[]) {
    const E = estados.length;
    const nos: P[] = [[0, 0]];
    let total = 0;
    estados.forEach((e, j) => {
        total += e.palavra ? PALAVRA : DESENHO;
        nos.push([total, j < E - 1 ? j + VOO_INICIO : j]);
        if (j < E - 1) {
            total += VOO;
            nos.push([total, j + VOO_FIM]);
        }
    });
    return { nos, total };
}

// a posição na linha dos estados para o progresso q (de 0 a 1) da seção
function naLinha({ nos, total }: ReturnType<typeof rolagem>, q: number) {
    const x = limitar(q) * total;
    const i = nos.findIndex(([v]) => v >= x);
    if (i < 0) return nos[nos.length - 1][1];
    if (i === 0) return 0;
    const [x0, s0] = nos[i - 1];
    const [x1, s1] = nos[i];
    return s0 + ((s1 - s0) * (x - x0)) / (x1 - x0);
}

// os desenhos, numa caixa centrada (u e v de 0 a 1)
function desenhar(g: CanvasRenderingContext2D, estado: Estado, familia: string, W: number, H: number) {
    const cx = W / 2;
    const cy = H * 0.45;
    if (estado.palavra) {
        g.font = `800 100px ${familia}`;
        const l100 = g.measureText(estado.nome).width;
        const fs = Math.min((W * 0.84 * 100) / l100, H * 0.3);
        g.font = `800 ${fs}px ${familia}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(estado.nome, cx, cy);
        return;
    }
    const bw = Math.min(W * 0.74, H * 0.5 * 1.62);
    const bh = bw / 1.62;
    const X = (u: number) => cx - bw / 2 + u * bw;
    const Y = (v: number) => cy - bh / 2 + v * bh;
    const lw = Math.max(3, bw * 0.017);
    g.lineWidth = lw;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const caixa = (u: number, v: number, w: number, h: number, r: number, cheia = false) => {
        g.beginPath();
        g.roundRect(X(u), Y(v), w * bw, h * bh, r * bw);
        if (cheia) g.fill();
        else g.stroke();
    };
    const linha = (pts: P[], largura = lw) => {
        g.lineWidth = largura;
        g.beginPath();
        pts.forEach(([u, v], i) => (i ? g.lineTo(X(u), Y(v)) : g.moveTo(X(u), Y(v))));
        g.stroke();
        g.lineWidth = lw;
    };
    const bola = (u: number, v: number, r: number) => {
        g.beginPath();
        g.arc(X(u), Y(v), r * bw, 0, Math.PI * 2);
        g.fill();
    };
    if (estado.id === 'processo') {
        // o processo: o painel no ar (o desenho que era do produto), com barras, a linha subindo e o ponto ao vivo
        caixa(0, 0, 1, 1, 0.035);
        [0.3, 0.48, 0.38, 0.6, 0.5, 0.7].forEach((h, i) => caixa(0.08 + i * 0.142, 0.9 - h, 0.085, h, 0.008, true));
        linha([[0.08, 0.5], [0.22, 0.38], [0.36, 0.44], [0.5, 0.28], [0.64, 0.32], [0.78, 0.18], [0.9, 0.2]], lw * 0.85);
        bola(0.9, 0.2, 0.022);
    } else if (estado.id === 'branding') {
        // a identidade: o anel com o tipo (Aa) e três cores do sistema
        g.lineWidth = lw * 1.6;
        g.beginPath();
        g.arc(X(0.34), Y(0.5), bh * 0.46, 0, Math.PI * 2);
        g.stroke();
        g.font = `800 ${bh * 0.48}px ${familia}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('Aa', X(0.34), Y(0.53));
        [0.08, 0.39, 0.7].forEach(v => caixa(0.72, v, 0.2, 0.22, 0.012, true));
    } else if (estado.id === 'ui') {
        // a interface: a tela com cabeçalho e título, e três cartões com uma chave ligada, um controle deslizante e um
        // botão (a tela que era do design, com os controles que eram da interface)
        caixa(0, 0, 1, 1, 0.035);
        caixa(0, 0, 1, 0.13, 0.035, true);
        caixa(0.06, 0.22, 0.46, 0.07, 0.01, true);
        caixa(0.06, 0.33, 0.3, 0.04, 0.01, true);
        [0.06, 0.37, 0.68].forEach(u => caixa(u, 0.46, 0.26, 0.44, 0.02));
        caixa(0.11, 0.6, 0.16, 0.13, 0.04);
        bola(0.23, 0.665, 0.027);
        linha([[0.42, 0.68], [0.58, 0.68]], lw * 1.1);
        linha([[0.42, 0.68], [0.52, 0.68]], lw * 2.2);
        bola(0.52, 0.68, 0.034);
        caixa(0.72, 0.62, 0.18, 0.12, 0.035, true);
    } else if (estado.id === 'saas') {
        // o produto: o computador com o painel no ar e o celular com o app (os aparelhos que eram do código, com o
        // produto dentro)
        caixa(0, 0.04, 0.68, 0.74, 0.03);
        caixa(0.29, 0.78, 0.1, 0.09, 0.004, true);
        caixa(0.21, 0.87, 0.26, 0.04, 0.012, true);
        caixa(0.04, 0.11, 0.6, 0.07, 0.01, true);
        [0.16, 0.26, 0.22, 0.34, 0.3, 0.42].forEach((h, i) => caixa(0.06 + i * 0.095, 0.7 - h, 0.06, h, 0.006, true));
        bola(0.62, 0.27, 0.018);
        caixa(0.76, 0.18, 0.22, 0.76, 0.05);
        caixa(0.795, 0.27, 0.15, 0.045, 0.01, true);
        caixa(0.795, 0.36, 0.15, 0.22, 0.02);
        caixa(0.795, 0.8, 0.15, 0.07, 0.03, true);
    } else {
        // a experiência: quem usa, empolgado; os olhos rindo, a boca aberta num sorriso grande, a cabeça um pouco
        // inclinada e três brilhos em volta (as medidas do rosto em raios, a partir do centro)
        const r = bh * 0.46;
        const fx = (a: number) => X(0.5) + a * r;
        const fy = (b: number) => Y(0.5) + b * r;
        g.lineWidth = lw * 1.9;
        g.beginPath();
        g.arc(fx(0), fy(0), r, 0, Math.PI * 2);
        g.stroke();
        // os brilhos: estrelas de quatro pontas (centro e tamanho)
        const brilhos: [number, number, number][] = [[1.38, -0.78, 0.3], [1.62, -0.3, 0.15], [-1.45, -0.55, 0.2]];
        brilhos.forEach(([a, b, s]) => {
            g.beginPath();
            for (let i = 0; i < 8; i++) {
                const angulo = -Math.PI / 2 + (i * Math.PI) / 4;
                const q = (i % 2 ? 0.28 * s : s) * r;
                g.lineTo(fx(a) + Math.cos(angulo) * q, fy(b) + Math.sin(angulo) * q);
            }
            g.fill();
        });
        g.save();
        g.translate(fx(0), fy(0));
        g.rotate(-0.1);
        g.translate(-fx(0), -fy(0));
        g.lineWidth = lw * 2.2;
        [-0.36, 0.36].forEach(a => {
            g.beginPath();
            g.arc(fx(a), fy(-0.2), 0.15 * r, Math.PI * 1.08, Math.PI * 1.92);
            g.stroke();
        });
        g.beginPath();
        g.moveTo(fx(-0.52), fy(0.1));
        g.quadraticCurveTo(fx(0), fy(0.22), fx(0.52), fy(0.1));
        g.bezierCurveTo(fx(0.49), fy(0.55), fx(0.26), fy(0.7), fx(0), fy(0.7));
        g.bezierCurveTo(fx(-0.26), fy(0.7), fx(-0.49), fy(0.55), fx(-0.52), fy(0.1));
        g.fill();
        g.restore();
    }
}

// sorteia os pontos dentro da tinta de cada forma, da esquerda para a direita (o bando voa sem se cruzar tanto)
function amostrar(estado: Estado, familia: string, W: number, H: number, n: number, passo: number, semente: number): P[] {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const g = cv.getContext('2d', { willReadFrequently: true })!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#000';
    g.strokeStyle = '#000';
    desenhar(g, estado, familia, W, H);
    const d = g.getImageData(0, 0, W, H).data;
    const candidatos: P[] = [];
    for (let y = 0; y < H; y += passo) for (let x = 0; x < W; x += passo) if (d[(y * W + x) * 4] < 128) candidatos.push([x, y]);
    const pontos: P[] = [];
    for (let i = 0; i < n; i++) {
        const c = candidatos[Math.floor(sorteio(i * 13 + semente) * candidatos.length)] ?? [W / 2, H / 2];
        pontos.push([c[0] + (sorteio(i + semente * 7) - 0.5) * passo * 0.7, c[1] + (sorteio(i * 3 + semente) - 0.5) * passo * 0.7]);
    }
    return pontos.sort((a, b) => a[0] + a[1] * 0.25 - (b[0] + b[1] * 0.25));
}

export default function Pontilhado() {
    const t = useTexto();
    const { idioma } = useIdioma();
    const toque = useToque();
    const reduzido = useReducedMotion() ?? false;
    const secao = useRef<HTMLElement>(null);
    const palco = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const nomeDaLegenda = useRef<HTMLSpanElement>(null);
    const textoDaLegenda = useRef<HTMLSpanElement>(null);
    const legenda = useRef<HTMLParagraphElement>(null);
    const p = useProgresso(secao);
    // o processo e, depois dele, os serviços na ordem de um projeto; cada um com o nome e o desenho
    const itens: { id: Estado['id']; nome: string; texto: string }[] = [
        { id: 'processo', nome: t.processo.nome, texto: t.processo.texto },
        ...ORDEM.map(id => t.servicos.find(s => s.id === id)!),
    ];
    const estados: Estado[] = itens.flatMap(s => [{ ...s, palavra: true }, { ...s, palavra: false }]);
    const E = estados.length;
    const tempos = rolagem(estados);

    useEffect(() => {
        const el = palco.current;
        const cv = canvas.current;
        if (!el || !cv) return;
        let vivo = true;
        let visivel = false;
        let quadro = 0;
        // o que muda a cada quadro fica fora do React
        const m = {
            formas: [] as P[][],
            n: 0,
            raio: 2.5,
            W: 0,
            H: 0,
            px: new Float32Array(0),
            py: new Float32Array(0),
            ox: new Float32Array(0),
            oy: new Float32Array(0),
            mouse: { x: -9999, y: -9999 },
            // no toque: de onde os pontos saíram, para onde vão e quando
            toque: { para: 0, inicio: -1e9, origemX: new Float32Array(0), origemY: new Float32Array(0) },
        };
        const preparar = async () => {
            await document.fonts.ready;
            if (!vivo) return;
            const W = el.clientWidth;
            const H = el.clientHeight;
            const estreita = W < 768;
            const n = estreita ? 1400 : 2600;
            const familia = getComputedStyle(el).fontFamily;
            m.formas = estados.map((e, i) => amostrar(e, familia, W, H, n, estreita ? 3 : 4, i * 101 + 7));
            m.n = n;
            m.raio = estreita ? 1.6 : 2.4;
            m.W = W;
            m.H = H;
            m.px = new Float32Array(n);
            m.py = new Float32Array(n);
            m.ox = new Float32Array(n);
            m.oy = new Float32Array(n);
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            cv.width = Math.round(W * dpr);
            cv.height = Math.round(H * dpr);
            cv.style.width = `${W}px`;
            cv.style.height = `${H}px`;
            m.toque.para = Math.round(naLinha(tempos, p.get()));
            m.toque.inicio = -1e9;
        };
        const desenharQuadro = (agora: number) => {
            quadro = visivel ? requestAnimationFrame(desenharQuadro) : 0;
            const { formas, n, W, H } = m;
            if (!formas.length) return;
            const g = cv.getContext('2d')!;
            const dpr = cv.width / W;
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, W, H);
            g.fillStyle = TINTA;
            g.beginPath();
            const s = naLinha(tempos, p.get());
            const k = Math.min(E - 2, Math.floor(s));
            const f = s - k;
            const tt = (agora - m.toque.inicio) / 1000;
            const R = Math.max(70, W * 0.075);
            for (let i = 0; i < n; i++) {
                let a: P;
                let b: P;
                let e: number;
                const atraso = (i / n) * 0.16;
                if (!toque) {
                    a = formas[k][i];
                    b = formas[k + 1][i];
                    e = reduzido ? (f > 0.55 ? 1 : 0) : entraESai(trecho(f, VOO_INICIO + atraso, VOO_INICIO + 0.5 + atraso));
                } else {
                    a = [m.toque.origemX[i] ?? formas[m.toque.para][i][0], m.toque.origemY[i] ?? formas[m.toque.para][i][1]];
                    b = formas[m.toque.para][i];
                    e = reduzido ? 1 : entraESai(trecho(tt, atraso * 1.4, atraso * 1.4 + 0.95));
                }
                const dx = b[0] - a[0];
                const dy = b[1] - a[1];
                const comprimento = Math.hypot(dx, dy) || 1;
                const curva = (sorteio(i * 5 + k) - 0.5) * W * 0.17 * Math.sin(Math.PI * e);
                let x = a[0] + dx * e + (-dy / comprimento) * curva;
                let y = a[1] + dy * e + (dx / comprimento) * curva;
                m.px[i] = x;
                m.py[i] = y;
                // o mouse empurra os pontos (eles voltam devagar quando ele sai)
                let alvoX = 0;
                let alvoY = 0;
                const mx = x - m.mouse.x;
                const my = y - m.mouse.y;
                const d = Math.hypot(mx, my);
                if (d < R && d > 0.01) {
                    const forca = Math.pow(1 - d / R, 2) * R * 0.42;
                    alvoX = (mx / d) * forca;
                    alvoY = (my / d) * forca;
                }
                m.ox[i] += (alvoX - m.ox[i]) * 0.18;
                m.oy[i] += (alvoY - m.oy[i]) * 0.18;
                x += m.ox[i];
                y += m.oy[i];
                g.moveTo(x + m.raio, y);
                g.arc(x, y, m.raio, 0, Math.PI * 2);
            }
            g.fill();
            // o texto do estado mais perto: inteiro enquanto a forma está parada, e some no começo do voo
            const perto = toque ? m.toque.para : Math.round(s);
            const fora = Math.max(perto - (1 - VOO_FIM) - s, s - (perto + VOO_INICIO), 0);
            const assentado = toque ? limitar((tt - 0.9) / 0.4) : 1 - limitar(fora / 0.1);
            const est = estados[perto];
            if (legenda.current && nomeDaLegenda.current && textoDaLegenda.current && est) {
                legenda.current.style.opacity = assentado.toFixed(3);
                nomeDaLegenda.current.textContent = est.palavra ? '' : est.nome;
                textoDaLegenda.current.textContent = est.texto;
            }
        };
        const ligar = () => { if (!quadro && visivel) quadro = requestAnimationFrame(desenharQuadro); };
        const observador = new IntersectionObserver(([en]) => { visivel = en.isIntersecting; ligar(); }, { threshold: 0 });
        observador.observe(el);
        const redimensiona = new ResizeObserver(() => { preparar().then(ligar); });
        redimensiona.observe(el);
        // no toque, a rolagem escolhe o estado e os pontos saem de onde estão
        const aoRolar = (v: number) => {
            if (!toque || !m.formas.length) return;
            const alvo = Math.round(naLinha(tempos, v));
            if (alvo === m.toque.para) return;
            m.toque.origemX = m.px.slice();
            m.toque.origemY = m.py.slice();
            m.toque.para = alvo;
            m.toque.inicio = performance.now();
        };
        const parar = p.on('change', aoRolar);
        const mover = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return;
            const r = el.getBoundingClientRect();
            m.mouse.x = e.clientX - r.left;
            m.mouse.y = e.clientY - r.top;
        };
        const sair = () => { m.mouse.x = -9999; m.mouse.y = -9999; };
        el.addEventListener('pointermove', mover);
        el.addEventListener('pointerleave', sair);
        return () => {
            vivo = false;
            cancelAnimationFrame(quadro);
            observador.disconnect();
            redimensiona.disconnect();
            parar();
            el.removeEventListener('pointermove', mover);
            el.removeEventListener('pointerleave', sair);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idioma, toque, reduzido]);

    return (
        <section id="servicos" ref={secao} className="relative" style={{ height: `${tempos.total + 100}vh` }}>
            <h2 className="sr-only">{t.menu.servicos}</h2>
            <ul className="sr-only">
                {itens.map(s => <li key={s.id}>{s.nome}: {s.texto}</li>)}
            </ul>
            <div ref={palco} className="sticky top-0 h-svh overflow-hidden">
                <canvas ref={canvas} aria-hidden className="absolute left-0 top-0" />
                <p ref={legenda} aria-hidden className="absolute inset-x-0 bottom-[8vh] mx-auto max-w-[40ch] px-6 text-center text-[clamp(16px,1.35vw,21px)] leading-snug" style={{ ...TIPO.texto, color: 'rgba(5,5,5,.7)', opacity: 0 }}>
                    <span ref={nomeDaLegenda} className="mb-1 block text-[1.15em]" style={{ ...TIPO.menu, fontWeight: 700, color: TINTA }} />
                    <span ref={textoDaLegenda} />
                </p>
            </div>
        </section>
    );
}
