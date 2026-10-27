'use client';

// as peças pequenas que se repetem na página do rumo: as palavras soltas (cada uma no seu span, para entrarem uma a
// uma), o texto que rola no hover, a seta e a logo
import { Fragment, type MouseEvent } from 'react';
import { animate } from 'motion';
import { power3Out } from './movimento';

export function Palavras({ texto, classe = '' }: { texto: string; classe?: string }) {
    const p = texto.split(' ');
    return (
        <>
            {p.map((w, i) => (
                <Fragment key={i}>
                    <span className={`fa-w ${classe}`}>{w}</span>
                    {i < p.length - 1 ? ' ' : null}
                </Fragment>
            ))}
        </>
    );
}

// o texto e a cópia empilhados numa janela: no hover o texto sobe e a cópia entra por baixo (sem saída: o próximo
// hover recomeça do zero, e como os dois são iguais o salto não aparece)
export function Rola({ texto }: { texto: string }) {
    return (
        <span className="fa-rola">
            <span>{texto}</span>
            <span aria-hidden>{texto}</span>
        </span>
    );
}

export function rolarTexto(duracao: number) {
    return (e: MouseEvent<HTMLElement>) => {
        e.currentTarget.querySelectorAll<HTMLElement>('.fa-rola').forEach(r => {
            const [a, b] = r.children as unknown as HTMLElement[];
            animate(a, { y: ['0%', '-100%'] }, { duration: duracao, ease: power3Out });
            animate(b, { y: ['100%', '0%'] }, { duration: duracao, ease: power3Out });
        });
    };
}

export function Seta() {
    const caminho = <path d="M1 6h10M6.5 1.5 11 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1" />;
    return (
        <span className="fa-seta" aria-hidden>
            <svg viewBox="0 0 12 12">{caminho}</svg>
            <svg viewBox="0 0 12 12">{caminho}</svg>
        </span>
    );
}

// a logo da Föeger na versão escrita (as peças da empilhada nas posições da reorganização em linha do cabeçalho do
// site: a linha de cima desce e a de baixo sobe para o lado, com os giros de ±2°)
export const PECAS: [string, number, number, number, number, number, boolean?][] = [
    ['M0.52832 94.6189L44.5283 735.119L278.528 648.619L232.028 435.619L394.528 413.119L363.028 267.119L205.528 312.619L185.528 233.119L431.028 214.119L424.528 0.618896L0.52832 94.6189Z', -110, 260, 2, 216, 368],
    ['M386.528 589.619L435.528 299.619L689.028 249.119L770.028 368.619L755.028 636.619L478.528 694.619L386.528 589.619ZM547.028 379.619L523.528 538.119L645.028 551.619L635.028 386.119L547.028 379.619Z', -105, 260, -2, 578, 472, true],
    ['M464.528 107.619L471.528 226.619L586.528 218.119L578.528 100.119L464.528 107.619Z', -105, 260, 2, 525, 163],
    ['M634.528 86.6189L622.528 203.119L737.028 214.119L747.028 96.1189L634.528 86.6189Z', -105, 260, -2, 685, 150],
    ['M785.528 575.119L909.528 691.119L1176.53 641.619L1195.03 504.619L943.528 537.119L925.028 504.619L1195.03 441.619L1168.03 251.619L1047.03 202.119L819.028 260.119L785.528 575.119ZM929.528 335.119L917.028 406.119L1062.53 373.619L1045.53 335.119H929.528Z', -95, 250, 2, 990, 446, true],
    ['M26.5283 1046.12L42.5283 783.619L228.028 715.119L285.528 753.119V692.119L472.028 728.619L455.028 850.619L418.028 858.119L468.528 1226.12L367.028 1353.12L55.5283 1316.62L77.5283 1165.62L282.528 1195.62L301.028 1109.62L180.028 1139.62L26.5283 1046.12ZM180.028 858.119L172.028 982.119L282.528 1014.12V875.119L180.028 858.119Z', 1100, -250, -2, 249, 1022, true],
    ['M464.528 1001.12L474.528 872.119L541.528 723.119L731.528 680.619L864.528 733.619L892.528 923.119L618.528 980.119L632.528 1006.12L889.528 1029.62L839.528 1177.62L529.528 1111.12L464.528 1001.12ZM626.028 807.619L610.028 879.619L759.028 851.119L744.028 814.119L626.028 807.619Z', 1100, -250, 2, 678, 929, true],
    ['M926.528 871.119L907.028 1171.12L1104.53 1133.12L1052.53 855.619L1097.53 830.619L1126.03 859.119L1129.53 901.119L1237.53 859.119L1258.03 737.619L1135.03 683.619L1038.53 759.619V701.119L892.028 732.619L926.528 871.119Z', 1120, -250, -2, 1075, 927],
    ['M1303.53 1145.12L1156.53 1134.62L1163.03 1011.12L1291.53 997.619L1303.53 1145.12Z', 1120, -250, 2, 1230, 1071],
];

export function Logo({ empilhada = false }: { empilhada?: boolean }) {
    return (
        <svg viewBox={empilhada ? '-20 -20 1345 1395' : '-130 236 2580 890'} fill="currentColor" aria-label="Föeger" role="img">
            {PECAS.map(([d, x, y, r, cx, cy, par], i) => (
                <path
                    key={i}
                    d={d}
                    fillRule={par ? 'evenodd' : undefined}
                    clipRule={par ? 'evenodd' : undefined}
                    transform={empilhada ? undefined : `translate(${x} ${y}) rotate(${r} ${cx} ${cy})`}
                />
            ))}
        </svg>
    );
}
