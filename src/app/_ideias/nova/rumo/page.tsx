'use client';

// o rumo visual, segunda rodada (23/10): a abertura e o cabeçalho até o hero (o carregamento com o "Olá", a cortina e
// as palavras saindo do desfoque), com o seletor de idioma do site à direita do cabeçalho e a logo animada parada no
// meio dele. Acima do hero há um pedaço escondido: rolando para cima a partir do topo, a logo cresce até o meio da
// tela e liga a animação; descendo, ela volta ao cabeçalho. O fundo da abertura são as ondas de luz
// (_comp/FundoOndas.tsx), em que a câmera mergulha ao rolar. O hero também é o
// manifesto: ao rolar, ele prende e abre o ato da escala em volta da palavra que troca, que mergulha na haste do "L"
// até a tela ficar creme (_fa/Hero.tsx). No creme vem a lista dos serviços (_comp/Projetos.tsx), com o índice lateral
// (_fa/Indice.tsx) a partir dela, e depois o rodapé, tudo num idioma só, o do seletor do cabeçalho. O índice
// lateral (_fa/Indice.tsx) volta quando entrarem as próximas seções
import Casca from './_fa/Casca';
import Hero from './_fa/Hero';
import Fundo from './_comp/Fundo';
import FundoOndas from './_comp/FundoOndas';
import Cursor from './_comp/Cursor';
import Bordas from './_comp/Bordas';
import Barquinho from './_comp/Barquinho';
import GraoVivo from './_comp/GraoVivo';
import Projetos, { SeletorDaLista, useVersaoDaLista } from './_comp/Projetos';
import Rodape from './_comp/Rodape';
import Indice from './_fa/Indice';
import Imagens from './_comp/Imagens';
import { COR_DA_ABERTURA } from './_lib/rumo';
import { useIdioma } from '../_lib/idioma';
import { useEffect } from 'react';
import { idiomaVisto } from './_lib/troca';

export default function Rumo() {
    const { idioma } = useIdioma();
    const cores = COR_DA_ABERTURA;
    const [lista, escolherLista] = useVersaoDaLista();
    // o idioma que a página já mostrou, atualizado depois dos filhos (_lib/troca.ts)
    useEffect(() => {
        idiomaVisto.atual = idioma;
    }, [idioma]);
    return (
        <Casca
            fundo={
                <>
                    <Fundo />
                    <FundoOndas />
                </>
            }
        >
            <section id="segredo" aria-hidden data-fundo={cores.fundo} data-tinta={cores.tinta} className="h-[100svh]" />
            {/* o hero e as seções depois dele, com o índice lateral preso no meio da tela a partir do ato */}
            <div className="relative">
                <div data-fundo={cores.fundo} data-tinta={cores.tinta}>
                    <Hero key={idioma} />
                </div>
                <Projetos key={`projetos-${idioma}`} versao={lista} />
                <Imagens key={`imagens-${idioma}`} />
                <Indice key={`indice-${idioma}`} />
            </div>
            <div data-fundo="#051236" data-tinta="#FFFDE2" className="relative">
                <Rodape key={`rodape-${idioma}`} />
            </div>
            <Barquinho />
            <Bordas />
            <Cursor />
            <GraoVivo />
            <SeletorDaLista versao={lista} escolher={escolherLista} />
        </Casca>
    );
}
