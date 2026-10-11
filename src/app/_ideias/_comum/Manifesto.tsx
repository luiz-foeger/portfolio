'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useReducedMotion, type MotionValue } from 'motion/react';
import { limitar, useProgresso } from './progresso';
import { ajustarLargura } from './ajuste';
import { useBorrao } from './borrao';

// o manifesto se escreve com a rolagem: cada linha nasce de pontinhos soltos que sobem, incham, se juntam por
// palavra e viram letras. É o efeito aprovado na simulação (desfoque + limiar num filtro SVG) com desfoque de
// movimento: as letras sobem até o lugar e deixam um rastro vertical na medida da velocidade, que some quando a
// rolagem para. chave: muda quando a fonte ou o texto mudam (refaz o ajuste de tamanho)
const INICIO = 0.06;
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

export default function Manifesto({ linhas, estilo, chave, id }: { linhas: string[]; estilo: React.CSSProperties; chave: string; id?: string }) {
    const secao = useRef<HTMLElement>(null);
    const bloco = useRef<HTMLDivElement>(null);
    const p = useProgresso(secao);
    const reduzido = useReducedMotion() ?? false;
    // quando a seção acaba, o bloco sai com a rolagem e borra junto
    const { alvo, filtro } = useBorrao<HTMLDivElement>('v');
    const cada = (1 - INICIO - 0.08) / linhas.length;

    // no desktop cada linha fica numa linha só: o tamanho sai da mais longa
    useLayoutEffect(() => {
        const el = bloco.current;
        if (!el) return;
        const ajustar = () => {
            if (window.innerWidth < 768) { el.style.fontSize = ''; return; }
            const ls = [...el.querySelectorAll<HTMLElement>('[data-linha]')];
            ajustarLargura(el, () => Math.max(...ls.map(l => l.offsetWidth)), el.clientWidth, window.innerWidth * 0.08);
        };
        ajustar();
        document.fonts?.ready.then(ajustar);
        document.fonts?.addEventListener('loadingdone', ajustar);
        window.addEventListener('resize', ajustar);
        return () => {
            document.fonts?.removeEventListener('loadingdone', ajustar);
            window.removeEventListener('resize', ajustar);
        };
    }, [chave]);

    return (
        <section id={id} ref={secao} className="relative h-[300vh] md:h-[320vh]">
            {filtro}
            <div className="sticky top-0 flex h-svh items-center px-[5vw]">
                <div ref={alvo} className="w-full">
                    <div ref={bloco} className="w-full text-[11vw]" style={estilo}>
                        {linhas.map((linha, i) => (
                            <LinhaQueNasce key={`${i}-${linha}`} texto={linha} indice={i} progresso={p} faixa={[INICIO + i * cada, INICIO + (i + 1) * cada - 0.02]} reduzido={reduzido} />
                        ))}
                    </div>
                </div>
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
        <span ref={linha} data-linha className="block md:w-max md:whitespace-nowrap">
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
