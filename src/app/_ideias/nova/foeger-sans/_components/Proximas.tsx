'use client';

import { motion } from 'motion/react';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { FALTAM_MAIUSCULAS } from '../_lib/glifos';
import { FALTAM_OUTRAS, TEXTOS_FONTE } from '../_lib/textos';
import { PedraBruta } from './Glifo';

// o fecho: o que ainda vai sair da pedra. Cada uma é uma pedra bruta com o caractere que vai virar, na fonte do
// site (porque na Foeger Sans ele ainda não existe). Passar o mouse faz a pedra balançar
export default function Proximas() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].proximas;
    const lista = [...FALTAM_MAIUSCULAS, ...FALTAM_OUTRAS];
    return (
        <section className="px-[4vw] py-[14vh]">
            <div className="mb-[7vh] grid gap-4 md:grid-cols-12 md:gap-x-[4vw]">
                <h2 className="text-[9vw] md:col-span-6 md:text-[4.2vw]" style={TIPO.frase}>{t.titulo}</h2>
                <p className="max-w-[40ch] self-end text-lg text-black/60 md:col-span-5 md:col-start-8 md:text-xl" style={TIPO.texto}>{t.texto}</p>
            </div>
            <div className="flex flex-wrap gap-[2vw]">
                {lista.map((c, i) => (
                    <motion.span
                        key={c}
                        className="relative flex h-[19vw] w-[19vw] items-center justify-center text-black/70 md:h-[8vw] md:w-[8vw]"
                        initial={{ opacity: 0, y: 30, rotate: (i % 2 ? 1 : -1) * 6 }}
                        whileInView={{ opacity: 1, y: 0, rotate: (i % 3) - 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: (i % 9) * 0.03 }}
                        whileHover={{ rotate: [0, -8, 6, -3, 0], transition: { duration: 0.6 } }}
                    >
                        <PedraBruta className="absolute inset-0 h-full w-full text-black/30" />
                        <span className="relative text-[7vw] md:text-[3vw]" style={TIPO.menu}>{c}</span>
                    </motion.span>
                ))}
            </div>
        </section>
    );
}
