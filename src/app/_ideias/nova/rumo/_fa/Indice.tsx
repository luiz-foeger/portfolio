'use client';

// o índice lateral da página do rumo: números, um traço e o nome da seção numa janela de uma linha, preso no meio da
// tela das seções depois do hero (sobe com a primeira e solta no fim da última), em mix-blend-mode: difference. Desde
// 25/10 a primeira seção é o ato da escala: o índice aparece quando a palavra da escala se solta do texto (o ato
// começa SEGURA telas depois do topo do hero, em Hero.tsx) e a seção conta dali; depois vêm os serviços, e as
// próximas seções entram em SECOES.
// A posição é contínua e presa à rolagem: n − 1 + p (n = seção, p = progresso dela; a última não anda). Cada
// atualização passa por uma transição CSS de 0,4 s easeOutQuart (o "seguidor"), e a opacidade de cada linha cai com a
// distância à posição: 1, 0,32, 0,24, 0,16, 0,08. Os números rolam até a seção (expo.out de 1,5 s). As seções daqui
// são longas (o manifesto fica preso por várias telas), então o nome troca só nos últimos 15% de cada uma; com o
// progresso contínuo ele passaria quase a seção toda cortado ao meio na janela. Os nomes vêm nos dois idiomas; o passo
// entre as linhas é medido no DOM, porque a unidade tem mínimo (ver .fa-indice em fa.css)
import { useEffect, useRef } from 'react';
import { aCadaQuadro, geo, rolarPara } from './laco';
import { ramp } from './movimento';
import { useIdioma } from '../../_lib/idioma';
import { textosDoRumo } from '../_lib/textos';
import { useTrocaDeIdioma } from '../_lib/troca';

const PESOS = [1, 0.32, 0.24, 0.16, 0.08];
const peso = (d: number) => {
    d = Math.abs(d);
    const i = Math.floor(d);
    const a = PESOS[i] ?? PESOS[4];
    const b = PESOS[i + 1] ?? PESOS[4];
    return a + (b - a) * (d - i);
};
// as seções do índice, na ordem da página (o id de cada uma está em IDS, em laco.ts, e o nome em rotulos, em textos.ts)
const SECOES = ['hero', 'projetos', 'galeria'] as const;
// onde cada seção começa para o índice, em alturas de tela depois do topo dela (o hero conta a partir do ato)
const INICIO: Partial<Record<(typeof SECOES)[number], number>> = { hero: 0.4 };
const inicio = (s: (typeof SECOES)[number]) => geo.s[s].top + (INICIO[s] ?? 0) * geo.vh;

export default function Indice() {
    const r = textosDoRumo(useIdioma().idioma);
    const trilho = useRef<HTMLDivElement>(null);
    const numeros = useRef<HTMLDivElement>(null);
    const nomes = useRef<HTMLDivElement>(null);
    useTrocaDeIdioma(trilho, '.fa-indice-conteudo');

    useEffect(() => {
        const nums = [...(numeros.current?.children ?? [])] as HTMLElement[];
        const noms = [...(nomes.current?.children ?? [])] as HTMLElement[];
        let antes = '';
        let versao = -1;
        let passo = 0;
        return aCadaQuadro(({ y }) => {
            if (versao !== geo.versao) {
                versao = geo.versao;
                passo = nums.length > 1 ? nums[1].offsetTop - nums[0].offsetTop : 0;
            }
            // antes da primeira seção começar ele fica apagado, e acende em um quinto de tela
            const t0 = inicio(SECOES[0]);
            if (trilho.current) trilho.current.style.opacity = ramp(y, t0, t0 + 0.2 * geo.vh).toFixed(3);
            let n = 1;
            let p = 0;
            for (let i = SECOES.length - 1; i >= 0; i--) {
                const ini = inicio(SECOES[i]);
                if (y >= ini) {
                    n = i + 1;
                    const fim = geo.s[SECOES[i]].top + geo.s[SECOES[i]].h;
                    p = i === SECOES.length - 1 ? 0 : Math.min(1, Math.max(0, (y - ini) / Math.max(1, fim - ini)));
                    break;
                }
            }
            const pos = n - 1 + p;
            const pNome = ramp(p, 0.85, 1);
            const chave = `${pos.toFixed(4)}|${pNome.toFixed(4)}|${passo}`;
            if (chave === antes) return;
            antes = chave;
            nums.forEach((el, i) => {
                el.style.transform = `translateY(${(-passo * pos).toFixed(2)}px)`;
                el.style.opacity = peso(i - pos).toFixed(3);
            });
            noms.forEach((el, i) => {
                el.style.transform = `translateY(${(-passo * (n - 1 + pNome)).toFixed(2)}px)`;
                el.style.opacity = peso(i - pos).toFixed(3);
            });
        });
    }, []);

    return (
        <div ref={trilho} className="fa-indice-trilho" style={{ opacity: 0 }}>
            <div className="fa-indice" aria-label={r.rotulos.indice}>
                <div className="fa-indice-conteudo">
                    <div ref={numeros} className="fa-indice-numeros">
                        {SECOES.map((s, i) => (
                            <button key={s} type="button" onClick={() => rolarPara(inicio(s))} aria-label={r.rotulos[s]}>
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <span className="fa-indice-traco" />
                    <div className="fa-indice-janela">
                        <div ref={nomes} className="fa-indice-nomes">
                            {SECOES.map(s => (
                                <span key={s}>{r.rotulos[s]}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
