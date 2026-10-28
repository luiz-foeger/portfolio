'use client';

import { motion, Variants, Transition, useAnimationControls, useInView } from 'motion/react';
import { useEffect, useId, useRef } from 'react';

// desfoque de movimento só na descida das peças (a entrada da logo): cada peça borra na vertical na medida da
// própria velocidade, medida na tela a cada quadro. Desliga sozinho quando a última assenta; as reorganizações
// (empilhada ↔ escrita) seguem sem desfoque
const LARGURA_VIEWBOX = 3800;
const RASTRO_FATOR = 0.55;
const RASTRO_MAX = 26; // px na tela

function borrarQueda(svg: SVGSVGElement | null, prefixo: string) {
    // nem com movimento reduzido nem em tela de toque (no celular o rastro fica esquisito)
    if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => { };
    const pecas = [...svg.querySelectorAll<SVGPathElement>('path[data-peca]')];
    const filtros = pecas.map((_, i) => svg.querySelector<SVGFEGaussianBlurElement>(`#${prefixo}-${i} feGaussianBlur`));
    const antes = pecas.map(() => NaN);
    const atual = pecas.map(() => 0);
    let fim = false;
    let quadro = 0;
    const passo = () => {
        // px na tela por unidade do desenho (a logo muda de escala com a rolagem)
        const escala = svg.getBoundingClientRect().width / LARGURA_VIEWBOX;
        let algum = false;
        pecas.forEach((p, i) => {
            const y = p.getBoundingClientRect().top;
            const v = Number.isNaN(antes[i]) ? 0 : y - antes[i];
            antes[i] = y;
            atual[i] += (Math.min(RASTRO_MAX, Math.abs(v) * RASTRO_FATOR) - atual[i]) * 0.5;
            const f = filtros[i];
            if (atual[i] > 0.3 && f && escala > 0) {
                algum = true;
                f.setAttribute('stdDeviation', `0 ${(atual[i] / escala).toFixed(1)}`);
                if (!p.hasAttribute('filter')) p.setAttribute('filter', `url(#${prefixo}-${i})`);
            } else if (p.hasAttribute('filter')) p.removeAttribute('filter');
        });
        if (fim && !algum) {
            pecas.forEach(p => p.removeAttribute('filter'));
            return;
        }
        quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    // a descida terminou: o laço para assim que o rastro de todas zera
    return (agora = false) => {
        fim = true;
        if (agora) {
            cancelAnimationFrame(quadro);
            pecas.forEach(p => p.removeAttribute('filter'));
        }
    };
}

export const AnimatedLogoHeader: React.FC<{ desfoqueNaEntrada?: boolean }> = ({ desfoqueNaEntrada = false }) => {
    const controls = useAnimationControls();
    const ref = useRef(null);
    const svg = useRef<SVGSVGElement>(null);
    const prefixo = `queda-${useId().replace(/[^\w-]/g, '')}`;
    const isInView = useInView(ref, { amount: 0.5, once: true });

    useEffect(() => {
        let isMounted = true;
        let pararRastro: ((agora?: boolean) => void) | null = null;
        const sequence = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMounted) return;

            if (isInView) {
                try {
                    if (desfoqueNaEntrada) pararRastro = borrarQueda(svg.current, prefixo);
                    await controls.start("stacked_fall");
                    pararRastro?.();
                    while (isMounted) {
                        await new Promise(resolve => setTimeout(resolve, 4500));
                        if (!isMounted) break;
                        await controls.start("inline_reorganize");
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        if (!isMounted) break;
                        await controls.start("stacked_reorganize");
                    }
                } catch { }
            }
        };
        sequence();
        return () => { isMounted = false; controls.stop(); pararRastro?.(true); };
    }, [controls, isInView, desfoqueNaEntrada, prefixo]);

    // --- TRANSIÇÕES ORIGINAIS RESTAURADAS ---
    const fallBounce: Transition = { type: "spring", stiffness: 120, damping: 14, mass: 1 };
    const jellyLand: Transition = { type: "spring", stiffness: 160, damping: 10, mass: 0.8 };
    const dotBounce: Transition = { type: "spring", stiffness: 180, damping: 8, mass: 0.5 };

    const movements = {
        f: { x: -110, y: 260, rotate: 2 },
        oBody: { x: -105, y: 260, rotate: -2 },
        oDotL: { x: -105, y: 260, rotate: 2 },
        oDotR: { x: -105, y: 260, rotate: -2 },
        eTop: { x: -95, y: 250, rotate: 2 },
        g: { x: 1100, y: -250, rotate: -2 },
        eBottom: { x: 1100, y: -250, rotate: 2 },
        r: { x: 1120, y: -250, rotate: -2 },
        dot: { x: 1120, y: -250, rotate: 2 },
    };

    const delayMap: Record<string, number> = {
        'f': 0.0, 'oBody': 0.1, 'eTop': 0.05,
        'g': 0.15, 'eBottom': 0.2, 'r': 0.25,
        'dot': 0.4, 'oDotL': 0.5, 'oDotR': 0.55
    };

    const createStoneVariant = (letterId: keyof typeof movements, isDot = false): Variants => {
        const target = movements[letterId];
        const myDelay = delayMap[letterId] || 0.1;
        const transitionType = isDot ? dotBounce : jellyLand;
        const stackedState = { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 };

        return {
            hidden: { y: -1200, x: 0, rotate: 0, opacity: 0, scale: 0.5 },
            stacked_fall: {
                ...stackedState,
                transition: { ...fallBounce, delay: myDelay * 0.4 }
            },
            inline_reorganize: {
                x: target.x, y: target.y, rotate: target.rotate, scale: 1,
                transition: { ...transitionType, delay: myDelay }
            },
            stacked_reorganize: {
                ...stackedState, rotate: 0,
                transition: { ...transitionType, delay: (0.7 - myDelay) }
            }
        };
    };

    const groupSlideVariants: Variants = {
        hidden: { x: 450 },
        stacked_fall: { x: 450, transition: { duration: 0.5 } },
        inline_reorganize: { x: 0, transition: { ...jellyLand, delay: 0 } },
        stacked_reorganize: { x: 450, transition: { ...jellyLand, delay: 0.5 } }
    };

    return (
        <div ref={ref} className="w-full flex justify-center items-center overflow-visible">
            <motion.svg ref={svg} viewBox="-800 85 3800 1200" className="w-full text-white overflow-visible" fill="none" initial="hidden" animate={controls}>
                {desfoqueNaEntrada && (
                    <defs>
                        {Array.from({ length: 9 }, (_, i) => (
                            <filter key={i} id={`${prefixo}-${i}`} x="-30%" y="-120%" width="160%" height="340%" colorInterpolationFilters="sRGB">
                                <feGaussianBlur stdDeviation="0 0" />
                            </filter>
                        ))}
                    </defs>
                )}
                <motion.g variants={groupSlideVariants}>
                    <motion.path data-peca id="letter-f" fill="currentColor" variants={createStoneVariant('f')} d="M0.52832 94.6189L44.5283 735.119L278.528 648.619L232.028 435.619L394.528 413.119L363.028 267.119L205.528 312.619L185.528 233.119L431.028 214.119L424.528 0.618896L0.52832 94.6189Z" />
                    <motion.path data-peca id="letter-o-body" fill="currentColor" variants={createStoneVariant('oBody')} fillRule="evenodd" clipRule="evenodd" d="M386.528 589.619L435.528 299.619L689.028 249.119L770.028 368.619L755.028 636.619L478.528 694.619L386.528 589.619ZM547.028 379.619L523.528 538.119L645.028 551.619L635.028 386.119L547.028 379.619Z" />
                    <motion.path data-peca id="letter-o-dot-left" fill="currentColor" variants={createStoneVariant('oDotL', true)} d="M464.528 107.619L471.528 226.619L586.528 218.119L578.528 100.119L464.528 107.619Z" />
                    <motion.path data-peca id="letter-o-dot-right" fill="currentColor" variants={createStoneVariant('oDotR', true)} d="M634.528 86.6189L622.528 203.119L737.028 214.119L747.028 96.1189L634.528 86.6189Z" />
                    <motion.path data-peca id="letter-e-top" fill="currentColor" variants={createStoneVariant('eTop')} fillRule="evenodd" clipRule="evenodd" d="M785.528 575.119L909.528 691.119L1176.53 641.619L1195.03 504.619L943.528 537.119L925.028 504.619L1195.03 441.619L1168.03 251.619L1047.03 202.119L819.028 260.119L785.528 575.119ZM929.528 335.119L917.028 406.119L1062.53 373.619L1045.53 335.119H929.528Z" />
                    <motion.path data-peca id="letter-g" fill="currentColor" variants={createStoneVariant('g')} fillRule="evenodd" clipRule="evenodd" d="M26.5283 1046.12L42.5283 783.619L228.028 715.119L285.528 753.119V692.119L472.028 728.619L455.028 850.619L418.028 858.119L468.528 1226.12L367.028 1353.12L55.5283 1316.62L77.5283 1165.62L282.528 1195.62L301.028 1109.62L180.028 1139.62L26.5283 1046.12ZM180.028 858.119L172.028 982.119L282.528 1014.12V875.119L180.028 858.119Z" />
                    <motion.path data-peca id="letter-e-bottom" fill="currentColor" variants={createStoneVariant('eBottom')} fillRule="evenodd" clipRule="evenodd" d="M464.528 1001.12L474.528 872.119L541.528 723.119L731.528 680.619L864.528 733.619L892.528 923.119L618.528 980.119L632.528 1006.12L889.528 1029.62L839.528 1177.62L529.528 1111.12L464.528 1001.12ZM626.028 807.619L610.028 879.619L759.028 851.119L744.028 814.119L626.028 807.619Z" />
                    <motion.path data-peca id="letter-r" fill="currentColor" variants={createStoneVariant('r')} d="M926.528 871.119L907.028 1171.12L1104.53 1133.12L1052.53 855.619L1097.53 830.619L1126.03 859.119L1129.53 901.119L1237.53 859.119L1258.03 737.619L1135.03 683.619L1038.53 759.619V701.119L892.028 732.619L926.528 871.119Z" />
                    <motion.path data-peca id="symbol-dot" fill="currentColor" variants={createStoneVariant('dot')} d="M1303.53 1145.12L1156.53 1134.62L1163.03 1011.12L1291.53 997.619L1303.53 1145.12Z" />
                </motion.g>
            </motion.svg>
        </div>
    );
};