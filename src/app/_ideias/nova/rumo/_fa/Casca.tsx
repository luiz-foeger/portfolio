'use client';

// a casca da página do rumo: o laço da página ligado ao Lenis (lerp 0,1, sem duração), o fundo, o cabeçalho, a faixa de
// desfoque do topo, a barra de progresso, o indicador de rolagem e o carregamento. O fundo vem da página (o de cores
// das seções e o da abertura), o "Olá" segue o idioma, e a página começa rolada até o hero, com o pedaço escondido
// acima dele (o segredo da logo); a barra de progresso e o indicador contam a partir do hero.
//
// Carregamento: painel creme com o "Olá", que some (0,6 s power3.out) quando as fontes ficam prontas (com um respiro
// para ele ser lido); o conteúdo entra (0,6 s, atraso 0,3) e o progresso segue os recursos (cada alvo em 0,8 s
// power3.inOut, piso de 35%). Em 100%: a linha recolhe pelo centro (0,5 s power3.inOut), o conteúdo some
// (0,3 s, atraso 0,3) e a cortina recolhe para cima (recorte de baixo de 0 a 100% em 1,4 s power3.out, atraso 0,4).
// No fim, o PLAY. Ao mudar a largura da janela, um painel creme cobre a página e some 250 ms depois do último resize.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLenis } from 'lenis/react';
import { animate, type AnimationPlaybackControls } from 'motion';
import { aCadaQuadro, geo, ligarLaco, rolagem } from './laco';
import { aoTocar, tocar } from './estado';
import { power3InOut, power3Out } from './movimento';
import Cabecalho from './Cabecalho';
import { Logo } from './Pecas';
import { useIdioma } from '../../_lib/idioma';
import { textosDoRumo } from '../_lib/textos';

// onde a página começa: o topo do hero (acima dele fica o segredo)
// pela posição na página, e não pelo offsetTop: o hero fica dentro de um bloco posicionado (o do índice lateral), e o
// offsetTop seria medido a partir dele (dava 0, e a página abria no segredo, com a logo)
const topoDoHero = () => {
    const hero = document.getElementById('hero');
    return hero ? hero.getBoundingClientRect().top + window.scrollY : 0;
};

export default function Casca({ children, fundo }: { children: ReactNode; fundo?: ReactNode }) {
    const lenis = useLenis();
    const raiz = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!lenis) return;
        const desligar = ligarLaco(lenis);
        // sem eventos de ponteiro enquanto a página corre (> 1,5 px por quadro), para o hover não pegar no que passa sob
        // o cursor
        const html = document.documentElement;
        const solta = () => (html.style.pointerEvents = '');
        window.addEventListener('pointermove', solta, { passive: true });
        const desligarPonteiro = aCadaQuadro(({ vel }) => {
            const v = Math.abs(vel);
            if (v > 1.5) html.style.pointerEvents = 'none';
            else if (v < 1) html.style.pointerEvents = '';
        });
        return () => {
            desligar();
            desligarPonteiro();
            window.removeEventListener('pointermove', solta);
            html.style.pointerEvents = '';
        };
    }, [lenis]);

    return (
        <div ref={raiz} data-fa="" data-rumo="" style={{ color: 'var(--tinta)' }}>
            {/* o fundo fica dentro do bloco do conteúdo, atrás de tudo (z-index -1 em .fa-fundo): assim o que está em
                modo diferença na página (as linhas da lista) se mistura com as camadas de fundo */}
            <div className="relative z-[1]">
                {fundo}
                {children}
            </div>
            <Progresso />
            <Indicador />
            <div className="fa-desfoque" aria-hidden />
            <Cabecalho />
            <Carregando raiz={raiz} />
        </div>
    );
}

function Progresso() {
    const el = useRef<HTMLDivElement>(null);
    useEffect(
        () =>
            aCadaQuadro(({ y }) => {
                const ini = geo.s.hero.top;
                el.current?.style.setProperty('--progress', Math.min(1, Math.max(0, (y - ini) / Math.max(1, geo.limite - ini))).toFixed(2));
            }),
        [],
    );
    return (
        <div ref={el} className="fa-progresso" aria-hidden>
            <i />
        </div>
    );
}

function Indicador() {
    const el = useRef<HTMLDivElement>(null);
    const ponto = useRef<HTMLDivElement>(null);
    const traco = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const desligar = aCadaQuadro(({ y }) => {
            const k = Math.min(Math.max(0, y - geo.s.hero.top) / (0.25 * geo.vh), 1);
            traco.current?.style.setProperty('--progress', String(k));
            el.current?.classList.toggle('fa-ativo', k >= 1);
        });
        const desligarPlay = aoTocar(() => {
            if (!ponto.current || !traco.current) return;
            animate(ponto.current, { scale: [0, 1] }, { duration: 1.2, ease: power3Out, delay: 0.6 }).then(() => ponto.current?.classList.add('fa-pronto'));
            animate(traco.current, { scaleY: [0, 1] }, { duration: 1.2, ease: power3Out, delay: 0.6 });
        });
        return () => {
            desligar();
            desligarPlay();
        };
    }, []);
    return (
        <div ref={el} className="fa-ind" aria-hidden>
            <div ref={ponto} className="fa-ind-ponto" />
            <div ref={traco} className="fa-ind-traco" />
        </div>
    );
}

function Carregando({ raiz }: { raiz: React.RefObject<HTMLDivElement | null> }) {
    const boasVindas = textosDoRumo(useIdioma().idioma).ola;
    const painel = useRef<HTMLDivElement>(null);
    const ola = useRef<HTMLDivElement>(null);
    const conteudo = useRef<HTMLDivElement>(null);
    const pct = useRef<HTMLDivElement>(null);
    const linha = useRef<HTMLElement>(null);
    const [feito, setFeito] = useState(false);
    const [cobrindo, setCobrindo] = useState(false);

    useEffect(() => {
        let vivo = true;
        const timers: number[] = [];
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, topoDoHero());

        let valor = 0;
        let alvo = 0;
        let piso = 0;
        let seguindo: AnimationPlaybackControls | null = null;
        let saindo = false;

        const sair = () => {
            if (saindo || !vivo) return;
            saindo = true;
            if (linha.current) {
                linha.current.style.transformOrigin = 'center';
                animate(linha.current, { scaleX: 0 }, { duration: 0.5, ease: power3InOut });
            }
            if (conteudo.current) animate(conteudo.current, { opacity: 0 }, { duration: 0.3, delay: 0.3, ease: power3InOut });
            animate(0, 100, {
                duration: 1.4,
                delay: 0.4,
                ease: power3Out,
                onUpdate: x => {
                    if (painel.current) painel.current.style.clipPath = `inset(0 0 ${x}% 0)`;
                },
                onComplete: () => {
                    if (!vivo) return;
                    setFeito(true);
                    raiz.current?.setAttribute('data-pronto', '');
                    rolagem.lenis?.scrollTo(topoDoHero(), { immediate: true, force: true });
                    rolagem.lenis?.start();
                    timers.push(window.setTimeout(tocar, 100));
                },
            });
        };

        const seguir = (n: number) => {
            alvo = Math.max(piso, n);
            seguindo?.stop();
            seguindo = animate(valor, alvo, {
                duration: 0.8,
                ease: power3InOut,
                onUpdate: x => {
                    valor = x;
                    if (pct.current) pct.current.textContent = `${Math.round(x)}%`;
                    if (linha.current) linha.current.style.transform = `scaleX(${x / 100})`;
                },
                onComplete: () => {
                    if (valor >= 100) sair();
                },
            });
        };

        // o progresso: as imagens da página e as fontes
        const imagens = [...(raiz.current?.querySelectorAll('img') ?? [])];
        const total = imagens.length + 1;
        let prontos = 0;
        let mostrando = false;
        const contar = () => {
            prontos++;
            if (mostrando) seguir((prontos / total) * 100);
        };
        imagens.forEach(im => {
            if (im.complete) contar();
            else {
                im.addEventListener('load', contar, { once: true });
                im.addEventListener('error', contar, { once: true });
            }
        });

        // o sinal de pronto: as fontes prontas e um respiro para o "Olá" ser lido
        const inicio = performance.now();
        document.fonts.ready.then(() => {
            if (!vivo) return;
            contar();
            const espera = Math.max(0, 1100 - (performance.now() - inicio));
            timers.push(
                window.setTimeout(async () => {
                    if (!vivo) return;
                    if (ola.current) animate(ola.current, { opacity: 0 }, { duration: 0.6, ease: power3Out });
                    if (conteudo.current) await animate(conteudo.current, { opacity: 1 }, { duration: 0.6, ease: power3Out, delay: 0.3 });
                    mostrando = true;
                    piso = 35;
                    seguir((prontos / total) * 100);
                }, espera),
            );
        });
        // a trava: aos 8 s força 100%, para um recurso que não chega não prender a página no carregamento
        timers.push(window.setTimeout(() => seguir(100), 8000));

        return () => {
            vivo = false;
            timers.forEach(t => window.clearTimeout(t));
            seguindo?.stop();
        };
    }, [raiz]);

    // trava a rolagem até o PLAY
    const lenis = useLenis();
    useEffect(() => {
        if (lenis && !feito) lenis.stop();
    }, [lenis, feito]);

    // a cobertura do resize (só a largura)
    useEffect(() => {
        let largura = window.innerWidth;
        let fim = 0;
        const aoMudar = () => {
            if (window.innerWidth === largura) return;
            largura = window.innerWidth;
            setCobrindo(true);
            window.clearTimeout(fim);
            fim = window.setTimeout(() => setCobrindo(false), 250);
        };
        window.addEventListener('resize', aoMudar);
        return () => {
            window.removeEventListener('resize', aoMudar);
            window.clearTimeout(fim);
        };
    }, []);

    return (
        <>
            {!feito && (
                <div ref={painel} className="fa-carregando">
                    <div ref={ola} className="fa-carregando-ola">
                        {boasVindas}
                    </div>
                    <div ref={conteudo} className="fa-carregando-conteudo">
                        <div className="fa-carregando-marca">
                            <Logo empilhada />
                        </div>
                        <div ref={pct} className="fa-carregando-pct">
                            0%
                        </div>
                        <div className="fa-carregando-linha">
                            <i ref={linha} />
                        </div>
                    </div>
                </div>
            )}
            {cobrindo && (
                <div className="fa-carregando" style={{ zIndex: 9999999 }}>
                    <div className="fa-carregando-marca">
                        <Logo empilhada />
                    </div>
                </div>
            )}
        </>
    );
}
