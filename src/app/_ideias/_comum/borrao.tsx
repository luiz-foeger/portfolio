'use client';

import { useEffect, useId, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

// desfoque de movimento: borra só na direção em que a coisa anda, na medida da velocidade, como os jogos fazem
// para o movimento parecer mais fluido. A velocidade é o quanto o próprio elemento andou na tela desde o quadro
// anterior (preso num sticky, não anda e não borra); lerVelocidade troca isso por outra fonte, em px por quadro.
// Parado, o filtro sai (filter: none), porque desfoque em letra grande pesa. Em tela de toque não borra: a rolagem
// com o dedo vem em trancos e com embalo, e o rastro fica tremido
export function useBorrao<T extends HTMLElement>(eixo: 'v' | 'h', { lerVelocidade, fator = 0.45, maximo = 14 }: { lerVelocidade?: () => number; fator?: number; maximo?: number } = {}) {
    const id = `borrao-${useId().replace(/[^\w-]/g, '')}`;
    const alvo = useRef<T>(null);
    const desfoque = useRef<SVGFEGaussianBlurElement>(null);
    const reduzido = useReducedMotion() ?? false;
    const ler = useRef(lerVelocidade);
    ler.current = lerVelocidade;

    useEffect(() => {
        const el = alvo.current;
        const blur = desfoque.current;
        if (!el || !blur || reduzido || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        let atual = 0;
        let ligado = false;
        let visivel = true;
        let quadro = 0;
        let antes: number | null = null;
        const posicao = () => {
            const r = el.getBoundingClientRect();
            return eixo === 'v' ? r.top : r.left;
        };
        const passo = () => {
            quadro = requestAnimationFrame(passo);
            if (!visivel) { antes = null; return; }
            let v = 0;
            if (ler.current) v = ler.current();
            else {
                const agora = posicao();
                if (antes !== null) v = agora - antes;
                antes = agora;
            }
            atual += (Math.min(maximo, Math.abs(v) * fator) - atual) * 0.35;
            if (atual < 0.25) {
                if (ligado) { el.style.filter = ''; ligado = false; }
                return;
            }
            blur.setAttribute('stdDeviation', eixo === 'v' ? `0 ${atual.toFixed(2)}` : `${atual.toFixed(2)} 0`);
            if (!ligado) { el.style.filter = `url(#${id})`; ligado = true; }
        };
        const observador = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; });
        observador.observe(el);
        quadro = requestAnimationFrame(passo);
        return () => {
            cancelAnimationFrame(quadro);
            observador.disconnect();
            el.style.filter = '';
        };
    }, [eixo, fator, maximo, id, reduzido]);

    const filtro = (
        <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
            <filter id={id} x={eixo === 'h' ? '-8%' : '0%'} y={eixo === 'v' ? '-15%' : '0%'} width={eixo === 'h' ? '116%' : '100%'} height={eixo === 'v' ? '130%' : '100%'} colorInterpolationFilters="sRGB">
                <feGaussianBlur ref={desfoque} stdDeviation="0" />
            </filter>
        </svg>
    );
    return { alvo, filtro };
}
