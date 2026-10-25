'use client';

// o fecho da home, logo antes do rodapé: a seção fica presa enquanto, primeiro, a chamada se monta dos pontos como o
// manifesto (cada palavra sobe ainda feita de pontinhos, que se juntam e viram a palavra; no desktop com a rolagem, no
// toque sozinha, por tempo, quando o palco aparece) e, depois, a tinta escura sobe do pé da tela em bolhas que
// ondulam e se fundem (desfoque com limiar), até cobrir tudo e emendar no rodapé, que é escuro. A pergunta fica em modo
// diferença (escura no claro e branca onde a tinta passa, como o rodapé e a logo) e é o link do e-mail; a palavra
// "projeto" vai em caixa alta. As bolhas seguem ondulando com o tempo mesmo com a rolagem parada (menos com o
// movimento reduzido). O desenho é de 1440×900 e cobre qualquer tela pelo viewBox, sem esticar o filtro
import { useEffect, useMemo, useRef } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'motion/react';
import { PalavrasQueSobem } from '../../_comum/Manifesto';
import { useToque } from '../../_comum/progresso';
import { EMAIL } from '../_lib/textos';
import { useTexto } from '../_lib/idioma';
import { TIPO } from '../_lib/tipo';
import { FUNDO_CLARO } from './Expansao';

const TINTA = '#050505';
const W = 1440;
const H = 900;
// as bolhas que sobem (x, atraso, raio de saída) e os pingos que correm na frente e são engolidos
const SOBE = [
    { x: 70, d: 0.0, r: 150 }, { x: 290, d: 0.3, r: 190 }, { x: 520, d: 0.1, r: 160 }, { x: 730, d: 0.4, r: 210 },
    { x: 940, d: 0.05, r: 170 }, { x: 1160, d: 0.32, r: 200 }, { x: 1370, d: 0.15, r: 160 },
];
const PINGOS = [{ x: 410, d: 0.55, r: 38 }, { x: 850, d: 0.45, r: 32 }, { x: 1260, d: 0.7, r: 36 }, { x: 160, d: 0.8, r: 30 }];
// a parte da rolagem da seção em que a chamada se monta (no toque ela se monta por tempo, e a rolagem só dá a folga);
// a tinta usa o resto
const PALAVRAS = 0.4;
const PALAVRAS_TOQUE = 0.2;
const TEMPO_TOQUE = 2.4; // s, como o manifesto
const VISIVEL_TOQUE = 0.6;

const trecho = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const suave = (x: number) => x * x * (3 - 2 * x);
const misturar = (a: number, b: number, k: number) => a + (b - a) * k;

// a chamada em duas linhas (as três primeiras palavras e o resto: "Tem um PROJETO / em mente?"), com a palavra do
// projeto em caixa alta
const linhasDa = (chamada: string) => {
    const palavras = chamada.split(' ').map(p => (/^proje/i.test(p) ? p.toUpperCase() : p));
    return [palavras.slice(0, 3).join(' '), palavras.slice(3).join(' ')];
};

export default function FechoTinta() {
    const t = useTexto();
    const reduzido = useReducedMotion() ?? false;
    const toque = useToque();
    const linhas = useMemo(() => linhasDa(t.contato.chamada), [t.contato.chamada]);
    const pPalavras = useMotionValue(0);
    const secao = useRef<HTMLElement>(null);
    const palco = useRef<HTMLDivElement>(null);
    const bolhas = useRef<(SVGCircleElement | null)[]>([]);
    const pingos = useRef<(SVGCircleElement | null)[]>([]);
    const mar = useRef<SVGRectElement>(null);
    const cheio = useRef<HTMLDivElement>(null);

    // no toque, a chamada se monta sozinha quando o palco aparece
    useEffect(() => {
        const el = palco.current;
        if (!toque || !el) return;
        let animacao: ReturnType<typeof animate> | null = null;
        const observador = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting || animacao) return;
            animacao = animate(pPalavras, 1, { duration: TEMPO_TOQUE, ease: 'linear' });
            observador.disconnect();
        }, { threshold: VISIVEL_TOQUE });
        observador.observe(el);
        return () => {
            observador.disconnect();
            animacao?.stop();
        };
    }, [toque, pPalavras]);

    useEffect(() => {
        const el = secao.current;
        if (!el) return;
        let quadro = 0;
        let visivel = false;
        const fatia = toque ? PALAVRAS_TOQUE : PALAVRAS;
        const passo = (agora: number) => {
            quadro = requestAnimationFrame(passo);
            if (!visivel) return;
            const p = trecho(-el.getBoundingClientRect().top, 0, el.offsetHeight - window.innerHeight);
            if (!toque) pPalavras.set(trecho(p, 0, fatia));
            const q = trecho(p, fatia, 1);
            const tempo = reduzido ? 0 : agora / 1000;
            SOBE.forEach((b, i) => {
                const c = bolhas.current[i];
                if (!c) return;
                const e = trecho(q, 0.1 + b.d * 0.3, 0.82 + b.d * 0.1);
                c.setAttribute('cx', (b.x + Math.sin(tempo * 2.2 + i * 1.7) * 26 * (1 - e)).toFixed(1));
                c.setAttribute('cy', misturar(H + b.r + 40, -260, suave(e)).toFixed(1));
                c.setAttribute('r', misturar(b.r, 640, Math.pow(e, 1.7)).toFixed(1));
            });
            PINGOS.forEach((b, i) => {
                const c = pingos.current[i];
                if (!c) return;
                const e = trecho(q, 0.1 + b.d * 0.3, 0.55 + b.d * 0.3);
                c.setAttribute('cx', (b.x + Math.sin(tempo * 3 + i) * 10).toFixed(1));
                c.setAttribute('cy', misturar(H + 60, 140, suave(e)).toFixed(1));
                c.setAttribute('r', (b.r * (1 - 0.35 * e)).toFixed(1));
            });
            // o mar por baixo das bolhas, para o pé nunca abrir; coberta a tela, a tinta vira um fundo liso (sem filtro)
            mar.current?.setAttribute('y', misturar(H + 30, -40, suave(trecho(q, 0.12, 0.95))).toFixed(1));
            if (cheio.current) cheio.current.style.opacity = q >= 0.97 ? '1' : '0';
        };
        const observador = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }, { rootMargin: '200px 0px' });
        observador.observe(el);
        quadro = requestAnimationFrame(passo);
        return () => {
            cancelAnimationFrame(quadro);
            observador.disconnect();
        };
    }, [reduzido, toque, pPalavras]);

    return (
        <section ref={secao} className="relative h-[220vh] md:h-[300vh]" style={{ background: FUNDO_CLARO }}>
            <div ref={palco} className="sticky top-0 h-[100svh] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
                    <defs>
                        <filter id="fecho-tinta-gosma" filterUnits="userSpaceOnUse" x={-200} y={-300} width={W + 400} height={H + 600} colorInterpolationFilters="sRGB">
                            <feGaussianBlur in="SourceGraphic" stdDeviation={22} />
                            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
                        </filter>
                    </defs>
                    <rect width={W} height={H} fill={FUNDO_CLARO} />
                    <g filter="url(#fecho-tinta-gosma)">
                        <rect ref={mar} x={-60} y={H + 30} width={W + 120} height={H + 400} fill={TINTA} />
                        {SOBE.map((b, i) => <circle key={i} ref={c => { bolhas.current[i] = c; }} cx={b.x} cy={H + b.r + 40} r={b.r} fill={TINTA} />)}
                        {PINGOS.map((b, i) => <circle key={i} ref={c => { pingos.current[i] = c; }} cx={b.x} cy={H + 60} r={b.r} fill={TINTA} />)}
                    </g>
                </svg>
                <div ref={cheio} className="absolute inset-0" style={{ background: TINTA, opacity: 0 }} />
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ color: '#ffffff', mixBlendMode: 'difference' }}>
                    <a href={`mailto:${EMAIL}`} className="block w-full text-[clamp(56px,10.4vw,150px)]" style={{ ...TIPO.manifesto, letterSpacing: '-0.045em' }}>
                        <PalavrasQueSobem key={linhas.join('|')} linhas={linhas} progresso={pPalavras} reduzido={reduzido} semRastro={toque} pontos fracao={1} />
                    </a>
                </div>
            </div>
        </section>
    );
}
