'use client';

import { GLIFOS, METRICAS, type Peca } from '../_lib/glifos';

// desenho de um caractere da Foeger Sans em SVG, a partir dos dados gerados do arquivo da fonte. Os pedaços vêm
// separados (corpo e pedras soltas), para poderem se mexer cada um por si
export const ALTO = METRICAS.ascendente;
export const BAIXO = -METRICAS.descendente;
export const existe = (c: string) => c in GLIFOS;

export function GlifoSvg({ c, className, style, peca }: {
    c: string;
    className?: string;
    style?: React.CSSProperties;
    // desenha cada pedaço do jeito que quiser (para animar); sem isso, vai tudo parado
    peca?: (p: Peca, i: number) => React.ReactNode;
}) {
    const g = GLIFOS[c];
    if (!g) return null;
    return (
        <svg viewBox={`0 ${-ALTO} ${g.w} ${ALTO + BAIXO}`} className={className} style={style} aria-hidden overflow="visible">
            {g.pecas.map((p, i) => (peca ? peca(p, i) : <path key={i} d={p.d} fill="currentColor" fillRule="evenodd" />))}
        </svg>
    );
}

// a pedra bruta: o contorno do ponto da fonte, no lugar de uma letra que ainda não foi desenhada
const PONTO = GLIFOS['.'].pecas[0];
export function PedraBruta({ className, style, cheia = false }: { className?: string; style?: React.CSSProperties; cheia?: boolean }) {
    const folga = 12;
    return (
        <svg
            viewBox={`${PONTO.x0 - folga} ${PONTO.y0 - folga} ${PONTO.x1 - PONTO.x0 + folga * 2} ${PONTO.y1 - PONTO.y0 + folga * 2}`}
            className={className}
            style={style}
            aria-hidden
            preserveAspectRatio="none"
        >
            <path d={PONTO.d} fill={cheia ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
    );
}
