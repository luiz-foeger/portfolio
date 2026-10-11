'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { motion, useReducedMotion, useTransform } from 'motion/react';
import { entraESai, limitar, misturar, useProgresso } from '../../../_comum/progresso';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { TEXTOS_FONTE } from '../_lib/textos';

// "cortada como pedra": as minúsculas começam num monte de pedras no chão e, com a rolagem, voam em arco até virar
// o alfabeto (letras soltas que convergem com a rolagem, como na Feixen). Cada uma borra na direção em que anda,
// na medida da velocidade, e o monte volta se a rolagem voltar
const LINHAS = ['abcdefghijklm', 'nopqrstuvwxyz'];
const LETRAS = LINHAS.join('');
// do monte: quantas pedras por camada, de baixo para cima
const CAMADAS = [9, 7, 5, 3, 2];
const sorteio = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
};

export default function Pedras() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].pedras;
    const secao = useRef<HTMLElement>(null);
    const palco = useRef<HTMLDivElement>(null);
    const molde = useRef<HTMLDivElement>(null);
    const voando = useRef<(HTMLSpanElement | null)[]>([]);
    const filtros = useRef<(SVGFEGaussianBlurElement | null)[]>([]);
    const alvos = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
    const p = useProgresso(secao);
    const reduzido = useReducedMotion() ?? false;
    const textoOpacidade = useTransform(p, [0.62, 0.74], [0, 1]);
    const textoY = useTransform(p, [0.62, 0.74], [24, 0]);

    // onde cada letra fica no alfabeto pronto (medido no molde invisível)
    useLayoutEffect(() => {
        const medir = () => {
            const base = palco.current?.getBoundingClientRect();
            const spans = molde.current?.querySelectorAll<HTMLElement>('[data-letra]');
            if (!base || !spans) return;
            alvos.current = [...spans].map(s => {
                const r = s.getBoundingClientRect();
                return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
            });
        };
        medir();
        document.fonts?.ready.then(medir);
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);

    useEffect(() => {
        const el = palco.current;
        if (!el) return;
        // a posição de cada letra no monte, por camada, com um pouco de desordem
        const monte = () => {
            const W = el.clientWidth;
            const H = el.clientHeight;
            const lista: { x: number; y: number; r: number }[] = [];
            let k = 0;
            CAMADAS.forEach((n, camada) => {
                const largura = W * (0.62 - camada * 0.1);
                for (let j = 0; j < n && k < LETRAS.length; j++, k++) {
                    const a = alvos.current[k];
                    const passo = largura / n;
                    const x = W / 2 - largura / 2 + passo * (j + 0.5) + (sorteio(k) - 0.5) * passo * 0.5;
                    const y = H * 0.94 - (a?.h ?? 80) * (0.62 + camada * 0.55) + (sorteio(k + 40) - 0.5) * 18;
                    lista.push({ x: x - (a?.w ?? 60) / 2, y, r: (sorteio(k + 90) - 0.5) * 80 });
                }
            });
            return lista;
        };
        let pedras = monte();
        const antes = LETRAS.split('').map(() => ({ x: NaN, y: NaN }));
        let ultimo = NaN;
        let quadro = 0;
        let visivel = false;
        // alguma letra ainda borrada: o rastro precisa terminar de sumir mesmo com a rolagem parada
        let borrando = false;

        const desenhar = () => {
            quadro = visivel ? requestAnimationFrame(desenhar) : 0;
            const v = p.get();
            if (v === ultimo && !borrando) return;
            ultimo = v;
            borrando = false;
            LETRAS.split('').forEach((_, i) => {
                const span = voando.current[i];
                const a = alvos.current[i];
                const m = pedras[i];
                if (!span || !a || !m) return;
                // as de cima do monte saem primeiro
                const ordem = LETRAS.length - 1 - i;
                const inicio = 0.06 + ordem * 0.011;
                const lp = reduzido ? (v > 0.3 ? 1 : 0) : entraESai(limitar((v - inicio) / 0.34));
                const arco = Math.sin(Math.PI * lp) * a.h * 0.9;
                const x = misturar(m.x, a.x, lp);
                const y = misturar(m.y, a.y, lp) - arco;
                const r = misturar(m.r, 0, lp);
                span.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg)`;
                // rastro na direção em que anda
                const ant = antes[i];
                const vx = Number.isNaN(ant.x) ? 0 : x - ant.x;
                const vy = Number.isNaN(ant.y) ? 0 : y - ant.y;
                antes[i] = { x, y };
                const f = filtros.current[i];
                const sx = Math.min(12, Math.abs(vx) * 0.5);
                const sy = Math.min(12, Math.abs(vy) * 0.5);
                if (!f || reduzido || (sx < 0.4 && sy < 0.4)) { span.style.filter = ''; return; }
                borrando = true;
                f.setAttribute('stdDeviation', `${sx.toFixed(1)} ${sy.toFixed(1)}`);
                span.style.filter = `url(#pedra-rastro-${i})`;
            });
        };
        const observador = new IntersectionObserver(([e]) => {
            visivel = e.isIntersecting;
            if (visivel && !quadro) quadro = requestAnimationFrame(desenhar);
        });
        observador.observe(el);
        const refazer = () => { pedras = monte(); ultimo = NaN; };
        window.addEventListener('resize', refazer);
        document.fonts?.ready.then(refazer);
        return () => {
            observador.disconnect();
            cancelAnimationFrame(quadro);
            window.removeEventListener('resize', refazer);
        };
    }, [p, reduzido]);

    return (
        <section ref={secao} className="relative h-[260vh]">
            <div ref={palco} className="sticky top-0 h-svh overflow-hidden" style={{ fontFamily: 'var(--ff-foeger)' }}>
                <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
                    {LETRAS.split('').map((_, i) => (
                        <filter key={i} id={`pedra-rastro-${i}`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
                            <feGaussianBlur ref={el => { filtros.current[i] = el; }} stdDeviation="0 0" />
                        </filter>
                    ))}
                </svg>

                {/* molde invisível com o alfabeto pronto, só para medir onde cada letra mora */}
                <div ref={molde} aria-hidden className="invisible absolute inset-x-0 top-[22vh] flex flex-col items-center text-[11.5vw] leading-[1.05] md:top-[16vh] md:text-[7.4vw]">
                    {LINHAS.map(l => (
                        <span key={l} className="whitespace-nowrap">
                            {[...l].map((c, j) => <span key={j} data-letra className="inline-block">{c}</span>)}
                        </span>
                    ))}
                </div>

                <div aria-hidden className="absolute inset-0 text-[11.5vw] leading-[1.05] md:text-[7.4vw]">
                    {LETRAS.split('').map((c, i) => (
                        <span key={i} ref={el => { voando.current[i] = el; }} className="absolute left-0 top-0 inline-block origin-center will-change-transform">
                            {c}
                        </span>
                    ))}
                </div>
                <span className="sr-only">{LETRAS}</span>

                <motion.div className="absolute inset-x-[4vw] bottom-[9vh] grid gap-4 md:grid-cols-12" style={{ opacity: textoOpacidade, y: textoY }}>
                    <h2 className="text-[9vw] md:col-span-6 md:text-[4.2vw]" style={TIPO.frase}>{t.titulo}</h2>
                    <p className="max-w-[40ch] self-end text-lg text-black/60 md:col-span-5 md:col-start-8 md:text-xl" style={TIPO.texto}>{t.texto}</p>
                </motion.div>
            </div>
        </section>
    );
}
