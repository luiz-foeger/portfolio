'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useProgresso, useToque } from '../../_comum/progresso';
import { useIdioma, useTexto } from '../_lib/idioma';
import type { IdServico } from '../_lib/textos';
import { TIPO } from '../_lib/tipo';

// os serviços em pontos: a seção presa e uma nuvem de pontos que muda de forma com a rolagem. Cada serviço tem dois
// estados: o nome feito de pontos e um desenho do que ele entrega (o painel do Produto, a identidade com tipo e cores,
// o fluxo de telas da Experiência, os componentes da Interface), também de pontos. Entre um estado e outro, os pontos
// voam em bando, em curva, da esquerda para a direita. No desktop o voo fica preso à rolagem (linear e reversível) e
// os pontos fogem do mouse; no toque, a rolagem só escolhe o estado e o voo anda sozinho. O texto do serviço aparece
// embaixo quando a forma assenta
type P = [number, number];

const TINTA = '#050505';

const limitar = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const trecho = (t: number, a: number, b: number) => limitar((t - a) / (b - a));
const entraESai = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sorteio = (i: number) => {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
};

// os desenhos, numa caixa centrada (u e v de 0 a 1)
function desenhar(g: CanvasRenderingContext2D, estado: { id: IdServico; palavra: boolean; nome: string }, familia: string, W: number, H: number) {
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
    if (estado.id === 'saas') {
        // o painel no ar: barras, a linha subindo e o ponto ao vivo
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
    } else if (estado.id === 'ux') {
        // o fluxo: três telas em sequência, com setas
        [0, 0.37, 0.74].forEach(u => {
            caixa(u, 0.06, 0.26, 0.88, 0.02);
            caixa(u + 0.03, 0.2, 0.14, 0.06, 0.006, true);
            caixa(u + 0.03, 0.33, 0.2, 0.04, 0.006, true);
            caixa(u + 0.03, 0.42, 0.16, 0.04, 0.006, true);
            caixa(u + 0.03, 0.7, 0.2, 0.12, 0.03, true);
        });
        [0.27, 0.64].forEach(u => {
            linha([[u, 0.5], [u + 0.08, 0.5]]);
            linha([[u + 0.055, 0.44], [u + 0.08, 0.5], [u + 0.055, 0.56]]);
        });
    } else {
        // a interface: chave, controle deslizante, botão e caixa marcada num cartão
        caixa(0.06, 0, 0.88, 1, 0.035);
        caixa(0.16, 0.13, 0.17, 0.15, 0.05);
        bola(0.27, 0.205, 0.04);
        linha([[0.16, 0.5], [0.66, 0.5]], lw * 0.7);
        linha([[0.16, 0.5], [0.46, 0.5]], lw * 1.4);
        bola(0.46, 0.5, 0.034);
        caixa(0.16, 0.7, 0.3, 0.16, 0.05, true);
        caixa(0.58, 0.7, 0.1, 0.16, 0.01);
        linha([[0.6, 0.79], [0.625, 0.83], [0.67, 0.74]]);
    }
}

// sorteia os pontos dentro da tinta de cada forma, da esquerda para a direita (o bando voa sem se cruzar tanto)
function amostrar(estado: Parameters<typeof desenhar>[1], familia: string, W: number, H: number, n: number, passo: number, semente: number): P[] {
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
    const servicos = t.servicos;
    const estados = servicos.flatMap(s => [{ id: s.id, palavra: true, nome: s.nome, texto: s.texto }, { id: s.id, palavra: false, nome: s.nome, texto: s.texto }]);
    const E = estados.length;

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
            m.toque.para = Math.round(p.get() * (E - 1));
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
            const s = limitar(p.get()) * (E - 1);
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
                    e = reduzido ? (f > 0.55 ? 1 : 0) : entraESai(trecho(f, 0.22 + atraso, 0.72 + atraso));
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
            // o texto do estado mais perto, quando a forma assenta
            const perto = toque ? m.toque.para : Math.round(s);
            const assentado = toque ? limitar((tt - 0.9) / 0.4) : 1 - limitar((Math.abs(s - perto) - 0.08) / 0.12);
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
            const alvo = Math.round(limitar(v) * (E - 1));
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
        <section id="servicos" ref={secao} className="relative" style={{ height: `${E * 55 + 100}vh` }}>
            <h2 className="sr-only">{t.menu.servicos}</h2>
            <ul className="sr-only">
                {servicos.map(s => <li key={s.id}>{s.nome}: {s.texto}</li>)}
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
