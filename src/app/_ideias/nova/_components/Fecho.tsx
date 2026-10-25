'use client';

// o fecho, antes do rodapé: a chamada ("Tem um projeto em mente?") no claro. Com a rolagem, o ponto do "?" cresce
// devagar, acelera e cobre a tela, e as letras invertem quando ele passa (modo diferença); coberta a tela, o rodapé
// escuro de sempre chega sem emenda. Em diferença qualquer diferença de forma aparece, então o pingo é cortado do sinal
// e desenhado como o próprio círculo de tinta
import { useEffect, useRef } from 'react';
import { useMotionValueEvent } from 'motion/react';
import { useProgresso } from '../../_comum/progresso';
import { useIdioma, useTexto } from '../_lib/idioma';
import { TIPO } from '../_lib/tipo';

const CLARO = '#E4E4E4';
const TINTA = '#050505';
// em que parte da rolagem da seção o ponto começa a crescer e quando cobre a tela
const PONTO = { comeca: 0.1, cobre: 0.72 };

const limitar = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const trecho = (t: number, a: number, b: number) => limitar((t - a) / (b - a));

// o pingo do "?": desenha o sinal num canvas e acha a mancha de baixo; devolve o centro (em relação à origem do sinal
// e à linha de base) e o tamanho dela (nada, com a letra pequena demais para medir, como numa janela sem largura)
function medirPingo(fonte: string, peso: string, tamanho: number) {
    if (!(tamanho >= 4)) return null;
    const lado = Math.ceil(tamanho * 1.6);
    const cv = document.createElement('canvas');
    cv.width = lado;
    cv.height = lado;
    const g = cv.getContext('2d', { willReadFrequently: true })!;
    g.font = `${peso} ${tamanho}px ${fonte}`;
    g.fillStyle = '#000';
    const x0 = Math.round(tamanho * 0.3);
    const base = Math.round(tamanho * 1.2);
    g.fillText('?', x0, base);
    const d = g.getImageData(0, 0, lado, lado).data;
    const tinta = (x: number, y: number) => d[(y * lado + x) * 4 + 3] > 128;
    const linhaTem = (y: number) => { for (let x = 0; x < lado; x++) if (tinta(x, y)) return true; return false; };
    let baixo = lado - 1;
    while (baixo > 0 && !linhaTem(baixo)) baixo--;
    let alto = baixo;
    while (alto > 0 && linhaTem(alto - 1)) alto--;
    let esq = lado;
    let dir = 0;
    for (let y = alto; y <= baixo; y++) for (let x = 0; x < lado; x++) if (tinta(x, y)) { esq = Math.min(esq, x); dir = Math.max(dir, x); }
    if (dir < esq) return null;
    return { cx: (esq + dir + 1) / 2 - x0, cy: (alto + baixo + 1) / 2 - base, w: dir - esq + 1, h: baixo - alto + 1 };
}

export default function Fecho() {
    const t = useTexto();
    const { idioma } = useIdioma();
    const secao = useRef<HTMLElement>(null);
    const palco = useRef<HTMLDivElement>(null);
    const tinta = useRef<HTMLDivElement>(null);
    const frase = useRef<HTMLHeadingElement>(null);
    const sinal = useRef<HTMLSpanElement>(null);
    const linhaDeBase = useRef<HTMLSpanElement>(null);
    // o pingo no palco: centro e raio
    const pingo = useRef<{ x: number; y: number; r: number } | null>(null);
    const p = useProgresso(secao);

    const desenhar = (v: number) => {
        const pg = pingo.current;
        const el = tinta.current;
        const pl = palco.current;
        if (!pg || !el || !pl) return;
        const W = pl.clientWidth;
        const H = pl.clientHeight;
        // cresce devagar e acelera (como a palavra do ato), até o raio que cobre a tela a partir do ponto
        const e = trecho(v, PONTO.comeca, PONTO.cobre);
        const cobre = Math.hypot(Math.max(pg.x, W - pg.x), Math.max(pg.y, H - pg.y)) + 4;
        const r = pg.r * Math.pow(cobre / pg.r, Math.pow(e, 2.2));
        el.style.clipPath = `circle(${r.toFixed(2)}px at ${pg.x.toFixed(2)}px ${pg.y.toFixed(2)}px)`;
    };
    useMotionValueEvent(p, 'change', desenhar);

    // mede o pingo no lugar dele (de novo quando a fonte chega, o idioma troca ou o tamanho muda)
    useEffect(() => {
        const medir = () => {
            const pl = palco.current;
            const s = sinal.current;
            const b = linhaDeBase.current;
            const f = frase.current;
            if (!pl || !s || !b || !f) return;
            const cs = getComputedStyle(f);
            const m = medirPingo(cs.fontFamily, cs.fontWeight, parseFloat(cs.fontSize));
            if (!m) return;
            const rp = pl.getBoundingClientRect();
            const rs = s.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const y = rb.top - rp.top + m.cy;
            // o corte tira o pingo do sinal: sai o que fica abaixo do alto dele (com folga), e o círculo entra no lugar
            const corte = rs.bottom - rp.top - (y - m.h / 2) + 1.5;
            s.style.clipPath = `inset(-0.3em -0.3em ${corte.toFixed(1)}px -0.3em)`;
            pingo.current = { x: rs.left - rp.left + m.cx, y, r: Math.max(m.w, m.h) / 2 };
            desenhar(p.get());
        };
        medir();
        document.fonts.ready.then(medir);
        const redimensiona = new ResizeObserver(medir);
        if (palco.current) redimensiona.observe(palco.current);
        return () => redimensiona.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idioma]);

    const chamada = t.contato.chamada;
    return (
        <section ref={secao} className="relative" style={{ height: '240vh' }}>
            <div ref={palco} className="sticky top-0 h-svh overflow-hidden" style={{ background: CLARO, isolation: 'isolate' }}>
                <div ref={tinta} aria-hidden className="absolute inset-0" style={{ background: TINTA, clipPath: 'circle(0px at 50% 50%)' }} />
                <div className="absolute inset-0 flex items-center justify-center px-[4vw]">
                    <h2 ref={frase} className="max-w-[12ch] text-center text-[14vw] md:max-w-none md:text-[10.4vw]" style={{ ...TIPO.manifesto, color: CLARO, mixBlendMode: 'difference', textWrap: 'balance' }}>
                        {chamada.slice(0, -1)}
                        <span ref={sinal} className="inline-block">{chamada.slice(-1)}</span>
                        <span ref={linhaDeBase} aria-hidden className="inline-block h-0 w-0 align-baseline" />
                    </h2>
                </div>
            </div>
        </section>
    );
}
