'use client';

// o cursor: uma gota branca em modo diferença que acompanha a seta (a seta continua) e que, sobre o que tem data-cursor,
// escorre e vira uma etiqueta com o destino. Feito como água (26/10):
// - a gota não fica sob a seta: descansa ao lado da ponta dela (embaixo, à direita), como uma sombra, e segue o mouse
//   numa mola macia;
// - é um corpo só que segue o caminho: atrás da cabeça vêm elos cada vez menores, cada um correndo atrás do anterior
//   (fundidos por um filtro de "gosma": desfoque + limiar de alfa), então nas curvas a gota dobra junto com o traço,
//   como um fio de água, e parando os elos alcançam a cabeça e ela volta redonda. Cada elo fica preso ao anterior por uma
//   distância máxima, menor que o raio, e a gota nunca se parte em bolinhas (27/10: o rabo numa mola própria se soltava
//   da cabeça nos movimentos rápidos, e o pingo reto, oposto à velocidade, ficava duro nas curvas);
// - a etiqueta nasce da gota: a cabeça escorre um pouco para a direita (para não cobrir a seta) e incha até a pílula,
//   numa mola com um leve passar do ponto; andando, a pílula também pinga, da ponta de trás; o texto (fora do filtro,
//   para ficar nítido) entra pelo desfoque depois que ela abriu e sai antes de fechar;
// - o clique afunda a gota (ou a pílula) enquanto está apertado;
// - com data-cursor-setas (o arrasto da faixa curva), a etiqueta leva setinhas dos dois lados, que se afastam com o
//   clique segurado e vão para o lado em que o mouse anda;
// - com data-cursor-acima (o barquinho do rodapé na mão, pendurado embaixo da seta), a etiqueta escorre para cima da
//   seta, para não cair sobre o papel branco.
import { useEffect, useId, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useVelocity, type MotionValue } from 'motion/react';

const CABECA = { damping: 28, stiffness: 260, mass: 0.6 };
const FORMA = { damping: 19, stiffness: 160, mass: 0.9 };
const APERTO = { damping: 22, stiffness: 400, mass: 0.5 };
const GOTA = 12;
const ALTURA = 38;
// onde a gota descansa em relação à ponta da seta, e quanto a cabeça escorre para virar a etiqueta
const SOMBRA = { x: 14, y: 18 };
const ESCORRE = { x: 18, y: 8, acima: -48 };
// a caixa do filtro em volta da cabeça (cabe a pílula mais larga e o pingo esticado)
const CAIXA = { esquerda: 64, cima: 64, largura: 300, altura: 128 };
// os elos atrás da cabeça: quantos, o quanto cada um corre atrás do anterior (por segundo; os de trás mais devagar), o
// quanto o raio cai até a ponta e a distância máxima até o anterior (em fração do raio e em px, o que for menor)
const ELOS = { n: 6, segue: 34, cai: 3, afina: 0.55, preso: 0.9, max: 5 };

function Seta({ lado, abre, vx }: { lado: -1 | 1; abre: MotionValue<number>; vx: MotionValue<number> }) {
    // afasta com o clique segurado e anda para o lado do movimento (até 5 px)
    const x = useTransform([abre, vx], ([a, v]: number[]) => lado * (1 + 3 * a) + Math.max(-5, Math.min(5, v / 300)));
    return (
        <motion.svg width="9" height="10" viewBox="0 0 9 10" aria-hidden style={{ x, flex: 'none' }}>
            <path
                d={lado < 0 ? 'M6.5 1.5 3 5l3.5 3.5' : 'M2.5 1.5 6 5 2.5 8.5'}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </motion.svg>
    );
}

export default function Cursor() {
    const filtro = `gota-${useId().replace(/:/g, '')}`;
    // o mouse; a cabeça segue o ponto de descanso (ao lado da seta), e os elos seguem a cabeça
    const x = useMotionValue(-100), y = useMotionValue(-100);
    const cx = useSpring(x, CABECA), cy = useSpring(y, CABECA);
    const vx = useVelocity(cx);
    const elos = useRef<(SVGCircleElement | null)[]>([]);
    // a forma: largura e altura da cabeça (a gota ou a pílula) e o quanto ela escorreu
    const largura = useMotionValue(GOTA), altura = useMotionValue(GOTA);
    const ex = useMotionValue(0), ey = useMotionValue(0);
    const sl = useSpring(largura, FORMA), sa = useSpring(altura, FORMA);
    const sex = useSpring(ex, FORMA), sey = useSpring(ey, FORMA);
    const aperto = useSpring(0, APERTO);
    const [rotulo, setRotulo] = useState<string | null>(null);
    const [setas, setSetas] = useState(false);
    const [acima, setAcima] = useState(false);
    // o último texto fica na pílula enquanto ela fecha
    const [texto, setTexto] = useState<string | null>(null);
    const [visivel, setVisivel] = useState(false);
    const medida = useRef<HTMLSpanElement>(null);
    const atual = useRef<string | null>(null);

    // a caixa do filtro anda com a cabeça (no ponto de descanso mais o escorrido)
    const caixaX = useTransform([cx, sex], ([a, e]: number[]) => a + SOMBRA.x + e - CAIXA.esquerda);
    const caixaY = useTransform([cy, sey], ([a, e]: number[]) => a + SOMBRA.y + e - CAIXA.cima);
    // a cabeça na caixa: a gota centrada no ponto; a pílula com a ponta esquerda nele (ela cresce para a direita)
    const cabecaX = useTransform(sa, h => CAIXA.esquerda - h / 2);
    const cabecaY = useTransform(sa, h => CAIXA.cima - h / 2);
    const cantos = useTransform(sa, h => h / 2);
    const escala = useTransform(aperto, a => 1 - 0.18 * a);

    useEffect(() => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        let px = -100, py = -100, ultima = 0, apertado = false;
        const buscar = () => {
            const el = document.elementFromPoint(px, py)?.closest<HTMLElement>('[data-cursor]');
            const r = el?.dataset.cursor || null;
            // com o botão apertado (o arrasto da faixa rola a página), uma leitura vazia no meio da rolagem não fecha a
            // etiqueta; ao soltar, confere de novo
            if (apertado && !r && atual.current) return;
            const s = !!el?.hasAttribute('data-cursor-setas');
            const a = !!el?.hasAttribute('data-cursor-acima');
            const chave = r ? `${r}|${s}|${a}` : null;
            if (chave === atual.current) return;
            atual.current = chave;
            setRotulo(r);
            setSetas(s);
            if (r) {
                setTexto(r);
                setAcima(a);
            }
        };
        // a posição vem do movimento e também do que chega com o mouse parado: o giro da roda e o "passou por cima" (o
        // navegador avisa quando algo novo passa sob a seta), para a gota não ficar perdida quando a página abre ou volta
        // com o mouse quieto
        const mover = (e: MouseEvent) => {
            if ('pointerType' in e && e.pointerType === 'touch') return;
            px = e.clientX;
            py = e.clientY;
            x.set(px);
            y.set(py);
            setVisivel(true);
            const agora = performance.now();
            if (agora - ultima > 60) {
                ultima = agora;
                buscar();
            }
        };
        const apertar = (e: PointerEvent) => {
            if (e.pointerType === 'touch' || e.button !== 0) return;
            apertado = true;
            aperto.set(1);
        };
        const soltar = () => {
            apertado = false;
            aperto.set(0);
            buscar();
        };
        // com o mouse parado e a página rolando, o alvo sob a seta muda sozinho; e um rótulo pode mudar sem o mouse
        // andar (a faixa curva troca o dela quando uma capa passa por baixo, abre ou o clique é segurado)
        const rolar = () => buscar();
        const rotulos = new MutationObserver(buscar);
        rotulos.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-cursor', 'data-cursor-setas', 'data-cursor-acima'] });
        const sair = () => setVisivel(false);
        window.addEventListener('pointermove', mover, { passive: true });
        window.addEventListener('pointerover', mover, { passive: true });
        window.addEventListener('wheel', mover, { passive: true });
        window.addEventListener('pointerdown', apertar, { passive: true });
        window.addEventListener('pointerup', soltar, { passive: true });
        window.addEventListener('pointercancel', soltar, { passive: true });
        window.addEventListener('scroll', rolar, { passive: true });
        document.documentElement.addEventListener('pointerleave', sair);
        return () => {
            rotulos.disconnect();
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('pointerover', mover);
            window.removeEventListener('wheel', mover);
            window.removeEventListener('pointerdown', apertar);
            window.removeEventListener('pointerup', soltar);
            window.removeEventListener('pointercancel', soltar);
            window.removeEventListener('scroll', rolar);
            document.documentElement.removeEventListener('pointerleave', sair);
        };
    }, [x, y, aperto]);

    // os elos, a cada quadro: cada um corre atrás do anterior (o primeiro, atrás do meio da cabeça) e fica preso a ele
    // pela distância máxima; o desenho é na caixa do filtro, que anda com a cabeça
    useEffect(() => {
        const pos = Array.from({ length: ELOS.n }, () => ({ x: 0, y: 0 }));
        let antes = performance.now(), quadro = 0, primeiro = true;
        const passo = (agora: number) => {
            quadro = requestAnimationFrame(passo);
            const dt = Math.min(0.05, (agora - antes) / 1000);
            antes = agora;
            const w = sl.get(), h = sa.get();
            const ax = cx.get() + SOMBRA.x + sex.get(), ay = cy.get() + SOMBRA.y + sey.get();
            let qx = ax + w / 2 - h / 2, qy = ay;
            for (let i = 0; i < ELOS.n; i++) {
                const p = pos[i];
                if (primeiro) {
                    p.x = qx;
                    p.y = qy;
                }
                const k = 1 - Math.exp(-dt * (ELOS.segue - ELOS.cai * i));
                p.x += (qx - p.x) * k;
                p.y += (qy - p.y) * k;
                const r = (h / 2) * (1 - (ELOS.afina * (i + 1)) / ELOS.n);
                const max = Math.min(r * ELOS.preso, ELOS.max);
                const dx = p.x - qx, dy = p.y - qy, d = Math.hypot(dx, dy);
                if (d > max) {
                    p.x = qx + (dx / d) * max;
                    p.y = qy + (dy / d) * max;
                }
                const el = elos.current[i];
                if (el) {
                    el.setAttribute('cx', (CAIXA.esquerda + p.x - ax).toFixed(2));
                    el.setAttribute('cy', (CAIXA.cima + p.y - ay).toFixed(2));
                    el.setAttribute('r', r.toFixed(2));
                }
                qx = p.x;
                qy = p.y;
            }
            primeiro = false;
        };
        quadro = requestAnimationFrame(passo);
        return () => cancelAnimationFrame(quadro);
    }, [cx, cy, sex, sey, sl, sa]);

    // a forma: a pílula do tamanho do conteúdo (o texto e as setinhas), escorrida para o lado (ou para cima da seta), ou
    // a gota
    useEffect(() => {
        if (rotulo && medida.current) {
            largura.set(medida.current.offsetWidth + 30);
            altura.set(ALTURA);
            ex.set(ESCORRE.x);
            ey.set(acima ? ESCORRE.acima : ESCORRE.y);
        } else {
            largura.set(GOTA);
            altura.set(GOTA);
            ex.set(0);
            ey.set(0);
        }
    }, [rotulo, setas, acima, largura, altura, ex, ey]);

    const estiloDoTexto = { fontWeight: 600, fontSize: 14, gap: 8 } as const;

    return (
        <motion.div
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:block"
            style={{
                x: caixaX,
                y: caixaY,
                width: CAIXA.largura,
                height: CAIXA.altura,
                scale: escala,
                originX: `${CAIXA.esquerda}px`,
                originY: `${CAIXA.cima}px`,
                mixBlendMode: 'difference',
                opacity: visivel ? 1 : 0,
                transition: 'opacity .4s',
            }}
        >
            <svg width={CAIXA.largura} height={CAIXA.altura} className="absolute left-0 top-0 overflow-visible">
                <defs>
                    <filter id={filtro} x="-20%" y="-50%" width="140%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="borrado" />
                        <feColorMatrix in="borrado" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -13" />
                    </filter>
                </defs>
                <g filter={`url(#${filtro})`} fill="#fff">
                    {Array.from({ length: ELOS.n }, (_, i) => (
                        <circle
                            key={i}
                            ref={el => {
                                elos.current[i] = el;
                            }}
                            r="0"
                        />
                    ))}
                    <motion.rect style={{ x: cabecaX, y: cabecaY }} width={sl} height={sa} rx={cantos} />
                </g>
            </svg>
            {/* o texto, fora do filtro, por cima da pílula */}
            <motion.span
                className="absolute left-0 top-0 flex items-center justify-center whitespace-nowrap text-black"
                style={{ ...estiloDoTexto, x: cabecaX, y: cabecaY, width: sl, height: sa }}
                initial={false}
                animate={rotulo ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(4px)' }}
                transition={rotulo ? { duration: 0.35, delay: 0.12, ease: [0.165, 0.84, 0.44, 1] } : { duration: 0.15 }}
            >
                {setas && <Seta lado={-1} abre={aperto} vx={vx} />}
                <span>{texto}</span>
                {setas && <Seta lado={1} abre={aperto} vx={vx} />}
            </motion.span>
            {/* a régua do conteúdo, para a largura da pílula */}
            <span ref={medida} className="invisible absolute left-0 top-0 flex items-center whitespace-nowrap" style={estiloDoTexto}>
                {setas && <svg width="9" height="10" aria-hidden />}
                <span>{rotulo}</span>
                {setas && <svg width="9" height="10" aria-hidden />}
            </span>
        </motion.div>
    );
}
