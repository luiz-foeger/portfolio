'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useTexto } from '../../_lib/idioma';
import { useSozinha } from '../Palco';

// UX, "para o produto fazer sentido para quem usa": o mesmo cadastro antes (tudo de uma vez, oito campos, três
// botões iguais) e depois (em etapas, dois campos por vez e um caminho claro). Os campos que ficam viajam até o
// lugar novo; o resto vai para as próximas etapas
const MOLA = { type: 'spring', stiffness: 260, damping: 30 } as const;
const EXTRAS = 6;

export default function DemoUx({ ativo }: { ativo: boolean }) {
    const t = useTexto().demos.ux;
    const [depois, setDepois] = useState(false);
    const { sozinha, tocou } = useSozinha(ativo);

    useEffect(() => {
        if (!sozinha) return;
        const id = setInterval(() => setDepois(v => !v), 3000);
        return () => clearInterval(id);
    }, [sozinha]);

    const escolher = (v: boolean) => { setDepois(v); tocou(); };

    return (
        <div className="absolute inset-0 text-white">
            {/* antes / depois */}
            <div className="absolute left-1/2 top-6 flex -translate-x-1/2 rounded-full border border-white/15 p-1" role="tablist">
                {[false, true].map(v => (
                    <button
                        key={String(v)}
                        role="tab"
                        aria-selected={depois === v}
                        onClick={() => escolher(v)}
                        className={`relative rounded-full px-4 py-1.5 text-[14px] transition-colors ${depois === v ? 'text-black' : 'text-white/60 hover:text-white'}`}
                        style={{ fontWeight: 500 }}
                    >
                        {depois === v && <motion.span layoutId="ux-aba" className="absolute inset-0 rounded-full bg-white" transition={MOLA} />}
                        <span className="relative">{v ? t.depois : t.antes}</span>
                    </button>
                ))}
            </div>

            <div className="absolute left-6 right-6 top-[84px] h-[318px] overflow-hidden rounded-[12px] border border-white/10 bg-[#151515]">
                <LayoutGroup>
                    {depois ? (
                        <div className="absolute inset-0 flex flex-col gap-4 p-5">
                            {/* progresso */}
                            <motion.div layout className="flex flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map(i => <span key={i} className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/15'}`} />)}
                                </div>
                                <span className="text-[13px] text-white/55">{t.etapa}</span>
                            </motion.div>
                            {[t.nome, t.email].map((rotulo, i) => (
                                <motion.label key={rotulo} layoutId={`ux-campo-${i}`} className="flex flex-col gap-1.5" transition={MOLA}>
                                    <motion.span layout="position" className="text-[14px] text-white/80">{rotulo}</motion.span>
                                    <motion.span layout className="block h-11 rounded-[8px] border border-white/20 bg-white/[0.03]" />
                                </motion.label>
                            ))}
                            <motion.div layoutId="ux-botao" className="mt-auto flex h-11 items-center justify-center rounded-[8px] bg-white text-[15px] text-black" style={{ fontWeight: 600 }} transition={MOLA}>
                                <motion.span layout="position">{t.continuar}</motion.span>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col gap-2.5 p-4">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                {[t.nome, t.email].map((rotulo, i) => (
                                    <motion.label key={rotulo} layoutId={`ux-campo-${i}`} className="flex flex-col gap-1" transition={MOLA}>
                                        <motion.span layout="position" className="text-[12px] uppercase tracking-wide text-white/45">{rotulo}</motion.span>
                                        <motion.span layout className="block h-7 rounded-[3px] border border-white/15" />
                                    </motion.label>
                                ))}
                                <AnimatePresence>
                                    {Array.from({ length: EXTRAS }, (_, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex flex-col gap-1"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.03 } }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <span className="h-[9px] rounded-full bg-white/15" style={{ width: `${46 + ((i * 23) % 40)}%` }} />
                                            <span className="block h-7 rounded-[3px] border border-white/15" />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            {/* texto miúdo de regras, que ninguém lê */}
                            <div className="mt-1 flex flex-col gap-1.5">
                                {[92, 86, 64].map((w, i) => <span key={i} className="h-[7px] rounded-full bg-white/10" style={{ width: `${w}%` }} />)}
                            </div>
                            <div className="mt-auto grid grid-cols-3 gap-2">
                                <span className="flex h-8 items-center justify-center rounded-[3px] border border-white/20 text-[13px] text-white/70">{t.cancelar}</span>
                                <span className="flex h-8 items-center justify-center rounded-[3px] border border-white/20 text-[13px] text-white/70">{t.limpar}</span>
                                <motion.div layoutId="ux-botao" className="flex h-8 items-center justify-center rounded-[3px] border border-white/20 text-[13px] text-white/70" transition={MOLA}>
                                    <motion.span layout="position">{t.enviar}</motion.span>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </LayoutGroup>
            </div>

            <p className="absolute bottom-6 left-6 right-6 text-center text-[14px] text-white/55">{t.legenda}</p>
        </div>
    );
}
