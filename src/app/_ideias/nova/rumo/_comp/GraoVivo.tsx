'use client';

// o chiado por cima da página inteira: um ruído leve por pixel (no máximo 5% de branco ou preto, a FORCA), sorteado de
// novo a cada quadro. Em vez de um shader, são oito ladrilhos de ruído sorteados uma vez e trocados a ~24 quadros por
// segundo numa camada fixa: cada ponto é branco ou preto, translúcido conforme o sorteio, em mistura normal (clareia e
// escurece, como um ruído somado à cor). Em modo overlay ele escurecia o creme do fundo e não pegava a camada do ato, e
// os dois cremes se cortavam na passagem para a seção seguinte. O ladrilho tem um pixel do ruído por pixel da tela.
// Teste: ?grao=0 desliga
import { useEffect, useRef } from 'react';

const LADRILHO = 256;
const QUADROS = 8;
const POR_SEGUNDO = 24;
const FORCA = 0.05;

export default function GraoVivo() {
    const el = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const camada = el.current;
        if (!camada || new URLSearchParams(location.search).get('grao') === '0') return;
        const urls = Array.from({ length: QUADROS }, () => {
            const c = document.createElement('canvas');
            c.width = c.height = LADRILHO;
            const ctx = c.getContext('2d')!;
            const img = ctx.createImageData(LADRILHO, LADRILHO);
            for (let i = 0; i < img.data.length; i += 4) {
                const v = Math.random() * 2 - 1;
                img.data[i] = img.data[i + 1] = img.data[i + 2] = v > 0 ? 255 : 0;
                img.data[i + 3] = Math.round(Math.abs(v) * 255);
            }
            ctx.putImageData(img, 0, 0);
            return c.toDataURL('image/png');
        });
        // um ponto do ruído por pixel da tela no computador; nas telas pequenas (densidade 2 a 3), um por pixel de CSS:
        // um ponto por pixel físico ficava fino demais para ver, e o grão parecia parado
        const celular = window.innerWidth < 768;
        camada.style.backgroundSize = `${celular ? LADRILHO : LADRILHO / (window.devicePixelRatio || 1)}px`;
        camada.style.opacity = String(FORCA);
        let k = 0, antes = 0, quadro = 0;
        const passo = (t: number) => {
            quadro = requestAnimationFrame(passo);
            if (t - antes < 1000 / POR_SEGUNDO) return;
            antes = t;
            k = (k + 1 + Math.floor(Math.random() * (QUADROS - 1))) % QUADROS;
            camada.style.backgroundImage = `url(${urls[k]})`;
            // o ladrilho também anda, para a repetição não aparecer
            camada.style.backgroundPosition = `${Math.floor(Math.random() * LADRILHO)}px ${Math.floor(Math.random() * LADRILHO)}px`;
        };
        quadro = requestAnimationFrame(passo);
        return () => cancelAnimationFrame(quadro);
    }, []);
    return <div ref={el} aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 9999998, opacity: 0 }} />;
}
