'use client';

import { useLayoutEffect, useRef } from 'react';
import { animate, motion, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { ajustarLargura } from '../../_comum/ajuste';
import { useIdioma, useTexto } from '../_lib/idioma';
import { EMAIL, LINKS } from '../_lib/textos';
import { TIPO } from '../_lib/tipo';

const SAI = { initial: { y: 0 }, hover: { y: '-100%', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } };
const ENTRA = { initial: { y: '100%' }, hover: { y: '0%', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } } };
const EM_CASCATA = { hover: { transition: { staggerChildren: 0.015 } } };
// rastro da troca de letras: sobe rápido quando elas disparam e some enquanto assentam
const RASTRO = 0.07; // em, no pico
const RASTRO_DURA = 0.85;

// o rodapé: a chamada, o e-mail de ponta a ponta (com a troca de letras de hoje, agora com desfoque de movimento) e
// os links. Sem relógio, ano ou cidade
export default function Contato() {
    const t = useTexto();
    const { idioma } = useIdioma();
    const ancora = useRef<HTMLAnchorElement>(null);
    const linha = useRef<HTMLDivElement>(null);
    const caixa = useRef<HTMLDivElement>(null);
    const rastro = useRef<SVGFEGaussianBlurElement>(null);
    const animacao = useRef<AnimationPlaybackControls | null>(null);
    const reduzido = useReducedMotion() ?? false;

    // o tamanho vai no link, para as duas camadas da troca de letras herdarem o mesmo
    useLayoutEffect(() => {
        const ajustar = () => {
            const a = ancora.current;
            const el = linha.current;
            const c = caixa.current;
            if (a && el && c) ajustarLargura(a, el, c.clientWidth);
        };
        ajustar();
        document.fonts?.ready.then(ajustar);
        window.addEventListener('resize', ajustar);
        return () => window.removeEventListener('resize', ajustar);
    }, [idioma]);

    const borrar = () => {
        const a = ancora.current;
        const f = rastro.current;
        if (!a || !f || reduzido) return;
        const pico = (parseFloat(a.style.fontSize) || 100) * RASTRO;
        animacao.current?.stop();
        a.style.filter = 'url(#email-rastro)';
        animacao.current = animate(0, 1, {
            duration: RASTRO_DURA,
            ease: 'linear',
            onUpdate: v => {
                const forca = v < 0.12 ? v / 0.12 : Math.exp(-(v - 0.12) * 6);
                f.setAttribute('stdDeviation', `0 ${(pico * forca).toFixed(2)}`);
            },
            onComplete: () => { a.style.filter = ''; },
        });
    };

    return (
        <footer id="contato" className="relative flex min-h-svh flex-col justify-between px-[4vw] pb-[5vh] pt-[18vh]">
            <p className="text-[9vw] md:text-[4.4vw]" style={TIPO.frase}>{t.contato.chamada}</p>

            <div ref={caixa} className="w-full">
                <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
                    <filter id="email-rastro" x="0%" y="-20%" width="100%" height="140%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur ref={rastro} stdDeviation="0 0" />
                    </filter>
                </svg>
                <motion.a
                    ref={ancora}
                    href={`mailto:${EMAIL}`}
                    initial="initial"
                    whileHover="hover"
                    onHoverStart={borrar}
                    onHoverEnd={borrar}
                    className="relative block overflow-hidden"
                    aria-label={EMAIL}
                >
                    <motion.div ref={linha} className="flex w-max" variants={EM_CASCATA} style={TIPO.largo} aria-hidden>
                        {[...EMAIL].map((c, i) => <motion.span key={i} variants={SAI} className="inline-block">{c}</motion.span>)}
                    </motion.div>
                    <motion.div className="absolute left-0 top-0 flex w-max" variants={EM_CASCATA} style={TIPO.largo} aria-hidden>
                        {[...EMAIL].map((c, i) => <motion.span key={i} variants={ENTRA} className="inline-block">{c}</motion.span>)}
                    </motion.div>
                </motion.a>
            </div>

            <nav className="flex flex-wrap gap-x-8 gap-y-2 text-lg md:text-xl" style={TIPO.menu}>
                {LINKS.map(l => (
                    <a key={l.texto} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-white/60 transition-colors hover:text-white">
                        {l.texto}
                    </a>
                ))}
            </nav>
        </footer>
    );
}
