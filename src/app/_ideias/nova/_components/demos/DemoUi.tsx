'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useTexto } from '../../_lib/idioma';
import { useSozinha } from '../Palco';

// UI, "interfaces com personalidade": componentes de verdade, com movimento que tem peso. Os controles mexem na
// própria fonte do site (peso e largura da Bricolage), o interruptor troca o tema da prévia e o botão confirma.
// Enquanto ninguém mexe, eles se mexem sozinhos
const MOLA = { type: 'spring', stiffness: 420, damping: 28 } as const;

export default function DemoUi({ ativo }: { ativo: boolean }) {
    const t = useTexto().demos.ui;
    const peso = useMotionValue(560);
    const largura = useMotionValue(92);
    const [escuro, setEscuro] = useState(true);
    const [salvo, setSalvo] = useState(false);
    const { sozinha, tocou } = useSozinha(ativo);
    const variacao = useTransform(() => `'opsz' 96, 'wdth' ${largura.get().toFixed(1)}, 'wght' ${Math.round(peso.get())}`);

    // sozinhos: os controles vão e voltam, o interruptor alterna e o botão confirma de vez em quando
    useEffect(() => {
        if (!sozinha) return;
        const a = animate(peso, [peso.get(), 800, 200, 560], { duration: 6, ease: 'easeInOut', repeat: Infinity });
        const b = animate(largura, [largura.get(), 75, 100, 92], { duration: 7.5, ease: 'easeInOut', repeat: Infinity });
        const c = setInterval(() => setEscuro(e => !e), 3200);
        const d = setInterval(() => setSalvo(true), 5200);
        return () => { a.stop(); b.stop(); clearInterval(c); clearInterval(d); };
    }, [sozinha, peso, largura]);

    useEffect(() => {
        if (!salvo) return;
        const id = setTimeout(() => setSalvo(false), 1600);
        return () => clearTimeout(id);
    }, [salvo]);

    return (
        <div className="absolute inset-0 text-white">
            {/* prévia */}
            <motion.div
                className="absolute left-6 right-6 top-6 flex h-[164px] items-center justify-center overflow-hidden rounded-[12px] border"
                initial={false}
                animate={{ backgroundColor: escuro ? '#151515' : '#EFECE6', color: escuro ? '#F4F1EC' : '#121212', borderColor: escuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.45 }}
            >
                <motion.span className="text-[42px] leading-none" style={{ fontVariationSettings: variacao, letterSpacing: '-0.03em' }}>
                    {t.palavra}
                </motion.span>
            </motion.div>

            <div className="absolute left-6 right-6 top-[214px] flex flex-col gap-7">
                <Deslizante rotulo={t.peso} valor={peso} min={200} max={800} passo={10} aoMexer={tocou} />
                <Deslizante rotulo={t.largura} valor={largura} min={75} max={100} passo={1} aoMexer={tocou} />
            </div>

            <div className="absolute bottom-7 left-6 right-6 flex items-center justify-between">
                <Interruptor rotulo={t.escuro} ligado={escuro} aoMudar={v => { setEscuro(v); tocou(); }} />
                <motion.button
                    onClick={() => { setSalvo(true); tocou(); }}
                    whileTap={{ scale: 0.92 }}
                    layout
                    transition={MOLA}
                    className="flex h-11 items-center gap-2 overflow-hidden rounded-full bg-white px-5 text-[15px] text-black"
                    style={{ fontWeight: 600 }}
                >
                    <motion.span layout="position">{salvo ? t.salvo : t.salvar}</motion.span>
                    {salvo && (
                        <motion.svg width="16" height="16" viewBox="0 0 16 16" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={MOLA}>
                            <motion.path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.1 }} />
                        </motion.svg>
                    )}
                </motion.button>
            </div>
        </div>
    );
}

// controle deslizante com peso: o puxador amassa na direção em que anda, como uma pedra arrastada
function Deslizante({ rotulo, valor, min, max, passo, aoMexer }: { rotulo: string; valor: MotionValue<number>; min: number; max: number; passo: number; aoMexer: () => void }) {
    const trilho = useRef<HTMLDivElement>(null);
    const [mostrado, setMostrado] = useState(Math.round(valor.get()));
    const [segurando, setSegurando] = useState(false);
    const fracao = useTransform(valor, v => (v - min) / (max - min));
    const esquerda = useTransform(fracao, f => `${f * 100}%`);
    // amassa com a velocidade do puxador
    const ultimo = useRef({ v: valor.get(), t: 0 });
    const solta = useRef(0);
    const esticar = useSpring(1, { stiffness: 500, damping: 22 });
    const achatar = useTransform(esticar, s => 2 - s);
    useMotionValueEvent(valor, 'change', v => {
        setMostrado(Math.round(v));
        const agora = performance.now();
        const dt = Math.max(8, agora - ultimo.current.t);
        const vel = (Math.abs(v - ultimo.current.v) / (max - min) / dt) * 1000;
        ultimo.current = { v, t: agora };
        esticar.set(1 + Math.min(0.35, vel * 0.25));
        // parou de andar: volta ao redondo
        clearTimeout(solta.current);
        solta.current = window.setTimeout(() => esticar.set(1), 70);
    });

    const deXParaValor = (x: number) => {
        const r = trilho.current?.getBoundingClientRect();
        if (!r) return valor.get();
        const f = Math.min(1, Math.max(0, (x - r.left) / r.width));
        return Math.round((min + f * (max - min)) / passo) * passo;
    };
    const mover = (e: React.PointerEvent) => { if (segurando) valor.set(deXParaValor(e.clientX)); };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between text-[14px]">
                <span className="text-white/70">{rotulo}</span>
                <span className="text-white" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{mostrado}</span>
            </div>
            <div
                ref={trilho}
                role="slider"
                tabIndex={0}
                aria-label={rotulo}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={mostrado}
                className="relative h-6 cursor-pointer touch-none outline-none [&:focus-visible>span:last-child]:ring-2 [&:focus-visible>span:last-child]:ring-white/60"
                onPointerDown={e => {
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    setSegurando(true);
                    aoMexer();
                    animate(valor, deXParaValor(e.clientX), { type: 'spring', stiffness: 400, damping: 32 });
                }}
                onPointerMove={mover}
                onPointerUp={() => setSegurando(false)}
                onPointerCancel={() => setSegurando(false)}
                onKeyDown={e => {
                    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? passo * 5 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -passo * 5 : 0;
                    if (!d) return;
                    e.preventDefault();
                    aoMexer();
                    animate(valor, Math.min(max, Math.max(min, valor.get() + d)), { type: 'spring', stiffness: 400, damping: 32 });
                }}
            >
                <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
                <motion.span className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white" style={{ width: esquerda }} />
                <motion.span
                    className="absolute top-1/2 h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                    style={{ left: esquerda, x: '-50%', y: '-50%', scaleX: esticar, scaleY: achatar }}
                    animate={{ scale: segurando ? 1.15 : 1 }}
                    transition={MOLA}
                />
            </div>
        </div>
    );
}

// interruptor: a bolinha estica no caminho e assenta do outro lado
function Interruptor({ rotulo, ligado, aoMudar }: { rotulo: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
    return (
        <button role="switch" aria-checked={ligado} onClick={() => aoMudar(!ligado)} className="flex items-center gap-3 text-[15px] text-white/80">
            <motion.span
                className="relative flex h-[30px] w-[54px] items-center rounded-full px-[3px]"
                initial={false}
                animate={{ backgroundColor: ligado ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }}
                transition={{ duration: 0.25 }}
                style={{ justifyContent: ligado ? 'flex-end' : 'flex-start' }}
            >
                {/* os dois quadros-chave diferem um pouco para a animação rodar de novo a cada troca */}
                <motion.span
                    layout
                    className="block h-6 rounded-full"
                    initial={false}
                    animate={{ width: ligado ? [24, 32, 24] : [24, 31, 24], backgroundColor: ligado ? '#111111' : '#FFFFFF' }}
                    transition={{ layout: MOLA, width: { duration: 0.3, times: [0, 0.4, 1] }, backgroundColor: { duration: 0.2 } }}
                />
            </motion.span>
            {rotulo}
        </button>
    );
}
