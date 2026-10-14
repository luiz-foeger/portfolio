'use client';

// Home da marca Föeger. _ideias é uma pasta privada do Next (o _ tira do roteamento): quem põe esta página no / é
// src/app/page.tsx, com o layout daqui em volta.
// Parte do site antigo (a logo animada que vira o cabeçalho) e soma o que foi aprovado nas simulações: uma fonte
// só (Bricolage), o manifesto que sobe dos pontos com desfoque de movimento, a letra fina que engrossa nos serviços
// e o e-mail de ponta a ponta. Sem azul claro, sem stacks e sem trabalhos antigos: os serviços se demonstram
// funcionando e o laboratório guarda os estudos próprios, começando pela Foeger Sans.
// O manifesto continua no ato da escala (_components/Expansao.tsx): a palavra da escala fica no meio exato da tela,
// troca e cresce com a rolagem e, no fim, a haste do "l" dela cobre a tela com o claro; daí a página segue no tema
// claro (serviços e laboratório; o rodapé continua o de sempre). O cabeçalho fica em modo diferença, para o logo
// aparecer no claro e por cima das imagens.
// Português por padrão, com inglês no cabeçalho (na primeira visita, segue o idioma do navegador).
// As imagens do ato ficam em public/nova-escala.
import { useEffect, useRef, useState } from 'react';
import ManifestoComum, { TAMANHO } from '../_comum/Manifesto';
import Cabecalho from './_components/Cabecalho';
import Servicos from './_components/Servicos';
import Laboratorio from './_components/Laboratorio';
import { APAGA_FRASE, AtoContexto, ExpansaoJanelas, FUNDO_CLARO } from './_components/Expansao';
import Footer from '../../../components/layout/Footer';
import { useIdioma, useTexto } from './_lib/idioma';
import type { Textos } from './_lib/textos';
import { TIPO } from './_lib/tipo';

type Frase = Textos['manifesto'];

// o espaço que não quebra: na régua, igual ao que encosta as palavras na do centro, na linha do meio do manifesto
const ESPACO_FIXO = String.fromCharCode(160);

// as palavras antes da do centro, na ordem de leitura: é a ordem dela para o manifesto
function ordemDoCentro(linhas: string[], centro: string) {
    const meio = (linhas.length - 1) / 2;
    const antes = linhas.slice(0, meio).join(' ').split(/\s+/).filter(Boolean).length;
    return antes + linhas[meio].split(/\s+/).indexOf(centro);
}

// mede os arranjos com a letra do manifesto, no tamanho do bloco dele (uma régua escondida com as mesmas classes), e
// fica com o primeiro que cabe. Na linha do meio, a grade pede o dobro do lado mais largo mais a palavra
function useArranjo(frase: Frase) {
    const regua = useRef<HTMLDivElement>(null);
    const [escolhido, setEscolhido] = useState(0);
    useEffect(() => {
        const bloco = regua.current;
        const linha = bloco?.firstElementChild as HTMLSpanElement | null;
        if (!bloco || !linha) return;
        const largura = (t: string) => {
            linha.textContent = t;
            return linha.getBoundingClientRect().width;
        };
        const medir = () => {
            const cabe = bloco.clientWidth - 2;
            const i = frase.arranjos.findIndex(linhas => linhas.every((l, j) => {
                if (j !== (linhas.length - 1) / 2) return largura(l) <= cabe;
                const palavras = l.split(' ');
                const k = palavras.indexOf(frase.centro);
                const esq = palavras.slice(0, k).join(' ');
                const dir = palavras.slice(k + 1).join(' ');
                return 2 * Math.max(esq ? largura(esq + ESPACO_FIXO) : 0, dir ? largura(ESPACO_FIXO + dir) : 0) + largura(frase.centro) <= cabe;
            }));
            setEscolhido(i < 0 ? frase.arranjos.length - 1 : i);
        };
        // a primeira medida vai no quadro seguinte (e de novo quando as fontes chegam)
        const quadro = requestAnimationFrame(medir);
        document.fonts.ready.then(medir);
        window.addEventListener('resize', medir);
        return () => {
            cancelAnimationFrame(quadro);
            window.removeEventListener('resize', medir);
        };
    }, [frase]);
    const reguaEl = (
        <div aria-hidden className="pointer-events-none invisible fixed inset-x-0 top-0 px-4 sm:px-8">
            <div ref={regua} className={`mx-auto max-w-7xl ${TAMANHO}`} style={TIPO.manifesto}>
                <span className="whitespace-nowrap" style={{ wordSpacing: '0.1em' }} />
            </div>
        </div>
    );
    return { linhas: frase.arranjos[escolhido], regua: reguaEl };
}

export default function Nova() {
    const { idioma } = useIdioma();
    const t = useTexto();
    const { linhas, regua } = useArranjo(t.manifesto);
    const centro = ordemDoCentro(linhas, t.manifesto.centro);
    return (
        <main className="bg-[#050505] text-white">
            <style>{'nav.fixed { mix-blend-mode: difference; }'}</style>
            {regua}
            <Cabecalho />
            {/* a chave refaz o manifesto quando o idioma ou o arranjo mudam: a cópia da palavra começa de novo */}
            <AtoContexto.Provider value={{ palavras: t.manifesto.palavras }}>
                <ManifestoComum
                    key={`${idioma}-${linhas.length}`}
                    linhas={linhas}
                    estilo={TIPO.manifesto}
                    entrada="pontos-de-baixo"
                    centro={centro}
                    continuacao={{ vh: 380, vhToque: 260, apagaFrase: APAGA_FRASE, palavra: centro, Componente: ExpansaoJanelas }}
                />
            </AtoContexto.Provider>
            {/* o tema claro: o fim do ato cobre a tela com este fundo, e a página segue nele */}
            <div style={{ background: FUNDO_CLARO, color: '#050505' }}>
                <Servicos claro />
                <Laboratorio claro />
            </div>
            {/* o rodapé do site; o id é o destino do "Contato" do menu */}
            <div id="contato">
                <Footer />
            </div>
        </main>
    );
}
