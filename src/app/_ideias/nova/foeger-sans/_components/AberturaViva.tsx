'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useLenis } from 'lenis/react';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { GLIFOS } from '../_lib/glifos';
import { pontosDe } from '../_lib/caminho';
import { PEDRAS_COR } from '../_lib/tema';
import { TEXTOS_FONTE } from '../_lib/textos';
import { ALTO, BAIXO } from './Glifo';

// abertura ao vivo, como a das páginas da Feixen: o nome em letra gigante, cada letra numa cor de pedra, e quatro
// cursores trabalhando nele numa linha do tempo única de 6 s, que se repete. Um evento por vez, nunca tudo junto:
// - o g mostra o contorno e os pontos do desenho de verdade (lidos do arquivo da fonte);
// - as quinas do F se gastam e voltam (um ensaio do "desgaste", um eixo que a fonte ainda não tem);
// - um cursor levanta uma pedra do trema do ö e solta: ela cai com desfoque de movimento e quica;
// - o e é empurrado para baixo e, no fundo da queda, vira é (ou volta a ser e).
const PALAVRA = ['F', 'ö', 'e', 'g', 'e', 'r'];
const CORES = [PEDRAS_COR.granito, PEDRAS_COR.terracota, PEDRAS_COR.basalto, PEDRAS_COR.ocre, PEDRAS_COR.musgo, PEDRAS_COR.basalto];
const CICLO = 6000;
const TOTAL = ALTO + BAIXO;

type Tempo = [number, number, ((x: number) => number)?];
const lin = (x: number) => x;
const entra = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sai = (x: number) => 1 - Math.pow(1 - x, 3);
const cai = (x: number) => x * x * x;
// valor por trechos: [instante, valor, curva do trecho que termina ali]
function trechos(t: number, pontos: Tempo[]) {
    if (t <= pontos[0][0]) return pontos[0][1];
    for (let i = 1; i < pontos.length; i++) {
        const [t1, v1, curva = entra] = pontos[i];
        const [t0, v0] = pontos[i - 1];
        if (t <= t1) return v0 + (v1 - v0) * curva((t - t0) / Math.max(1, t1 - t0));
    }
    return pontos[pontos.length - 1][1];
}
const mistura = (a: number, b: number, k: number) => a + (b - a) * k;

export default function AberturaViva() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma];
    const lenis = useLenis();
    const reduzido = useReducedMotion() ?? false;
    const palco = useRef<HTMLDivElement>(null);
    const letras = useRef<(HTMLDivElement | null)[]>([]);
    const cursores = useRef<(HTMLDivElement | null)[]>([]);
    // peças que a linha do tempo mexe direto
    const desgaste = useRef<SVGFEGaussianBlurElement>(null);
    const limiarF = useRef<SVGFEColorMatrixElement>(null);
    const corpoF = useRef<SVGGElement>(null);
    const nosF = useRef<SVGGElement>(null);
    const nosG = useRef<SVGGElement>(null);
    const corpoG = useRef<SVGGElement>(null);
    const pedraO = useRef<SVGPathElement>(null);
    const pedraO2 = useRef<SVGPathElement>(null);
    const rastroO = useRef<SVGFEGaussianBlurElement>(null);
    const letraE = useRef<SVGGElement>(null);
    const eSimples = useRef<SVGGElement>(null);
    const eAcento = useRef<SVGGElement>(null);
    const rastroE = useRef<SVGFEGaussianBlurElement>(null);
    const letraR = useRef<SVGGElement>(null);
    const [caixas, setCaixas] = useState<{ x: number; y: number; w: number; h: number }[]>([]);

    // as duas pedras do trema (a da direita é a que o cursor pega)
    const trema = useMemo(() => {
        const ps = GLIFOS['ö'].pecas;
        const pedras = ps.slice(1).sort((a, b) => a.x0 - b.x0);
        return { corpo: ps[0], esquerda: pedras[0], direita: pedras[1] };
    }, []);
    const pontosF = useMemo(() => GLIFOS['F'].pecas.flatMap(p => pontosDe(p.d)), []);
    const pontosG = useMemo(() => GLIFOS['g'].pecas.flatMap(p => pontosDe(p.d)), []);

    // onde cada letra está no palco (os cursores andam em frações da caixa de cada letra)
    useLayoutEffect(() => {
        const medir = () => {
            const base = palco.current?.getBoundingClientRect();
            if (!base) return;
            setCaixas(letras.current.map(el => {
                const r = el?.getBoundingClientRect();
                return r ? { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height } : { x: 0, y: 0, w: 0, h: 0 };
            }));
        };
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);

    useEffect(() => {
        if (reduzido || caixas.length < PALAVRA.length) return;
        // ponto dentro da caixa de uma letra, em frações (y: 0 no alto da caixa, 1 embaixo)
        const em = (i: number, fx: number, fy: number) => ({ x: caixas[i].x + caixas[i].w * fx, y: caixas[i].y + caixas[i].h * fy });
        const fracao = (c: string, x: number, y: number) => ({ fx: x / GLIFOS[c].w, fy: (y + ALTO) / TOTAL });
        const dirO = trema.direita;
        const alvoO = fracao('ö', (dirO.x0 + dirO.x1) / 2, (dirO.y0 + dirO.y1) / 2);

        let quadro = 0;
        const t0 = performance.now();
        let ultimoCiclo = -1;
        let comAcento = false;
        let antesO = 0;
        let antesE = 0;
        let visivel = true;
        const observador = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; });
        if (palco.current) observador.observe(palco.current);

        const posCursor = (k: number, x: number, y: number, clique = 1) => {
            const c = cursores.current[k];
            if (c) c.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${clique.toFixed(3)})`;
        };

        const passo = (agora: number) => {
            quadro = requestAnimationFrame(passo);
            if (!visivel) return;
            const total = agora - t0;
            const tt = total % CICLO;
            const ciclo = Math.floor(total / CICLO);
            const balanco = (k: number) => Math.sin(total / 900 + k * 1.7) * 6;

            // g: o contorno de verdade (cursor 0 chega antes do ciclo virar)
            {
                const tau = (tt + 400) % CICLO;
                const ver = trechos(tau, [[700, 0], [1000, 1], [1600, 1], [1900, 0]]);
                nosG.current?.setAttribute('opacity', ver.toFixed(3));
                corpoG.current?.setAttribute('fill-opacity', (1 - ver * 0.78).toFixed(3));
                const repouso = em(3, 0.62, 1.04);
                const alvo = em(3, 0.58, 0.47);
                const k = trechos(tau, [[0, 0], [600, 1], [1600, 1], [2200, 0]]);
                const clique = 1 - 0.18 * trechos(tau, [[750, 0], [820, 1, lin], [900, 0, lin]]);
                posCursor(0, mistura(repouso.x, alvo.x, k) + balanco(0), mistura(repouso.y, alvo.y, k), clique);
            }
            // F: as quinas se gastam e voltam
            {
                const ver = trechos(tt, [[700, 0], [950, 1], [3200, 1], [3500, 0]]);
                const s = trechos(tt, [[1100, 0], [1600, 38], [2700, 38], [3200, 0]]);
                nosF.current?.setAttribute('opacity', (ver * (1 - s / 60)).toFixed(3));
                if (desgaste.current && limiarF.current && corpoF.current) {
                    if (s < 0.5) corpoF.current.removeAttribute('filter');
                    else {
                        desgaste.current.setAttribute('stdDeviation', s.toFixed(1));
                        corpoF.current.setAttribute('filter', 'url(#desgaste-f)');
                    }
                }
                const repouso = em(0, -0.18, 0.98);
                const quina = em(0, 0.93, 0.19);
                const k = trechos(tt, [[400, 0], [900, 1], [3300, 1], [3900, 0]]);
                const arrasto = trechos(tt, [[1100, 0], [1600, 1], [2700, 1], [3200, 0]]);
                posCursor(1, mistura(repouso.x, quina.x, k) - arrasto * caixas[0].w * 0.06 + balanco(1), mistura(repouso.y, quina.y, k) + arrasto * caixas[0].h * 0.03);
            }
            // ö: a pedra da direita sobe com o cursor, cai e quica; a da esquerda pula junto
            {
                const sobe = trechos(tt, [[2100, 0], [2600, -330, entra], [2850, 0, cai], [3050, -70, sai], [3250, 0, entra]]);
                const giro = trechos(tt, [[2100, 0], [2600, 22], [2850, 0, cai]]);
                const pula = trechos(tt, [[2850, 0], [3030, -90, sai], [3200, 0, cai]]);
                pedraO.current?.setAttribute('transform', `translate(0 ${sobe.toFixed(1)}) rotate(${giro.toFixed(1)} ${(dirO.x0 + dirO.x1) / 2} ${(dirO.y0 + dirO.y1) / 2})`);
                pedraO2.current?.setAttribute('transform', `translate(0 ${pula.toFixed(1)})`);
                const vel = Math.abs(sobe - antesO);
                antesO = sobe;
                if (rastroO.current && pedraO.current) {
                    if (vel < 2) pedraO.current.removeAttribute('filter');
                    else {
                        rastroO.current.setAttribute('stdDeviation', `0 ${Math.min(60, vel * 0.55).toFixed(1)}`);
                        pedraO.current.setAttribute('filter', 'url(#rastro-o)');
                    }
                }
                const repouso = em(1, 1.02, -0.06);
                const pedra = { x: caixas[1].x + caixas[1].w * alvoO.fx, y: caixas[1].y + caixas[1].h * alvoO.fy };
                const k = trechos(tt, [[1600, 0], [2050, 1], [2650, 1], [3400, 0]]);
                const levanta = Math.min(0, sobe) * (caixas[1].h / TOTAL) * (tt < 2650 ? 1 : 0);
                posCursor(2, mistura(repouso.x, pedra.x, k) + balanco(2), mistura(repouso.y, pedra.y, k) + levanta);
            }
            // e: empurrado para baixo; no fundo vira é (ou volta a ser e) e sobe quicando
            {
                if (ciclo !== ultimoCiclo && tt >= 4100) {
                    ultimoCiclo = ciclo;
                    comAcento = !comAcento;
                    if (eSimples.current) eSimples.current.style.display = comAcento ? 'none' : '';
                    if (eAcento.current) eAcento.current.style.display = comAcento ? '' : 'none';
                }
                const desce = trechos(tt, [[3750, 0], [4100, 230, cai], [4450, -80, sai], [4700, 14, entra], [4850, 0, entra]]);
                letraE.current?.setAttribute('transform', `translate(0 ${desce.toFixed(1)})`);
                const vel = Math.abs(desce - antesE);
                antesE = desce;
                if (rastroE.current && letraE.current) {
                    if (vel < 2) letraE.current.removeAttribute('filter');
                    else {
                        rastroE.current.setAttribute('stdDeviation', `0 ${Math.min(50, vel * 0.5).toFixed(1)}`);
                        letraE.current.setAttribute('filter', 'url(#rastro-e)');
                    }
                }
                const repouso = em(2, 1.08, 0.06);
                const topo = em(2, 0.52, 0.29);
                const k = trechos(tt, [[3250, 0], [3700, 1], [4150, 1], [4700, 0]]);
                const empurra = Math.max(0, Math.min(230, desce)) * (caixas[2].h / TOTAL) * (tt < 4150 ? 1 : 0);
                posCursor(3, mistura(repouso.x, topo.x, k) + balanco(3), mistura(repouso.y, topo.y, k) + empurra);
            }
            // r: o cursor do g passa por ele e dá um toque
            {
                const giro = trechos(tt, [[5150, 0], [5300, -7, sai], [5700, 0, entra]]);
                letraR.current?.setAttribute('transform', `rotate(${giro.toFixed(1)} ${GLIFOS['r'].w / 2} 0)`);
            }
        };
        quadro = requestAnimationFrame(passo);
        return () => { cancelAnimationFrame(quadro); observador.disconnect(); };
    }, [caixas, reduzido, trema]);

    const altura = 'min(31vw, 46svh)';
    const rotulo = t.titulo;

    return (
        <section id="topo" className="relative flex min-h-svh flex-col items-center justify-center px-[4vw] pb-[8vh] pt-[96px]">
            <h1 className="sr-only">{rotulo}</h1>
            <div ref={palco} className="relative flex items-end" aria-hidden>
                <svg width="0" height="0" className="absolute">
                    <filter id="desgaste-f" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur ref={desgaste} stdDeviation="0" />
                        <feColorMatrix ref={limiarF} type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 13 -6" />
                    </filter>
                    <filter id="rastro-o" x="-50%" y="-120%" width="200%" height="340%"><feGaussianBlur ref={rastroO} stdDeviation="0 0" /></filter>
                    <filter id="rastro-e" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur ref={rastroE} stdDeviation="0 0" /></filter>
                </svg>
                {PALAVRA.map((c, i) => {
                    const g = GLIFOS[c];
                    const cor = CORES[i];
                    return (
                        <div key={i} ref={el => { letras.current[i] = el; }} className="relative" style={{ height: altura, aspectRatio: `${g.w} / ${TOTAL}` }}>
                            <svg viewBox={`0 ${-ALTO} ${g.w} ${TOTAL}`} className="absolute inset-0 h-full w-full overflow-visible">
                                {c === 'F' && (
                                    <>
                                        <g ref={corpoF}>{g.pecas.map((p, k) => <path key={k} d={p.d} fill={cor} fillRule="evenodd" stroke="#111" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />)}</g>
                                        <g ref={nosF} opacity={0}>
                                            {pontosF.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={11} fill="#F3F1EC" stroke="#111" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />)}
                                        </g>
                                    </>
                                )}
                                {c === 'ö' && (
                                    <>
                                        <path d={trema.corpo.d} fill={cor} fillRule="evenodd" />
                                        <path ref={pedraO2} d={trema.esquerda.d} fill={cor} fillRule="evenodd" />
                                        <path ref={pedraO} d={trema.direita.d} fill={cor} fillRule="evenodd" />
                                    </>
                                )}
                                {c === 'e' && i === 2 && (
                                    <g ref={letraE}>
                                        <g ref={eSimples}>{g.pecas.map((p, k) => <path key={k} d={p.d} fill={cor} fillRule="evenodd" />)}</g>
                                        <g ref={eAcento} style={{ display: 'none' }}>{GLIFOS['é'].pecas.map((p, k) => <path key={k} d={p.d} fill={cor} fillRule="evenodd" />)}</g>
                                    </g>
                                )}
                                {c === 'g' && (
                                    <>
                                        <g ref={corpoG}>{g.pecas.map((p, k) => <path key={k} d={p.d} fill={cor} fillRule="evenodd" stroke="#111" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />)}</g>
                                        <g ref={nosG} opacity={0}>
                                            {pontosG.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={9} fill="#F3F1EC" stroke="#111" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />)}
                                        </g>
                                    </>
                                )}
                                {c === 'r' && <g ref={letraR}>{g.pecas.map((p, k) => <path key={k} d={p.d} fill={cor} fillRule="evenodd" />)}</g>}
                                {c === 'e' && i !== 2 && g.pecas.map((p, k) => <path key={k} d={p.d} fill={cor} fillRule="evenodd" />)}
                            </svg>
                        </div>
                    );
                })}
                {/* os cursores (só desenho; o do sistema continua o mesmo) */}
                {!reduzido && [0, 1, 2, 3].map(k => (
                    <div key={k} ref={el => { cursores.current[k] = el; }} className="pointer-events-none absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: 'max(18px, calc(min(31vw, 46svh) * 0.085))' }}>
                        <svg viewBox="0 0 24 26" className="h-auto w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]">
                            <path d="M2 1.5 L21 11.5 L12.6 13.6 L8.6 22.6 Z" fill="#111" stroke="#F3F1EC" strokeWidth="1.6" strokeLinejoin="round" />
                        </svg>
                    </div>
                ))}
            </div>

            <div className="mt-[6vh] flex flex-col items-center gap-2 text-center" style={TIPO.texto}>
                <span className="text-lg text-[#111] md:text-xl" style={{ fontWeight: 600 }}>{t.titulo}</span>
                <span className="max-w-[44ch] text-base text-black/55 md:text-lg">{t.aoVivo.linha}</span>
                <a
                    href="#livro"
                    onClick={e => { e.preventDefault(); if (lenis) lenis.scrollTo('#livro', { duration: 1.6 }); else document.querySelector('#livro')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="mt-4 rounded-full bg-[#111] px-5 py-2.5 text-[15px] text-[#E4E4E4] transition-transform hover:scale-[1.03]"
                    style={{ fontWeight: 600 }}
                >
                    {t.aoVivo.folhear} ↓
                </a>
            </div>
        </section>
    );
}
