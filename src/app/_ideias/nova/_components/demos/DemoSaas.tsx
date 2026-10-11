'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTexto } from '../../_lib/idioma';
import { useSozinha } from '../Palco';

// SaaS, "da ideia ao produto no ar": o mesmo painel de um produto passa por três estados.
// Ideia: rabisco à mão. Design: o painel limpo. No ar: os números andam, chega uma reserva nova, a barra de hoje cresce
const BARRAS = [42, 58, 51, 74, 66, 88, 94];
const CARTAO = { x: 24, y: 84, w: 352, h: 352 };
const GRAFICO = { x: 20, base: 262, alto: 110, largura: 312 };
const INICIAL = 128;

// ruído fixo por semente, para o rabisco sair igual a cada render
const ruido = (s: number) => {
    const x = Math.sin(s * 91.7 + 13.1) * 43758.5453;
    return x - Math.floor(x) - 0.5;
};
type P = [number, number];
const traco = (u: P, v: P, s: number, j: number) => {
    const mx = (u[0] + v[0]) / 2 + ruido(s) * j * 1.6;
    const my = (u[1] + v[1]) / 2 + ruido(s + 0.5) * j * 1.6;
    return `M${u[0].toFixed(1)},${u[1].toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${v[0].toFixed(1)},${v[1].toFixed(1)}`;
};
// retângulo rabiscado: quatro traços com os cantos um pouco fora do lugar e passando do ponto
function retangulo(x: number, y: number, w: number, h: number, s: number, j = 2.4) {
    const c = (i: number): P => [ruido(s + i) * j, ruido(s + i + 0.3) * j];
    const a: P = [x + c(1)[0] - 2, y + c(1)[1]];
    const b: P = [x + w + c(2)[0] + 2, y + c(2)[1]];
    const d: P = [x + w + c(3)[0], y + h + c(3)[1] + 2];
    const e: P = [x + c(4)[0], y + h + c(4)[1] - 1];
    return [traco(a, b, s + 10, j), traco([b[0] - 3, b[1] - 2], d, s + 11, j), traco(d, e, s + 12, j), traco([e[0] + 1, e[1] + 2], [a[0] + 1, a[1] - 3], s + 13, j)].join(' ');
}
// linha ondulada no lugar de um texto
function rabisco(x0: number, x1: number, y: number, s: number, amplitude = 3.5) {
    let d = `M${x0},${y}`;
    const passos = Math.max(3, Math.round((x1 - x0) / 14));
    for (let i = 1; i <= passos; i++) {
        const x = x0 + ((x1 - x0) * i) / passos;
        const cx = x - (x1 - x0) / passos / 2;
        d += ` Q${cx.toFixed(1)},${(y + (i % 2 ? -1 : 1) * amplitude + ruido(s + i) * 2).toFixed(1)} ${x.toFixed(1)},${(y + ruido(s + i + 9) * 1.5).toFixed(1)}`;
    }
    return d;
}

export default function DemoSaas({ ativo }: { ativo: boolean }) {
    const t = useTexto().demos.saas;
    const [etapa, setEtapa] = useState(0);
    const { sozinha, tocou } = useSozinha(ativo);
    const [reservas, setReservas] = useState(INICIAL);
    const [aviso, setAviso] = useState(0);
    const noAr = etapa === 2;

    // passa sozinha pelas etapas
    useEffect(() => {
        if (!sozinha) return;
        const id = setInterval(() => setEtapa(e => (e + 1) % 3), 2800);
        return () => clearInterval(id);
    }, [sozinha]);

    // no ar: chega uma reserva de tempos em tempos
    useEffect(() => {
        if (!noAr || !ativo) return;
        const chegar = () => {
            setReservas(r => r + 1);
            setAviso(a => a + 1);
        };
        const primeiro = setTimeout(chegar, 500);
        const id = setInterval(chegar, 1500);
        return () => { clearTimeout(primeiro); clearInterval(id); };
    }, [noAr, ativo]);
    useEffect(() => { if (!noAr) setReservas(INICIAL); }, [noAr]);

    const rabiscos = useMemo(() => {
        const { x, base, alto, largura } = GRAFICO;
        const passo = largura / BARRAS.length;
        return [
            retangulo(4, 4, CARTAO.w - 8, CARTAO.h - 8, 1, 3.2),
            rabisco(22, 108, 32, 2),
            retangulo(22, 58, 112, 50, 3),
            rabisco(22, 92, 122, 4, 2.5),
            ...BARRAS.map((b, i) => retangulo(x + i * passo + 6, base - (alto * b) / 100, passo - 14, (alto * b) / 100, 20 + i * 7, 1.8)),
            traco([16, base + 2], [CARTAO.w - 16, base + 3], 90, 1.4),
            retangulo(20, 296, CARTAO.w - 40, 40, 5, 2.2),
            rabisco(CARTAO.w / 2 - 44, CARTAO.w / 2 + 44, 316, 6, 2.5),
        ];
    }, []);

    const passo = GRAFICO.largura / BARRAS.length;
    const hoje = noAr ? Math.min(100, BARRAS[6] + ((reservas - INICIAL) % 4) * 2) : BARRAS[6];

    return (
        <div className="absolute inset-0 select-none text-white">
            {/* etapas */}
            <div className="absolute left-6 right-6 top-6 flex justify-between" role="tablist">
                {t.etapas.map((nome, i) => (
                    <button
                        key={nome}
                        role="tab"
                        aria-selected={etapa === i}
                        onClick={() => { setEtapa(i); tocou(); }}
                        className={`relative px-1 pb-2 text-[15px] transition-colors ${etapa === i ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                        style={{ fontWeight: 500 }}
                    >
                        {nome}
                        {etapa === i && <motion.span layoutId="saas-etapa" className="absolute inset-x-0 -bottom-0.5 h-[2px] bg-white" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                    </button>
                ))}
            </div>

            <div className="absolute" style={{ left: CARTAO.x, top: CARTAO.y, width: CARTAO.w, height: CARTAO.h }}>
                {/* o rabisco */}
                <motion.svg
                    className="absolute inset-0 overflow-visible"
                    viewBox={`0 0 ${CARTAO.w} ${CARTAO.h}`}
                    animate={{ opacity: etapa === 0 ? 1 : 0 }}
                    transition={{ duration: 0.45 }}
                    fill="none"
                    stroke="rgba(255,255,255,0.78)"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    aria-hidden
                >
                    {rabiscos.map((d, i) => (
                        <motion.path key={i} d={d} initial={false} animate={{ pathLength: etapa === 0 ? 1 : 0 }} transition={{ duration: etapa === 0 ? 0.9 : 0.3, delay: etapa === 0 ? i * 0.05 : 0, ease: 'easeOut' }} />
                    ))}
                </motion.svg>

                {/* o painel limpo, que se revela de cima para baixo */}
                <motion.div
                    className="absolute inset-0 rounded-[12px] border border-white/10 bg-[#151515]"
                    initial={false}
                    animate={{ clipPath: etapa === 0 ? 'inset(0 0 100% 0 round 12px)' : 'inset(0 0 0% 0 round 12px)' }}
                    transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
                >
                    <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                        <span className="text-[16px]" style={{ fontWeight: 600 }}>{t.titulo}</span>
                        <AnimatePresence>
                            {noAr && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[12px] text-white/80"
                                >
                                    <motion.span className="h-1.5 w-1.5 rounded-full bg-white" animate={{ opacity: [1, 0.25, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                                    {t.aoVivo}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="absolute left-5 top-[56px] h-[56px] overflow-hidden text-[52px] leading-[56px]" style={{ fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.span key={reservas} className="block" initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '-100%' }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                                {reservas}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <span className="absolute left-5 top-[114px] text-[13px] text-white/50">{t.semana}</span>

                    {/* barras */}
                    {BARRAS.map((b, i) => {
                        const valor = i === 6 ? hoje : b;
                        return (
                            <motion.div
                                key={i}
                                className={`absolute rounded-t-[3px] ${i === 6 ? 'bg-white' : 'bg-white/30'}`}
                                style={{ left: GRAFICO.x + i * passo + 6, width: passo - 14, bottom: CARTAO.h - GRAFICO.base }}
                                initial={false}
                                animate={{ height: etapa === 0 ? 0 : (GRAFICO.alto * valor) / 100 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 22, delay: etapa === 0 ? 0 : 0.25 + i * 0.04 }}
                            />
                        );
                    })}
                    <div className="absolute flex justify-between text-[12px] text-white/40" style={{ left: GRAFICO.x + 6, right: 20 + 8, top: GRAFICO.base + 6 }}>
                        {t.dias.map((d, i) => <span key={i} className="text-center" style={{ width: passo - 14 }}>{d}</span>)}
                    </div>

                    <div className="absolute bottom-4 left-5 right-5 flex h-10 items-center justify-center rounded-[8px] bg-white text-[14px] text-black" style={{ fontWeight: 600 }}>
                        {t.botao}
                    </div>

                    {/* a reserva que chega */}
                    <AnimatePresence>
                        {noAr && aviso > 0 && (
                            <motion.div
                                key={aviso}
                                className="absolute right-4 top-[52px] flex items-center gap-2 rounded-[10px] border border-white/15 bg-[#222] px-3 py-2 text-[13px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                initial={{ opacity: 0, y: -14, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <span className="h-2 w-2 rounded-full bg-white" />
                                <span style={{ fontWeight: 600 }}>{t.aviso}</span>
                                <span className="text-white/50">· {t.agora}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
