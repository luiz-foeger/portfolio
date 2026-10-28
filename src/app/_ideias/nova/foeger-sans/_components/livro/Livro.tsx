'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';
import { useIdioma } from '../../../_lib/idioma';
import { TIPO } from '../../../_lib/tipo';
import { TEXTOS_FONTE } from '../../_lib/textos';
import { FOLHA, usePaginas } from './Paginas';

// o livro: o espécime de verdade, para folhear. No desktop abre em páginas duplas e cada folha vira em 3D em volta
// da lombada: arrastando (passou de 40% do caminho, vira; se não, volta), clicando na página ou com as setas do
// teclado. No celular, uma página por vez. O sumário leva direto à página, e o PDF sai das mesmas páginas
type Giro = { folha: number; de: number; para: number; arrastando: boolean };

export default function Livro() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].livro;
    const reduzido = useReducedMotion() ?? false;
    const caixa = useRef<HTMLDivElement>(null);
    const [medida, setMedida] = useState({ cw: 1000, vh: 900 });
    const duplo = medida.cw >= 860;
    const [virada, setVirada] = useState(0);
    const [giro, setGiro] = useState<Giro | null>(null);
    const progresso = useMotionValue(0);
    const deslocamento = useMotionValue(0);
    const irParaRef = useRef<(n: number) => void>(() => { });
    const paginas = usePaginas(idioma, n => irParaRef.current(n));
    const N = paginas.length;
    const folhas = duplo ? Math.ceil(N / 2) : N;

    // tamanho da página: a dupla cabe na largura e na altura da tela
    useLayoutEffect(() => {
        const medir = () => setMedida({ cw: caixa.current?.clientWidth ?? 1000, vh: window.innerHeight });
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);
    const pw = duplo ? Math.min(medida.cw / 2, (medida.vh * 0.72) / 1.414) : Math.min(medida.cw, (medida.vh * 0.64) / 1.414);
    const ph = pw * 1.414;
    const escala = pw / FOLHA.w;

    // ao mudar de modo (largura da tela), volta ao começo
    const [duploAntes, setDuploAntes] = useState(duplo);
    if (duplo !== duploAntes) {
        setDuploAntes(duplo);
        setVirada(0);
        setGiro(null);
    }

    // fechado na capa, o livro fica centrado; aberto, a lombada vai para o meio (na primeira vez, sem animar).
    // jump para de verdade uma animação em curso (set não para, e ela ganharia depois)
    const primeira = useRef(true);
    useEffect(() => {
        if (!duplo) { deslocamento.jump(0); return; }
        const alvo = virada === 0 && !giro ? -pw / 2 : virada === folhas && !giro ? pw / 2 : 0;
        if (primeira.current) { primeira.current = false; deslocamento.jump(alvo); return; }
        const a = animate(deslocamento, alvo, { duration: reduzido ? 0 : 0.6, ease: [0.65, 0, 0.35, 1] });
        return () => a.stop();
    }, [virada, giro, duplo, pw, folhas, deslocamento, reduzido]);

    const terminar = useCallback((g: Giro, completa: boolean) => {
        animate(progresso, completa ? 1 : 0, {
            duration: reduzido ? 0 : completa ? 0.55 : 0.35,
            ease: [0.45, 0, 0.2, 1],
            // o progresso só volta a 0 no próximo giro: zerar aqui faria a folha piscar na posição antiga
            onComplete: () => {
                if (completa) setVirada(v => v + (g.para < g.de ? 1 : -1));
                setGiro(null);
            },
        });
    }, [progresso, reduzido]);

    const virar = useCallback((sentido: 1 | -1) => {
        if (giro) return;
        if (sentido === 1 && virada >= folhas) return;
        if (sentido === -1 && virada <= 0) return;
        const g: Giro = sentido === 1 ? { folha: virada, de: 0, para: -180, arrastando: false } : { folha: virada - 1, de: -180, para: 0, arrastando: false };
        progresso.set(0);
        setGiro(g);
        terminar(g, true);
    }, [giro, virada, folhas, progresso, terminar]);

    // ir direto a uma página (sumário): pula sem animar folha por folha. Logo depois de um arrasto, o clique que o
    // navegador ainda manda para o link é ignorado
    const ultimoArrasto = useRef(0);
    useLayoutEffect(() => {
        irParaRef.current = (n: number) => {
            if (giro || performance.now() - ultimoArrasto.current < 400) return;
            setVirada(duplo ? Math.floor(n / 2) : n - 1);
        };
    });

    // arrastar o canto da página
    const inicio = useRef<{ x: number; t: number; lado: 1 | -1; g: Giro | null; link: boolean } | null>(null);
    const apertar = (e: React.PointerEvent<HTMLDivElement>) => {
        if (giro) return;
        const r = caixa.current?.getBoundingClientRect();
        if (!r) return;
        const meio = r.left + r.width / 2 + deslocamento.get();
        const lado: 1 | -1 = duplo ? (e.clientX >= meio ? 1 : -1) : e.clientX >= r.left + r.width / 2 ? 1 : -1;
        const link = !!(e.target as Element).closest?.('[data-pagina-link]');
        inicio.current = { x: e.clientX, t: performance.now(), lado, g: null, link };
        // sem capturar quando começa num link: o clique precisa chegar nele
        if (!link) (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const mover = (e: React.PointerEvent<HTMLDivElement>) => {
        const i = inicio.current;
        if (!i) return;
        const dx = e.clientX - i.x;
        if (!i.g) {
            if (Math.abs(dx) < 8) return;
            // no desktop vale o lado onde apertou; no celular, o sentido do gesto
            const sentido: 1 | -1 = duplo ? i.lado : dx < 0 ? 1 : -1;
            if (sentido === 1 && virada >= folhas) return;
            if (sentido === -1 && virada <= 0) return;
            i.g = sentido === 1 ? { folha: virada, de: 0, para: -180, arrastando: true } : { folha: virada - 1, de: -180, para: 0, arrastando: true };
            setGiro(i.g);
        }
        const p = (i.g.para < i.g.de ? -dx : dx) / (pw * (duplo ? 1.6 : 1.1));
        progresso.set(Math.max(0, Math.min(1, p)));
    };
    const soltar = (e: React.PointerEvent<HTMLDivElement>) => {
        const i = inicio.current;
        inicio.current = null;
        if (!i) return;
        if (!i.g) {
            // foi um clique: num link do sumário, quem age é o link; fora dele, a página da direita avança e a da
            // esquerda volta
            if (!i.link) virar(i.lado);
            return;
        }
        ultimoArrasto.current = performance.now();
        const dt = Math.max(1, performance.now() - i.t);
        const rapido = Math.abs(e.clientX - i.x) / dt > 0.6;
        terminar(i.g, progresso.get() > 0.4 || rapido);
    };

    // setas do teclado, quando o livro está na tela
    useEffect(() => {
        let naTela = false;
        const el = caixa.current;
        const observador = new IntersectionObserver(([x]) => { naTela = x.isIntersecting; }, { threshold: 0.4 });
        if (el) observador.observe(el);
        const tecla = (e: KeyboardEvent) => {
            if (!naTela || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); virar(1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); virar(-1); }
        };
        window.addEventListener('keydown', tecla);
        return () => { window.removeEventListener('keydown', tecla); observador.disconnect(); };
    }, [virar]);

    const frente = (j: number) => (duplo ? paginas[2 * j] : paginas[j]);
    const verso = (j: number) => (duplo ? paginas[2 * j + 1] : null);
    const aberta = duplo ? (virada === 0 ? '1' : virada === folhas ? `${N}` : `${2 * virada}–${2 * virada + 1}`) : `${virada + 1}`;

    return (
        <div className="flex flex-col items-center gap-6">
            {/* numa página só, a folha que vira sai pela esquerda: o corte evita rolagem para o lado */}
            <div ref={caixa} className={`relative w-full select-none ${duplo ? '' : 'overflow-hidden'}`} style={{ height: ph, perspective: 2400 }}>
                <motion.div
                    className="absolute top-0 h-full touch-pan-y"
                    style={{ left: duplo ? '50%' : `calc(50% - ${pw / 2}px)`, x: deslocamento, transformStyle: 'preserve-3d', cursor: giro?.arrastando ? 'grabbing' : 'grab' }}
                    onPointerDown={apertar}
                    onPointerMove={mover}
                    onPointerUp={soltar}
                    onPointerCancel={soltar}
                >
                    {Array.from({ length: folhas }, (_, j) => (
                        <Folha
                            key={`${duplo}-${j}`}
                            j={j}
                            virada={virada}
                            giro={giro}
                            progresso={progresso}
                            folhas={folhas}
                            pw={pw}
                            ph={ph}
                            escala={escala}
                            frente={frente(j)}
                            verso={verso(j)}
                            duplo={duplo}
                        />
                    ))}
                </motion.div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-4" style={TIPO.menu}>
                <button onClick={() => virar(-1)} disabled={virada === 0 || !!giro} aria-label={t.anterior} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/20 text-lg transition-opacity hover:border-black disabled:opacity-30">←</button>
                <span className="min-w-[110px] text-center text-[15px] text-black/70" aria-live="polite">{t.pagina} {aberta} / {N}</span>
                <button onClick={() => virar(1)} disabled={virada >= folhas || !!giro} aria-label={t.proxima} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/20 text-lg transition-opacity hover:border-black disabled:opacity-30">→</button>
                <a href={`/foeger-sans-especime-${idioma}.pdf`} download className="ml-2 rounded-full bg-[#111] px-5 py-2.5 text-[15px] text-[#E4E4E4] transition-transform hover:scale-[1.03]" style={{ fontWeight: 600 }}>
                    {t.baixar} ↓
                </a>
            </div>
        </div>
    );
}

// uma folha: frente e verso, girando em volta da lombada (borda esquerda)
function Folha({ j, virada, giro, progresso, folhas, pw, ph, escala, frente, verso, duplo }: {
    j: number; virada: number; giro: Giro | null; progresso: MotionValue<number>; folhas: number; pw: number; ph: number; escala: number;
    frente: React.ReactNode; verso: React.ReactNode; duplo: boolean;
}) {
    const virando = giro?.folha === j;
    const parada = j < virada ? -180 : 0;
    const angulo = useTransform(progresso, p => (virando && giro ? giro.de + (giro.para - giro.de) * p : parada));
    // sombra da curva: mais escura no meio do giro
    const sombra = useTransform(progresso, p => (virando ? Math.sin(Math.PI * p) * 0.28 : 0));
    // quem está em cima: as viradas, da última para trás; as não viradas, da primeira para trás; a que gira, por cima
    const z = virando ? 400 : j < virada ? 100 + j : 100 + (folhas - j);
    // longe da folha aberta não precisa desenhar (são muitas camadas 3D). Na dupla: as duas abertas e as de baixo
    // de cada lado; numa página só: a aberta e a de baixo
    const visivel = virando || (duplo ? j >= virada - 2 && j <= virada + 1 : j === virada || j === virada + 1);

    return (
        <motion.div
            className="absolute left-0 top-0"
            style={{ width: pw, height: ph, rotateY: angulo, transformOrigin: 'left center', transformStyle: 'preserve-3d', zIndex: z, visibility: visivel ? 'visible' : 'hidden' }}
        >
            <Face escala={escala} lado="frente" sombra={sombra} duplo={duplo}>{frente}</Face>
            <Face escala={escala} lado="verso" sombra={sombra} duplo={duplo}>{verso}</Face>
        </motion.div>
    );
}

function Face({ escala, lado, sombra, duplo, children }: { escala: number; lado: 'frente' | 'verso'; sombra: MotionValue<number>; duplo: boolean; children: React.ReactNode }) {
    return (
        <div
            className="absolute inset-0 overflow-hidden bg-[#F3F1EC] shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: lado === 'verso' ? 'rotateY(180deg)' : undefined }}
        >
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: FOLHA.w, height: FOLHA.h, transform: `scale(${escala})` }}>{children}</div>
            {/* a dobra da lombada: um degradê perto do miolo */}
            {duplo && (
                <div
                    className="pointer-events-none absolute inset-y-0 w-[12%]"
                    style={lado === 'frente' ? { left: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.14), transparent)' } : { right: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.14), transparent)' }}
                />
            )}
            <motion.div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: sombra }} />
        </div>
    );
}
