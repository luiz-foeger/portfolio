'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useVelocity } from 'motion/react';

// as demonstrações são desenhadas numa prancha fixa de 400×460 e escaladas para caber no palco: assim o texto e as
// medidas ficam iguais no desktop e no celular, só maiores ou menores
export const PRANCHA = { w: 400, h: 460 };

export function Palco({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    const caixa = useRef<HTMLDivElement>(null);
    const [escala, setEscala] = useState(1);

    useEffect(() => {
        const el = caixa.current;
        if (!el) return;
        const medir = () => setEscala(el.clientWidth / PRANCHA.w);
        medir();
        const observador = new ResizeObserver(medir);
        observador.observe(el);
        return () => observador.disconnect();
    }, []);

    return (
        <div
            ref={caixa}
            className={`relative w-full overflow-hidden rounded-[14px] border border-white/10 bg-[#0b0b0b] ${className}`}
            style={{ aspectRatio: `${PRANCHA.w} / ${PRANCHA.h}`, ...style }}
        >
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: PRANCHA.w, height: PRANCHA.h, transform: `scale(${escala})` }}>
                {children}
            </div>
        </div>
    );
}

// troca de conteúdo com desfoque de movimento: o que sai sobe e o que entra vem de baixo, borrando na vertical
// na medida da velocidade
export function TrocaComRastro({ chave, children }: { chave: string | number; children: React.ReactNode }) {
    return (
        <AnimatePresence initial={false} mode="popLayout">
            <Camada key={chave}>{children}</Camada>
        </AnimatePresence>
    );
}

function Camada({ children }: { children: React.ReactNode }) {
    const id = `troca-${useId().replace(/[^\w-]/g, '')}`;
    const y = useMotionValue(0);
    const velocidade = useVelocity(y);
    const filtro = useRef<SVGFEGaussianBlurElement>(null);
    const camada = useRef<HTMLDivElement>(null);
    const reduzido = useReducedMotion() ?? false;

    useMotionValueEvent(velocidade, 'change', v => {
        const el = camada.current;
        const f = filtro.current;
        if (!el || !f || reduzido) return;
        const s = Math.min(14, Math.abs(v) * 0.012);
        if (s < 0.3) { el.style.filter = ''; return; }
        f.setAttribute('stdDeviation', `0 ${s.toFixed(2)}`);
        el.style.filter = `url(#${id})`;
    });

    return (
        <motion.div
            ref={camada}
            className="absolute inset-0"
            style={{ y }}
            initial={{ y: reduzido ? 0 : 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ y: reduzido ? 0 : -70, opacity: 0, transition: { duration: 0.35, ease: [0.55, 0, 1, 0.45] } }}
        >
            <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
                <filter id={id} x="0%" y="-20%" width="100%" height="140%" colorInterpolationFilters="sRGB">
                    <feGaussianBlur ref={filtro} stdDeviation="0 0" />
                </filter>
            </svg>
            {children}
        </motion.div>
    );
}

// liga a demonstração só quando ela aparece de verdade (no celular, cada uma tem o seu palco)
export function useNaTela<T extends HTMLElement>(limiar = 0.35) {
    const ref = useRef<T>(null);
    const [naTela, setNaTela] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observador = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: limiar });
        observador.observe(el);
        return () => observador.disconnect();
    }, [limiar]);
    return { ref, naTela };
}

// enquanto ninguém mexeu, a demonstração se mostra sozinha; depois de um gesto, espera um tempo antes de voltar
export function useSozinha(ativo: boolean, pausa = 7000) {
    const [mexeu, setMexeu] = useState(0);
    const [agora, setAgora] = useState(0);
    useEffect(() => {
        if (!mexeu) return;
        const id = setTimeout(() => setAgora(Date.now()), pausa);
        return () => clearTimeout(id);
    }, [mexeu, pausa]);
    const sozinha = ativo && (!mexeu || agora - mexeu >= pausa);
    return { sozinha, tocou: () => { setMexeu(Date.now()); setAgora(Date.now()); } };
}
