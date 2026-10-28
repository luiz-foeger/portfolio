'use client';

import { motion, Variants, Transition, useAnimationControls, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export const AnimatedLogoFooter: React.FC = () => { // useAnimatedLogo = () => {
    const controls = useAnimationControls();
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.5, once: true });

    useEffect(() => {
        let isMounted = true;

        const sequence = async () => {
            // garantindo que o componente está montado
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMounted) return; // verifica isMounted antes de continuar

            if (isInView) {
                try {
                    await controls.start("stacked_fall");

                    while (isMounted) { // verifica isMounted em cada volta do loop
                        if (!isMounted) break;

                        await new Promise(resolve => setTimeout(resolve, 3000));

                        if (!isMounted) break;
                        await controls.start("inline_reorganize");

                        await new Promise(resolve => setTimeout(resolve, 3000));

                        if (!isMounted) break;
                        await controls.start("stacked_reorganize");
                    }
                } catch {
                    // ignora erros de interrupção de animação (comuns ao desmontar)
                }
            }
        };

        sequence();

        // cleanup function
        return () => {
            isMounted = false; // avisa o loop para parar
            controls.stop();   // força a parada da animação no Framer Motion
        };
    }, [controls, isInView]);

    // física da animação
    const fallBounce: Transition = { type: "spring", stiffness: 120, damping: 14, mass: 1 };
    const jellyLand: Transition = { type: "spring", stiffness: 160, damping: 10, mass: 0.8 };
    const dotBounce: Transition = { type: "spring", stiffness: 180, damping: 8, mass: 0.5 };

    const movements = {
        // parte de cima
        f: { x: 0, y: 260, rotate: 2 },
        oBody: { x: 0, y: 260, rotate: -2 },
        oDotL: { x: 0, y: 260, rotate: 2 },
        oDotR: { x: 0, y: 260, rotate: -2 },
        eTop: { x: 0, y: 250, rotate: 2 },
        // parte de baixo
        g: { x: 1200, y: -250, rotate: -2 },
        eBottom: { x: 1200, y: -250, rotate: 2 },
        r: { x: 1220, y: -250, rotate: -2 },
        dot: { x: 1220, y: -250, rotate: 2 },
    };

    const delayMap: Record<string, number> = {
        'f': 0.0, 'oBody': 0.1, 'eTop': 0.05,
        'g': 0.15, 'eBottom': 0.2, 'r': 0.25,
        'dot': 0.4, 'oDotL': 0.5, 'oDotR': 0.55
    };

    // de onde cada pedra cai: sorteado uma vez por montagem (sorteado na renderização, mudaria a cada uma)
    const [queda] = useState(() =>
        Object.fromEntries(Object.keys(movements).map(k => [k, { x: (Math.random() - 0.5) * 400, rotate: (Math.random() - 0.5) * 180 }])),
    );

    const createStoneVariant = (letterId: keyof typeof movements, isDot = false): Variants => {
        const target = movements[letterId];
        const myDelay = delayMap[letterId] || 0.1;
        const transitionType = isDot ? dotBounce : jellyLand;
        const stackedState = { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 };

        return {
            hidden: { y: -1200, x: queda[letterId].x, rotate: queda[letterId].rotate, opacity: 0, scale: 0.5 },
            stacked_fall: { ...stackedState, transition: { ...fallBounce, delay: myDelay * 0.4 } },
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

    return (
        <div ref={ref} className="w-full flex justify-center items-center overflow-visible">
            <motion.svg
                // viewBox="-100 0 2400 1200"
                viewBox="-100 0 2800 1200"
                className="w-full text-white overflow-visible"
                fill="none"
                initial="hidden"
                animate={controls}
            >
                {/* letter F */}
                <motion.path
                    id="letter-f"
                    fill="currentColor"
                    variants={createStoneVariant('f')}

                    d="M0.52832 94.6189L44.5283 735.119L278.528 648.619L232.028 435.619L394.528 413.119L363.028 267.119L205.528 312.619L185.528 233.119L431.028 214.119L424.528 0.618896L0.52832 94.6189Z" />

                {/* letter O (body) */}
                <motion.path
                    id="letter-o-body"
                    fill="currentColor"
                    variants={createStoneVariant('oBody')}
                    fillRule="evenodd"
                    clipRule="evenodd"

                    d="M386.528 589.619L435.528 299.619L689.028 249.119L770.028 368.619L755.028 636.619L478.528 694.619L386.528 589.619ZM547.028 379.619L523.528 538.119L645.028 551.619L635.028 386.119L547.028 379.619Z" />

                {/* letter O (dots) */}
                <motion.path
                    id="letter-o-dot-left"
                    fill="currentColor"
                    variants={createStoneVariant('oDotL', true)}

                    d="M464.528 107.619L471.528 226.619L586.528 218.119L578.528 100.119L464.528 107.619Z" />
                <motion.path
                    id="letter-o-dot-right"
                    fill="currentColor"
                    variants={createStoneVariant('oDotR', true)}

                    d="M634.528 86.6189L622.528 203.119L737.028 214.119L747.028 96.1189L634.528 86.6189Z" />

                {/* letter E (top) */}
                <motion.path
                    id="letter-e-top"
                    fill="currentColor"
                    variants={createStoneVariant('eTop')}
                    fillRule="evenodd"
                    clipRule="evenodd"

                    d="M785.528 575.119L909.528 691.119L1176.53 641.619L1195.03 504.619L943.528 537.119L925.028 504.619L1195.03 441.619L1168.03 251.619L1047.03 202.119L819.028 260.119L785.528 575.119ZM929.528 335.119L917.028 406.119L1062.53 373.619L1045.53 335.119H929.528Z" />

                {/* letter G */}
                <motion.path
                    id="letter-g"
                    fill="currentColor"
                    variants={createStoneVariant('g')}
                    fillRule="evenodd"
                    clipRule="evenodd"

                    d="M26.5283 1046.12L42.5283 783.619L228.028 715.119L285.528 753.119V692.119L472.028 728.619L455.028 850.619L418.028 858.119L468.528 1226.12L367.028 1353.12L55.5283 1316.62L77.5283 1165.62L282.528 1195.62L301.028 1109.62L180.028 1139.62L26.5283 1046.12ZM180.028 858.119L172.028 982.119L282.528 1014.12V875.119L180.028 858.119Z" />

                {/* letter E (bottom) */}
                <motion.path
                    id="letter-e-bottom"
                    fill="currentColor"
                    variants={createStoneVariant('eBottom')}
                    fillRule="evenodd"
                    clipRule="evenodd"

                    d="M464.528 1001.12L474.528 872.119L541.528 723.119L731.528 680.619L864.528 733.619L892.528 923.119L618.528 980.119L632.528 1006.12L889.528 1029.62L839.528 1177.62L529.528 1111.12L464.528 1001.12ZM626.028 807.619L610.028 879.619L759.028 851.119L744.028 814.119L626.028 807.619Z" />

                {/* letter R */}
                <motion.path
                    id="letter-r"
                    fill="currentColor"
                    variants={createStoneVariant('r')}

                    d="M926.528 871.119L907.028 1171.12L1104.53 1133.12L1052.53 855.619L1097.53 830.619L1126.03 859.119L1129.53 901.119L1237.53 859.119L1258.03 737.619L1135.03 683.619L1038.53 759.619V701.119L892.028 732.619L926.528 871.119Z" />

                {/* symbol dot */}
                <motion.path
                    id="symbol-dot"
                    fill="currentColor"
                    variants={createStoneVariant('dot')}

                    d="M1303.53 1145.12L1156.53 1134.62L1163.03 1011.12L1291.53 997.619L1303.53 1145.12Z" />
            </motion.svg>
        </div>
    );
};