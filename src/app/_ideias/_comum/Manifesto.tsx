'use client';

import { Fragment, useEffect, useId, useMemo, useRef } from 'react';
import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'motion/react';
import { limitar, useProgresso, useToque } from './progresso';
import { useBorrao } from './borrao';

// o manifesto se escreve com a rolagem, preso no meio da tela, centralizado e no tamanho do manifesto do site de
// hoje (ScrollManifesto: de 12vw no celular a 6vw no desktop). Em tela de toque ele se monta sozinho, por tempo,
// quando chega à tela, e sem rastro: com o dedo, montar a frase rolando várias telas cansava, e o rastro tremia.
// Três entradas:
// - 'pontos-de-baixo': as duas de baixo juntas. Cada palavra sobe de trás da linha ainda feita de pontinhos soltos,
//   que incham e se juntam no caminho e viram a palavra quando ela assenta;
// - 'de-baixo': palavra por palavra, cada uma sobe de trás da própria linha (uma máscara do tamanho da palavra) e
//   deixa um rastro vertical na medida da velocidade, que some quando a rolagem para;
// - 'pontos': cada linha nasce de pontinhos soltos que sobem, incham, se juntam por palavra e viram letras (o efeito
//   aprovado na simulação: desfoque + limiar num filtro SVG), também com o rastro vertical
export type EntradaManifesto = 'pontos-de-baixo' | 'de-baixo' | 'pontos';

const TAMANHO = 'text-[12vw] sm:text-[10vw] md:text-[7.5vw] lg:text-[6vw]';
const INICIO = 0.06;
const TEMPO_TOQUE = 2.4; // s para a frase inteira se montar sozinha numa tela de toque
const VISIVEL_TOQUE = 0.6; // fração do bloco preso que precisa estar na tela para a montagem começar
const DESFOQUE = 0.22; // em em
const LIMIAR = 0.4; // alfa a partir do qual o borrão vira mancha
const DURO = 60; // inclinação do limiar: alto = borda nítida mesmo com o borrão largo
const NITIDO = 0.16; // trecho final em que o limiar amolece, para a letra chegar com a borda normal
const ESPALHA = 0.45; // quanto as letras se atrasam umas das outras
const ACENDE = 0.25;
const SOBE = 0.8; // em: de quanto abaixo cada letra vem
const CHEGA = 0.4; // quanto da linha do tempo cada letra leva subindo
const RASTRO = 2.2; // borrão por px que as letras em movimento andaram no quadro
const RASTRO_MAX = 0.2; // em

// sorteio fixo por letra (o mesmo a cada render)
const sorteio = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
};
const saida = (t: number) => 1 - Math.pow(1 - t, 3);

// continuação: depois que a frase se monta, a rolagem segue presa na mesma tela por mais `vh` (no toque, `vhToque`
// de svh, porque lá a frase se monta por tempo) e `Componente` desenha por cima dela. A frase se apaga no trecho
// `apagaFrase` do progresso da continuação. O componente recebe esse progresso (0 a 1), o bloco do texto (para achar
// a palavra de ordem `palavra`, contando todas na ordem de leitura) e o tamanho e o estilo da letra, para repeti-la igual
export type ContinuacaoProps = {
    progresso: MotionValue<number>;
    texto: React.RefObject<HTMLDivElement | null>;
    palavra: number;
    tamanho: string;
    estilo: React.CSSProperties;
};
export type Continuacao = {
    vh: number;
    vhToque: number;
    apagaFrase: readonly [number, number];
    palavra: number;
    Componente: React.ComponentType<ContinuacaoProps>;
};

export default function Manifesto({ linhas, estilo, entrada = 'pontos', id, continuacao }: {
    linhas: string[];
    estilo: React.CSSProperties;
    entrada?: EntradaManifesto;
    id?: string;
    continuacao?: Continuacao;
}) {
    const secao = useRef<HTMLElement>(null);
    const p = useProgresso(secao);
    const reduzido = useReducedMotion() ?? false;
    // quando a seção acaba, o bloco sai com a rolagem e borra junto
    const { alvo, filtro } = useBorrao<HTMLDivElement>('v');
    const cada = (1 - INICIO - 0.08) / linhas.length;
    // a seção cresce com o texto, para cada palavra ter a mesma rolagem qualquer que seja ele (com as 11 palavras do
    // texto antigo dá 300vh no celular e 320vh no desktop), e a continuação ganha um trecho só dela, no fim. fracao é a
    // parte da rolagem que é das palavras
    const palavras = linhas.join(' ').split(/\s+/).filter(Boolean).length;
    const extra = continuacao ? continuacao.vh : 0;
    const fracao = (palavras * 20) / (palavras * 20 + extra);

    // tela de toque: o progresso vem do tempo, não da rolagem. Quando o bloco preso entra na tela, a frase se monta
    // sozinha em TEMPO_TOQUE; a seção fica curta (uma tela e pouco), só para a frase não fugir enquanto se monta
    const toque = useToque();
    const fixo = useRef<HTMLDivElement>(null);
    const pTempo = useMotionValue(0);
    useEffect(() => {
        const el = fixo.current;
        if (!toque || !el) return;
        let animacao: ReturnType<typeof animate> | null = null;
        const observador = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting || animacao) return;
            animacao = animate(pTempo, 1, { duration: TEMPO_TOQUE, ease: 'linear' });
            observador.disconnect();
        }, { threshold: VISIVEL_TOQUE });
        observador.observe(el);
        return () => {
            observador.disconnect();
            animacao?.stop();
        };
    }, [toque, pTempo]);
    const progresso = toque ? pTempo : p;

    // o progresso da continuação: no desktop, a parte da rolagem depois da das palavras; no toque, o que passa dos
    // 40svh em que a frase se monta
    const temContinuacao = !!continuacao;
    const vhToque = continuacao?.vhToque ?? 0;
    const [apagaDe, apagaAte] = continuacao?.apagaFrase ?? [0, 1];
    const pDepois = useMotionValue(0);
    const texto = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!temContinuacao) return;
        const bloco = texto.current;
        const atualizar = (v: number) => {
            const d = toque ? limitar((v * (40 + vhToque) - 40) / vhToque) : limitar((v - fracao) / (1 - fracao));
            pDepois.set(d);
            const a = limitar((d - apagaDe) / (apagaAte - apagaDe));
            if (bloco) bloco.style.opacity = String(1 - (a < 0.5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2));
        };
        atualizar(p.get());
        const parar = p.on('change', atualizar);
        return () => {
            parar();
            if (bloco) bloco.style.opacity = '';
        };
    }, [p, pDepois, toque, fracao, vhToque, apagaDe, apagaAte, temContinuacao]);

    return (
        <section
            id={id}
            ref={secao}
            className={toque ? 'relative h-[140svh]' : 'relative h-[calc(100vh_+_var(--palavras)_*_18.2vh_+_var(--extra)_*_1vh)] md:h-[calc(100vh_+_var(--palavras)_*_20vh_+_var(--extra)_*_1vh)]'}
            style={{ '--palavras': palavras, '--extra': extra, ...(toque && continuacao ? { height: `calc(140svh + ${vhToque}svh)` } : {}) } as React.CSSProperties}
        >
            {filtro}
            <div ref={fixo} className="sticky top-0 flex h-svh items-center px-4 sm:px-8">
                <div ref={alvo} className="w-full">
                    <div ref={texto} className={`mx-auto max-w-7xl text-center ${TAMANHO}`} style={estilo}>
                        {entrada === 'pontos' ? (
                            linhas.map((linha, i) => (
                                <LinhaQueNasce key={`${i}-${linha}`} texto={linha} indice={i} progresso={progresso} faixa={[(INICIO + i * cada) * fracao, (INICIO + (i + 1) * cada - 0.02) * fracao]} reduzido={reduzido} />
                            ))
                        ) : (
                            <PalavrasQueSobem linhas={linhas} progresso={progresso} reduzido={reduzido} semRastro={toque} pontos={entrada === 'pontos-de-baixo'} fracao={fracao} />
                        )}
                    </div>
                </div>
                {continuacao && <continuacao.Componente progresso={pDepois} texto={texto} palavra={continuacao.palavra} tamanho={TAMANHO} estilo={estilo} />}
            </div>
        </section>
    );
}

function LinhaQueNasce({ texto, indice, progresso, faixa, reduzido }: {
    texto: string;
    indice: number;
    progresso: MotionValue<number>;
    faixa: [number, number];
    reduzido: boolean;
}) {
    const id = `manifesto-${indice}`;
    const linha = useRef<HTMLSpanElement>(null);
    const letrasRef = useRef<HTMLSpanElement>(null);
    const desfoque = useRef<SVGFEGaussianBlurElement>(null);
    const limiar = useRef<SVGFEColorMatrixElement>(null);
    const movimento = useRef<SVGFEGaussianBlurElement>(null);
    const [l0, l1] = faixa;

    useEffect(() => {
        const el = linha.current;
        const visual = letrasRef.current;
        const blur = desfoque.current;
        const matriz = limiar.current;
        const rastroEl = movimento.current;
        if (!el || !visual || !blur || !matriz || !rastroEl) return;
        const cada = [...el.querySelectorAll<HTMLElement>('[data-letra]')];
        const atraso = cada.map((_, i) => sorteio(i + indice * 50) * ESPALHA);
        const opLetra = cada.map(() => '');
        const yLetra = cada.map(() => NaN);
        let filtro = '';
        let opac = '';
        let rastro = 0;
        let ultimo = NaN;
        const definir = (f: string, o: string) => {
            if (f !== filtro) visual.style.filter = filtro = f;
            if (o !== opac) visual.style.opacity = opac = o;
        };
        // cada letra: quanto acendeu e quanto falta subir. Devolve quantos px andaram, em média, as letras que se
        // moveram neste quadro (as paradas não contam, senão o rastro some na média)
        const letrasEm = (tl: number | null, tamanho: number) => {
            let andou = 0;
            let moveram = 0;
            cada.forEach((c, i) => {
                const o = tl === null ? '1' : limitar((tl - atraso[i]) / ACENDE).toFixed(3);
                if (o !== opLetra[i]) c.style.opacity = opLetra[i] = o;
                const y = tl === null ? 0 : (1 - saida(limitar((tl - atraso[i]) / CHEGA))) * SOBE * tamanho;
                const d = Number.isNaN(yLetra[i]) ? 0 : Math.abs(y - yLetra[i]);
                if (d > 0.05) { andou += d; moveram++; }
                if (d > 0.05 || Number.isNaN(yLetra[i])) {
                    c.style.top = `${y.toFixed(2)}px`;
                    yLetra[i] = y;
                }
            });
            return moveram ? andou / moveram : 0;
        };

        // a cada quadro, enquanto a linha está na tela: o rastro precisa sumir sozinho quando a rolagem para
        const quadroDe = () => {
            const v = progresso.get();
            const t = limitar((v - l0) / (l1 - l0));
            if (reduzido) {
                if (v !== ultimo) { letrasEm(null, 0); definir('none', t.toFixed(3)); }
                ultimo = v;
                return;
            }
            if (v === ultimo && rastro < 0.05) return;
            ultimo = v;
            if (t <= 0) {
                rastro = 0;
                return definir('none', '0');
            }
            // lido a cada quadro: o tamanho muda quando a fonte troca
            const tamanho = parseFloat(getComputedStyle(el).fontSize) || 100;
            // começa um pouco adiante, logo antes do primeiro ponto aparecer
            const tl = t >= 1 ? 1 : 0.2 + 0.8 * t;
            const andou = letrasEm(t >= 1 ? null : tl, tamanho);
            rastro += (Math.min(RASTRO_MAX * tamanho, andou * RASTRO) - rastro) * 0.4;
            if (t >= 1 && rastro < 0.25) {
                rastro = 0;
                return definir('none', '1');
            }
            const s = limitar((1 - t) / NITIDO);
            blur.setAttribute('stdDeviation', (tamanho * DESFOQUE * (1 - tl)).toFixed(2));
            matriz.setAttribute('values', `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${(1 + (DURO - 1) * s).toFixed(2)} ${(s * (0.5 - DURO * LIMIAR)).toFixed(2)}`);
            rastroEl.setAttribute('stdDeviation', `0 ${rastro.toFixed(2)}`);
            definir(`url(#${id})`, '1');
        };

        let quadro = 0;
        let ativo = false;
        const laco = () => {
            quadroDe();
            quadro = ativo ? requestAnimationFrame(laco) : 0;
        };
        const observador = new IntersectionObserver(([e]) => {
            ativo = e.isIntersecting;
            if (ativo && !quadro) quadro = requestAnimationFrame(laco);
        });
        observador.observe(el);
        quadroDe();
        return () => {
            observador.disconnect();
            cancelAnimationFrame(quadro);
        };
    }, [progresso, l0, l1, reduzido, id, indice]);

    // letra por letra só para o visual; o leitor de tela lê a linha inteira. As letras sobem com top (relative):
    // em inline o transform não pega, e inline-block quebraria o kerning entre elas
    return (
        <span ref={linha} data-linha className="block">
            <svg aria-hidden width="0" height="0" className="absolute">
                <filter id={id} x="-6%" y="-50%" width="112%" height="250%" colorInterpolationFilters="sRGB">
                    <feGaussianBlur ref={desfoque} stdDeviation="0" />
                    <feColorMatrix ref={limiar} type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
                    <feGaussianBlur ref={movimento} stdDeviation="0 0" />
                </filter>
            </svg>
            <span className="sr-only">{texto}</span>
            <span ref={letrasRef} aria-hidden style={{ opacity: 0 }}>
                {[...texto].map((letra, j) => (letra === ' ' ? ' ' : <span key={j} data-letra className="relative">{letra}</span>))}
            </span>
        </span>
    );
}

// 'de-baixo' e 'pontos-de-baixo': as palavras sobem na ordem de leitura, com uma pausa a mais na troca de linha.
// Com os pontos não há máscara: cada letra da palavra é um ponto que já nasce pequeno e inteiro (sem corte), acende
// no seu tempo e vem um pouco atrás dela na subida
const DURACAO = 0.16; // quanto da rolagem cada palavra leva subindo
const DURACAO_PONTOS = 0.2; // com os pontos, um pouco mais, para dar tempo de ver eles se juntarem
const FIM = 0.86; // a última assenta aqui; o resto da seção é a frase inteira, parada
const PAUSA = 1.2; // na troca de linha, em passos de palavra
const DESCE = 1.35; // em: de quanto abaixo a palavra sai (o bastante para começar inteira escondida)
const DESCE_PONTOS = 1; // em: sem a máscara, os pontos aparecem já à vista, então saem de mais perto
// em: a máscara cresce para não cortar acento, descendente e sobra lateral; a margem negativa devolve o espaço
const FOLGA = { cima: 0.12, baixo: 0.22, lado: 0.05 };
const SOBE_PONTO = 0.45; // em: o quanto cada ponto vem atrás da palavra
const RASTRO_PALAVRA = 1.2; // borrão por px que a palavra andou no quadro
const RASTRO_PALAVRA_MAX = 0.25; // em

// semRastro: tela de toque, as palavras sobem sem o rastro vertical. fracao: a parte da rolagem que é das palavras (o
// resto é da continuação)
function PalavrasQueSobem({ linhas, progresso, reduzido, semRastro, pontos, fracao }: { linhas: string[]; progresso: MotionValue<number>; reduzido: boolean; semRastro: boolean; pontos: boolean; fracao: number }) {
    const bloco = useRef<HTMLDivElement>(null);
    const prefixo = `manifesto-sobe-${useId().replace(/[^\w-]/g, '')}`;
    // as palavras de cada linha, com o número delas na ordem de leitura
    const porLinha = useMemo(() => {
        let n = 0;
        return linhas.map(linha => linha.split(' ').map(texto => ({ texto, indice: n++ })));
    }, [linhas]);
    const total = porLinha.reduce((soma, l) => soma + l.length, 0);

    useEffect(() => {
        const el = bloco.current;
        if (!el) return;
        const duracao = pontos ? DURACAO_PONTOS : DURACAO;
        const desce = pontos ? DESCE_PONTOS : DESCE;
        const cada = [...el.querySelectorAll<HTMLElement>('[data-palavra]')];
        const filtros = cada.map((_, i) => {
            const f = el.querySelector(`#${prefixo}-${i}`);
            return {
                desfoque: f?.querySelector<SVGFEGaussianBlurElement>('[data-desfoque]') ?? null,
                limiar: f?.querySelector<SVGFEColorMatrixElement>('[data-limiar]') ?? null,
                movimento: f?.querySelector<SVGFEGaussianBlurElement>('[data-movimento]') ?? null,
            };
        });
        // começo de cada palavra: passos iguais, mais a pausa a cada troca de linha
        const passos = porLinha.flatMap((palavras, li) => palavras.map(({ indice }) => indice + li * PAUSA));
        const ultimo = passos[passos.length - 1] || 1;
        const inicio = passos.map(s => INICIO + (s / ultimo) * (FIM - INICIO - duracao));
        const yAntes = cada.map(() => NaN);
        const rastro = cada.map(() => 0);
        const borrando = cada.map(() => false);
        const opPalavra = cada.map(() => '');
        // com os pontos: as letras de cada palavra, cada uma com o seu atraso
        const letras = cada.map(c => [...c.querySelectorAll<HTMLElement>('[data-letra]')]);
        const atraso = letras.map((ls, i) => ls.map((_, j) => sorteio(j + i * 50) * ESPALHA));
        const opLetra = letras.map(ls => ls.map(() => ''));
        const yLetra = letras.map(ls => ls.map(() => NaN));
        let vAntes = NaN;

        // quanto cada ponto da palavra acendeu e quanto ainda falta subir (começa um pouco adiante, logo antes do
        // primeiro ponto aparecer)
        const pontosEm = (i: number, t: number, tamanho: number) => {
            const tl = t >= 1 ? null : 0.2 + 0.8 * t;
            letras[i].forEach((l, j) => {
                const o = tl === null ? '1' : limitar((tl - atraso[i][j]) / ACENDE).toFixed(3);
                if (o !== opLetra[i][j]) l.style.opacity = opLetra[i][j] = o;
                const y = tl === null ? 0 : (1 - saida(limitar((tl - atraso[i][j]) / CHEGA))) * SOBE_PONTO * tamanho;
                // passos menores que 0,05 px não valem a escrita, mas a chegada no lugar sempre vale
                if (Number.isNaN(yLetra[i][j]) || Math.abs(y - yLetra[i][j]) > 0.05 || (y === 0 && yLetra[i][j] !== 0)) {
                    l.style.top = `${y.toFixed(2)}px`;
                    yLetra[i][j] = y;
                }
            });
        };

        // a cada quadro, enquanto a frase está na tela: o rastro precisa sumir sozinho quando a rolagem para
        const quadroDe = () => {
            const v = progresso.get();
            if (v === vAntes && !rastro.some(r => r > 0)) return;
            vAntes = v;
            const vp = Math.min(1, v / fracao);
            const tamanho = parseFloat(getComputedStyle(el).fontSize) || 100;
            cada.forEach((c, i) => {
                const t = limitar((vp - inicio[i]) / duracao);
                if (reduzido) {
                    c.style.transform = 'none';
                    c.style.opacity = t.toFixed(3);
                    return;
                }
                const y = (1 - saida(t)) * desce;
                const px = y * tamanho;
                const andou = Number.isNaN(yAntes[i]) ? 0 : Math.abs(px - yAntes[i]);
                if (Number.isNaN(yAntes[i]) || andou > 0.05 || (px === 0 && yAntes[i] !== 0)) {
                    c.style.transform = y > 0.0005 ? `translateY(${y.toFixed(4)}em)` : 'none';
                    yAntes[i] = px;
                }
                rastro[i] += (Math.min(RASTRO_PALAVRA_MAX * tamanho, andou * (semRastro ? 0 : RASTRO_PALAVRA)) - rastro[i]) * 0.4;
                if (rastro[i] <= 0.3) rastro[i] = 0;
                if (pontos) {
                    // sem máscara, a palavra que ainda não começou fica apagada
                    const o = t > 0 ? '1' : '0';
                    if (o !== opPalavra[i]) c.style.opacity = opPalavra[i] = o;
                    pontosEm(i, t, tamanho);
                }
                // o filtro só fica ligado enquanto os pontos viram letra ou a palavra ainda deixa rastro: desfoque em
                // letra grande pesa
                const nascendo = pontos && t > 0 && t < 1;
                const { desfoque, limiar, movimento } = filtros[i];
                if ((nascendo || rastro[i] > 0) && movimento) {
                    movimento.setAttribute('stdDeviation', `0 ${rastro[i].toFixed(2)}`);
                    if (desfoque && limiar) {
                        // os pontos: desfoque + limiar, que afrouxa no fim para a letra chegar com a borda normal
                        const tl = nascendo ? 0.2 + 0.8 * t : 1;
                        const s = nascendo ? limitar((1 - t) / NITIDO) : 0;
                        desfoque.setAttribute('stdDeviation', (tamanho * DESFOQUE * (1 - tl)).toFixed(2));
                        limiar.setAttribute('values', `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${(1 + (DURO - 1) * s).toFixed(2)} ${(s * (0.5 - DURO * LIMIAR)).toFixed(2)}`);
                    }
                    if (!borrando[i]) { c.style.filter = `url(#${prefixo}-${i})`; borrando[i] = true; }
                } else if (borrando[i]) {
                    c.style.filter = '';
                    borrando[i] = false;
                }
            });
        };

        let quadro = 0;
        let ativo = false;
        const laco = () => {
            quadroDe();
            quadro = ativo ? requestAnimationFrame(laco) : 0;
        };
        const observador = new IntersectionObserver(([e]) => {
            ativo = e.isIntersecting;
            if (ativo && !quadro) quadro = requestAnimationFrame(laco);
        });
        observador.observe(el);
        quadroDe();
        return () => {
            observador.disconnect();
            cancelAnimationFrame(quadro);
        };
    }, [progresso, reduzido, semRastro, prefixo, porLinha, pontos, fracao]);

    // cada palavra é um bloco em linha com a palavra dentro, que sobe com transform; sem os pontos, esse bloco corta o
    // que passa da borda (a máscara). Dentro da palavra o texto segue corrido (com os pontos, letra por letra em
    // linha, que sobem com top), então o kerning fica igual; o word-spacing devolve o que a margem negativa da folga
    // come do espaço entre as palavras. O leitor de tela lê a linha inteira
    return (
        <div ref={bloco}>
            <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
                {Array.from({ length: total }, (_, i) => (
                    <filter key={i} id={`${prefixo}-${i}`} x="-20%" y="-60%" width="140%" height="220%" colorInterpolationFilters="sRGB">
                        {pontos && <feGaussianBlur data-desfoque stdDeviation="0" />}
                        {pontos && <feColorMatrix data-limiar type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />}
                        <feGaussianBlur data-movimento stdDeviation="0 0" />
                    </filter>
                ))}
            </svg>
            {porLinha.map((palavras, li) => (
                <span key={`${li}-${linhas[li]}`} className="block" style={{ wordSpacing: `${FOLGA.lado * 2}em` }}>
                    <span className="sr-only">{linhas[li]}</span>
                    <span aria-hidden>
                        {palavras.map(({ texto, indice }, pi) => (
                            <Fragment key={indice}>
                                {pi > 0 && ' '}
                                <span
                                    className={pontos ? 'inline-block align-top' : 'inline-block overflow-hidden align-top'}
                                    style={{ padding: `${FOLGA.cima}em ${FOLGA.lado}em ${FOLGA.baixo}em`, margin: `-${FOLGA.cima}em -${FOLGA.lado}em -${FOLGA.baixo}em` }}
                                >
                                    <span data-palavra className="inline-block" style={pontos ? { transform: `translateY(${DESCE_PONTOS}em)`, opacity: 0 } : { transform: `translateY(${DESCE}em)` }}>
                                        {pontos ? [...texto].map((letra, j) => <span key={j} data-letra className="relative">{letra}</span>) : texto}
                                    </span>
                                </span>
                            </Fragment>
                        ))}
                    </span>
                </span>
            ))}
        </div>
    );
}
