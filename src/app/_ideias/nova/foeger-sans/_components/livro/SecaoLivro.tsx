'use client';

import { useIdioma } from '../../../_lib/idioma';
import { TIPO } from '../../../_lib/tipo';
import { TEXTOS_FONTE } from '../../_lib/textos';
import Livro from './Livro';

// a seção do livro: título, como usar e o livro em si
export default function SecaoLivro() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].livro;
    return (
        <section id="livro" className="px-[4vw] py-[14vh]">
            <div className="mb-[6vh] grid gap-4 md:grid-cols-12 md:gap-x-[4vw]">
                <h2 className="text-[9vw] md:col-span-6 md:text-[4.2vw]" style={TIPO.frase}>{t.titulo}</h2>
                <p className="max-w-[40ch] self-end text-lg text-black/60 md:col-span-5 md:col-start-8 md:text-xl" style={TIPO.texto}>{t.texto}</p>
            </div>
            <Livro />
        </section>
    );
}
