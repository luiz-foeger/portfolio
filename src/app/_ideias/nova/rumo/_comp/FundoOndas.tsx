'use client';

// o fundo da abertura (o segredo e o hero), escolhido em 24/10 entre o anel, o nó e as ondas (os outros dois estão em
// C:\pessoal\ideias\rumo-visual\fundos-de-luz): ondas de luz discretas, no navy e numa rampa do azul ao turquesa. O
// grão é o chiado da página inteira (_comp/GraoVivo.tsx).
// As ondas são camadas em profundidade, como a superfície do mar vista de pé: a da frente fica no pé da tela, grossa e
// mais desfocada, e as de trás sobem para o horizonte, finas e apagadas. Cada uma ondula no seu tempo; o mouse as
// desloca em paralaxe (as da frente andam mais) e a rolagem agita a água (as ondas andam mais depressa enquanto a
// página corre). Ao rolar para baixo não é a tela que sobe: a câmera mergulha, descendo e avançando, e as ondas passam
// por ela, as da frente primeiro e mais depressa, ficando por cima quando a câmera passa da superfície; o navy clareia
// e entram feixes de luz fracos vindos de cima, como debaixo d'água; quando o ato da escala começa por cima delas, as
// ondas e os feixes desfocam, para ficarem só de fundo. Rolando para cima do hero (o segredo), a
// câmera sobe e recua, e as ondas se afastam para o horizonte. Debaixo d'água o fundo segue o ato da escala inteiro,
// até a haste cobrir a tela de creme; só aí a camada sai (por baixo do creme, sem aparecer) e o fundo de cores das
// seções continua. O desenho é um shader WebGL2 na resolução da tela (a meia resolução as ondas finas serrilhavam),
// preso ao laço da página.
import { useEffect, useRef } from 'react';
import { aCadaQuadro, geo, type Quadro } from '../_fa/laco';
import { ramp } from '../_fa/movimento';
import { COR_DA_ABERTURA, luzDoAto } from '../_lib/rumo';

// a rolagem do hero, em alturas de tela (o texto sai até 0,4, o SEGURA do Hero.tsx, e o ato vem depois): o mergulho vai
// de MERGULHO[0] a MERGULHO[1] e a subida (no segredo, rolagem negativa) vai até SUBIDA. COBRE é onde o creme fecha a
// tela: o SEGURA (40) e o ATO (360) do Hero.tsx, em svh, com o fim do mergulho na haste (0,97 do ato, o
// LETRA.mergulha de Escala.tsx)
const MERGULHO = [0.02, 1.5];
// o desfoque das ondas como fundo do ato: de DESFOCA[0] (o ato começa em 0,4) a DESFOCA[1]
const DESFOCA = [0.4, 1.4];
const SUBIDA = 0.8;
const COBRE = (40 + 0.97 * 360) / 100;
// a agitação: a velocidade da rolagem (px por quadro do Lenis) que agita tudo, e quanto as ondas aceleram com ela
const AGITA = { cheia: 40, acelera: 3.5 };

// o mouse em fração da tela (y para baixo)
const ponteiro = { x: 0.5, y: 0.5, mexeu: false };

// as ondas: a distância de cada uma até a câmera, a altura delas (abaixo do olho) e o horizonte em repouso; os mesmos no
// shader e na conta do barquinho do rodapé (alturaDaOnda, abaixo), para ele boiar exatamente na linha que se vê
export const ONDAS = { z: [1.0, 1.35, 1.8, 2.4, 3.2, 4.3, 5.8], altura: -0.45, horizonte: -0.13 };
const glsl = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

// a água simulada do barquinho do rodapé (_lib/agua2d.ts, 27/10): a altura da superfície (unidades do mundo, para cima)
// numa grade nx × nz que começa em (x0, z0), com células hx × hz, e a altura do plano da água perto do barco (planoY,
// para a luz da superfície). O barquinho preenche a aguaDoRodape a cada quadro (a versão sobe quando muda) e as ondas do
// rodapé a desenham: cada linha se desloca com a água na profundidade dela, e entre as linhas a superfície acende onde
// a água se inclina
export type AguaDoRodape = { dados: Float32Array | null; nx: number; nz: number; x0: number; z0: number; hx: number; hz: number; planoY: number; versao: number };
export const aguaDoRodape: AguaDoRodape = { dados: null, nx: 0, nz: 0, x0: 0, z0: 0, hx: 1, hz: 1, planoY: -0.5, versao: 0 };

// as ondas no último quadro desenhado de cada cena: o que o shader recebeu, para a mesma conta fora dele
export type OndasNoQuadro = { merg: number; desf: number; tempo: number; mx: number; my: number; agita: number; larg: number };
export const ondasNoQuadro = new Map<CenaDasOndas, OndasNoQuadro>();

const VERTICE = `#version 300 es
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// as unidades: o quadro 16:9 em cover, em alturas desse quadro a partir do centro (y para cima). Cada
// onda é uma linha na altura ALTURA (abaixo do olho), a uma distância Z[i] da câmera; na tela ela fica em
// (altura - câmera) / distância, e a grossura, a cortina de luz acima dela e o paralaxe crescem com 1 / distância.
// uMerg vai de -1 (a câmera subiu, no segredo) a 1 (mergulhou)
const FRAGMENTO = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform float uMerg;
// o quanto o azul de debaixo d'água já clareou no ato (0 a 1; só na cena do hero)
uniform float uClareia;
uniform float uAgita;
uniform float uDesf;
uniform float uLarg;
uniform vec2 uMouse;
uniform sampler2D uAgua;
uniform float uAguaLiga;
uniform vec4 uAguaGrade;
uniform vec2 uAguaN;
uniform vec2 uAguaCelula;
uniform float uAguaPlano;
out vec4 cor;
const vec3 FUNDO = vec3(0.0078, 0.0471, 0.1765);
const vec3 R0 = vec3(0.0784, 0.2784, 0.4745);
const vec3 R1 = vec3(0.1294, 0.5725, 0.5882);
const vec3 R2 = vec3(0.3059, 0.7882, 0.6745);
const vec3 R3 = vec3(0.7098, 0.8706, 0.7216);
// debaixo d'água o mesmo navy, mais claro (#0D2259), que no ato clareia um passo a cada verbo até AGUA_CLARA (70% do
// caminho até o azul da rampa, R0)
const vec3 AGUA = vec3(0.051, 0.1333, 0.349);
const vec3 AGUA_CLARA = vec3(0.0702, 0.2349, 0.4368);
const float Z[7] = float[7](${ONDAS.z.map(glsl).join(', ')});
const float ALTURA = ${glsl(ONDAS.altura)};
// o horizonte em repouso fica abaixo do meio, para as ondas de trás não passarem atrás da escada; no mergulho ele volta
// ao meio
const float HORIZONTE = ${glsl(ONDAS.horizonte)};

// a água simulada do barquinho (só no rodapé): a altura (unidades do mundo, para cima) no ponto (X, Z) da superfície,
// com o filtro linear da textura; fora da grade (e no hero), zero
float agua(vec2 xz) {
    if (uAguaLiga < 0.5) return 0.0;
    vec2 g = (xz - uAguaGrade.xy) * uAguaGrade.zw;
    if (g.x < 0.0 || g.y < 0.0 || g.x > uAguaN.x - 1.0 || g.y > uAguaN.y - 1.0) return 0.0;
    return texture(uAgua, (g + 0.5) / uAguaN).r;
}

// a rampa da bolha até o turquesa claro (o núcleo verde-claro ficou de fora, para ser discreto), com o contorno escuro
// mais leve
vec3 pintar(float f, float sombra, float agua) {
    vec3 c = mix(FUNDO, mix(AGUA, AGUA_CLARA, uClareia), agua);
    c *= 1.0 - 0.15 * smoothstep(0.02, 0.1, f) * (1.0 - smoothstep(0.1, 0.24, f));
    c = mix(c, R0, 0.3 * sombra * (1.0 - smoothstep(0.08, 0.25, f)));
    c = mix(c, R0, smoothstep(0.1, 0.3, f));
    c = mix(c, R1, smoothstep(0.3, 0.55, f));
    c = mix(c, R2, smoothstep(0.55, 0.8, f));
    c = mix(c, R3, 0.5 * smoothstep(0.8, 1.0, f));
    return c;
}

void main() {
    float k = max(uRes.x / 1920.0, uRes.y / 1080.0);
    vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / (k * 1080.0);
    float t = uT;
    float desce = max(uMerg, 0.0), sobe = min(uMerg, 0.0);
    // a câmera: no mergulho desce (passa da superfície perto de 0,58) e avança; na subida, sobe e recua
    float camY = -0.78 * desce - 0.3 * sobe;
    float camZ = 2.4 * desce + 0.9 * sobe;
    float horiz = HORIZONTE * (1.0 - desce) + 0.1 * sobe;
    // a água agitada pela rolagem: as ondas ficam um pouco mais altas
    float amp = 1.0 + 0.6 * uAgita;
    float s = 0.0;
    // entre as linhas, a superfície em volta do barquinho: o ponto do plano da água sob este pixel (abaixo do
    // horizonte), e onde a água se inclina ela reflete a luz: o anel de uma batida em perspectiva, os do balanço
    if (uAguaLiga > 0.5 && v.y < horiz - 0.002) {
        float dp = (uAguaPlano - camY + uMouse.y * 0.03) / (v.y - horiz);
        if (dp > 0.12) {
            vec2 xz = vec2((v.x * dp - uMouse.x * 0.05) / uLarg, dp + camZ);
            vec2 cx = vec2(uAguaCelula.x, 0.0), cz = vec2(0.0, uAguaCelula.y);
            float ix = (agua(xz + cx) - agua(xz - cx)) / (2.0 * uAguaCelula.x);
            float iz = (agua(xz + cz) - agua(xz - cz)) / (2.0 * uAguaCelula.y);
            // vista assim de lado, a água inclinada para o horizonte reflete mais luz e a inclinada para quem olha, menos;
            // os lados dos anéis (inclinados de lado) quase não mudam o reflexo: o que aparece são os arcos da frente e de
            // trás
            float reflexo = max(-iz, 0.0) + 0.4 * max(iz, 0.0) + 0.12 * abs(ix);
            s += 0.8 * reflexo * exp(-0.25 * (dp - 1.0));
        }
    }
    for (int i = 0; i < 7; i++) {
        float fi = float(i);
        float d = Z[i] - camZ;
        if (d < 0.12) continue;
        float p = 1.0 / d;
        // a onda some ao passar pela câmera e apaga com a distância
        float some = smoothstep(0.12, 0.55, d) * exp(-0.22 * (d - 1.0));
        // o desfoque: quanto mais perto, mais larga e mais fraca
        float desf = 1.0 + 1.8 * smoothstep(1.1, 0.3, d);
        float xs = v.x - uMouse.x * 0.05 * p;
        float xw = xs * d / uLarg;
        float y = ALTURA - 0.015 * fi
            + amp * 0.035 * sin(xw * 1.3 + t * (0.09 + 0.02 * fi) + fi * 2.1)
            + amp * 0.02 * (1.0 - 0.7 * uDesf) * sin(xw * 2.9 - t * 0.13 + fi * 4.3);
        float ys = horiz + (y - camY) * p + uMouse.y * 0.03 * p;
        // a água do barquinho na profundidade desta linha a desloca e a acende onde ela se mexe
        float hf = agua(vec2(xw, Z[i]));
        float inclina = uAguaLiga > 0.5 ? (agua(vec2(xw + uAguaCelula.x, Z[i])) - hf) / uAguaCelula.x : 0.0;
        ys += hf * p;
        // no fundo do ato tudo alarga (o desfoque) e perde um pouco de força
        float borra = 1.0 + 2.2 * uDesf;
        float esp = (0.03 + 0.012 * sin(xw * 1.9 + t * 0.1 + fi)) * p * desf * borra;
        float dy = v.y - ys;
        float nucleo = exp(-dy * dy / (esp * esp) * 0.8);
        // a cortina de luz acima da onda começa macia (um degrau duro aqui era o serrilhado)
        float alto = (0.09 + 0.05 * (0.5 + 0.5 * sin(xw * 2.3 + t * 0.11 + fi * 1.3))) * p * desf * (1.0 + 1.2 * uDesf);
        float cortina = exp(-max(dy, 0.0) / alto) * smoothstep(-esp, 0.6 * esp, dy) * 0.55;
        float brilho = (0.6 + 0.4 * sin(xw * 0.9 - t * 0.08 + fi * 1.7)) * (1.0 + 40.0 * abs(hf * p) + 1.2 * abs(inclina));
        s += (0.6 * nucleo + cortina) * brilho * some / desf / (1.0 + 0.6 * uDesf);
    }
    // debaixo d'água: feixes de luz fracos que descem de cima e balançam devagar
    float agua = smoothstep(0.5, 0.85, desce);
    if (agua > 0.0) {
        vec2 fonte = vec2(0.15 * sin(t * 0.07), 0.95);
        vec2 r = v - fonte;
        float ang = atan(r.x, -r.y);
        float feixes = pow(0.5 + 0.5 * sin(ang * 11.0 + t * 0.12 + 1.6 * sin(ang * 3.0 - t * 0.09)), mix(5.0, 2.0, uDesf));
        feixes *= smoothstep(-0.55, 0.45, v.y) * smoothstep(0.5, -0.05, abs(ang));
        s += agua * (0.32 - 0.1 * uDesf) * feixes;
    }
    float f = 1.0 - exp(-0.85 * s);
    float sombra = exp(-pow(length((v - vec2(0.0, -0.45)) / vec2(0.5, 0.18)), 2.0)) * (1.0 - desce);
    // um ruído de meio tom por pixel desfaz os degraus do degradê escuro (aparecem nas telas de celular)
    float ruido = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    cor = vec4(pintar(f, sombra, agua) + ruido / 255.0, 1.0);
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
    gl.attachShader(p, sombreador(gl.VERTEX_SHADER, VERTICE));
    gl.attachShader(p, sombreador(gl.FRAGMENT_SHADER, FRAGMENTO));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
    return p;
}

const suave = (x: number) => x * x * (3 - 2 * x);

// a cena das ondas num quadro: o mergulho (-1 a 1, como no shader) e o desfoque; null para não desenhar
export type CenaDasOndas = (q: Quadro) => { merg: number; desf: number } | null;

// a cena do hero: o mergulho e a subida pela rolagem a partir do topo dele, até ele passar
const cenaDoHero: CenaDasOndas = q => {
    const s = geo.s.hero;
    if (s.h && q.y > s.top + s.h) return null;
    // a rolagem a partir do topo do hero, em alturas de tela (negativa no segredo)
    const r = (q.y - s.top) / geo.vh;
    const merg = r >= 0 ? suave(ramp(r, MERGULHO[0], MERGULHO[1])) : -suave(ramp(-r, 0, SUBIDA));
    return { merg, desf: suave(ramp(r, DESFOCA[0], DESFOCA[1])) };
};

// a cena do rodapé (26/10), "voltar à tona": o hero mergulha; no fim da página a câmera sobe. p vai de 0 (o topo do
// rodapé no pé da tela) a 1 (o topo dele no topo da tela); o mergulho vai de 1 (debaixo d'água, com os feixes de luz) a
// −0,25 (a câmera um pouco acima da superfície, recuando, o mar calmo no horizonte), e o desfoque de 0,5 a 0. Antes de
// o rodapé chegar, nada é desenhado
const MERGULHO_DO_RODAPE = -0.25;
export const cenaDoRodape: CenaDasOndas = q => {
    const s = geo.s.footer;
    if (!s.h || q.y + geo.vh < s.top) return null;
    const p = suave(ramp(q.y + geo.vh - s.top, 0, Math.min(s.h, geo.vh)));
    return { merg: 1 - (1 - MERGULHO_DO_RODAPE) * p, desf: 0.5 * (1 - p) };
};

// px da tela por unidade do quadro (o 16:9 em cover, como no shader)
export const unidadeDasOndas = (W: number, H: number) => Math.max(W / 1920, H / 1080) * 1080;

// a câmera no mergulho merg, como no shader: a altura, o avanço e o horizonte
const camera = (merg: number) => {
    const desce = Math.max(merg, 0), sobe = Math.min(merg, 0);
    return { camY: -0.78 * desce - 0.3 * sobe, camZ: 2.4 * desce + 0.9 * sobe, horiz: ONDAS.horizonte * (1 - desce) + 0.1 * sobe };
};

// a linha da onda i no ponto x (px) da tela W × H, sem a água simulada: a altura dela no mundo (unidades, para cima) e
// a distância à câmera, com a mesma conta do shader e o que ele recebeu no último quadro. A onda que passou da câmera
// o shader não desenha (d < 0,12); aqui ela fica presa nesse limite, sem dividir por zero
function linha(q: OndasNoQuadro, i: number, x: number, W: number, H: number) {
    const vx = (x - W / 2) / unidadeDasOndas(W, H);
    const { camZ } = camera(q.merg);
    const amp = 1 + 0.6 * q.agita;
    const d = Math.max(ONDAS.z[i] - camZ, 0.12);
    const xw = ((vx - (q.mx * 0.05) / d) * d) / q.larg;
    const y =
        ONDAS.altura -
        0.015 * i +
        amp * 0.035 * Math.sin(xw * 1.3 + q.tempo * (0.09 + 0.02 * i) + i * 2.1) +
        amp * 0.02 * (1 - 0.7 * q.desf) * Math.sin(xw * 2.9 - q.tempo * 0.13 + i * 4.3);
    return { y, d };
}

export const linhaNoMundo = (q: OndasNoQuadro, i: number, x: number, W: number, H: number) => linha(q, i, x, W, H).y;

// a altura na tela (px, de cima) da linha da onda i no ponto x (px) da tela W × H, sem a água simulada (o barquinho
// soma a dele)
export function alturaDaOnda(q: OndasNoQuadro, i: number, x: number, W: number, H: number) {
    const { camY, horiz } = camera(q.merg);
    const { y, d } = linha(q, i, x, W, H);
    return H / 2 - (horiz + (y - camY) / d + (q.my * 0.03) / d) * unidadeDasOndas(W, H);
}

// a vista da linha da onda i, para o barquinho (_lib/barco-fisica.ts): o meio da tela e a unidade do quadro (px), a
// largura que encolhe nas telas estreitas, o mouse, a profundidade Z da linha e a distância dela à câmera; em px por
// unidade do mundo, a largura (sx) e a altura (sy) ali e o quanto a superfície sobe na tela por unidade de
// profundidade (prof); e o ângulo em que a câmera vê a água ali (rad, de cima). Sem q, a do rodapé parado e o mouse no
// meio (para o tamanho da grade da água)
export function vistaDaLinha(q: OndasNoQuadro | null, i: number, W: number, H: number) {
    const unidade = unidadeDasOndas(W, H);
    const larg = q ? q.larg : Math.max(0.35, Math.min(1, (0.5 * W) / unidade / 0.62));
    const { camY, camZ } = camera(q ? q.merg : MERGULHO_DO_RODAPE);
    const Zb = ONDAS.z[i], d = Math.max(Zb - camZ, 0.12);
    const acima = Math.max(0.02, camY - (ONDAS.altura - 0.015 * i));
    return {
        meio: W / 2,
        unidade,
        larg,
        mx: q ? q.mx : 0,
        Zb,
        d,
        sx: (unidade * larg) / d,
        sy: unidade / d,
        prof: (acima / (d * d)) * unidade,
        elevacao: Math.atan2(acima, d),
    };
}

// a linha da onda i em repouso (sem as ondulações e sem o mouse), com o rodapé parado: o lugar médio dela na tela,
// para escolher a onda do barquinho sem depender da fase das ondas
export function repousoDaOnda(i: number, W: number, H: number) {
    const { camY, camZ, horiz } = camera(MERGULHO_DO_RODAPE);
    const d = Math.max(ONDAS.z[i] - camZ, 0.12);
    return H / 2 - (horiz + (ONDAS.altura - 0.015 * i - camY) / d) * unidadeDasOndas(W, H);
}

// o canvas das ondas, do tamanho do pai; a cena diz, a cada quadro, onde a câmera está (o rodapé usa a cenaDoRodape,
// na camada de baixo do fundo, em _comp/Fundo.tsx, com a água simulada do barquinho). O que o shader recebe em cada
// quadro fica em ondasNoQuadro, para a conta de fora (alturaDaOnda)
export function Ondas({ cena = cenaDoHero, agua }: { cena?: CenaDasOndas; agua?: AguaDoRodape }) {
    const tela = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const c = tela.current;
        const gl = c?.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false });
        if (!c || !gl) return;
        const prog = compilar(gl);
        const u = Object.fromEntries(
            ['uRes', 'uT', 'uMerg', 'uClareia', 'uAgita', 'uDesf', 'uLarg', 'uMouse', 'uAgua', 'uAguaLiga', 'uAguaGrade', 'uAguaN', 'uAguaCelula', 'uAguaPlano'].map(n => [
                n,
                gl.getUniformLocation(prog, n),
            ]),
        );
        // a textura da água simulada (meia precisão, que filtra linear no WebGL2), só com água
        const texAgua = agua ? gl.createTexture() : null;
        let versaoDaAgua = -1, nx = 0, nz = 0;
        if (texAgua) {
            gl.bindTexture(gl.TEXTURE_2D, texAgua);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        let w = 1, h = 1;
        const medir = () => {
            const k = Math.min(window.devicePixelRatio || 1, 1.5);
            w = Math.max(1, Math.round(c.clientWidth * k));
            h = Math.max(1, Math.round(c.clientHeight * k));
            if (c.width !== w || c.height !== h) {
                c.width = w;
                c.height = h;
            }
            gl.viewport(0, 0, w, h);
        };
        medir();
        const obs = new ResizeObserver(medir);
        obs.observe(c);
        // o mouse com ~0,8 s de atraso; sem mouse (no toque ou antes de mexer), parado no meio. O tempo das ondas anda
        // mais depressa com a agitação, que segue a velocidade da rolagem com ~0,5 s de atraso
        let mx = 0, my = 0, agita = 0, tempo = 0;
        const desligar = aCadaQuadro((q: Quadro) => {
            const a = 1 - Math.exp(-q.dt / 0.8);
            mx += ((ponteiro.mexeu ? ponteiro.x - 0.5 : 0) - mx) * a;
            my += ((ponteiro.mexeu ? ponteiro.y - 0.5 : 0) - my) * a;
            agita += (Math.min(1, Math.abs(q.vel) / AGITA.cheia) - agita) * (1 - Math.exp(-q.dt / 0.5));
            tempo += q.dt * (1 + AGITA.acelera * agita);
            const quadro = cena(q);
            if (!quadro) return;
            // nas telas estreitas o quadro em cover mostra só o meio: as ondas encurtam para caber mais delas
            const unidade = Math.max(w / 1920, h / 1080) * 1080;
            const cabe = Math.min(1, (0.5 * w) / unidade / 0.62);
            gl.useProgram(prog);
            gl.uniform2f(u.uRes, w, h);
            gl.uniform1f(u.uT, tempo);
            gl.uniform1f(u.uMerg, quadro.merg);
            gl.uniform1f(u.uClareia, cena === cenaDoHero ? luzDoAto.clareia : 0);
            gl.uniform1f(u.uAgita, agita);
            gl.uniform1f(u.uDesf, quadro.desf);
            const larg = Math.max(0.35, cabe);
            gl.uniform1f(u.uLarg, larg);
            gl.uniform2f(u.uMouse, mx, my);
            // a água simulada: sobe para a textura quando muda
            let liga = 0;
            if (texAgua && agua?.dados && agua.nx >= 2 && agua.nz >= 2) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texAgua);
                if (agua.versao !== versaoDaAgua) {
                    versaoDaAgua = agua.versao;
                    if (agua.nx !== nx || agua.nz !== nz) {
                        nx = agua.nx;
                        nz = agua.nz;
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, nx, nz, 0, gl.RED, gl.FLOAT, agua.dados);
                    } else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, nx, nz, gl.RED, gl.FLOAT, agua.dados);
                }
                liga = 1;
                gl.uniform1i(u.uAgua, 0);
                gl.uniform4f(u.uAguaGrade, agua.x0, agua.z0, 1 / agua.hx, 1 / agua.hz);
                gl.uniform2f(u.uAguaN, agua.nx, agua.nz);
                gl.uniform2f(u.uAguaCelula, agua.hx, agua.hz);
                gl.uniform1f(u.uAguaPlano, agua.planoY);
            }
            gl.uniform1f(u.uAguaLiga, liga);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            ondasNoQuadro.set(cena, { merg: quadro.merg, desf: quadro.desf, tempo, mx, my, agita, larg });
        });
        return () => {
            desligar();
            obs.disconnect();
            if (texAgua) gl.deleteTexture(texAgua);
            gl.deleteProgram(prog);
            ondasNoQuadro.delete(cena);
        };
    }, [cena, agua]);
    return <canvas ref={tela} className="absolute inset-0 h-full w-full" />;
}

export default function FundoOndas() {
    const camada = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const mover = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            ponteiro.x = e.clientX / window.innerWidth;
            ponteiro.y = e.clientY / window.innerHeight;
            ponteiro.mexeu = true;
        };
        window.addEventListener('pointermove', mover, { passive: true });
        let visivel = true;
        const desligar = aCadaQuadro(({ y }) => {
            const s = geo.s.hero;
            const op = (y - s.top) / geo.vh < COBRE ? 1 : 0;
            const el = camada.current;
            if (!el) return;
            el.style.opacity = String(op);
            const v = op > 0.001;
            if (v !== visivel) {
                visivel = v;
                el.style.visibility = v ? 'visible' : 'hidden';
            }
        });
        return () => {
            desligar();
            window.removeEventListener('pointermove', mover);
        };
    }, []);
    return (
        <div className="fa-fundo" aria-hidden>
            <div ref={camada} className="fa-camada" style={{ background: COR_DA_ABERTURA.fundo }}>
                <Ondas />
            </div>
        </div>
    );
}
