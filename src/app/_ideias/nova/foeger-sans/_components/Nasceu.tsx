'use client';

import { useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { useProgresso } from '../../../_comum/progresso';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { GLIFOS } from '../_lib/glifos';
import { pontosDe } from '../_lib/caminho';
import { PEDRAS_COR, TEMA } from '../_lib/tema';
import { TEXTOS_FONTE } from '../_lib/textos';
import { ALTO, BAIXO } from './Glifo';

// como ela nasceu, em três passos presos à rolagem: o gabarito (uma letra por quadrado, com traço de tinta), o
// contorno (o mesmo "a" vira pontos e curvas) e a fonte (cada letra numa caixa, todas com a mesma folga dos
// lados, como o Calligraphr entrega). O desenho vem do arquivo da fonte; o traço de tinta é um filtro por cima
const TOTAL = ALTO + BAIXO;
const GABARITO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
const PALAVRA = ['F', 'ö', 'e', 'g', 'e', 'r'];
const FOLGA = 22; // unidades de cada lado, igual em todas as letras (lido do arquivo)

export default function Nasceu() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].nasceu;
    const secao = useRef<HTMLElement>(null);
    const p = useProgresso(secao);
    const [passo, setPasso] = useState(0);
    useMotionValueEvent(p, 'change', v => setPasso(Math.min(2, Math.floor(v * 3))));
    // dentro do passo 2, o traço vira contorno
    const vira = useTransform(p, [0.36, 0.6], [0, 1]);

    return (
        <section ref={secao} className="relative h-[320vh]">
            <div className="sticky top-0 grid h-svh items-center gap-8 px-[4vw] pt-16 md:grid-cols-12 md:gap-x-[4vw]">
                <div className="flex flex-col gap-8 md:col-span-5">
                    <h2 className="text-[9vw] md:text-[4.2vw]" style={TIPO.frase}>{t.titulo}</h2>
                    <ol className="flex flex-col gap-5">
                        {t.passos.map((x, i) => (
                            <li key={x.titulo} className="flex gap-4 transition-opacity duration-500" style={{ opacity: passo === i ? 1 : 0.3 }}>
                                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/30 text-[13px]" style={TIPO.menu}>{i + 1}</span>
                                <span className="flex flex-col gap-1">
                                    <span className="text-xl md:text-2xl" style={{ ...TIPO.texto, fontWeight: 600 }}>{x.titulo}</span>
                                    <span className="max-w-[38ch] text-base text-black/60 md:text-lg" style={TIPO.texto}>{x.texto}</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="relative mx-auto aspect-square w-full max-w-[min(560px,62svh)] md:col-span-7">
                    <svg width="0" height="0" className="absolute">
                        {/* traço de tinta: a borda treme um pouco, como caneta no papel */}
                        <filter id="tinta" x="-5%" y="-5%" width="110%" height="110%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="ruido" />
                            <feDisplacementMap in="SourceGraphic" in2="ruido" scale="22" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                    </svg>
                    <Quadro ativo={passo === 0}><Gabarito /></Quadro>
                    <Quadro ativo={passo === 1}><Contorno vira={vira} /></Quadro>
                    <Quadro ativo={passo === 2}><Caixas /></Quadro>
                </div>
            </div>
        </section>
    );
}

function Quadro({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
    return (
        <motion.div
            className="absolute inset-0 overflow-hidden rounded-[14px] shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
            style={{ backgroundColor: TEMA.papel }}
            initial={false}
            animate={{ opacity: ativo ? 1 : 0, y: ativo ? 0 : 24, scale: ativo ? 1 : 0.97 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden={!ativo}
        >
            {children}
        </motion.div>
    );
}

// uma página de gabarito: um quadrado por letra, com a letra pedida no canto e a linha de base
function Gabarito() {
    const celula = { w: 130, h: 150 };
    return (
        <svg viewBox="0 0 600 600" className="h-full w-full">
            {GABARITO.map((c, i) => {
                const x = 40 + (i % 4) * celula.w;
                const y = 75 + Math.floor(i / 4) * celula.h;
                const g = GLIFOS[c];
                const escala = 92 / TOTAL;
                const base = y + celula.h * 0.74;
                return (
                    <g key={c}>
                        <rect x={x} y={y} width={celula.w} height={celula.h} fill="none" stroke="rgba(17,17,17,0.22)" strokeWidth={1} />
                        <line x1={x + 8} x2={x + celula.w - 8} y1={base} y2={base} stroke="rgba(17,17,17,0.18)" strokeWidth={1} />
                        <text x={x + 8} y={y + 18} fontSize={13} fill="rgba(17,17,17,0.5)" style={{ fontFamily: 'var(--ff-bricolage-w), sans-serif' }}>{c}</text>
                        <g transform={`translate(${x + (celula.w - g.w * escala) / 2} ${base}) scale(${escala})`} filter="url(#tinta)">
                            {g.pecas.map((pc, k) => <path key={k} d={pc.d} fill="#1b1b1b" fillRule="evenodd" />)}
                        </g>
                    </g>
                );
            })}
        </svg>
    );
}

// o mesmo "a": primeiro o traço de tinta, depois o contorno com os pontos do desenho
function Contorno({ vira }: { vira: MotionValue<number> }) {
    const g = GLIFOS['a'];
    const pontos = useMemo(() => g.pecas.flatMap(pc => pontosDe(pc.d)), [g]);
    const escala = 430 / TOTAL;
    const tinta = useTransform(vira, v => 1 - v);
    return (
        <svg viewBox="0 0 600 600" className="h-full w-full">
            <g transform={`translate(${(600 - g.w * escala) / 2} ${70 + ALTO * escala}) scale(${escala})`}>
                <motion.g style={{ opacity: tinta }} filter="url(#tinta)">
                    {g.pecas.map((pc, k) => <path key={k} d={pc.d} fill="#1b1b1b" fillRule="evenodd" />)}
                </motion.g>
                <motion.g style={{ opacity: vira }}>
                    {g.pecas.map((pc, k) => <path key={k} d={pc.d} fill={PEDRAS_COR.terracota} fillOpacity={0.18} fillRule="evenodd" stroke="#111" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />)}
                    {pontos.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={7} fill={TEMA.papel} stroke="#111" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />)}
                </motion.g>
            </g>
        </svg>
    );
}

// cada letra numa caixa: a largura dela mais a mesma folga dos dois lados, em todas
function Caixas() {
    const larguras = PALAVRA.map(c => GLIFOS[c].w);
    const soma = larguras.reduce((a, b) => a + b, 0);
    const escala = 520 / soma;
    let x = 40;
    return (
        <svg viewBox="0 0 600 600" className="h-full w-full">
            {PALAVRA.map((c, i) => {
                const g = GLIFOS[c];
                const w = g.w * escala;
                const x0 = x;
                x += w;
                const topo = 300 - (TOTAL * escala) / 2;
                const base = topo + ALTO * escala;
                return (
                    <g key={i}>
                        <rect x={x0} y={topo} width={w} height={TOTAL * escala} fill="none" stroke="rgba(17,17,17,0.35)" strokeWidth={1} />
                        <rect x={x0} y={topo} width={FOLGA * escala} height={TOTAL * escala} fill={PEDRAS_COR.terracota} fillOpacity={0.28} />
                        <rect x={x0 + w - FOLGA * escala} y={topo} width={FOLGA * escala} height={TOTAL * escala} fill={PEDRAS_COR.terracota} fillOpacity={0.28} />
                        <g transform={`translate(${x0} ${base}) scale(${escala})`}>
                            {g.pecas.map((pc, k) => <path key={k} d={pc.d} fill="#111" fillRule="evenodd" />)}
                        </g>
                    </g>
                );
            })}
            <line x1={40} x2={560} y1={300 - (TOTAL * escala) / 2 + ALTO * escala} y2={300 - (TOTAL * escala) / 2 + ALTO * escala} stroke="rgba(17,17,17,0.25)" strokeWidth={1} />
        </svg>
    );
}
