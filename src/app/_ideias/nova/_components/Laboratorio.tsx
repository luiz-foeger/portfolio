'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useTransform } from 'motion/react';
import { useProgresso } from '../../_comum/progresso';
import { useBorrao } from '../../_comum/borrao';
import { useIdioma, useTexto } from '../_lib/idioma';
import { TIPO } from '../_lib/tipo';

// fora da home desde 16/10/2026 (no lugar dele entraram os projetos e o fecho); guardado para continuar depois.
// laboratório: estudos e projetos próprios no lugar dos trabalhos antigos. O título estreito e pesado atravessa a
// tela com a rolagem (borrando na horizontal quando corre) e embaixo vem o primeiro estudo, a Foeger Sans,
// escrita com a própria fonte. Ela ainda não tem pontuação além de ponto e vírgula, então a amostra só usa letras
const ALFABETO = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', 'abcdefghijklm', 'nopqrstuvwxyz', '0123456789'];

// claro: a letra escura, para quando a página passa para o tema claro (o fundo vem de quem chama)
export default function Laboratorio({ claro = false }: { claro?: boolean }) {
    const t = useTexto().laboratorio;
    const { idioma } = useIdioma();
    const trilho = useRef<HTMLDivElement>(null);
    const palavra = useRef<HTMLHeadingElement>(null);
    const p = useProgresso(trilho);
    const [curso, setCurso] = useState({ de: 0, ate: 0 });

    // a palavra entra pela direita e sai pela esquerda: o percurso depende da largura dela
    useLayoutEffect(() => {
        const medir = () => {
            const el = palavra.current;
            if (!el) return;
            setCurso({ de: window.innerWidth * 0.35, ate: -(el.scrollWidth - window.innerWidth * 0.65) });
        };
        medir();
        document.fonts?.ready.then(medir);
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, [idioma]);

    const x = useTransform(p, [0, 1], [curso.de, curso.ate]);
    const anterior = useRef(0);
    const { alvo, filtro } = useBorrao<HTMLDivElement>('h', {
        lerVelocidade: () => {
            const atual = x.get();
            const v = atual - anterior.current;
            anterior.current = atual;
            return v;
        },
        fator: 0.35,
        maximo: 18,
    });

    return (
        <section id="laboratorio" className="relative">
            {filtro}
            <div ref={trilho} className="relative h-[220vh]">
                <div className="sticky top-0 flex h-svh items-center overflow-hidden">
                    <div ref={alvo}>
                        <motion.h2 ref={palavra} className="w-max whitespace-nowrap text-[44vw] md:text-[30vw]" style={{ ...TIPO.titulo, x }}>
                            {t.titulo}
                        </motion.h2>
                    </div>
                </div>
            </div>

            <div className="grid gap-y-10 px-[4vw] pb-[22vh] md:grid-cols-12 md:gap-x-[4vw]">
                <p className={`max-w-[34ch] text-lg md:col-span-4 md:text-xl ${claro ? 'text-[#050505]/65' : 'text-white/65'}`} style={TIPO.texto}>
                    {t.texto}
                </p>
                <div className="md:col-span-8">
                    <p className="text-[19vw] leading-[0.95] md:text-[10vw]" style={{ fontFamily: 'var(--ff-foeger)' }} lang="pt-BR">
                        {t.amostra}
                    </p>
                    <div className={`mt-[5vh] flex flex-col gap-1 text-[7.4vw] leading-[1.08] md:text-[3.4vw] ${claro ? 'text-[#050505]/80' : 'text-white/80'}`} style={{ fontFamily: 'var(--ff-foeger)' }} aria-hidden>
                        {ALFABETO.map(linha => <span key={linha} className="break-all">{linha}</span>)}
                    </div>
                </div>
            </div>
        </section>
    );
}
