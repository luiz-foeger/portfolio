'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { TEXTOS_FONTE } from '../_lib/textos';
import type { Peca } from '../_lib/glifos';
import { GlifoSvg } from './Glifo';

// três características, cada uma mostrada em vez de descrita: minúsculas altas, pedras soltas (pingos, tremas e
// acentos são pedaços à parte, que pulam) e o tamanho (um peso só, do grito à leitura)
const SOLTAS = ['i', 'j', 'ö', 'á', 'ê', 'ã', 'í', 'ô'];
const TAMANHOS = ['clamp(44px, 9vw, 150px)', 'clamp(30px, 5vw, 84px)', 'clamp(22px, 2.8vw, 46px)', 'clamp(17px, 1.6vw, 26px)', '15px'];

export default function Caracteristicas() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].caracteristicas;

    return (
        <section className="flex flex-col gap-[18vh] px-[4vw] py-[18vh]">
            <Bloco titulo={t.alto.titulo} texto={t.alto.texto}>
                <div className="flex items-end gap-[3vw] leading-none" style={{ fontFamily: 'var(--ff-foeger)' }} aria-hidden>
                    <span className="text-[34vw] md:text-[22vw]">H</span>
                    <span className="text-[34vw] md:text-[22vw]">x</span>
                </div>
            </Bloco>

            <Bloco titulo={t.soltas.titulo} texto={t.soltas.texto}>
                <PedrasSoltas />
            </Bloco>

            <Bloco titulo={t.tamanhos.titulo} texto={t.tamanhos.texto}>
                {/* as linhas grandes passam da coluna de propósito e somem num degradê na borda */}
                <div
                    className="flex flex-col gap-[2.2vh] overflow-hidden"
                    style={{ fontFamily: 'var(--ff-foeger)', maskImage: 'linear-gradient(to right, black 78%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black 78%, transparent)' }}
                >
                    {TAMANHOS.map((tamanho, i) => (
                        <motion.p
                            key={i}
                            className="whitespace-nowrap leading-[1.05]"
                            style={{ fontSize: tamanho }}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {t.frase}
                        </motion.p>
                    ))}
                </div>
            </Bloco>
        </section>
    );
}

function Bloco({ titulo, texto, children }: { titulo: string; texto: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-8 md:grid-cols-12 md:gap-x-[4vw]">
            <div className="flex flex-col gap-3 md:col-span-4">
                <h2 className="text-[8vw] md:text-[3.2vw]" style={TIPO.frase}>{titulo}</h2>
                <p className="max-w-[36ch] text-lg text-black/60 md:text-xl" style={TIPO.texto}>{texto}</p>
            </div>
            <div className="min-w-0 md:col-span-8">{children}</div>
        </div>
    );
}

// letras com pedaços soltos: o corpo fica, as pedras (pingo, trema, acento) pulam, giram um pouco e caem de volta.
// No mouse, pula a que está embaixo; no toque, a tocada; parado, uma por vez se mexe sozinha
function PedrasSoltas() {
    const reduzido = useReducedMotion() ?? false;
    const pulos = useRef<(() => void)[]>([]);
    const [mexeu, setMexeu] = useState(false);

    useEffect(() => {
        if (reduzido || mexeu) return;
        let n = 0;
        const id = setInterval(() => pulos.current[n++ % SOLTAS.length]?.(), 1100);
        return () => clearInterval(id);
    }, [reduzido, mexeu]);

    return (
        <div className="flex flex-wrap items-end gap-x-[2.5vw] gap-y-6">
            {SOLTAS.map((c, i) => (
                <LetraComPedras key={c} c={c} registrar={f => { pulos.current[i] = f; }} aoTocar={() => setMexeu(true)} reduzido={reduzido} />
            ))}
        </div>
    );
}

function LetraComPedras({ c, registrar, aoTocar, reduzido }: { c: string; registrar: (f: () => void) => void; aoTocar: () => void; reduzido: boolean }) {
    const ys = [useMotionValue(0), useMotionValue(0), useMotionValue(0)];
    const giros = [useMotionValue(0), useMotionValue(0), useMotionValue(0)];
    const pular = () => {
        if (reduzido) return;
        // só os pedaços soltos (o primeiro é o corpo)
        [1, 2].forEach((k, n) => {
            const sobe = -(260 + n * 70);
            animate(ys[k], [0, sobe, 0, sobe * 0.14, 0], { duration: 0.9, delay: n * 0.07, times: [0, 0.36, 0.7, 0.85, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'] });
            animate(giros[k], [0, (n ? -1 : 1) * 24, 0], { duration: 0.9, delay: n * 0.07, ease: 'easeInOut' });
        });
    };
    registrar(pular);

    // o motion gira cada pedaço em volta do próprio centro (transform-box: fill-box)
    const peca = (p: Peca, i: number) => (i === 0 ? (
        <path key={i} d={p.d} fill="currentColor" fillRule="evenodd" />
    ) : (
        <motion.path key={i} d={p.d} fill="currentColor" fillRule="evenodd" style={{ y: ys[i] ?? 0, rotate: giros[i] ?? 0 }} />
    ));

    return (
        <button
            onPointerEnter={e => { if (e.pointerType === 'mouse') { aoTocar(); pular(); } }}
            onClick={() => { aoTocar(); pular(); }}
            className="block cursor-pointer text-[#111]"
            aria-label={c}
        >
            <GlifoSvg c={c} className="h-[26vw] w-auto md:h-[13vw]" peca={peca} />
        </button>
    );
}
