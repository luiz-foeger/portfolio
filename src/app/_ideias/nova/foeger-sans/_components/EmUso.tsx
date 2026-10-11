'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { TEXTOS_FONTE } from '../_lib/textos';
import { PedraBruta } from './Glifo';

// a fonte em cenários de uso, desenhados em código: um cartaz, uma placa pendurada que balança, adesivos no
// formato do ponto (que estalam ao passar o mouse) e uma tela de celular. Cada cenário fica num quadro escuro,
// como uma foto na página clara. As cores do papel e da placa são do cenário, não do site
const FOEGER = { fontFamily: 'var(--ff-foeger)' };

export default function EmUso() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].uso;
    return (
        <section className="px-[4vw] py-[14vh]">
            <h2 className="mb-[7vh] text-[9vw] md:text-[4.2vw]" style={TIPO.frase}>{t.titulo}</h2>
            <div className="grid gap-[2vw] md:grid-cols-2">
                <Quadro><Cartaz linhas={t.cartaz} /></Quadro>
                <Quadro><Placa texto={t.placa} /></Quadro>
                <Quadro><Adesivos palavras={t.adesivos} /></Quadro>
                <Quadro><Celular linhas={t.celular} /></Quadro>
            </div>
        </section>
    );
}

function Quadro({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-[#1a1a1a] [container-type:inline-size]"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

function Cartaz({ linhas }: { linhas: string[] }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
                className="flex h-[86%] flex-col justify-between rounded-[2px] bg-[#ECE6DA] p-[4.5cqw] text-[#141414] shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
                style={{ aspectRatio: '1 / 1.414', rotate: -2 }}
                whileHover={{ rotate: 0, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            >
                <div className="text-[13.5cqw] leading-[0.9]" style={FOEGER}>
                    {linhas.map(l => <div key={l}>{l}</div>)}
                </div>
                <div className="h-[0.6cqw] w-[30%] bg-[#141414]" />
            </motion.div>
        </div>
    );
}

// a placa balança sozinha devagar; passar o mouse dá um empurrão
function Placa({ texto }: { texto: string }) {
    const reduzido = useReducedMotion() ?? false;
    const giro = useSpring(0, { stiffness: 40, damping: 3.5, mass: 1.2 });
    useEffect(() => {
        if (reduzido) return;
        giro.set(5);
        const id = setInterval(() => giro.set(giro.get() > 0 ? -4 : 4), 2600);
        return () => clearInterval(id);
    }, [reduzido, giro]);
    return (
        <div className="absolute inset-0 flex justify-center" onPointerEnter={() => !reduzido && giro.set(giro.get() > 0 ? -14 : 14)}>
            <motion.div className="relative mt-[6%] flex flex-col items-center" style={{ rotate: giro, originY: 0 }}>
                <div className="flex w-[34cqw] justify-between">
                    <span className="h-[14cqw] w-px bg-white/50" />
                    <span className="h-[14cqw] w-px bg-white/50" />
                </div>
                <div className="rounded-[1.4cqw] bg-[#F1EEE8] px-[6cqw] py-[3.5cqw] text-[#121212] shadow-[0_24px_50px_rgba(0,0,0,0.6)]">
                    <span className="block text-[13cqw] leading-none" style={FOEGER}>{texto}</span>
                </div>
            </motion.div>
        </div>
    );
}

const POSICOES = [
    { left: '8%', top: '12%', rotate: -8, w: 30 },
    { left: '50%', top: '8%', rotate: 7, w: 36 },
    { left: '16%', top: '54%', rotate: 5, w: 33 },
    { left: '54%', top: '50%', rotate: -6, w: 40 },
];

// adesivos no formato do ponto da fonte, que estalam (pop de mola) ao passar o mouse ou tocar
function Adesivos({ palavras }: { palavras: string[] }) {
    return (
        <div className="absolute inset-0">
            {palavras.map((p, i) => {
                const pos = POSICOES[i % POSICOES.length];
                return (
                    <motion.div
                        key={p}
                        className="absolute flex aspect-[1.1] items-center justify-center text-[#121212]"
                        style={{ left: pos.left, top: pos.top, width: `${pos.w}cqw`, rotate: pos.rotate }}
                        whileHover={{ scale: 1.12, rotate: pos.rotate * -0.5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                    >
                        <PedraBruta cheia className="absolute inset-0 h-full w-full text-[#F1EEE8] drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)]" />
                        <span className="relative text-[7cqw] leading-none" style={FOEGER}>{p}</span>
                    </motion.div>
                );
            })}
        </div>
    );
}

// tela de celular: a saudação grande e um aviso que chega de tempos em tempos
function Celular({ linhas }: { linhas: string[] }) {
    const [aviso, setAviso] = useState(0);
    const y = useMotionValue(0);
    useEffect(() => {
        const id = setInterval(() => setAviso(a => a + 1), 3200);
        return () => clearInterval(id);
    }, []);
    useEffect(() => { animate(y, [0, -6, 0], { duration: 0.5 }); }, [aviso, y]);
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-[88%] flex-col gap-[3cqw] overflow-hidden rounded-[5cqw] border border-white/15 bg-[#151515] p-[3.5cqw]" style={{ aspectRatio: '9 / 18' }}>
                <span className="mx-auto mb-[1cqw] h-[1.2cqw] w-[30%] rounded-full bg-white/15" />
                {/* do tamanho que cabe a palavra mais longa ("morning") na largura da tela do celular */}
                <span className="text-[6.6cqw] leading-[0.95] text-white" style={FOEGER}>{linhas[0]}</span>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={aviso}
                        className="rounded-[2.4cqw] bg-white p-[2.6cqw] text-[#121212]"
                        initial={{ opacity: 0, y: -30, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    >
                        <span className="block text-[4.6cqw] leading-[1.05]" style={FOEGER}>{linhas[1]}</span>
                        <span className="block text-[4.6cqw] leading-[1.05]" style={FOEGER}>{linhas[2]}</span>
                    </motion.div>
                </AnimatePresence>
                <motion.div className="mt-auto flex flex-col gap-[1.6cqw]" style={{ y }}>
                    {[78, 56, 66].map((w, i) => <span key={i} className="h-[2.2cqw] rounded-full bg-white/10" style={{ width: `${w}%` }} />)}
                </motion.div>
            </div>
        </div>
    );
}
