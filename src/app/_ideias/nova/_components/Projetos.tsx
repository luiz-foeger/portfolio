'use client';

// Projetos: uma pilha de capas no meio da tela presa. Cada capa é o case inteiro do projeto, e a rolagem rola o case
// dentro dela; no fim do case, a capa sai de lado (subindo e girando) e volta por baixo da pilha, e a de baixo vem para
// cima. O nome gigante troca subindo de uma máscara, em diferença, com o texto embaixo. Tudo preso à rolagem (linear e
// reversível), igual no toque. Os projetos: este site e a tipografia (de verdade) e três conceitos, um por serviço,
// até entrarem os projetos novos (a lista fica em textos.ts e os cases em midia.ts)
import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion } from 'motion/react';
import { useProgresso } from '../../_comum/progresso';
import { useIdioma, useTexto } from '../_lib/idioma';
import { CASO_DO_PROJETO } from '../_lib/midia';
import { TIPO } from '../_lib/tipo';

const CLARO = '#E4E4E4';
// as vagas da pilha, de cima para baixo (x e y em larguras do cartão); da terceira em diante, todas na terceira
const VAGAS = [{ x: 0, y: 0, r: -2 }, { x: 0.05, y: 0.022, r: 4.5 }, { x: -0.055, y: 0.04, r: -6.5 }];
const vaga = (i: number) => VAGAS[Math.min(i, VAGAS.length - 1)];
// quanto da rolagem de cada projeto rola o case; o resto é a troca de capa
const ROLA = { de: 0.06, ate: 0.72, troca: 0.76 };

const limitar = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const trecho = (t: number, a: number, b: number) => limitar((t - a) / (b - a));
const suave = (x: number) => x * x * (3 - 2 * x);
const entraESai = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const comVolta = (x: number) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
const misturar = (a: number, b: number, t: number) => a + (b - a) * t;

type Medidas = { w: number; h: number; cy: number; estreita: boolean; fontes: number[]; topoNome: number };

export default function Projetos() {
    const t = useTexto().projetos;
    const { idioma } = useIdioma();
    const itens = t.itens;
    const n = itens.length;
    const reduzido = useReducedMotion() ?? false;
    const secao = useRef<HTMLElement>(null);
    const palco = useRef<HTMLDivElement>(null);
    const cartoes = useRef<(HTMLDivElement | null)[]>([]);
    const casos = useRef<(HTMLImageElement | null)[]>([]);
    const nomes = useRef<(HTMLDivElement | null)[]>([]);
    const legenda = useRef<HTMLParagraphElement>(null);
    const regua = useRef<HTMLSpanElement>(null);
    const [m, setM] = useState<Medidas>({ w: 360, h: 468, cy: 576, estreita: false, fontes: itens.map(() => 200), topoNome: 63 });
    const medidas = useRef(m);
    const p = useProgresso(secao);

    const desenhar = (v: number) => {
        const { w } = medidas.current;
        const pp = limitar(v) * n;
        const s = Math.min(n - 1, Math.floor(pp));
        const q = pp - s;
        const ultimo = s === n - 1;
        // o case da capa de cima rola com a página; no fim dele, a troca (menos no último)
        const rolar = ultimo ? trecho(q, ROLA.de, 0.92) : trecho(q, ROLA.de, ROLA.ate);
        let e = ultimo ? 0 : trecho(q, ROLA.troca, 1);
        if (reduzido) e = e >= 0.5 ? 1 : 0;
        const lado = s % 2 === 0 ? -1 : 1;
        cartoes.current.forEach((el, c) => {
            if (!el) return;
            const slot = (((c - s) % n) + n) % n;
            let x: number;
            let y: number;
            let r: number;
            let z: number;
            let rola = 0;
            if (slot === 0) {
                rola = e > 0 ? 1 : rolar;
                if (e <= 0) {
                    ({ x, y, r } = vaga(0));
                    z = 30;
                } else {
                    // sai de lado, subindo e girando, e volta por baixo da pilha
                    const fora = { x: lado * 1.45, y: -0.16, r: vaga(0).r + lado * 16 };
                    if (e < 0.5) {
                        const sai = entraESai(trecho(e, 0, 0.5));
                        x = misturar(vaga(0).x, fora.x, sai);
                        y = misturar(vaga(0).y, fora.y, sai) - Math.sin(Math.PI * sai) * 0.1;
                        r = misturar(vaga(0).r, fora.r, sai);
                        z = 30;
                    } else {
                        const volta = entraESai(trecho(e, 0.5, 1));
                        const b = vaga(n - 1);
                        x = misturar(fora.x, b.x, volta);
                        y = misturar(fora.y, b.y, volta);
                        r = misturar(fora.r, b.r, volta);
                        z = 0;
                    }
                }
            } else {
                // os outros sobem uma vaga enquanto o de cima sai
                const sobe = e > 0 ? entraESai(trecho(e, 0.22, 0.8)) : 0;
                const a = vaga(slot);
                const b = vaga(slot - 1);
                x = misturar(a.x, b.x, sobe);
                y = misturar(a.y, b.y, sobe);
                r = misturar(a.r, b.r, sobe);
                z = 30 - (e < 0.5 ? slot : slot - 1);
            }
            el.style.transform = `translate(${(x * w).toFixed(1)}px, ${(y * w).toFixed(1)}px) rotate(${r.toFixed(2)}deg)`;
            el.style.zIndex = String(z);
            const img = casos.current[c];
            if (img && img.naturalWidth) {
                const alto = (el.clientWidth * img.naturalHeight) / img.naturalWidth;
                img.style.transform = `translateY(${(-Math.max(0, alto - el.clientHeight) * rola).toFixed(1)}px)`;
            }
        });
        // o nome: o da vez sai pela máscara no começo da troca, e o próximo sobe dela
        nomes.current.forEach((el, i) => {
            if (!el) return;
            let y = 110;
            if (i === s) y = -110 * entraESai(trecho(e, 0.05, 0.4));
            if (i === s + 1 && e > 0) y = (1 - comVolta(trecho(e, 0.45, 1))) * 110;
            el.style.transform = `translateY(${y.toFixed(1)}%)`;
        });
        if (legenda.current) {
            const k = e < 0.5 ? s : Math.min(n - 1, s + 1);
            if (legenda.current.dataset.k !== String(k)) {
                legenda.current.dataset.k = String(k);
                legenda.current.textContent = itens[k].texto;
            }
            legenda.current.style.opacity = limitar(1 - suave(trecho(e, 0.05, 0.4)) + suave(trecho(e, 0.6, 0.95))).toFixed(3);
        }
    };
    useMotionValueEvent(p, 'change', desenhar);

    // as medidas: o cartão e o nome pelo tamanho da tela (de novo quando a fonte chega, o idioma troca ou a tela muda)
    useEffect(() => {
        const medir = () => {
            const pl = palco.current;
            const r = regua.current;
            if (!pl || !r) return;
            const W = pl.clientWidth;
            const H = pl.clientHeight;
            const estreita = W < 768;
            const w = estreita ? Math.round(W * 0.6) : Math.round(Math.min(400, Math.max(260, W * 0.25)));
            const h = Math.round(w * 1.3);
            const cy = Math.round(H * (estreita ? 0.6 : 0.64));
            const maximo = H * (estreita ? 0.1 : 0.24);
            const fontes = itens.map(it => {
                r.textContent = it.nome;
                const em = r.getBoundingClientRect().width / 100 || 1;
                return Math.round(Math.min(maximo, (W * 0.9) / em));
            });
            const novas = { w, h, cy, estreita, fontes, topoNome: Math.round(H * (estreita ? 0.13 : 0.07)) };
            medidas.current = novas;
            setM(novas);
        };
        medir();
        document.fonts.ready.then(medir);
        const redimensiona = new ResizeObserver(medir);
        if (palco.current) redimensiona.observe(palco.current);
        return () => redimensiona.disconnect();
    }, [idioma, itens]);

    // depois de cada medida (e quando as imagens chegam), a pilha é desenhada no lugar da rolagem de agora
    useEffect(() => {
        desenhar(p.get());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [m, reduzido]);

    const maiorFonte = Math.max(...m.fontes);
    return (
        <section id="projetos" ref={secao} className="relative" style={{ height: `${n * 95 + 100}vh` }}>
            <h2 className="sr-only">{t.titulo}</h2>
            <ul className="sr-only">
                {itens.map(it => <li key={it.id}>{it.nome}: {it.texto}</li>)}
            </ul>
            {/* o fundo claro dentro do palco: preso, ele isola a mistura do nome, que só enxerga o que está nele */}
            <div ref={palco} aria-hidden className="sticky top-0 h-svh overflow-hidden" style={{ background: CLARO }}>
                <span ref={regua} className="invisible absolute left-0 top-0 whitespace-nowrap" style={{ ...TIPO.manifesto, fontSize: 100 }} />
                {itens.map((it, i) => (
                    <div
                        key={it.id}
                        ref={el => { cartoes.current[i] = el; }}
                        className="absolute overflow-hidden rounded-[12px] bg-[#111]"
                        style={{ width: m.w, height: m.h, left: `calc(50% - ${m.w / 2}px)`, top: m.cy - m.h / 2, boxShadow: '0 22px 50px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.08)', zIndex: 30 - i }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img ref={el => { casos.current[i] = el; }} src={CASO_DO_PROJETO[it.id]} alt="" loading="lazy" decoding="async" draggable={false} onLoad={() => desenhar(p.get())} className="absolute left-0 top-0 w-full max-w-none" />
                    </div>
                ))}
                <div className="absolute inset-x-0 overflow-hidden" style={{ top: m.topoNome, height: Math.round(maiorFonte * 1.12), zIndex: 40, mixBlendMode: 'difference' }}>
                    {itens.map((it, i) => (
                        <div key={it.id} ref={el => { nomes.current[i] = el; }} className="absolute inset-0 flex items-center justify-center whitespace-nowrap" style={{ ...TIPO.manifesto, fontSize: m.fontes[i], lineHeight: 1, color: CLARO, transform: `translateY(${i === 0 ? 0 : 110}%)` }}>
                            {it.nome}
                        </div>
                    ))}
                </div>
                <p
                    ref={legenda}
                    className={m.estreita ? 'absolute inset-x-0 bottom-[7vh] mx-auto max-w-[32ch] px-6 text-center text-[16px] leading-snug' : 'absolute bottom-[7vh] left-[4vw] max-w-[30ch] text-[clamp(16px,1.3vw,20px)] leading-snug'}
                    style={{ ...TIPO.texto, color: 'rgba(5,5,5,.72)', zIndex: 40 }}
                >
                    {itens[0].texto}
                </p>
            </div>
        </section>
    );
}
