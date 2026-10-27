'use client';

// as bordas de vidro (26/10): no alto e no pé da tela, uma faixa de
// ~64 px (40 no celular) funciona como a beirada curva de um vidro. O que chega perto da borda é esticado, cada vez
// mais quanto mais perto (uma lente: a linha y da faixa mostra a linha h·(y/h)^CURVA, contada a partir da borda, então
// junto da borda poucas linhas viram muitas e o conteúdo que entra ou sai da tela "engorda"), e cada cor estica um pouco
// diferente, o que abre franjas de cor (vermelho e laranja de um lado, azul do outro) nas bordas do que é contrastado.
// O resto da página não muda, e o cabeçalho, o cursor e o grão ficam por cima, sem distorcer.
// É um filtro SVG de deslocamento aplicado ao que está atrás das duas faixas (backdrop-filter: url(#…)), então vale
// para tudo: o texto, as ondas e a faixa curva. Só os navegadores do Chromium aplicam filtro SVG no backdrop-filter;
// nos outros as faixas ficam transparentes. O mapa de deslocamento é desenhado num canvas de 1 px de largura (o canal
// verde é o deslocamento vertical) e esticado na faixa. Teste: ?bordas=0 desliga
import { useEffect, useId, useState } from 'react';

const ALTURA = { computador: 64, celular: 40 };
// o quanto a lente estica junto da borda (2: a derivada vai a zero na borda, um risco liso do que está ali)
const CURVA = 2;
// o esticão de cada cor (vermelho, verde, azul) em relação ao do verde: as franjas
const CORES = [1.16, 1, 0.84];
// o desfoque vertical de cada cor (px), que transforma as três cópias num degradê, como a dispersão de um vidro
const DISPERSAO = 1.6;

// o mapa de uma faixa (1 × (h + 2·SOBRA)·2 px): a linha y desloca a leitura até a linha da lente, com o deslocamento =
// escala · (verde − 0,5) e a escala = h; no alto a leitura sobe (verde abaixo de 0,5), no pé desce. As imagens passam
// SOBRA px das bordas da faixa (repetindo a última linha): esticadas na faixa, elas são suavizadas contra o vazio na
// primeira e na última linha, e sem a sobra isso puxava a leitura e deixava um fio claro na borda da tela
const SOBRA = 4;
function linhas(h: number, cada: (y: number) => number[]) {
    const n = (h + 2 * SOBRA) * 2;
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = n;
    const g = c.getContext('2d')!;
    const img = g.createImageData(1, n);
    for (let i = 0; i < n; i++) img.data.set(cada(Math.min(h, Math.max(0, ((i + 0.5) / n) * (h + 2 * SOBRA) - SOBRA))), i * 4);
    g.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
}
function mapa(h: number, noTopo: boolean) {
    return linhas(h, y => {
        // a distância até a borda e a linha que a lente mostra ali
        const ate = noTopo ? y : h - y;
        const lente = h * (ate / h) ** CURVA;
        const d = noTopo ? lente - ate : ate - lente;
        // arredondado para dentro da tela: com 8 bits o zero não é exato (127,5), e a leitura da borda caía uma fração
        // de pixel fora da faixa, misturando a última linha com o vazio (um fio claro na borda)
        const verde = (0.5 + d / h) * 255;
        return [128, noTopo ? Math.ceil(verde) : Math.floor(verde), 128, 255];
    });
}

// a máscara do desfoque (branca com alfa): nula onde a faixa começa e cheia perto da borda da tela, para a faixa não ter
// emenda com o resto da página (com o desfoque igual na faixa toda, a linha onde ela começa aparecia); nos últimos 3 px
// antes da borda ela volta a zero, porque ali o desfoque mistura a linha da borda com o vazio (fio claro na borda)
function mascara(h: number, noTopo: boolean) {
    return linhas(h, y => {
        const ate = noTopo ? y : h - y;
        return [255, 255, 255, Math.round((1 - ate / h) ** 1.5 * Math.min(1, ate / 3) * 255)];
    });
}

function Filtro({ id, h, largura, href, hrefMascara }: { id: string; h: number; largura: number; href: string; hrefMascara: string }) {
    // uma leitura deslocada por cor, com escalas diferentes, desfocada só na vertical (as franjas viram degradê) e as três
    // somadas de volta (screen)
    const so = ['1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'];
    return (
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feImage href={href} x="0" y={-SOBRA} width={largura} height={h + 2 * SOBRA} preserveAspectRatio="none" result="mapa" />
            {CORES.map((k, i) => (
                <feDisplacementMap key={`d${i}`} in="SourceGraphic" in2="mapa" scale={h * k} xChannelSelector="R" yChannelSelector="G" result={`d${i}`} />
            ))}
            {so.map((m, i) => (
                <feColorMatrix key={`m${i}`} in={`d${i}`} type="matrix" values={m} result={`m${i}`} />
            ))}
            {so.map((_, i) => (
                <feGaussianBlur key={`c${i}`} in={`m${i}`} stdDeviation={`0 ${DISPERSAO}`} edgeMode="duplicate" result={`c${i}`} />
            ))}
            <feBlend in="m0" in2="m1" mode="screen" result="nrg" />
            <feBlend in="nrg" in2="m2" mode="screen" result="nitido" />
            <feBlend in="c0" in2="c1" mode="screen" result="rg" />
            <feBlend in="rg" in2="c2" mode="screen" result="borrado" />
            {/* o degradê da dispersão só perto da borda da tela, sobre a leitura nítida */}
            <feImage href={hrefMascara} x="0" y={-SOBRA} width={largura} height={h + 2 * SOBRA} preserveAspectRatio="none" result="mascara" />
            <feComposite in="borrado" in2="mascara" operator="in" result="naBorda" />
            <feComposite in="naBorda" in2="nitido" operator="over" />
        </filter>
    );
}

export default function Bordas() {
    const base = `bordas-${useId().replace(/:/g, '')}`;
    const [faixas, setFaixas] = useState<{ h: number; largura: number; topo: string; pe: string; mTopo: string; mPe: string } | null>(null);

    useEffect(() => {
        if (new URLSearchParams(location.search).get('bordas') === '0') return;
        const medir = () => {
            const h = window.innerWidth < 768 ? ALTURA.celular : ALTURA.computador;
            setFaixas(f => (f && f.h === h && f.largura === window.innerWidth ? f : { h, largura: window.innerWidth, topo: mapa(h, true), pe: mapa(h, false), mTopo: mascara(h, true), mPe: mascara(h, false) }));
        };
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);

    if (!faixas) return null;
    const { h, largura } = faixas;
    return (
        <>
            <svg aria-hidden width="0" height="0" className="absolute">
                <defs>
                    <Filtro id={`${base}-topo`} h={h} largura={largura} href={faixas.topo} hrefMascara={faixas.mTopo} />
                    <Filtro id={`${base}-pe`} h={h} largura={largura} href={faixas.pe} hrefMascara={faixas.mPe} />
                </defs>
            </svg>
            <div aria-hidden className="fa-borda" style={{ top: 0, height: h, backdropFilter: `url(#${base}-topo)` }} />
            <div aria-hidden className="fa-borda" style={{ bottom: 0, height: h, backdropFilter: `url(#${base}-pe)` }} />
        </>
    );
}
