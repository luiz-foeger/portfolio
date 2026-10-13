'use client';

import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react';
import { useMotionValue } from 'motion/react';

export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const misturar = (a: number, b: number, t: number) => a + (b - a) * t;
export const entraESai = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// progresso da rolagem (0 a 1) de uma seção alta com um bloco sticky dentro. É calculado à mão porque o
// useScroll com offset "preset" do motion 13 usa a ViewTimeline nativa e os valores congelam dentro do sticky
export function useProgresso(ref: RefObject<HTMLElement | null>) {
    const p = useMotionValue(0);
    useEffect(() => {
        const calcular = () => {
            const el = ref.current;
            if (!el) return;
            const topo = el.getBoundingClientRect().top + window.scrollY;
            const curso = el.offsetHeight - window.innerHeight;
            p.set(curso > 0 ? limitar((window.scrollY - topo) / curso) : 0);
        };
        calcular();
        window.addEventListener('scroll', calcular, { passive: true });
        window.addEventListener('resize', calcular);
        return () => {
            window.removeEventListener('scroll', calcular);
            window.removeEventListener('resize', calcular);
        };
    }, [p, ref]);
    return p;
}

export function useTela() {
    const [tela, setTela] = useState({ w: 1440, h: 900 });
    useEffect(() => {
        const medir = () => setTela({ w: window.innerWidth, h: window.innerHeight });
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);
    return tela;
}

// tela de toque (sem mouse): no celular a rolagem vem em trancos e com embalo, então o que acompanha a rolagem ou a
// velocidade dela muda de jeito. ehToque serve dentro de efeitos; useToque, no render (no servidor e na primeira
// passada é false, o mesmo do desktop, e logo em seguida vira o valor do aparelho)
const MOUSE = '(hover: hover) and (pointer: fine)';
export const ehToque = () => !window.matchMedia(MOUSE).matches;
export function useToque() {
    return useSyncExternalStore(
        aviso => {
            const consulta = window.matchMedia(MOUSE);
            consulta.addEventListener('change', aviso);
            return () => consulta.removeEventListener('change', aviso);
        },
        ehToque,
        () => false,
    );
}

// mouse de verdade (no celular não há cursor nem hover)
export function usePonteiroFino() {
    const [fino, setFino] = useState(false);
    useEffect(() => {
        const consulta = window.matchMedia('(hover: hover) and (pointer: fine)');
        const atualizar = () => setFino(consulta.matches);
        atualizar();
        consulta.addEventListener('change', atualizar);
        return () => consulta.removeEventListener('change', atualizar);
    }, []);
    return fino;
}
