'use client';

// o fundo da página em camadas de tela cheia empilhadas atrás de tudo, e cada uma some por opacidade presa à rolagem,
// numa janela no fim da seção dela, revelando a de baixo. Antes (até 25/10) era uma cor só, misturada em OKLab entre
// as seções quando a próxima passava do meio da tela: a troca acontecia com conteúdo na tela e passava por tons sujos
// no meio do caminho (do creme ao navy, um cinza amarronzado). Aqui a troca acontece no vão vazio do fim de cada
// seção, e a camada escura tem luz que se mexe devagar, então a passagem parece mudança de luz, não de tinta. De cima
// para baixo:
// - as ondas do hero (_comp/FundoOndas.tsx, uma camada à parte, por cima desta), até o creme do ato cobrir a tela;
// - creme: o fundo da lista dos serviços (a cor do creme do ato, para não haver emenda); some no vão do fim dela;
// - mar: o navy com a luz turquesa das ondas se mexendo devagar, atrás da seção de imagens; some no fim dela;
// - rodapé: as ondas do hero numa cena própria, "voltar à tona" (a cenaDoRodape de _comp/FundoOndas.tsx): reveladas
//   quando o mar some, enquanto o rodapé entra, com a câmera subindo de debaixo d'água até acima da superfície, e
//   com a água simulada do barquinho de papel (_comp/Barquinho.tsx).
// A tinta do texto (a variável --tinta da raiz) continua vindo das seções (data-tinta): a da seção no meio da tela,
// misturada com a próxima em OKLab quando ela sobe de 90% a 50% da altura e suavizada (~0,3 s)
import { useEffect, useRef } from 'react';
import { aCadaQuadro, geo } from '../_fa/laco';
import { ramp } from '../_fa/movimento';
import { trecho } from '../_lib/rumo';
import { Ondas, aguaDoRodape, cenaDoRodape } from './FundoOndas';

type RGB = [number, number, number];
const linear = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const gama = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
// as cores andam em OKLab (L, a, b)
const rgb = (hex: string): RGB => {
    const [r, g, b] = [1, 3, 5].map(i => linear(parseInt(hex.slice(i, i + 2), 16)));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const css = ([L, A, B]: RGB) => {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const c = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    return `rgb(${c.map(v => Math.round(Math.min(255, Math.max(0, gama(Math.min(1, Math.max(0, v))))))).join(',')})`;
};
const misturar = (a: RGB, b: RGB, k: number): RGB => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * k) as RGB;
const suave = (x: number) => x * x * (3 - 2 * x);

type Camada = 'creme' | 'mar' | 'rodape';
const ORDEM: Camada[] = ['creme', 'mar', 'rodape'];

export default function Fundo() {
    const raiz = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const pagina = document.querySelector<HTMLElement>('[data-rumo]');
        const camadas: Partial<Record<Camada, HTMLElement>> = {};
        raiz.current?.querySelectorAll<HTMLElement>('[data-camada]').forEach(el => (camadas[el.dataset.camada as Camada] = el));
        const vis: Partial<Record<Camada, boolean>> = {};
        let tinta: RGB | null = null;

        return aCadaQuadro(({ y, dt }) => {
            const s = geo.s;
            const vh = geo.vh;
            // as janelas: o creme some no vão vazio do fim da lista (a última linha já perto do topo), depressa e numa
            // curva suave, enquanto as capas da seção de imagens entram (o meio da passagem, em que o creme meio
            // transparente sobre o navy fica acinzentado, dura pouco); o mar some quando o fim da seção de imagens sobe e
            // o rodapé entra
            const fimLista = s.projetos.top + s.projetos.h;
            const fimImagens = s.galeria.h ? s.galeria.top + s.galeria.h : fimLista;
            const op: Record<Camada, number> = {
                creme: 1 - suave(ramp(y, fimLista - 0.5 * vh, fimLista - 0.15 * vh)),
                mar: s.galeria.h ? 1 - ramp(y, fimImagens - 0.9 * vh, fimImagens - 0.2 * vh) : 0,
                rodape: 1,
            };
            // de cima para baixo: uma camada só aparece se as de cima deixam passar alguma coisa (a luz das escondidas
            // para)
            let passa = 1;
            for (const c of ORDEM) {
                const el = camadas[c];
                const visivel = op[c] > 0 && passa > 0.001;
                passa *= 1 - op[c];
                if (!el) continue;
                el.style.opacity = op[c].toFixed(4);
                if (vis[c] !== visivel) {
                    vis[c] = visivel;
                    el.style.visibility = visivel ? 'visible' : 'hidden';
                }
            }

            // a tinta: a da seção no meio da tela, misturada com a próxima
            const H = window.innerHeight;
            const secoes = [...document.querySelectorAll<HTMLElement>('[data-tinta]')];
            if (!secoes.length || !pagina) return;
            let i = secoes.findIndex(el => { const r = el.getBoundingClientRect(); return r.top <= H * 0.5 && r.bottom > H * 0.5; });
            if (i < 0) i = secoes[0].getBoundingClientRect().top > H * 0.5 ? 0 : secoes.length - 1;
            let alvo = rgb(secoes[i].dataset.tinta!);
            const prox = secoes[i + 1];
            if (prox) alvo = misturar(alvo, rgb(prox.dataset.tinta!), suave(trecho(H * 0.9 - prox.getBoundingClientRect().top, 0, H * 0.4)));
            tinta = tinta ? misturar(tinta, alvo, 1 - Math.exp(-dt / 0.3)) : alvo;
            pagina.style.setProperty('--tinta', css(tinta));
        });
    }, []);

    return (
        <div ref={raiz} className="fa-fundo" aria-hidden>
            <div data-camada="rodape" className="fa-camada" style={{ background: '#051236' }}>
                <Ondas cena={cenaDoRodape} agua={aguaDoRodape} />
            </div>
            <div data-camada="mar" className="fa-camada fa-mar">
                <div className="fa-mar-luz" />
                <div className="fa-mar-luz fa-mar-luz-2" />
                <div className="fa-mar-luz fa-mar-luz-3" />
            </div>
            <div data-camada="creme" className="fa-camada" style={{ background: '#fffde2' }} />
        </div>
    );
}
