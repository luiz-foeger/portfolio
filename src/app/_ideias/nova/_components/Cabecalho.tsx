'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useLenis } from 'lenis/react';
import { AnimatedLogoHeader } from '../../../../components/ui/AnimatedLogoHeader';
import { useIdioma, useTexto } from '../_lib/idioma';
import { TIPO } from '../_lib/tipo';

// a logo de hoje, igual (o xodó): começa grande no centro e vira o cabeçalho com a rolagem, alternando entre a
// versão empilhada e a escrita. Na entrada, as peças caem com desfoque de movimento. Ao lado, o menu e o idioma
export default function Cabecalho() {
    const t = useTexto();
    const { idioma, definir } = useIdioma();
    const lenis = useLenis();
    const [tela, setTela] = useState({ h: 1000, movel: false });
    const [pronto, setPronto] = useState(false);
    const [noRodape, setNoRodape] = useState(false);

    useEffect(() => {
        const medir = () => setTela({ h: window.innerHeight, movel: window.innerWidth < 768 });
        medir();
        setPronto(true);
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);

    // some quando o rodapé entra, como hoje
    useEffect(() => {
        const rodape = document.querySelector('footer');
        if (!rodape) return;
        const observador = new IntersectionObserver(([e]) => setNoRodape(e.isIntersecting), { threshold: 0.1 });
        observador.observe(rodape);
        return () => observador.disconnect();
    }, []);

    const { scrollY } = useScroll();
    const altura = useTransform(scrollY, [0, 400], [tela.h, 88]);
    const escala = useTransform(scrollY, [0, 400], [tela.movel ? 1.5 : 3, 0.45]);

    const ir = (alvo: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (lenis) lenis.scrollTo(alvo, { duration: 1.6 });
        else document.querySelector(alvo)?.scrollIntoView({ behavior: 'smooth' });
    };
    const menu = [
        { texto: t.menu.servicos, alvo: '#servicos' },
        { texto: t.menu.laboratorio, alvo: '#laboratorio' },
        { texto: t.menu.contato, alvo: '#contato' },
    ];

    return (
        <>
            <section aria-label={t.inicio} className="relative h-[100dvh] w-full" />
            {pronto && (
                <motion.div
                    style={{ height: altura }}
                    animate={{ opacity: noRodape ? 0 : 1 }}
                    transition={{ duration: 0.5 }}
                    className="pointer-events-none fixed left-0 top-0 z-50 flex w-full flex-col items-center justify-center overflow-visible"
                >
                    <motion.div style={{ scale: escala }} className="pointer-events-auto relative flex items-center justify-center">
                        <button
                            onClick={() => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
                            className="block cursor-pointer border-none bg-transparent p-0 outline-hidden"
                            aria-label={t.inicio}
                        >
                            <AnimatedLogoHeader desfoqueNaEntrada />
                        </button>
                    </motion.div>
                </motion.div>
            )}
            <motion.nav
                animate={{ opacity: noRodape ? 0 : 1 }}
                transition={{ duration: 0.5 }}
                className="fixed right-0 top-0 z-50 flex h-[88px] items-center gap-7 px-5 text-[15px] md:px-10"
                style={TIPO.menu}
            >
                {menu.map(m => (
                    <a key={m.alvo} href={m.alvo} onClick={ir(m.alvo)} className="hidden text-white/70 transition-colors hover:text-white md:inline">
                        {m.texto}
                    </a>
                ))}
                <span className="flex items-center gap-1.5 md:ml-3" role="group" aria-label="Idioma / Language">
                    {(['pt', 'en'] as const).map((i, n) => (
                        <span key={i} className="flex items-center gap-1.5">
                            {n > 0 && <span aria-hidden className="text-white/30">/</span>}
                            <button
                                onClick={() => definir(i)}
                                aria-pressed={idioma === i}
                                lang={i === 'pt' ? 'pt-BR' : 'en'}
                                className={`uppercase transition-colors ${idioma === i ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                            >
                                {i}
                            </button>
                        </span>
                    ))}
                </span>
            </motion.nav>
        </>
    );
}
