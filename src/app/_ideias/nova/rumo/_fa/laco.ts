// o laço do rumo, com as seções da página. A página inteira num laço só (o Lenis e tudo o que depende da rolagem no
// mesmo quadro).
//
// A geometria (topo e altura de cada seção pelo id, a janela e o rem) é medida na montagem, no resize e quando a altura
// do documento muda. Cada efeito se registra com aCadaQuadro e recebe a rolagem do quadro já atualizada pelo Lenis: se
// o Lenis vai rolar neste quadro, o laço espera o evento dele; se não (parado, travado ou rolagem nativa), roda no
// próprio requestAnimationFrame. Assim nada fica um quadro atrás do que está pintado.
import type Lenis from 'lenis';

// as seções da tela de teste do rumo (o segredo é o pedaço escondido acima do topo, onde a logo vira hero)
export const IDS = ['segredo', 'hero', 'projetos', 'galeria', 'footer'] as const;
export type IdSecao = (typeof IDS)[number];
export type Caixa = { top: number; h: number };

export const geo = {
    vw: 1440,
    vh: 900,
    // 1rem = largura/192 (7,5 px a 1440)
    rem: 7.5,
    // a largura sem a barra de rolagem (o plano da vitrine usa document.body.clientWidth)
    corpo: 1440,
    limite: 1,
    s: Object.fromEntries(IDS.map(id => [id, { top: 0, h: 0 }])) as Record<IdSecao, Caixa>,
    versao: 0,
};

export function medir() {
    geo.vw = window.innerWidth;
    geo.vh = window.innerHeight;
    geo.corpo = document.body.clientWidth || geo.vw;
    geo.rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || geo.vw / 192;
    const y = window.scrollY;
    for (const id of IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        geo.s[id] = { top: r.top + y, h: r.height };
    }
    geo.limite = Math.max(1, document.documentElement.scrollHeight - geo.vh);
    geo.versao++;
}

export type Quadro = { y: number; t: number; dt: number; vel: number };
type Funcao = (q: Quadro) => void;

const funcoes = new Set<Funcao>();
export function aCadaQuadro(f: Funcao) {
    funcoes.add(f);
    return () => {
        funcoes.delete(f);
    };
}

// o Lenis da página (o do layout raiz) e um sinal para as rolagens programadas (cliques no índice e nas miniaturas),
// que não disparam a trava da vitrine
export const rolagem = { lenis: null as Lenis | null, y: 0, programada: false };

let ultimo = -1;
let anterior = 0;

function rodar(t: number) {
    if (t === ultimo) return;
    const dt = ultimo < 0 ? 1 / 60 : Math.min(0.1, Math.max(0, (t - anterior) / 1000));
    ultimo = t;
    anterior = t;
    rolagem.y = window.scrollY;
    const q: Quadro = { y: rolagem.y, t: t / 1000, dt, vel: rolagem.lenis?.velocity ?? 0 };
    funcoes.forEach(f => f(q));
}

export function ligarLaco(lenis: Lenis) {
    rolagem.lenis = lenis;
    // o Lenis da raiz do site usa duração de 1,5 s na roda; aqui vale o padrão (lerp 0,1, λ = 6/s), sem duração
    const antes = { duration: lenis.options.duration, easing: lenis.options.easing };
    lenis.options.duration = undefined;
    lenis.options.easing = undefined;
    const aoRolar = () => rodar(lenis.time);
    const desligar = lenis.on('scroll', aoRolar);
    let quadro = 0;
    const passo = (t: number) => {
        quadro = requestAnimationFrame(passo);
        if (lenis.time === t || lenis.isScrolling !== 'smooth') rodar(t);
    };
    quadro = requestAnimationFrame(passo);

    medir();
    const aoMudar = () => medir();
    window.addEventListener('resize', aoMudar);
    const obs = new ResizeObserver(aoMudar);
    obs.observe(document.body);
    document.fonts?.ready.then(aoMudar);

    return () => {
        cancelAnimationFrame(quadro);
        desligar();
        window.removeEventListener('resize', aoMudar);
        obs.disconnect();
        lenis.options.duration = antes.duration;
        lenis.options.easing = antes.easing;
        rolagem.lenis = null;
    };
}

// rola até um ponto, como nos botões do índice (expo.out de 1,5 s, travando a roda no caminho)
let fimProgramada = 0;
export function rolarPara(alvo: number, duracao = 1.5, facilidade?: (x: number) => number) {
    const l = rolagem.lenis;
    if (!l) return;
    rolagem.programada = true;
    window.clearTimeout(fimProgramada);
    const soltar = () => {
        window.clearTimeout(fimProgramada);
        rolagem.programada = false;
    };
    // se a rolagem for interrompida, o onComplete não vem
    fimProgramada = window.setTimeout(soltar, duracao * 1000 + 300);
    l.scrollTo(alvo, {
        duration: duracao,
        easing: facilidade ?? (x => Math.min(1, 1.001 - 2 ** (-10 * x))),
        lock: true,
        force: true,
        onComplete: soltar,
    });
}
