'use client';

import Link from 'next/link';
import { useLenis } from 'lenis/react';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { TEXTOS_FONTE } from '../_lib/textos';

// cabeçalho próprio da página da fonte (ela é um caderno à parte): o nome da fonte escrito nela mesma, atalhos
// para o livro e para escrever, o idioma e a volta para a Föeger
export default function CabecalhoFonte() {
    const { idioma, definir } = useIdioma();
    const t = TEXTOS_FONTE[idioma];
    const lenis = useLenis();
    const ir = (alvo: string | number) => (e: React.MouseEvent) => {
        e.preventDefault();
        if (lenis) lenis.scrollTo(alvo, { duration: 1.4 });
        else if (typeof alvo === 'number') window.scrollTo({ top: alvo, behavior: 'smooth' });
        else document.querySelector(alvo)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-black/10 bg-[#E4E4E4]/90 px-[4vw] text-[#111] backdrop-blur-md">
            <a href="#topo" onClick={ir(0)} className="text-[22px] leading-none md:text-[26px]" style={{ fontFamily: 'var(--ff-foeger)' }}>
                {t.titulo}
            </a>
            <nav className="flex items-center gap-6 text-[15px]" style={TIPO.menu}>
                <a href="#livro" onClick={ir('#livro')} className="hidden text-black/60 transition-colors hover:text-black md:inline">{t.cabecalho.livro}</a>
                <a href="#escrever" onClick={ir('#escrever')} className="hidden text-black/60 transition-colors hover:text-black md:inline">{t.cabecalho.brincar}</a>
                <span className="flex items-center gap-1.5" role="group" aria-label="Idioma / Language">
                    {(['pt', 'en'] as const).map((i, n) => (
                        <span key={i} className="flex items-center gap-1.5">
                            {n > 0 && <span aria-hidden className="text-black/25">/</span>}
                            <button
                                onClick={() => definir(i)}
                                aria-pressed={idioma === i}
                                lang={i === 'pt' ? 'pt-BR' : 'en'}
                                className={`uppercase transition-colors ${idioma === i ? 'text-black' : 'text-black/40 hover:text-black/75'}`}
                            >
                                {i}
                            </button>
                        </span>
                    ))}
                </span>
                <Link href="/nova" className="rounded-full border border-black/20 px-3.5 py-1.5 transition-colors hover:border-black hover:bg-black hover:text-[#E4E4E4]">
                    {t.cabecalho.voltar} ↗
                </Link>
            </nav>
        </header>
    );
}
