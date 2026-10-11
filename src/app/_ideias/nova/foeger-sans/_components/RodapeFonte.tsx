'use client';

import Link from 'next/link';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { EMAIL } from '../../_lib/textos';
import { TEXTOS_FONTE } from '../_lib/textos';

// rodapé próprio do caderno da fonte: o convite, o e-mail e a volta para a Föeger (o e-mail fica na Bricolage,
// porque a Föeger Sans ainda não tem @)
export default function RodapeFonte() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].rodape;
    return (
        <footer className="flex min-h-[70svh] flex-col justify-between gap-12 bg-[#111] px-[4vw] pb-[5vh] pt-[14vh] text-[#E4E4E4]">
            <div className="flex flex-col gap-6">
                <p className="max-w-[22ch] text-[9vw] md:text-[4.6vw]" style={TIPO.frase}>{t.chamada}</p>
                <a href={`mailto:${EMAIL}`} className="w-fit text-[6vw] underline decoration-1 underline-offset-[0.18em] transition-opacity hover:opacity-70 md:text-[3vw]" style={TIPO.frase}>
                    {EMAIL}
                </a>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-6" style={TIPO.menu}>
                <span className="text-[44px] leading-none md:text-[64px]" style={{ fontFamily: 'var(--ff-foeger)' }}>föeger.</span>
                <span className="flex items-center gap-6 text-[15px]">
                    <span className="text-white/50">{t.projeto}</span>
                    <Link href="/nova" className="rounded-full border border-white/25 px-4 py-2 transition-colors hover:bg-white hover:text-[#111]">{t.voltar} ↗</Link>
                </span>
            </div>
        </footer>
    );
}
