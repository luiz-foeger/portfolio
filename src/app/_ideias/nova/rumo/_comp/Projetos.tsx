'use client';

// a seção depois do creme do ato da escala (25/10): a lista do que a Föeger resolve, no creme com a tinta navy e os
// textos de _lib/textos.ts. Os nomes grandes em caixa alta, um por linha, com o problema e a solução ao lado; no hover
// (no celular, a linha do meio da tela) a janela do hero abre ao lado do nome com um exemplo, e as outras linhas apagam.
// As linhas entram pelo desfoque do hero, presas à posição delas na tela. A seção sobe por cima do fim do hero, para
// começar logo que o creme cobre a tela (em fa.css). Em teste, duas versões do exemplo, trocadas no seletor "Lista" do
// canto (?lista=): as capas falsas (public/nova-escala/falsas) ou os conceitos. As versões de projetos em pilha, trilho
// e um por tela estão em C:/pessoal/ideias/rumo-visual/secao-projetos
import { useEffect, useRef, useState } from 'react';
import { aCadaQuadro } from '../_fa/laco';
import { useIdioma } from '../../_lib/idioma';
import { textosDoRumo } from '../_lib/textos';
import { useTrocaDeIdioma } from '../_lib/troca';
import { CAPA_DO_PROJETO } from '../../_lib/midia';

const CREME = '#FFFDE2';
const NAVY = '#051236';
// os exemplos de cada linha (marcas, sites, produtos, lançamentos): uma capa falsa ou um conceito, com o nome dele
const EXEMPLOS = {
    falsas: [1, 2, 3, 4].map(i => ({
        capa: `/nova-escala/falsas/capa-${i}.jpg`,
        nome: '',
    })),
    conceitos: [
        { capa: CAPA_DO_PROJETO.aurora, nome: 'Aurora' },
        { capa: CAPA_DO_PROJETO.site, nome: 'Föeger' },
        { capa: CAPA_DO_PROJETO.turno, nome: 'Turno' },
        { capa: CAPA_DO_PROJETO.pulso, nome: 'Pulso' },
    ],
};

const OPCOES = [
    { id: 'falsas', nome: '1 · Capas falsas' },
    { id: 'conceitos', nome: '3 · Conceitos' },
] as const;
export type VersaoDaLista = (typeof OPCOES)[number]['id'];
const CHAVE = 'foeger-rumo-lista';
const valida = (v: string | null): v is VersaoDaLista => OPCOES.some(o => o.id === v);

export function useVersaoDaLista() {
    const [versao, setVersao] = useState<VersaoDaLista>('conceitos');
    useEffect(() => {
        let salva: string | null = null;
        try {
            salva = localStorage.getItem(CHAVE);
        } catch {}
        const doEndereco = new URLSearchParams(location.search).get('lista');
        const v = valida(doEndereco) ? doEndereco : valida(salva) ? salva : null;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- a escolha só existe no navegador
        if (v) setVersao(v);
    }, []);
    const escolher = (v: VersaoDaLista) => {
        setVersao(v);
        try {
            localStorage.setItem(CHAVE, v);
        } catch {}
        const url = new URL(location.href);
        url.searchParams.set('lista', v);
        history.replaceState(history.state, '', url);
    };
    return [versao, escolher] as const;
}

export function SeletorDaLista({ versao, escolher }: { versao: VersaoDaLista; escolher: (v: VersaoDaLista) => void }) {
    return (
        <div className="fixed bottom-4 left-4 z-[95] flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[12px] text-white backdrop-blur">
            <span style={{ padding: '4px 6px', opacity: 0.6 }}>Lista</span>
            {OPCOES.map(o => (
                // a escolhida em pílula branca, por estilo próprio (o fa.css zera o fundo e o espaço dos botões da página)
                <button
                    key={o.id}
                    type="button"
                    onClick={() => escolher(o.id)}
                    className="rounded-full"
                    style={{
                        padding: '4px 10px',
                        ...(versao === o.id ? { background: '#fff', color: '#000' } : { opacity: 0.75 }),
                    }}
                >
                    {o.nome}
                </button>
            ))}
        </div>
    );
}

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const suave = (x: number) => x * x * (3 - 2 * x);

// a entrada pelo desfoque do hero, presa à posição: cada [data-entra] sai do desfoque enquanto o topo dele sobe da
// borda de baixo da tela a 78% da altura (e volta ao rolar para cima)
function useEntrada(raiz: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        const r = raiz.current;
        if (!r) return;
        const pecas = [...r.querySelectorAll<HTMLElement>('[data-entra]')];
        const fases = pecas.map(() => -1);
        return aCadaQuadro(() => {
            const vh = window.innerHeight;
            pecas.forEach((el, i) => {
                const topo = el.getBoundingClientRect().top;
                const e = suave(limitar((vh - topo) / (vh * 0.22)));
                if (Math.abs(e - fases[i]) < 0.002) return;
                fases[i] = e;
                el.style.opacity = e < 1 ? e.toFixed(3) : '';
                el.style.filter = e < 1 ? `blur(${(10 * (1 - e)).toFixed(2)}px)` : '';
                el.style.translate = e < 1 ? `0 ${(30 * (1 - e)).toFixed(1)}px` : '';
            });
        });
    }, [raiz]);
}

// a linha ativa: no computador, a que está sob a seta (conferida a cada quadro, então muda também com a página rolando
// e o mouse parado); fora da lista, nenhuma. No celular, a mais perto do meio da tela. No computador o exemplo aparece
// numa miniatura só, encaixada no vão entre os nomes e as descrições: ela pula até a linha ativa enquanto as imagens,
// numa coluna mascarada, correm de cima para baixo até a da linha. No celular, onde o nome e a descrição ficam um
// embaixo do outro, o exemplo abre como a janela do hero, ao lado do nome
const SAIDA = 'cubic-bezier(.165,.84,.44,1)';
const ENTRE = 'cubic-bezier(.77,0,.175,1)';
const ponteiro = { x: -1, y: -1 };

export default function Projetos({ versao }: { versao: VersaoDaLista }) {
    const T = textosDoRumo(useIdioma().idioma).projetos;
    const raiz = useRef<HTMLElement>(null);
    const lista = useRef<HTMLDivElement>(null);
    const miniatura = useRef<HTMLDivElement>(null);
    const [ativa, setAtiva] = useState(-1);
    const [ultima, setUltima] = useState(0);
    useEntrada(raiz);
    useTrocaDeIdioma(raiz, '.fa-proj-rotulo, .fa-proj-nome, .fa-proj-lado');
    useEffect(() => {
        const conteudo = lista.current;
        const mini = miniatura.current;
        if (!conteudo || !mini) return;
        const celular = window.matchMedia('(max-width: 767px)');
        const mover = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            ponteiro.x = e.clientX;
            ponteiro.y = e.clientY;
        };
        window.addEventListener('pointermove', mover, { passive: true });
        const linhas = [...conteudo.querySelectorAll<HTMLElement>('[data-linha]')];
        const nomes = linhas.map(l => l.querySelector<HTMLElement>('.fa-proj-nome')!);
        const lados = linhas.map(l => l.querySelector<HTMLElement>('.fa-proj-lado')!);
        let atual = -1;
        const desligar = aCadaQuadro(() => {
            const caixa = conteudo.getBoundingClientRect();
            if (caixa.bottom < 0 || caixa.top > window.innerHeight) return;
            let i = -1;
            if (celular.matches) {
                const meio = window.innerHeight / 2;
                let menor = window.innerHeight * 0.3;
                linhas.forEach((l, k) => {
                    const b = l.getBoundingClientRect();
                    const d = Math.abs(b.top + b.height / 2 - meio);
                    if (d < menor) [menor, i] = [d, k];
                });
            } else {
                if (ponteiro.x >= caixa.left && ponteiro.x <= caixa.right)
                    i = linhas.findIndex(l => {
                        const b = l.getBoundingClientRect();
                        return ponteiro.y >= b.top && ponteiro.y < b.bottom;
                    });
                // o vão: do fim do nome mais longo ao começo da descrição mais à esquerda
                const fim = Math.max(...nomes.map(n => n.getBoundingClientRect().right));
                const inicio = Math.min(...lados.map(n => n.getBoundingClientRect().left));
                // a miniatura fica centrada no vão e pode cobrir parte das letras (as linhas ficam em modo diferença, em fa.css); a
                // altura (16:9) passa no máximo um quarto da altura de uma linha
                const largura = Math.min(window.innerWidth * 0.24, linhas[0].offsetHeight * 1.25 * (16 / 9));
                mini.style.width = `${largura.toFixed(1)}px`;
                mini.style.left = `${((fim + inicio) / 2 - largura / 2 - caixa.left).toFixed(1)}px`;
            }
            if (i === atual) return;
            atual = i;
            setAtiva(i);
            if (i >= 0) {
                setUltima(i);
                mini.style.top = `${(linhas[i].offsetTop + linhas[i].offsetHeight / 2).toFixed(1)}px`;
            }
        });
        return () => {
            desligar();
            window.removeEventListener('pointermove', mover);
        };
    }, []);
    return (
        <section ref={raiz} id="projetos" data-fundo={CREME} data-tinta={NAVY} className="fa-proj fa-proj-lista">
            <p data-entra className="fa-proj-rotulo">
                {T.titulo}
            </p>
            <div ref={lista} className="fa-proj-caixa">
                <div
                    ref={miniatura}
                    aria-hidden
                    className="fa-proj-miniatura"
                    style={{
                        opacity: ativa >= 0 ? 1 : 0,
                        transition: `top .35s ${SAIDA}, opacity .3s ${SAIDA}`,
                    }}
                >
                    <div
                        style={{
                            transform: `translateY(${-ultima * 100}%)`,
                            transition: `transform .35s ${ENTRE}`,
                        }}
                    >
                        {T.itens.map((item, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={item.nome} src={EXEMPLOS[versao][i].capa} alt="" />
                        ))}
                    </div>
                </div>
                <ul className={ativa >= 0 ? 'fa-proj-com-aberta' : ''}>
                    {T.itens.map((item, i) => {
                        const ex = EXEMPLOS[versao][i];
                        return (
                            <li key={item.nome} data-linha data-entra className={ativa === i ? 'fa-aberta' : ''}>
                                <span className="fa-proj-nome">
                                    {item.nome}
                                    <span className="fa-proj-janela" aria-hidden>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={ex.capa} alt="" />
                                    </span>
                                </span>
                                <span className="fa-proj-lado">
                                    {ex.nome && (
                                        <span className="fa-proj-meta">
                                            {T.exemplo} {ex.nome}, {T.conceito}
                                        </span>
                                    )}
                                    <span className="fa-proj-frase">
                                        {item.problema} → {item.solucao}
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
