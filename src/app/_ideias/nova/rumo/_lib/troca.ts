'use client';

// a troca de idioma como no hero: em vez de o texto só mudar, as peças reaparecem pelo desfoque (a entrada do hero:
// opacidade e 10 px de desfoque, 1,8 s power3.out, 0,05 s entre elas). Vale para as seções que remontam com o idioma
// (a lista, o índice) e para as que só trocam o texto (o rodapé). A página guarda o idioma que já mostrou e só o
// atualiza depois dos filhos (os efeitos dela rodam por último), então cada peça sabe, ao montar ou ao trocar, se veio
// de uma troca; no primeiro carregamento nada anima. A decisão é tomada na renderização, antes de qualquer efeito: em
// desenvolvimento o React monta os efeitos duas vezes, e na segunda a página já teria guardado o idioma novo. Ao
// terminar, os estilos voltam ao CSS (o apagar e desfocar das linhas da lista no hover depende dele)
import { useEffect, useMemo, type RefObject } from 'react';
import { animate, stagger } from 'motion';
import { useIdioma } from '../../_lib/idioma';
import { power3Out } from '../_fa/movimento';

export const idiomaVisto: { atual: string | null } = { atual: null };

// se o idioma acabou de trocar (decidido na renderização; ver acima)
export function useTrocou() {
    const { idioma } = useIdioma();
    return useMemo(() => idiomaVisto.atual !== null && idiomaVisto.atual !== idioma, [idioma]);
}

export function useTrocaDeIdioma(raiz: RefObject<HTMLElement | null>, seletor: string) {
    const trocou = useTrocou();
    useEffect(() => {
        if (!trocou) return;
        const pecas = [...(raiz.current?.querySelectorAll<HTMLElement>(seletor) ?? [])];
        if (!pecas.length) return;
        const a = animate(pecas, { opacity: [0, 1], filter: ['blur(10px)', 'blur(0px)'] }, { duration: 1.8, ease: power3Out, delay: stagger(0.05) });
        // os estilos voltam ao CSS ao terminar e também se a animação for interrompida (a peça desmonta, ou o React
        // monta o efeito de novo em desenvolvimento), para nada ficar preso no meio
        const limpar = () =>
            pecas.forEach(el => {
                el.style.opacity = '';
                el.style.filter = '';
            });
        a.then(limpar);
        return () => {
            a.stop();
            limpar();
        };
    }, [trocou, raiz, seletor]);
}
