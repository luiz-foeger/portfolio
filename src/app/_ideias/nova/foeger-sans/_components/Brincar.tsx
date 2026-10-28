'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useIdioma } from '../../_lib/idioma';
import { TIPO } from '../../_lib/tipo';
import { TEXTOS_FONTE } from '../_lib/textos';
import { PedraBruta, existe } from './Glifo';

// área de brincar: escrever com a fonte (o que ela ainda não tem aparece em outra letra e na lista embaixo),
// mudar tamanho, espaço e fundo, e "Derrubar": as letras despencam e se empilham no chão como pedras. Dá para pegar
// uma letra e jogar; "Arrumar" devolve todas ao texto
const GRAVIDADE = 2600; // px/s²
const QUIQUE = 0.28;
const COLUNA = 4; // px por coluna do monte
// onde a tinta começa e termina dentro da caixa da letra (entrelinha 1.02, ascendente 1.025, descendente 0.208)
const TOPO = 0.28;
const BASE = 0.84;

type Pedra = { c: string; x: number; y: number; w: number; h: number; vx: number; vy: number; r: number; vr: number; parada: boolean; presa: boolean; atraso: number; ox: number; oy: number };

export default function Brincar() {
    const { idioma } = useIdioma();
    const t = TEXTOS_FONTE[idioma].brincar;
    const [texto, setTexto] = useState('');
    const [tamanho, setTamanho] = useState(140);
    const [espaco, setEspaco] = useState(0);
    const [claro, setClaro] = useState(false);
    const [modo, setModo] = useState<'escrever' | 'caindo' | 'arrumando'>('escrever');
    const area = useRef<HTMLDivElement>(null);
    const campo = useRef<HTMLTextAreaElement>(null);
    const espelho = useRef<HTMLDivElement>(null);
    const pedras = useRef<Pedra[]>([]);
    const spans = useRef<(HTMLSpanElement | null)[]>([]);
    const [quantas, setQuantas] = useState(0);
    const valor = texto || t.padrao;

    // tamanho inicial pela tela
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a medida da tela só existe no navegador
    useLayoutEffect(() => { setTamanho(window.innerWidth < 768 ? 64 : 150); }, []);

    const faltando = useMemo(() => [...new Set([...valor].filter(c => c.trim() && !existe(c)))], [valor]);
    const estiloTexto: React.CSSProperties = {
        fontFamily: 'var(--ff-foeger), var(--ff-bricolage-w), sans-serif',
        fontSize: tamanho,
        letterSpacing: `${espaco}em`,
        lineHeight: 1.02,
    };

    // mede onde cada letra está no texto (num espelho com o mesmo estilo) e cria as pedras
    const derrubar = () => {
        const a = area.current;
        const e = espelho.current;
        if (!a || !e) return;
        const base = a.getBoundingClientRect();
        const lista: Pedra[] = [];
        [...e.querySelectorAll<HTMLElement>('[data-c]')].forEach(s => {
            const c = s.dataset.c ?? '';
            if (!c.trim()) return;
            const r = s.getBoundingClientRect();
            const x = r.left - base.left;
            const y = r.top - base.top;
            lista.push({ c, x, y, w: r.width, h: r.height, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 160, r: 0, vr: (Math.random() - 0.5) * 140, parada: false, presa: false, atraso: 0, ox: x, oy: y });
        });
        // as de baixo caem primeiro
        const fundo = Math.max(...lista.map(p => p.y));
        lista.forEach(p => { p.atraso = ((fundo - p.y) / (fundo || 1)) * 0.35 + Math.random() * 0.12; });
        pedras.current = lista;
        setQuantas(lista.length);
        setModo('caindo');
    };

    const arrumar = () => setModo('arrumando');

    // física: gravidade, chão e paredes, e um monte que cresce por colunas
    useEffect(() => {
        if (modo !== 'caindo') return;
        const a = area.current;
        if (!a) return;
        let quadro = 0;
        let antes = performance.now();
        let tempo = 0;
        const passo = (agora: number) => {
            const dt = Math.min(0.033, (agora - antes) / 1000);
            antes = agora;
            tempo += dt;
            const W = a.clientWidth;
            const chao = a.clientHeight - 6;
            // a superfície do monte, só com as pedras paradas
            const sup = new Float32Array(Math.ceil(W / COLUNA) + 1).fill(chao);
            for (const p of pedras.current) {
                if (!p.parada) continue;
                // a caixa da letra tem folga em cima (o espaço dos acentos): o monte começa um pouco abaixo dela
                for (let b = Math.max(0, Math.floor(p.x / COLUNA)); b <= Math.min(sup.length - 1, Math.floor((p.x + p.w) / COLUNA)); b++) sup[b] = Math.min(sup[b], p.y + p.h * TOPO);
            }
            pedras.current.forEach((p, i) => {
                const el = spans.current[i];
                if (!el) return;
                if (!p.parada && !p.presa && tempo > p.atraso) {
                    p.vy += GRAVIDADE * dt;
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.r += p.vr * dt;
                    // paredes
                    if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * 0.5; }
                    if (p.x + p.w > W) { p.x = W - p.w; p.vx = -Math.abs(p.vx) * 0.5; }
                    // pousa no monte ou no chão
                    let topo = chao;
                    for (let b = Math.max(0, Math.floor(p.x / COLUNA)); b <= Math.min(sup.length - 1, Math.floor((p.x + p.w) / COLUNA)); b++) topo = Math.min(topo, sup[b]);
                    // a base da letra fica acima do fim da caixa (a folga das descendentes)
                    if (p.y + p.h * BASE >= topo) {
                        p.y = topo - p.h * BASE;
                        if (p.vy > 240) {
                            p.vy = -p.vy * QUIQUE;
                            p.vx *= 0.7;
                            p.vr *= 0.5;
                        } else {
                            p.vy = 0;
                            p.vx = 0;
                            p.vr = 0;
                            p.parada = true;
                        }
                    }
                }
                el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.r.toFixed(1)}deg)`;
            });
            quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
        return () => cancelAnimationFrame(quadro);
    }, [modo, quantas]);

    // arrumar: cada pedra volta ao lugar no texto, com um pouco de defasagem
    useEffect(() => {
        if (modo !== 'arrumando') return;
        const inicio = pedras.current.map(p => ({ x: p.x, y: p.y, r: p.r }));
        const t0 = performance.now();
        let quadro = 0;
        const passo = (agora: number) => {
            let fim = true;
            pedras.current.forEach((p, i) => {
                const el = spans.current[i];
                const atraso = i * 0.012;
                const k = Math.min(1, Math.max(0, ((agora - t0) / 1000 - atraso) / 0.7));
                if (k < 1) fim = false;
                const e = 1 - Math.pow(1 - k, 3);
                const x = inicio[i].x + (p.ox - inicio[i].x) * e;
                const y = inicio[i].y + (p.oy - inicio[i].y) * e - Math.sin(Math.PI * e) * 60;
                const r = inicio[i].r * (1 - e);
                if (el) el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg)`;
            });
            if (fim) { setModo('escrever'); pedras.current = []; setQuantas(0); return; }
            quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
        return () => cancelAnimationFrame(quadro);
    }, [modo]);

    // pegar e jogar uma pedra
    const pegar = useCallback((i: number) => (e: React.PointerEvent<HTMLSpanElement>) => {
        const p = pedras.current[i];
        const a = area.current;
        if (!p || !a || modo !== 'caindo') return;
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        const base = a.getBoundingClientRect();
        const dx = e.clientX - base.left - p.x;
        const dy = e.clientY - base.top - p.y;
        p.presa = true;
        p.parada = false;
        let ultimo = { x: e.clientX, y: e.clientY, t: performance.now() };
        let vel = { x: 0, y: 0 };
        const mover = (ev: PointerEvent) => {
            p.x = ev.clientX - base.left - dx;
            p.y = ev.clientY - base.top - dy;
            const agora = performance.now();
            const dt = Math.max(1, agora - ultimo.t) / 1000;
            vel = { x: (ev.clientX - ultimo.x) / dt, y: (ev.clientY - ultimo.y) / dt };
            ultimo = { x: ev.clientX, y: ev.clientY, t: agora };
        };
        const soltar = () => {
            p.presa = false;
            p.vx = Math.max(-2600, Math.min(2600, vel.x));
            p.vy = Math.max(-2600, Math.min(2600, vel.y));
            p.vr = vel.x * 0.08;
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('pointerup', soltar);
            window.removeEventListener('pointercancel', soltar);
        };
        window.addEventListener('pointermove', mover);
        window.addEventListener('pointerup', soltar);
        window.addEventListener('pointercancel', soltar);
    }, [modo]);

    // a página é clara: o interruptor deixa a área escura
    const cor = claro ? '#FFFFFF' : '#121212';
    const comPedras = modo !== 'escrever';

    return (
        <section id="escrever" className="px-[4vw] py-[14vh]">
            <h2 className="mb-[5vh] text-[9vw] md:text-[4.2vw]" style={TIPO.frase}>{t.titulo}</h2>

            <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-4 text-[15px]" style={TIPO.menu}>
                <Deslizante rotulo={t.tamanho} valor={tamanho} min={36} max={240} aoMudar={setTamanho} />
                <Deslizante rotulo={t.espaco} valor={Math.round(espaco * 100)} min={-6} max={20} aoMudar={v => setEspaco(v / 100)} />
                <button role="switch" aria-checked={claro} onClick={() => setClaro(c => !c)} className="flex items-center gap-3 text-black/75">
                    <span className={`relative flex h-[26px] w-[46px] items-center rounded-full px-[3px] transition-colors ${claro ? 'justify-end bg-[#111]' : 'justify-start bg-black/15'}`}>
                        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`block h-5 w-5 rounded-full ${claro ? 'bg-[#E4E4E4]' : 'bg-white'}`} />
                    </span>
                    {t.claro}
                </button>
                <div className="flex gap-2 md:ml-auto">
                    <button
                        onClick={derrubar}
                        disabled={comPedras}
                        className="h-10 rounded-full bg-[#111] px-5 text-[#E4E4E4] transition-opacity disabled:opacity-30"
                        style={{ fontWeight: 600 }}
                    >
                        {t.derrubar}
                    </button>
                    <button
                        onClick={arrumar}
                        disabled={modo !== 'caindo'}
                        className="h-10 rounded-full border border-black/25 px-5 text-[#111] transition-opacity disabled:opacity-30"
                        style={{ fontWeight: 600 }}
                    >
                        {t.arrumar}
                    </button>
                </div>
            </div>

            <div
                ref={area}
                className="relative h-[68svh] overflow-hidden rounded-[14px] border border-black/10 transition-colors duration-500"
                style={{ backgroundColor: claro ? '#0d0d0d' : '#F3F1EC' }}
            >
                <textarea
                    ref={campo}
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    placeholder={comPedras ? '' : t.padrao}
                    readOnly={comPedras}
                    aria-label={t.titulo}
                    spellCheck={false}
                    className={`absolute inset-0 h-full w-full resize-none bg-transparent p-[3vw] outline-none placeholder:opacity-100 ${claro ? 'placeholder:text-white' : 'placeholder:text-[#121212]'}`}
                    style={{ ...estiloTexto, color: comPedras ? 'transparent' : cor, caretColor: cor, WebkitTextFillColor: comPedras ? 'transparent' : undefined }}
                />
                {/* espelho invisível com o mesmo texto e o mesmo estilo, para medir cada letra */}
                <div ref={espelho} aria-hidden className="pointer-events-none invisible absolute inset-0 whitespace-pre-wrap break-words p-[3vw]" style={estiloTexto}>
                    {[...valor].map((c, i) => <span key={i} data-c={c}>{c}</span>)}
                </div>
                {comPedras && (
                    <div aria-hidden className="absolute inset-0" style={{ color: cor }}>
                        {/* eslint-disable-next-line react-hooks/refs -- as pedras andam fora do React (o laço move os spans); a lista só muda junto com quantas */}
                        {pedras.current.map((p, i) => (
                            <span
                                key={i}
                                ref={el => { spans.current[i] = el; }}
                                onPointerDown={pegar(i)}
                                className="absolute left-0 top-0 cursor-grab touch-none select-none whitespace-pre active:cursor-grabbing"
                                style={{ ...estiloTexto, transform: `translate(${p.x}px, ${p.y}px)` }}
                            >
                                {p.c}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 flex min-h-10 flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-black/55" style={TIPO.texto}>
                {faltando.length > 0 && (
                    <span className="flex flex-wrap items-center gap-3">
                        {t.faltando}:
                        {faltando.map(c => (
                            <span key={c} className="relative flex h-9 w-9 items-center justify-center text-black/80">
                                <PedraBruta className="absolute inset-0 h-full w-full text-black/35" />
                                <span className="relative">{c}</span>
                            </span>
                        ))}
                    </span>
                )}
                {modo === 'caindo' && <span>{t.dica}</span>}
            </div>
        </section>
    );
}

// controle deslizante simples (o nativo, vestido)
function Deslizante({ rotulo, valor, min, max, aoMudar }: { rotulo: string; valor: number; min: number; max: number; aoMudar: (v: number) => void }) {
    return (
        <label className="flex items-center gap-3 text-black/75">
            <span>{rotulo}</span>
            <input
                type="range"
                min={min}
                max={max}
                value={valor}
                onChange={e => aoMudar(Number(e.target.value))}
                className="h-1 w-[34vw] max-w-[180px] cursor-pointer appearance-none rounded-full bg-black/20 accent-black md:w-[180px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#111]"
            />
        </label>
    );
}
