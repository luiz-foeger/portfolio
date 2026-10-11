'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { GLIFOS, FALTAM_MAIUSCULAS } from '../_lib/glifos';
import { FALTAM_OUTRAS, TEXTOS_FONTE } from '../_lib/textos';
import { GlifoSvg, PedraBruta, existe } from './Glifo';

// letra por letra: todas as que existem e, no fim, as pedras brutas (o que ainda vai ser desenhado). Passar o mouse
// (ou tocar, ou focar pelo teclado) abre a lupa: o fundo escurece devagar e a letra aparece grande no centro, num
// corte seco, com a família dela embaixo (como na Feixen)
const ORDEM = [
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZÖ',
    ...'abcdefghijklmnopqrstuvwxyzö',
    ...'áâãçéêíóô',
    ...'0123456789',
    ...'.,',
];
const base = (c: string) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Glifos() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].glifos;
    const [ativo, setAtivo] = useState<string | null>(null);
    const faltam = useMemo(() => [...FALTAM_MAIUSCULAS, ...FALTAM_OUTRAS], []);
    const lista = ORDEM.filter(existe);

    // a família: as letras que existem com a mesma base (a, A, á, â, ã...)
    const familia = (c: string) => Object.keys(GLIFOS).filter(o => /\p{L}/u.test(o) && base(o) === base(c) && /\p{L}/u.test(c));

    const abrir = (c: string) => () => setAtivo(c);
    const fechar = () => setAtivo(null);

    // no toque, encostar fora da grade (ou rolar) fecha a lupa
    useEffect(() => {
        if (!ativo) return;
        const fora = (e: PointerEvent) => { if (!(e.target as Element)?.closest?.('[data-glifos]')) setAtivo(null); };
        const rolou = () => setAtivo(null);
        document.addEventListener('pointerdown', fora);
        window.addEventListener('scroll', rolou, { passive: true, once: true });
        return () => {
            document.removeEventListener('pointerdown', fora);
            window.removeEventListener('scroll', rolou);
        };
    }, [ativo]);

    return (
        <section className="px-[4vw] py-[16vh]">
            <div className="mb-[8vh] grid gap-4 md:grid-cols-12 md:gap-x-[4vw]">
                <h2 className="text-[9vw] md:col-span-6 md:text-[4.2vw]" style={TIPO.frase}>{t.titulo}</h2>
                <p className="max-w-[40ch] self-end text-lg text-black/60 md:col-span-5 md:col-start-8 md:text-xl" style={TIPO.texto}>{t.texto}</p>
            </div>

            <div data-glifos className="grid grid-cols-6 gap-1 md:grid-cols-12" onPointerLeave={e => { if (e.pointerType === 'mouse') fechar(); }}>
                {lista.map(c => (
                    <button
                        key={c}
                        onPointerEnter={e => { if (e.pointerType === 'mouse') setAtivo(c); }}
                        onFocus={abrir(c)}
                        onBlur={fechar}
                        onClick={() => setAtivo(a => (a === c ? null : c))}
                        className={`flex aspect-square items-center justify-center rounded-[6px] text-[9vw] leading-none transition-colors md:text-[4.4vw] ${ativo === c ? 'bg-black/[0.07]' : 'hover:bg-black/[0.04]'}`}
                        style={{ fontFamily: 'var(--ff-foeger)' }}
                        aria-label={c}
                    >
                        {c}
                    </button>
                ))}
                {faltam.map(c => (
                    <button
                        key={`falta-${c}`}
                        onPointerEnter={e => { if (e.pointerType === 'mouse') setAtivo(c); }}
                        onFocus={abrir(c)}
                        onBlur={fechar}
                        onClick={() => setAtivo(a => (a === c ? null : c))}
                        className={`relative flex aspect-square items-center justify-center rounded-[6px] text-black/35 transition-colors ${ativo === c ? 'bg-black/[0.07]' : 'hover:bg-black/[0.04]'}`}
                        aria-label={`${c}: ${t.falta}`}
                    >
                        <PedraBruta className="absolute h-[58%] w-[58%]" />
                        <span className="relative text-[4.4vw] md:text-[1.7vw]" style={TIPO.menu}>{c}</span>
                    </button>
                ))}
            </div>

            {/* a lupa: o fundo escurece devagar; o cartão aparece e some seco */}
            <motion.div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-40 bg-black"
                initial={false}
                animate={{ opacity: ativo ? 0.6 : 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
            />
            <AnimatePresence>
                {ativo && (
                    <motion.div
                        key={ativo}
                        className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-[4vw]"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0 } }}
                        role="status"
                    >
                    {/* o cartão tem fundo próprio, para não brigar com a grade escurecida atrás */}
                    <div className="flex flex-col items-center justify-center gap-6 rounded-[18px] border border-black/10 bg-[#F3F1EC] px-[6vh] py-[5vh] text-[#111] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                        {existe(ativo) ? (
                            <GlifoSvg c={ativo} className="h-[38vh] w-auto text-[#111]" />
                        ) : (
                            <div className="relative flex h-[30vh] w-[30vh] items-center justify-center text-black/70">
                                <PedraBruta className="absolute inset-0 h-full w-full" />
                                <span className="relative text-[9vh]" style={TIPO.menu}>{ativo}</span>
                            </div>
                        )}
                        <div className="flex flex-col items-center gap-3 text-center" style={TIPO.texto}>
                            {!existe(ativo) && <span className="text-xl text-[#111]">{t.falta}</span>}
                            {!existe(ativo) && existe(ativo.toLowerCase()) && (
                                <span className="flex items-center gap-3 text-base text-black/60">
                                    {t.hoje}
                                    <span className="text-3xl text-[#111]" style={{ fontFamily: 'var(--ff-foeger)' }}>{ativo.toLowerCase()}</span>
                                </span>
                            )}
                            {existe(ativo) && familia(ativo).length > 1 && (
                                <>
                                    <span className="text-base text-black/50">{t.familia}</span>
                                    <span className="flex gap-4 text-[5vh] text-black/35" style={{ fontFamily: 'var(--ff-foeger)' }}>
                                        {familia(ativo).map(o => <span key={o} className={o === ativo ? 'text-[#111]' : ''}>{o}</span>)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
