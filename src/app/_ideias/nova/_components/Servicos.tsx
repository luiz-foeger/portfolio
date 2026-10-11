'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent } from 'motion/react';
import { useLenis } from 'lenis/react';
import { useProgresso, useTela } from '../../_comum/progresso';
import { ajustarLargura } from '../../_comum/ajuste';
import { useBorrao } from '../../_comum/borrao';
import { useIdioma, useTexto } from '../_lib/idioma';
import type { IdServico } from '../_lib/textos';
import { TIPO, pesoFino } from '../_lib/tipo';
import { Palco, TrocaComRastro, useNaTela } from './Palco';
import DemoSaas from './demos/DemoSaas';
import DemoBranding from './demos/DemoBranding';
import DemoUx from './demos/DemoUx';
import DemoUi from './demos/DemoUi';

// serviços demonstrados: em vez de imagem de trabalho, cada serviço mostra, funcionando, o que ele entrega.
// No desktop os nomes ficam à esquerda (finos, engrossam perto do mouse) e o palco à direita troca de demonstração
// conforme a rolagem; clicar num nome leva até ele. No celular, cada serviço vem com o seu palco embaixo
const DEMOS: Record<IdServico, (p: { ativo: boolean }) => React.ReactNode> = {
    saas: p => <DemoSaas {...p} />,
    branding: p => <DemoBranding {...p} />,
    ux: p => <DemoUx {...p} />,
    ui: p => <DemoUi {...p} />,
};

export default function Servicos() {
    const { w } = useTela();
    return w < 768 ? <ServicosEmLista /> : <ServicosComPalco />;
}

// letra fina que engrossa: perto do mouse no desktop; no celular, a palavra que passa pelo meio da tela
function useLetrasQueEngrossam(letras: React.RefObject<(HTMLSpanElement | null)[]>, deps: unknown[]) {
    useEffect(() => {
        const lista = letras.current;
        const fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        let px = -9999;
        let py = -9999;
        let quadro = 0;
        const aplicar = () => {
            quadro = 0;
            const raio = fino ? Math.max(160, window.innerWidth * 0.14) : window.innerHeight * 0.22;
            const meio = window.innerHeight / 2;
            for (const el of lista) {
                if (!el) continue;
                const r = el.getBoundingClientRect();
                const d = fino ? Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py) : Math.abs(r.top + r.height / 2 - meio);
                const f = Math.max(0, 1 - d / raio);
                el.style.fontVariationSettings = pesoFino(f * f * (3 - 2 * f));
            }
        };
        const agendar = () => { if (!quadro) quadro = requestAnimationFrame(aplicar); };
        const mover = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return;
            px = e.clientX;
            py = e.clientY;
            agendar();
        };
        aplicar();
        window.addEventListener('pointermove', mover);
        window.addEventListener('scroll', agendar, { passive: true });
        window.addEventListener('resize', agendar);
        return () => {
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('scroll', agendar);
            window.removeEventListener('resize', agendar);
            cancelAnimationFrame(quadro);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

function Nome({ nome, inicio, letras, style, className }: { nome: string; inicio: number; letras: React.RefObject<(HTMLSpanElement | null)[]>; style?: React.CSSProperties; className?: string }) {
    return (
        <span className={className} style={style} aria-label={nome}>
            {[...nome].map((letra, j) => (
                <span key={j} aria-hidden ref={el => { letras.current[inicio + j] = el; }} className="inline-block transition-[font-variation-settings] duration-150">
                    {letra}
                </span>
            ))}
        </span>
    );
}

function ServicosComPalco() {
    const t = useTexto();
    const { idioma } = useIdioma();
    const lenis = useLenis();
    const secao = useRef<HTMLElement>(null);
    const coluna = useRef<HTMLDivElement>(null);
    const medida = useRef<HTMLSpanElement>(null);
    const letras = useRef<(HTMLSpanElement | null)[]>([]);
    const p = useProgresso(secao);
    const n = t.servicos.length;
    const [ativo, setAtivo] = useState(0);
    const [tamanho, setTamanho] = useState<number | null>(null);
    useMotionValueEvent(p, 'change', v => setAtivo(Math.min(n - 1, Math.max(0, Math.floor(v * n)))));
    useLetrasQueEngrossam(letras, [idioma]);

    // o tamanho dos nomes: o mais largo, já no peso mais grosso, cabe na coluna, e os quatro cabem na altura
    useLayoutEffect(() => {
        const ajustar = () => {
            const m = medida.current;
            const c = coluna.current;
            if (!m || !c) return;
            const porAltura = (window.innerHeight - 88 - window.innerHeight * 0.1) / (n * 1.02);
            ajustarLargura(m, m, c.clientWidth, Math.min(window.innerWidth * 0.11, porAltura));
            setTamanho(parseFloat(m.style.fontSize));
        };
        ajustar();
        document.fonts?.ready.then(ajustar);
        window.addEventListener('resize', ajustar);
        return () => window.removeEventListener('resize', ajustar);
    }, [n, idioma]);

    const ir = (i: number) => {
        const el = secao.current;
        if (!el) return;
        const topo = el.getBoundingClientRect().top + window.scrollY;
        const curso = el.offsetHeight - window.innerHeight;
        const alvo = topo + curso * ((i + 0.5) / n);
        if (lenis) lenis.scrollTo(alvo, { duration: 1.2 });
        else window.scrollTo({ top: alvo, behavior: 'smooth' });
    };

    const s = t.servicos[ativo];
    let indice = 0;
    return (
        <section id="servicos" ref={secao} className="relative" style={{ height: `${n * 90 + 100}vh` }}>
            <div className="sticky top-0 grid h-svh grid-cols-12 items-center gap-x-[3vw] px-[4vw] pb-[5vh] pt-[88px]">
                <div ref={coluna} className="relative col-span-6 flex flex-col">
                    <span ref={medida} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap" style={{ ...TIPO.fina, fontVariationSettings: pesoFino(1) }}>
                        {t.servicos.reduce((a, x) => (x.nome.length > a.length ? x.nome : a), '')}
                    </span>
                    {t.servicos.map((x, i) => {
                        const inicio = indice;
                        indice += x.nome.length;
                        return (
                            <button
                                key={x.id}
                                onClick={() => ir(i)}
                                aria-current={i === ativo}
                                className={`w-fit whitespace-nowrap text-left transition-colors duration-500 ${i === ativo ? 'text-white' : 'text-white/25 hover:text-white/60'}`}
                                style={{ ...TIPO.fina, fontSize: tamanho ? `${tamanho}px` : '9vw' }}
                            >
                                <Nome nome={x.nome} inicio={inicio} letras={letras} />
                            </button>
                        );
                    })}
                </div>

                <div className="col-span-6 flex h-full max-h-[calc(100svh-88px-5vh)] flex-col justify-center gap-5">
                    <div className="relative h-[3.2em] text-lg md:text-xl" style={TIPO.texto}>
                        <AnimatePresence initial={false} mode="wait">
                            <motion.p
                                key={`${s.id}-${idioma}`}
                                className="absolute inset-x-0 bottom-0 max-w-[36ch] text-white/65"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35 }}
                            >
                                {s.texto}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                    <Palco className="max-h-[62svh]" style={{ width: 'min(100%, calc(62svh * 400 / 460))' }}>
                        <TrocaComRastro chave={s.id}>{DEMOS[s.id]({ ativo: true })}</TrocaComRastro>
                    </Palco>
                </div>
            </div>
        </section>
    );
}

function ServicosEmLista() {
    const t = useTexto();
    const { idioma } = useIdioma();
    const letras = useRef<(HTMLSpanElement | null)[]>([]);
    const medida = useRef<HTMLSpanElement>(null);
    const caixa = useRef<HTMLDivElement>(null);
    const [tamanho, setTamanho] = useState<number | null>(null);
    const { alvo, filtro } = useBorrao<HTMLDivElement>('v');
    useLetrasQueEngrossam(letras, [idioma]);

    useLayoutEffect(() => {
        const ajustar = () => {
            const m = medida.current;
            const c = caixa.current;
            if (!m || !c) return;
            ajustarLargura(m, m, c.clientWidth, window.innerWidth * 0.22);
            setTamanho(parseFloat(m.style.fontSize));
        };
        ajustar();
        document.fonts?.ready.then(ajustar);
        window.addEventListener('resize', ajustar);
        return () => window.removeEventListener('resize', ajustar);
    }, [idioma]);

    let indice = 0;
    return (
        <section id="servicos" className="relative px-[4vw] pb-[14vh] pt-[16vh]">
            {filtro}
            <div ref={caixa} className="relative">
                <span ref={medida} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap" style={{ ...TIPO.fina, fontVariationSettings: pesoFino(1) }}>
                    {t.servicos.reduce((a, x) => (x.nome.length > a.length ? x.nome : a), '')}
                </span>
            </div>
            <div ref={alvo} className="flex flex-col gap-[12vh]">
                {t.servicos.map(x => {
                    const inicio = indice;
                    indice += x.nome.length;
                    return (
                        <ServicoNaLista key={x.id} id={x.id} texto={x.texto}>
                            <h3 className="whitespace-nowrap" style={{ ...TIPO.fina, fontSize: tamanho ? `${tamanho}px` : '20vw' }}>
                                <Nome nome={x.nome} inicio={inicio} letras={letras} />
                            </h3>
                        </ServicoNaLista>
                    );
                })}
            </div>
        </section>
    );
}

function ServicoNaLista({ id, texto, children }: { id: IdServico; texto: string; children: React.ReactNode }) {
    const { ref, naTela } = useNaTela<HTMLDivElement>(0.4);
    return (
        <div className="flex flex-col gap-4">
            {children}
            <p className="max-w-[34ch] text-base text-white/65" style={TIPO.texto}>{texto}</p>
            <div ref={ref}>
                <Palco>{DEMOS[id]({ ativo: naTela })}</Palco>
            </div>
        </div>
    );
}
