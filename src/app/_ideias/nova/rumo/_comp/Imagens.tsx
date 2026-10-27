'use client';

// a seção só de imagens depois da lista (25/10), sobre a camada "mar" do fundo (_comp/Fundo.tsx): uma faixa curva de
// capas. Elas ficam por dentro de um cilindro e passam de lado com a rolagem, de uma ponta à outra, com as das pontas
// mais perto e viradas para o meio. É WebGL2, como as ondas: cada capa é uma malha que
// dobra junto com o cilindro (a imagem curva de verdade, não um retângulo duro virado), com os cantos arredondados no
// shader. As capas têm todas o mesmo tamanho e a proporção delas (16:10), alinhadas (ele não gosta de capas de tamanhos
// diferentes); a do meio ocupa ~44% da altura da tela, para a água ter espaço.
// No hover (no celular, a capa que passa no meio), a capa chega um pouco mais perto e as outras apagam e desfocam como os
// itens do menu; embaixo, a legenda dela sai do desfoque em modo diferença (o nome em caixa alta, o tipo e o ano na
// serifa itálica e uma linha), e o cursor vira "Ver projeto". O mouse acha a capa pelo raio que sai da câmera e bate no
// cilindro em que cada capa está desenhada (a do hover, mais perto, num raio menor).
// A água: o mouse sobre a capa levanta uma onda líquida (a simulação está em _lib/agua-gl.ts), que continua
// amortecendo quando ele sai ou troca de capa; no toque nada muda. Ela levanta a capa (na direção do eixo do cilindro),
// desloca a leitura da imagem (o gradiente × 0,2) e escurece até
// 40%, e o resto é polimento: a altura e as normais lidas com o filtro B-spline (lisas, sem as facetas da bilinear), a
// capa com água desenhada numa grade fina (o relevo sem facetas; as outras ficam na tira), o nível de mipmap tirado da uv
// sem a água (a uv deslocada fazia o mipmap trocar a cada 2×2 pixels nas cristas e cintilar) e um pontilhado de meio
// tom contra as faixas do escurecimento.
// O clique (o toque, no celular) abre a capa (26/10): ela sai da curva, desenrola e vai para o meio da tela, plana e
// grande (1,1 s, cúbica de entrada e saída), com uma gota caindo onde foi o clique; as outras apagam e desfocam de
// vez, e a água continua nela. Fecha com outro clique ou com Esc (1,1 s na volta, ao lugar dela na curva) ou rolando a
// página (0,55 s, só desacelerando, para o lado em que a faixa levou o lugar dela). Arrastar de lado (o mouse ou o dedo) anda com a faixa: o arrasto vira rolagem na medida em que a capa do meio
// acompanha o ponteiro, e ao soltar segue com a inércia do gesto, sem passar dos limites da seção. O cursor do site
// acompanha a seta com o rótulo de cada coisa: "Ver projeto" na capa, "Fechar" com ela aberta e "Arraste", com as
// setinhas dos dois lados, no resto da faixa, ao segurar o clique (um quinto de segundo parado já conta) e no arrasto;
// nesses dois, a seta do sistema vira a mãozinha fechada.
// Depois da última capa entra "Veja mais", com a janela do hero que abre entre as palavras no hover, e as linhas
// embaixo das duas palavras viram uma só.
// A versão do anel (o cilindro visto de fora), guardada para mais à frente, está em C:/pessoal/ideias/rumo-visual/anel-de-capas
import { useEffect, useRef, useState } from 'react';
import { aCadaQuadro, rolagem } from '../_fa/laco';
import { COR_DA_ABERTURA } from '../_lib/rumo';
import { Agua, LER_AGUA, type Toque } from '../_lib/agua-gl';
import { CAPA_DO_PROJETO } from '../../_lib/midia';
import { useIdioma } from '../../_lib/idioma';
import { textosDoRumo } from '../_lib/textos';
import { useTrocaDeIdioma } from '../_lib/troca';

const falsa = (i: number) => `/nova-escala/falsas/capa-${i}.jpg`;
// as capas na ordem das legendas (textos.ts, galeria.itens), todas do mesmo tamanho: a largura em unidades (1,6: a
// proporção 16:10 das capas), a altura e o deslocamento vertical em fração da altura base
const CAPAS = [
    CAPA_DO_PROJETO.turno,
    falsa(1),
    CAPA_DO_PROJETO.aurora,
    falsa(2),
    CAPA_DO_PROJETO.tipografia,
    falsa(3),
    CAPA_DO_PROJETO.pulso,
    falsa(4),
    CAPA_DO_PROJETO.site,
    falsa(5),
    falsa(6),
    falsa(7),
    falsa(8),
].map(src => ({ src, larg: 1.6, alt: 1, y: 0 }));
const N = CAPAS.length;
// o vão entre duas capas, em unidades; o raio dos cantos, em px da capa
const VAO = 0.12;
const CANTO = 16;
// a faixa anda até AVANCO_FIM da parte presa; depois entra "Mais projetos"
const AVANCO_FIM = 0.86;
// o relevo da água, em alturas da capa por unidade de h: 14 px numa capa de 450 px de altura (a 1440)
const RELEVO = 14 / 450;
// a capa aberta: a largura máxima (em fração da tela; no celular, 92%), a altura máxima e quanto o meio dela sobe (em
// fração da altura da tela, para a legenda embaixo ficar livre); os tempos de abrir e fechar (s), e o de fechar rolando
// (mais curto e só desacelerando: a faixa anda junto, e a capa sai depressa para o lado); quanto a rolagem precisa
// andar para fechar (px)
const ABERTA = { larg: 0.78, alt: 0.62, sobe: 0.05, larguraNoCelular: 0.92, abrir: 1.1, fechar: 1.1, fecharRolando: 0.55, rolagem: 60 };
// o maior ângulo (do meio da capa, em radianos) de onde a capa aberta sai e para onde volta: com a meia largura da
// capa (~0,37), as bordas ficam bem antes de a curva passar para trás da câmera (~1,7)
const ANGULO_DA_ABERTA = 0.9;
// o arrasto: quantos px até o gesto virar arrasto (menos que isso é clique), quanto da velocidade do gesto (px/ms) a
// inércia leva, em ms, a duração dela e quantos segundos de clique segurado já mostram o rótulo do arrasto
const ARRASTO = { limiar: 6, inercia: 320, duracao: 1.1, segurar: 0.2 };

// o cilindro pelo tamanho da tela: a distância focal (a perspectiva), o raio, a distância da câmera ao eixo (menor que o
// raio: a câmera fica dentro do cilindro, do lado de dentro da curva, e as capas das pontas chegam mais perto), a altura
// base (a capa do meio com ~44% da altura da tela; 22% no celular, onde a largura é pouca) e a unidade de largura (um
// arco do tamanho da altura base, em radianos)
function geometria(W: number, H: number) {
    const celular = W < 768;
    const p = celular ? 800 : 1000;
    const R = W * (celular ? 1.7 : 1.2);
    const D = p - W * (celular ? 0.7 : 0.5);
    const hb = (H * (celular ? 0.22 : 0.44) * (D + R)) / p;
    return { p, R, D, hb, u: hb / R, celular };
}
type Geometria = ReturnType<typeof geometria>;

// a capa aberta na tela, em px: a largura e a altura (na proporção das capas) e quanto o meio dela fica acima do meio
function plano(W: number, H: number) {
    const larg = Math.min(W * (W < 768 ? ABERTA.larguraNoCelular : ABERTA.larg), H * ABERTA.alt * 1.6);
    return { larg, alt: larg / 1.6, sobe: W < 768 ? 0 : H * ABERTA.sobe };
}

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const ramp = (v: number, a: number, b: number) => limitar((v - a) / (b - a));
const suave = (x: number) => x * x * (3 - 2 * x);
const cubica = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const expoOut = (x: number) => Math.min(1, 1.001 - 2 ** (-10 * x));
const power3Out = (x: number) => 1 - (1 - x) ** 3;

// a capa no cilindro; com água, o raio diminui com a altura dela (a capa sobe na direção do eixo, para a câmera). Aberta
// (uAbre de 0 a 1), ela vai da curva ao retângulo plano no meio da tela (uPlano em px, o meio uPlanoY px acima), com o
// relevo da água virando uma leve aproximação, como num plano
const VERTICE = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 aUV;
uniform float uTheta, uDelta, uR, uD, uP, uH, uY, uRelevo, uTemAgua, uAbre, uWPlano, uPlanoY;
uniform vec2 uMeio, uPlano;
uniform sampler2D uAgua;
out vec2 vUV;
out float vPhi;
${LER_AGUA}
void main() {
    float phi = uTheta + (aUV.x - 0.5) * uDelta;
    float h = uTemAgua > 0.5 ? lerAgua(uAgua, aUV).x : 0.0;
    float r = uR - h * uRelevo;
    float x = r * sin(phi);
    float z = -uD - r * cos(phi);
    float y = uY + (0.5 - aUV.y) * uH;
    vUV = aUV;
    vPhi = phi;
    vec4 curva = vec4(x * uP / uMeio.x, y * uP / uMeio.y, 0.0, -z);
    if (uAbre <= 0.0) {
        gl_Position = curva;
        return;
    }
    vec2 naTela = vec2((aUV.x - 0.5) * uPlano.x, (0.5 - aUV.y) * uPlano.y) * (1.0 + h * 0.0145);
    naTela.y += uPlanoY;
    float w = mix(curva.w, uWPlano, uAbre);
    gl_Position = vec4(mix(curva.xy / curva.w, naTela / uMeio, uAbre) * w, 0.0, w);
}`;

// a capa: a imagem em cover dentro do tamanho da capa (o arco e a altura), os cantos arredondados por distância com a
// borda suavizada, o desfoque pelo nível de mipmap (com quatro amostras em volta para não ficar quadriculado), a água
// (o deslocamento e o escurecimento, com o nível de mipmap tirado da uv sem ela e o pontilhado), o apagar rumo
// ao navy (mais forte com uma capa aberta) e o sumiço nas pontas (que a capa aberta perde); a saída é pré-multiplicada
const FRAGMENTO = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUV;
in float vPhi;
uniform sampler2D uTex, uAgua;
uniform vec2 uCapa;
uniform float uAspecto, uCanto, uApaga, uEscurece, uDesfoque, uTemAgua, uAbre, uVisivel;
uniform vec3 uFundo;
out vec4 cor;
${LER_AGUA}
void main() {
    vec2 uv = vUV;
    float ac = uCapa.x / uCapa.y;
    if (ac > uAspecto) uv.y = 0.5 + (uv.y - 0.5) * uAspecto / ac;
    else uv.x = 0.5 + (uv.x - 0.5) * ac / uAspecto;
    float k = exp2(uDesfoque);
    vec2 gx = dFdx(uv) * k, gy = dFdy(uv) * k;
    vec2 n = vec2(0.0);
    if (uTemAgua > 0.5) {
        n = -2.0 * lerAgua(uAgua, vUV).yz;
        uv += n * 0.2;
    }
    vec2 passo = vec2(0.004, 0.006) * uDesfoque;
    vec3 c = textureGrad(uTex, uv, gx, gy).rgb * 0.4;
    c += textureGrad(uTex, uv + vec2(passo.x, 0.0), gx, gy).rgb * 0.15;
    c += textureGrad(uTex, uv - vec2(passo.x, 0.0), gx, gy).rgb * 0.15;
    c += textureGrad(uTex, uv + vec2(0.0, passo.y), gx, gy).rgb * 0.15;
    c += textureGrad(uTex, uv - vec2(0.0, passo.y), gx, gy).rgb * 0.15;
    if (uTemAgua > 0.5) {
        c *= clamp(1.0 - 0.6 * length(n), 0.6, 1.0);
        c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
    }
    c = mix(c, uFundo, uApaga * uEscurece);
    vec2 q = abs((vUV - 0.5) * uCapa) - (uCapa * 0.5 - uCanto);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uCanto;
    float aa = max(fwidth(d), 0.5);
    float a = (1.0 - smoothstep(-aa, aa, d)) * (1.0 - smoothstep(0.85, 1.05, abs(vPhi)) * (1.0 - uAbre)) * mix(uVisivel, 1.0, uAbre);
    cor = vec4(c * a, a);
}`;

function compilar(gl: WebGL2RenderingContext) {
    const sombreador = (tipo: number, fonte: string) => {
        const s = gl.createShader(tipo)!;
        gl.shaderSource(s, fonte);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
        return s;
    };
    const p = gl.createProgram()!;
    const v = sombreador(gl.VERTEX_SHADER, VERTICE), f = sombreador(gl.FRAGMENT_SHADER, FRAGMENTO);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, 'aUV');
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
    return p;
}

// as malhas de uma capa, em uv: a tira de 48 segmentos na largura (é o que deixa a curva lisa) e, para as capas com
// água, uma grade de 192×120 (duas quadras por célula da simulação), que o relevo empurra sem facetar
const SEGMENTOS = 48;
const GRADE = { x: 192, y: 120 };
function malhas(gl: WebGL2RenderingContext) {
    const tira = new Float32Array((SEGMENTOS + 1) * 4);
    for (let i = 0; i <= SEGMENTOS; i++) tira.set([i / SEGMENTOS, 0, i / SEGMENTOS, 1], i * 4);
    const grade = new Float32Array((GRADE.x + 1) * (GRADE.y + 1) * 2);
    for (let j = 0; j <= GRADE.y; j++) for (let i = 0; i <= GRADE.x; i++) grade.set([i / GRADE.x, j / GRADE.y], (j * (GRADE.x + 1) + i) * 2);
    const indices = new Uint16Array(GRADE.x * GRADE.y * 6);
    let k = 0;
    for (let j = 0; j < GRADE.y; j++)
        for (let i = 0; i < GRADE.x; i++) {
            const v = j * (GRADE.x + 1) + i;
            indices.set([v, v + 1, v + GRADE.x + 1, v + 1, v + GRADE.x + 2, v + GRADE.x + 1], k);
            k += 6;
        }
    const buffers: WebGLBuffer[] = [];
    const vao = (dados: Float32Array, ind?: Uint16Array) => {
        const a = gl.createVertexArray()!;
        gl.bindVertexArray(a);
        const b = gl.createBuffer()!;
        buffers.push(b);
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, dados, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        if (ind) {
            const e = gl.createBuffer()!;
            buffers.push(e);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, e);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ind, gl.STATIC_DRAW);
        }
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return a;
    };
    return { tira: vao(tira), grade: vao(grade, indices), nGrade: indices.length, buffers };
}

// o navy da abertura, para o apagar
const NAVY = [5 / 255, 18 / 255, 54 / 255];

// o mouse na janela (clientX/Y; fora da página, null) e, a cada quadro, em px a partir do meio da tela de desenho (y para
// cima). A conta é refeita em todo quadro porque a tela de desenho anda com a rolagem enquanto a seção entra e sai: com
// o mouse parado, a posição guardada em relação a ela ficava velha, e a faixa achava o mouse em outro lugar (26/10)
const cliente: { x: number | null; y: number | null } = { x: null, y: null };
const ponteiro: { x: number | null; y: number | null } = { x: null, y: null };

export default function Imagens() {
    const T = textosDoRumo(useIdioma().idioma).galeria;
    const raiz = useRef<HTMLElement>(null);
    const grupo = useRef<HTMLDivElement>(null);
    const tela = useRef<HTMLCanvasElement>(null);
    const mais = useRef<HTMLDivElement>(null);
    const [ativa, setAtiva] = useState(-1);
    useTrocaDeIdioma(raiz, '[data-troca]');
    const rotuloDoCursor = T.ver;
    const rotuloDeFechar = T.fechar;
    const rotuloDeArrastar = T.arraste;

    useEffect(() => {
        const r = raiz.current, g = grupo.current, c = tela.current, m = mais.current;
        const gl = c?.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
        if (!r || !g || !c || !m || !gl) return;
        const prog = compilar(gl);
        const u = Object.fromEntries(
            [
                'uTheta',
                'uDelta',
                'uR',
                'uD',
                'uP',
                'uH',
                'uY',
                'uRelevo',
                'uTemAgua',
                'uAbre',
                'uVisivel',
                'uWPlano',
                'uPlanoY',
                'uMeio',
                'uPlano',
                'uAgua',
                'uTex',
                'uCapa',
                'uAspecto',
                'uCanto',
                'uApaga',
                'uEscurece',
                'uDesfoque',
                'uFundo',
            ].map(n => [n, gl.getUniformLocation(prog, n)]),
        );
        const malha = malhas(gl);
        const agua = new Agua(gl, N);

        // as texturas: cada capa carrega e ganha mipmaps (o desfoque do hover sai deles). Uma imagem que termina de
        // carregar depois da desmontagem (o React monta duas vezes em desenvolvimento) é ignorada
        let vivo = true;
        const imagens: HTMLImageElement[] = [];
        const texturas = CAPAS.map(capa => {
            const t = { tex: gl.createTexture()!, aspecto: 1.6, pronta: false };
            const img = new Image();
            imagens.push(img);
            img.decoding = 'async';
            img.onload = () => {
                if (!vivo) return;
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, t.tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.bindTexture(gl.TEXTURE_2D, null);
                t.aspecto = img.naturalWidth / Math.max(1, img.naturalHeight);
                t.pronta = true;
            };
            img.src = capa.src;
            return t;
        });

        let W = 1, H = 1;
        const medir = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = c.clientWidth;
            H = c.clientHeight;
            const w = Math.max(1, Math.round(W * dpr)), h = Math.max(1, Math.round(H * dpr));
            if (c.width !== w || c.height !== h) {
                c.width = w;
                c.height = h;
            }
        };
        medir();
        const obs = new ResizeObserver(medir);
        obs.observe(c);

        // a geometria e a faixa do último quadro, para o arrasto converter px em rolagem
        const ultimo = { G: geometria(W, H), total: 1, altura: 1, topo: 0 };
        // o clique (o toque) que o próximo quadro resolve, em px a partir do meio da tela (y para cima)
        let clique: { x: number; y: number } | null = null;

        // a capa aberta: o índice (fica até terminar de fechar), o quanto ela abriu (0 a 1) e a animação até o alvo
        let aberta = -1, abre = 0, abreDe = 0, abrePara = 0, abreT = 0, yAoAbrir = 0;
        let abreDuracao = ABERTA.abrir, abreCurva = cubica;
        const animarAbertura = (para: number, duracao: number, curva = cubica) => {
            abreDe = abre;
            abrePara = para;
            abreT = 0;
            abreDuracao = duracao;
            abreCurva = curva;
        };
        const fechar = () => animarAbertura(0, ABERTA.fechar);

        const naTela = (x: number, y: number) => {
            const b = c.getBoundingClientRect();
            return { x: x - b.left - b.width / 2, y: b.height / 2 - (y - b.top) };
        };
        // a posição do mouse vem do movimento e também do que chega com ele parado: o giro da roda (que traz a posição
        // da seta) e o "passou por cima"; sem isso, abrindo ou voltando à página com o mouse quieto, a faixa não sabia
        // onde ele estava e a água não acendia
        const mover = (e: MouseEvent) => {
            if ('pointerType' in e && e.pointerType === 'touch') return;
            cliente.x = e.clientX;
            cliente.y = e.clientY;
        };
        const sair = () => {
            cliente.x = null;
            cliente.y = null;
        };

        // o arrasto: px de rolagem por px arrastado, na medida em que a capa do meio acompanha o ponteiro (perto do meio,
        // um px na tela é (D + R) / (R · p) radianos, e a faixa anda (b1 − b0) / (AVANCO_FIM · 1,12 · parte presa)
        // radianos por px de rolagem)
        const porPx = () => {
            const { G, total, altura } = ultimo;
            const radPorPx = (G.D + G.R) / (G.R * G.p);
            const radPorRolagem = (0.78 + total + 0.85) / (AVANCO_FIM * 1.12 * Math.max(1, altura - window.innerHeight));
            return radPorPx / radPorRolagem;
        };
        const dentro = (y: number) => Math.min(Math.max(y, ultimo.topo), ultimo.topo + ultimo.altura - window.innerHeight);
        const rolarAte = (y: number, duracao?: number) => {
            const l = rolagem.lenis;
            if (!l) return window.scrollTo(0, y);
            if (duracao) l.scrollTo(y, { duration: duracao, easing: expoOut, force: true });
            else l.scrollTo(y, { force: true });
        };
        let arrasto: { id: number; x0: number; y0: number; s0: number; ativo: boolean; x: number; t: number; vel: number; inicio: number } | null =
            null;
        const apertar = (e: PointerEvent) => {
            if (e.button !== 0) return;
            arrasto = { id: e.pointerId, x0: e.clientX, y0: e.clientY, s0: window.scrollY, ativo: false, x: e.clientX, t: performance.now(), vel: 0, inicio: performance.now() };
        };
        const arrastar = (e: PointerEvent) => {
            if (!arrasto || e.pointerId !== arrasto.id) return;
            const dx = e.clientX - arrasto.x0;
            if (!arrasto.ativo) {
                // com uma capa aberta não há arrasto; um gesto mais vertical que horizontal é rolagem
                if (abrePara > 0 || Math.abs(dx) < ARRASTO.limiar || Math.abs(dx) < Math.abs(e.clientY - arrasto.y0)) return;
                arrasto.ativo = true;
                c.setPointerCapture(e.pointerId);
                c.dataset.arrastando = '';
            }
            const agora = performance.now();
            const v = (e.clientX - arrasto.x) / Math.max(1, agora - arrasto.t);
            arrasto.vel += (v - arrasto.vel) * 0.5;
            arrasto.x = e.clientX;
            arrasto.t = agora;
            rolarAte(dentro(arrasto.s0 - dx * porPx()));
        };
        const soltar = (e: PointerEvent) => {
            if (!arrasto || e.pointerId !== arrasto.id) return;
            if (arrasto.ativo) {
                const dx = e.clientX - arrasto.x0 + arrasto.vel * ARRASTO.inercia;
                rolarAte(dentro(arrasto.s0 - dx * porPx()), ARRASTO.duracao);
                delete c.dataset.arrastando;
            } else clique = naTela(e.clientX, e.clientY);
            arrasto = null;
        };
        const cancelar = () => {
            arrasto = null;
            delete c.dataset.arrastando;
        };
        const tecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && abrePara > 0) fechar();
        };
        window.addEventListener('pointermove', mover, { passive: true });
        window.addEventListener('pointerover', mover, { passive: true });
        window.addEventListener('wheel', mover, { passive: true });
        document.documentElement.addEventListener('pointerleave', sair);
        c.addEventListener('pointerdown', apertar);
        window.addEventListener('pointermove', arrastar, { passive: true });
        window.addEventListener('pointerup', soltar);
        window.addEventListener('pointercancel', cancelar);
        window.addEventListener('keydown', tecla);

        // por capa: o quanto ela chegou perto (hover) e o quanto apagou, com atraso; os ângulos dela no quadro (o centro
        // a partir da primeira e a largura, em radianos) e a ordem do desenho, sem alocar nada a cada quadro
        const perto = new Float64Array(N);
        const apaga = new Float64Array(N);
        const theta = new Float64Array(N);
        const delta = new Float64Array(N);
        const ordem = new Int32Array(N);
        const longe = new Float64Array(N);
        const toque: Toque = { capa: -1, u: 0, v: 0, aspecto: 1.6 };
        const pego: Toque = { capa: -1, u: 0, v: 0, aspecto: 1.6 };
        let mx = 0, tempo = 0, atual = -1, rotulo: string | null = null;

        // o raio da câmera (na origem, olhando para -z) por um ponto da tela até o cilindro em que cada capa está
        // desenhada; vale a mais perto. Devolve a capa e o ponto nela em uv (u ao longo do arco, v = 0 em cima, como no
        // shader), ou -1
        const achar = (G: Geometria, desloca: number, px: number, py: number, saida: Toque) => {
            const dx = px / G.p, dy = py / G.p;
            const k2 = dx * dx + 1;
            let maisPerto = Infinity, achou = -1;
            for (let i = 0; i < N; i++) {
                const R = G.R - perto[i] * G.hb * 0.12;
                const disc = G.D * G.D - k2 * (G.D * G.D - R * R);
                if (disc <= 0) continue;
                const tt = (G.D + Math.sqrt(disc)) / k2;
                const capa = CAPAS[i];
                const uu = (Math.atan2(tt * dx, tt - G.D) - theta[i] - desloca) / delta[i] + 0.5;
                const vv = 0.5 - (tt * dy - capa.y * G.hb) / (capa.alt * G.hb);
                if (uu < 0 || uu > 1 || vv < 0 || vv > 1 || tt >= maisPerto) continue;
                maisPerto = tt;
                achou = i;
                saida.capa = i;
                saida.u = uu;
                saida.v = vv;
                saida.aspecto = (R * delta[i]) / (capa.alt * G.hb);
            }
            return achou;
        };

        const desligar = aCadaQuadro(({ y, dt }) => {
            const b = r.getBoundingClientRect();
            const vh = window.innerHeight;
            if (b.bottom < -vh * 0.2 || b.top > vh) {
                agua.parar();
                aberta = -1;
                abre = abrePara = 0;
                clique = null;
                return;
            }
            tempo += dt;
            if (cliente.x !== null && cliente.y !== null) {
                const p = naTela(cliente.x, cliente.y);
                ponteiro.x = p.x;
                ponteiro.y = p.y;
            } else ponteiro.x = ponteiro.y = null;
            // a entrada pelo desfoque, enquanto a seção sobe da borda de baixo até o topo
            const e = suave(ramp(vh - b.top, 0, vh * 0.9));
            g.style.opacity = e.toFixed(3);
            g.style.filter = e < 1 ? `blur(${(10 * (1 - e)).toFixed(2)}px)` : '';
            // o avanço: de 0 (a seção chegando) a 1 (o fim da parte presa)
            const preso = limitar(-b.top / Math.max(1, b.height - vh));
            const avanco = (preso - limitar(b.top / vh) * 0.12 + 0.12) / 1.12;

            const G = geometria(W, H);
            let pos = 0;
            for (let i = 0; i < N; i++) {
                delta[i] = CAPAS[i].larg * G.u;
                theta[i] = pos + delta[i] / 2;
                pos += delta[i] + VAO * G.u;
            }
            const total = pos - VAO * G.u;
            ultimo.G = G;
            ultimo.total = total;
            ultimo.altura = b.height;
            ultimo.topo = b.top + y;
            // a faixa: a primeira capa entra pela direita e a última sai pela esquerda até AVANCO_FIM; um balanço leve e
            // o mouse por cima
            const a = 1 - Math.exp(-dt / 0.6);
            mx += ((ponteiro.x ?? 0) / Math.max(1, W) - mx) * a;
            const t = limitar(avanco / AVANCO_FIM);
            const b0 = 0.78, b1 = -total - 0.85;
            const desloca = b0 + (b1 - b0) * t + Math.sin(tempo * 0.5) * 0.006 + mx * 0.1;
            const P = plano(W, H);

            // o clique: com uma capa aberta, fecha; senão abre a capa sob ele, com a gota
            if (clique) {
                if (abrePara > 0) fechar();
                else if (e > 0.9 && t < 1 && achar(G, desloca, clique.x, clique.y, pego) >= 0) {
                    aberta = pego.capa;
                    animarAbertura(1, ABERTA.abrir);
                    yAoAbrir = y;
                    agua.gota(pego.capa, pego.u, pego.v);
                }
                clique = null;
            }
            if (abrePara > 0 && Math.abs(y - yAoAbrir) > ABERTA.rolagem) animarAbertura(0, ABERTA.fecharRolando, power3Out);
            if (abre !== abrePara) {
                abreT += dt;
                const x = limitar(abreT / abreDuracao);
                abre = abreDe + (abrePara - abreDe) * abreCurva(x);
                if (x >= 1) abre = abrePara;
            }
            if (abre === 0 && abrePara === 0) aberta = -1;

            // a capa ativa: com uma aberta, ela; no celular, a que está cruzando o meio da tela; no desktop, a que o
            // raio do mouse acerta. Do mesmo raio (ou do retângulo da aberta, quando ela terminou de abrir) sai o ponto
            // do pincel
            let alvo = -1;
            let pincel: Toque | null = null;
            if (aberta >= 0) {
                alvo = aberta;
                if (abre > 0.98 && !G.celular && ponteiro.x !== null && ponteiro.y !== null) {
                    const uu = ponteiro.x / P.larg + 0.5, vv = 0.5 - (ponteiro.y - P.sobe) / P.alt;
                    if (uu >= 0 && uu <= 1 && vv >= 0 && vv <= 1) {
                        toque.capa = aberta;
                        toque.u = uu;
                        toque.v = vv;
                        toque.aspecto = 1.6;
                        pincel = toque;
                    }
                }
            } else if (e > 0.9 && t < 1) {
                if (G.celular) {
                    for (let i = 0; i < N; i++) if (Math.abs(theta[i] + desloca) <= delta[i] / 2) alvo = i;
                } else if (ponteiro.x !== null && ponteiro.y !== null && !arrasto?.ativo) {
                    alvo = achar(G, desloca, ponteiro.x, ponteiro.y, toque);
                    if (alvo >= 0) pincel = toque;
                }
            }
            if (alvo !== atual) {
                atual = alvo;
                setAtiva(alvo);
            }
            // o rótulo do cursor: "Fechar" com uma capa aberta; "Arraste" no arrasto e com o clique segurado (mesmo sobre
            // uma capa, antes de o mouse andar); "Ver projeto" sobre uma capa; "Arraste" no resto da altura da faixa (enquanto
            // ela passa). O do arrasto leva as setinhas (data-cursor-setas)
            const segurando = arrasto !== null && aberta < 0 && (arrasto.ativo || (performance.now() - arrasto.inicio) / 1000 > ARRASTO.segurar);
            const naFaixa = !G.celular && e > 0.9 && t < 1 && ponteiro.y !== null && Math.abs(ponteiro.y) < H * 0.34;
            const novoRotulo =
                aberta >= 0 ? rotuloDeFechar : segurando ? rotuloDeArrastar : alvo >= 0 && !G.celular ? rotuloDoCursor : naFaixa ? rotuloDeArrastar : null;
            if (novoRotulo !== rotulo) {
                rotulo = novoRotulo;
                c.toggleAttribute('data-cursor-setas', rotulo === rotuloDeArrastar);
                if (rotulo) c.dataset.cursor = rotulo;
                else delete c.dataset.cursor;
            }
            // a mãozinha fechada do sistema com o clique segurado e no arrasto
            if (segurando !== c.hasAttribute('data-segurando')) c.toggleAttribute('data-segurando', segurando);
            const k1 = 1 - Math.exp(-dt / 0.25), k2 = 1 - Math.exp(-dt / 0.35);
            for (let i = 0; i < N; i++) {
                perto[i] += ((i === alvo ? 1 : 0) - perto[i]) * k1;
                apaga[i] += ((alvo >= 0 && i !== alvo ? 1 : 0) - apaga[i]) * k2;
            }

            // a água: o pincel na capa sob o mouse (só no desktop) e os passos das capas com energia recente
            agua.avancar(dt, pincel);

            // "Mais projetos" entra pelo desfoque depois que a última capa sai
            const em = suave(ramp(avanco, AVANCO_FIM, AVANCO_FIM + 0.1));
            m.style.opacity = em.toFixed(3);
            m.style.filter = em < 1 ? `blur(${(10 * (1 - em)).toFixed(2)}px)` : '';
            m.style.pointerEvents = em > 0.6 ? 'auto' : 'none';

            // o desenho: das mais longe (o meio da curva) às mais perto (as pontas), e a aberta por cima de todas
            let n = 0;
            for (let i = 0; i < N; i++) {
                if (i === aberta || Math.abs(theta[i] + desloca) - delta[i] / 2 >= 1.1 || !texturas[i].pronta) continue;
                longe[i] = Math.cos(theta[i] + desloca);
                let j = n++;
                while (j > 0 && longe[ordem[j - 1]] < longe[i]) {
                    ordem[j] = ordem[j - 1];
                    j--;
                }
                ordem[j] = i;
            }
            if (aberta >= 0 && texturas[aberta].pronta) ordem[n++] = aberta;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, c.width, c.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.useProgram(prog);
            gl.uniform1f(u.uD, G.D);
            gl.uniform1f(u.uP, G.p);
            gl.uniform2f(u.uMeio, W / 2, H / 2);
            gl.uniform2f(u.uPlano, P.larg, P.alt);
            gl.uniform1f(u.uPlanoY, P.sobe);
            gl.uniform1f(u.uWPlano, G.D + G.R);
            gl.uniform1f(u.uCanto, CANTO);
            gl.uniform3f(u.uFundo, NAVY[0], NAVY[1], NAVY[2]);
            gl.uniform1f(u.uEscurece, 0.72 + 0.2 * (aberta >= 0 ? abre : 0));
            gl.uniform1i(u.uTex, 0);
            gl.uniform1i(u.uAgua, 1);
            // a capa aberta, no tamanho da tela convertido para as unidades da curva (pela escala do meio dela), para os
            // cantos ficarem do mesmo tamanho
            const escala = (G.D + G.R) / G.p;
            for (let j = 0; j < n; j++) {
                const i = ordem[j];
                const capa = CAPAS[i];
                const R = G.R - perto[i] * G.hb * 0.12;
                const h = capa.alt * G.hb;
                const comAgua = agua.ativa(i);
                const ab = i === aberta ? abre : 0;
                // a aberta vai e volta de um lugar da curva dentro da parte visível: rolando com ela aberta, a faixa anda,
                // e o lugar dela podia ir para trás da câmera (a conta da passagem da curva ao plano dividia por quase zero
                // e a capa virava uma cunha pela tela inteira); se o lugar de verdade já saiu da tela, ela some ao fechar
                const angulo = theta[i] + desloca;
                const naCurva = i === aberta ? Math.max(-ANGULO_DA_ABERTA, Math.min(ANGULO_DA_ABERTA, angulo)) : angulo;
                const apagada = i === aberta ? 0 : Math.max(apaga[i], aberta >= 0 ? abre : 0);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, agua.textura(i));
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texturas[i].tex);
                gl.uniform1f(u.uTheta, naCurva);
                const visivel = i === aberta ? 1 - suave(ramp(Math.abs(angulo), ANGULO_DA_ABERTA, ANGULO_DA_ABERTA + 0.4)) : 1;
                gl.uniform1f(u.uVisivel, visivel);
                gl.uniform1f(u.uDelta, delta[i]);
                gl.uniform1f(u.uR, R);
                gl.uniform1f(u.uH, h);
                gl.uniform1f(u.uY, capa.y * G.hb);
                gl.uniform1f(u.uRelevo, RELEVO * h);
                gl.uniform1f(u.uTemAgua, comAgua ? 1 : 0);
                gl.uniform1f(u.uAbre, ab);
                gl.uniform2f(u.uCapa, R * delta[i] + (P.larg * escala - R * delta[i]) * ab, h + (P.alt * escala - h) * ab);
                gl.uniform1f(u.uAspecto, texturas[i].aspecto);
                gl.uniform1f(u.uApaga, apagada);
                // desfoca também a aberta que volta para um lugar fora da tela, junto com o sumiço
                gl.uniform1f(u.uDesfoque, Math.max(apagada * 3.2, (1 - visivel) * (1 - ab) * 5));
                if (comAgua) {
                    gl.bindVertexArray(malha.grade);
                    gl.drawElements(gl.TRIANGLES, malha.nGrade, gl.UNSIGNED_SHORT, 0);
                } else {
                    gl.bindVertexArray(malha.tira);
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, (SEGMENTOS + 1) * 2);
                }
            }
            gl.bindVertexArray(null);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, null);
        });
        return () => {
            vivo = false;
            imagens.forEach(img => (img.onload = null));
            desligar();
            obs.disconnect();
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('pointerover', mover);
            window.removeEventListener('wheel', mover);
            document.documentElement.removeEventListener('pointerleave', sair);
            c.removeEventListener('pointerdown', apertar);
            window.removeEventListener('pointermove', arrastar);
            window.removeEventListener('pointerup', soltar);
            window.removeEventListener('pointercancel', cancelar);
            window.removeEventListener('keydown', tecla);
            agua.destruir();
            texturas.forEach(t => gl.deleteTexture(t.tex));
            gl.deleteVertexArray(malha.tira);
            gl.deleteVertexArray(malha.grade);
            malha.buffers.forEach(b => gl.deleteBuffer(b));
            gl.deleteProgram(prog);
        };
    }, [rotuloDoCursor, rotuloDeFechar, rotuloDeArrastar]);

    // a janela do "Mais projetos": as capas passando enquanto o mouse está em cima
    const [janela, setJanela] = useState(-1);
    const passando = janela >= 0;
    useEffect(() => {
        if (!passando) return;
        const id = window.setInterval(() => setJanela(j => (j + 1) % N), 900);
        return () => window.clearInterval(id);
    }, [passando]);

    return (
        <section ref={raiz} id="galeria" data-tinta={COR_DA_ABERTURA.tinta} className="fa-galeria" style={{ height: '420svh' }}>
            <div className="fa-galeria-palco">
                <div ref={grupo} className="fa-galeria-grupo" style={{ opacity: 0 }} aria-hidden>
                    <canvas ref={tela} className="fa-curva-tela" />
                </div>
                {/* a legenda da capa ativa, em modo diferença (fora da troca de idioma pelo desfoque: ela já entra e sai pelo
                    desfoque, e a troca deixava as treze visíveis ao mesmo tempo) */}
                <div className="fa-curva-legendas" aria-live="polite">
                    {T.itens.map((it, i) => (
                        <p key={it.nome} className="fa-curva-legenda" data-ativa={i === ativa ? '' : undefined}>
                            <span className="fa-curva-nome">{it.nome}</span>
                            <span className="fa-curva-meta">
                                {it.tipo} · {it.ano}
                            </span>
                            <span className="fa-curva-linha">{it.texto}</span>
                        </p>
                    ))}
                </div>
                <div ref={mais} className="fa-curva-mais" style={{ opacity: 0 }}>
                    <a
                        href="#galeria"
                        data-troca
                        data-cursor={T.emBreve}
                        className="fa-curva-mais-link"
                        onClick={e => e.preventDefault()}
                        onMouseEnter={() => setJanela(0)}
                        onMouseLeave={() => setJanela(-1)}
                    >
                        <span className="fa-sublinha">{T.mais[0]}</span>
                        <span className="fa-curva-mais-janela" data-aberta={passando ? '' : undefined} aria-hidden>
                            {CAPAS.map((capa, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={i} src={capa.src} alt="" style={{ opacity: i === Math.max(0, janela) ? 1 : 0 }} />
                            ))}
                        </span>
                        <span className="fa-sublinha">{T.mais[1]}</span>
                    </a>
                </div>
            </div>
        </section>
    );
}
