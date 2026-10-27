// o desenho do barquinho de papel do rodapé (26/10), em WebGL2: o barco em 3D numa tela pequena que anda com ele (com
// antisserrilhado) e as gotas dos respingos numa tela do tamanho da janela.
// - O modelo: o barquinho de papel dobrado de sempre, em unidades do modelo (2 de comprimento, a proa em +x, y para
//   cima, z para quem olha): o casco em V (a quilha embaixo, as duas paredes abrindo até a borda, com as abas
//   triangulares das pontas subindo até a proa e a popa) e as duas folhas do meio, que descem dentro do casco
//   (separando os dois bolsos) e sobem em vela, fechadas em cima. Cada painel é subdividido e levemente abaulado (papel
//   dobrado não fica liso), com as normais da superfície curva; as dobras e as bordas ficam nas arestas dos painéis.
// - O papel: a luz da lua do alto à esquerda, a luz turquesa que sobe da água, o ambiente navy, a luz que atravessa o
//   papel fino (o lado de trás iluminado clareia a frente), o lado de dentro mais escuro no fundo dos bolsos, as dobras
//   em linhas finas escuras e as bordas de corte claras, uma fibra leve de ruído. Molhado (até onde a física diz), o
//   papel escurece, acinzenta, deixa passar mais luz e ganha um brilho úmido. Abaixo da superfície (16 pontos da água
//   sob o barco) fica tingido de água e mais apagado, até sumir de vez a ~1 meio comprimento de fundo (é por ali que ele
//   surge e some), com o menisco claro na linha d'água.
// - O reflexo: o mesmo barco espelhado no plano da água sob ele, só abaixo da superfície, curto, escuro e quebrado em
//   faixas pela ondulação.
// - As gotas: um quadrado por gota (instâncias), esticado na direção do movimento (o rastro de meio quadro de câmera):
//   a gota com o miolo claro e a borda turquesa, a névoa, a espuma achatada, deitada na superfície, e a bolha, um anel
//   fino com brilho.
// A posição na tela: o modelo é girado (rolagem em x, guinada em y, arfagem em z), visto um pouco de cima (a elevação)
// e levado para a tela em px CSS, com y para baixo e z para quem olha; o ponto (0, âncora, 0) do modelo cai no ponto
// (x, y) da física. A água vista de cima: um ponto mais perto de quem olha (z do mundo) tem a superfície mais abaixo na
// tela, e o shader compara cada ponto do barco com a superfície na profundidade dele.

// os pontos que dão o contorno (para a área de pegar)
export const CONTORNO: V3[] = [
    [-0.55, 0, 0],
    [0.55, 0, 0],
    [1, 0.62, 0],
    [-1, 0.62, 0],
    [0, 0.52, 0.42],
    [0, 0.52, -0.42],
    [0, 1.28, 0],
];

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const ponto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normaliza = (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
};

// a malha: por vértice a posição, a normal de fora, a distância às arestas do painel (as baricêntricas, com 1 nas
// arestas que não aparecem), o tipo de cada aresta (0 nenhuma, 1 dobra, 2 borda de corte) e a parte (0 casco, 1 folhas)
const POR_VERTICE = 13;

function malha() {
    const dados: number[] = [];
    // um painel triangular subdividido em N: a posição pelas baricêntricas (b0, b1, b2), a normal tirada da superfície
    // (para o lado de fora), os tipos das arestas opostas a cada canto e a parte
    const painel = (pos: (b0: number, b1: number, b2: number) => V3, fora: (n: V3) => boolean, tipos: V3, parte: number, N: number) => {
        const vertice = (i: number, j: number) => {
            const b1 = i / N, b2 = j / N, b0 = 1 - b1 - b2, e = 1e-3;
            const p = pos(b0, b1, b2);
            let n = normaliza(cruz(sub(pos(b0 - e, b1 + e, b2), p), sub(pos(b0 - e, b1, b2 + e), p)));
            if (!fora(n)) n = [-n[0], -n[1], -n[2]];
            dados.push(...p, ...n, tipos[0] ? b0 : 1, tipos[1] ? b1 : 1, tipos[2] ? b2 : 1, ...tipos, parte);
        };
        for (let i = 0; i < N; i++)
            for (let j = 0; j < N - i; j++) {
                vertice(i, j);
                vertice(i + 1, j);
                vertice(i, j + 1);
                if (i + j < N - 1) {
                    vertice(i + 1, j);
                    vertice(i + 1, j + 1);
                    vertice(i, j + 1);
                }
            }
    };

    // o casco: em cada lado, a aba da popa, o meio e a aba da proa, saindo do ponto mais largo da borda (M); abaulados
    // para fora, retos nas arestas (as dobras continuam vincadas)
    const K0: V3 = [-0.55, 0, 0], K1: V3 = [0.55, 0, 0], P: V3 = [1, 0.62, 0], R: V3 = [-1, 0.62, 0];
    const dentro: V3 = [0, 0.45, 0];
    for (const lado of [1, -1]) {
        const M: V3 = [0, 0.52, 0.42 * lado];
        const tri = (a: V3, b: V3, c: V3, tipos: V3, abaula: number) => {
            let plano = normaliza(cruz(sub(b, a), sub(c, a)));
            const meio: V3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
            if (ponto(plano, sub(meio, dentro)) < 0) plano = [-plano[0], -plano[1], -plano[2]];
            painel(
                (b0, b1, b2) => {
                    const k = abaula * 27 * b0 * b1 * b2;
                    return [0, 1, 2].map(d => a[d] * b0 + b[d] * b1 + c[d] * b2 + plano[d] * k) as V3;
                },
                n => ponto(n, plano) > 0,
                tipos,
                0,
                6,
            );
        };
        // as arestas opostas a cada canto: a da popa (dobra das pontas, vinco, borda), a do meio (quilha, vincos) e a
        // da proa (dobra das pontas, borda, vinco)
        tri(M, R, K0, [1, 1, 2], 0.018);
        tri(M, K0, K1, [1, 1, 1], 0.025);
        tri(M, K1, P, [1, 2, 1], 0.018);
    }

    // as folhas do meio: o contorno de lado (a parte de baixo dentro do casco, a vela em cima) em leque a partir de um
    // ponto de dentro; separadas no pé e juntas na ponta da vela, sem passar das paredes
    const contorno: [number, number][] = [
        [-0.42, 0.04],
        [0.42, 0.04],
        [0.84, 0.5],
        [0.4, 0.53],
        [0, 1.28],
        [-0.4, 0.53],
        [-0.84, 0.5],
    ];
    // a aresta que sai de cada ponto: escondida dentro do casco, borda no alto dos bolsos e dobra nos lados da vela
    const tiposDoContorno = [0, 0, 2, 1, 1, 2, 0];
    const centro: [number, number] = [0, 0.32];
    const afasta = (x: number, y: number) => 0.004 + 0.045 * (1 - y / 1.28) * Math.min(1, y / 0.22) * Math.max(0, 1 - (x / 0.9) ** 4);
    for (const lado of [1, -1])
        contorno.forEach((a, k) => {
            const b = contorno[(k + 1) % contorno.length];
            painel(
                (b0, b1, b2) => {
                    const x = centro[0] * b0 + a[0] * b1 + b[0] * b2, y = centro[1] * b0 + a[1] * b1 + b[1] * b2;
                    return [x, y, lado * afasta(x, y)];
                },
                n => n[2] * lado > 0,
                [tiposDoContorno[k], 0, 0],
                1,
                4,
            );
        });
    return new Float32Array(dados);
}

type M3 = number[];
// linhas × colunas
const m3 = (a: M3, b: M3) => {
    const r = new Array(9).fill(0);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) r[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
    return r;
};
const vezes = (R: M3, p: V3): V3 => [R[0] * p[0] + R[1] * p[1] + R[2] * p[2], R[3] * p[0] + R[4] * p[1] + R[5] * p[2], R[6] * p[0] + R[7] * p[1] + R[8] * p[2]];
const rx = (t: number) => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)];
const ry = (t: number) => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)];
const rz = (t: number) => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];
const ESPELHO = [1, 0, 0, 0, -1, 0, 0, 0, 1];

// a posição do barco na tela: a matriz (coluna a coluna) do modelo para px CSS, só a rotação (para as normais), a conta
// da profundidade no mundo (z, para quem olha) e a de um ponto do modelo; o reflexo, espelhado no plano da água que
// passa na altura S0 da tela sob a âncora
export function matrizDoBarco(o: { x: number; y: number; escala: number; arfagem: number; guinada: number; rolagem: number; elevacao: number; ancora: number }) {
    const s = o.escala;
    // o barco no mundo (arfagem · guinada · rolagem) e a câmera (de cima, com y para baixo)
    const B = m3(rz(o.arfagem), m3(ry(o.guinada), rx(o.rolagem)));
    const camera = m3(ESPELHO, rx(o.elevacao));
    const montar = (R: M3, t: V3) => ({
        modelo: new Float32Array([R[0] * s, R[3] * s, R[6] * s, 0, R[1] * s, R[4] * s, R[7] * s, 0, R[2] * s, R[5] * s, R[8] * s, 0, t[0], t[1], t[2], 1]),
        giro: new Float32Array([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]),
    });
    const R = m3(camera, B);
    const ra = vezes(R, [0, o.ancora * s, 0]);
    const t: V3 = [o.x - ra[0], o.y - ra[1], -ra[2]];
    const profundo = new Float32Array([B[6] * s, B[7] * s, B[8] * s, -B[7] * s * o.ancora]);
    const aplicar = (p: V3): V3 => {
        const q = vezes(R, [p[0] * s, p[1] * s, p[2] * s]);
        return [q[0] + t[0], q[1] + t[1], q[2] + t[2]];
    };
    const reflexo = (S0: number) => {
        // a altura da água acima da âncora, no mundo; o ponto refletido fica na mesma distância do outro lado
        const v0 = (o.y - S0) / Math.cos(o.elevacao);
        const ba = vezes(B, [0, o.ancora * s, 0]);
        const cw = vezes(camera, [-ba[0], ba[1] + 2 * v0, -ba[2]]);
        return { ...montar(m3(camera, m3(ESPELHO, B)), [o.x + cw[0], o.y + cw[1], cw[2]]), profundo };
    };
    return { ...montar(R, t), profundo, aplicar, reflexo };
}

const SUPERFICIE = `uniform float uSup[16];
uniform vec2 uSupX;
float superficie(float x) {
    float t = clamp((x - uSupX.x) / max(1.0, uSupX.y - uSupX.x), 0.0, 1.0) * 15.0;
    int i = int(floor(t));
    int j = min(i + 1, 15);
    return mix(uSup[i], uSup[j], fract(t));
}`;

const VERT_BARCO = `#version 300 es
in vec3 aPos;
in vec3 aNormal;
in vec3 aBorda;
in vec3 aTipos;
in float aParte;
uniform mat4 uModelo;
uniform mat3 uGiro;
uniform vec4 uProfundo;
uniform vec2 uTela;
uniform vec2 uOrigem;
uniform float uReflexo;
uniform float uS0;
uniform float uTempo;
${SUPERFICIE}
out vec3 vNormal;
out vec3 vBorda;
flat out vec3 vTipos;
out vec3 vModelo;
out float vParte;
out vec2 vTela;
out float vZ;
void main() {
    vec4 p = uModelo * vec4(aPos, 1.0);
    if (uReflexo > 0.5) {
        // o reflexo acompanha a água sob cada ponto e tremula de lado com a ondulação
        p.y += superficie(p.x) - uS0;
        p.x += sin(p.y * 0.21 + uTempo * 4.0) * 1.2 * clamp((p.y - superficie(p.x)) / 20.0, 0.0, 1.0);
    }
    vTela = p.xy;
    vNormal = uGiro * aNormal;
    vBorda = aBorda;
    vTipos = aTipos;
    vModelo = aPos;
    vParte = aParte;
    vZ = dot(uProfundo.xyz, aPos) + uProfundo.w;
    gl_Position = vec4((p.x - uOrigem.x) / uTela.x * 2.0 - 1.0, 1.0 - (p.y - uOrigem.y) / uTela.y * 2.0, -p.z / 2000.0, 1.0);
}`;

const FRAG_BARCO = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vBorda;
flat in vec3 vTipos;
in vec3 vModelo;
in float vParte;
in vec2 vTela;
in float vZ;
uniform float uSenE;
uniform float uMolhado;
uniform float uReflexo;
uniform float uEscala;
uniform float uTempo;
${SUPERFICIE}
out vec4 cor;
float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float ruido(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
void main() {
    // a superfície na profundidade deste ponto (mais perto de quem olha, mais abaixo na tela); d > 0 abaixo dela
    float d = vTela.y - (superficie(vTela.x) + vZ * uSenE);
    if (uReflexo > 0.5 && d < 0.5) discard;
    vec3 n = normalize(vNormal);
    // vendo o lado de fora (a normal de fora vem para quem olha) ou o de dentro
    bool fora = n.z >= 0.0;
    if (!fora) n = -n;
    // a lua do alto à esquerda, quase de frente (o papel claro contra o mar escuro); a luz turquesa que sobe da água
    vec3 lua = normalize(vec3(-0.3, -0.45, 0.84));
    vec3 daAgua = normalize(vec3(0.1, 1.0, 0.3));
    vec3 papel = vec3(0.97, 0.95, 0.89) * (0.965 + 0.06 * ruido(vModelo * 18.0) + 0.02 * ruido(vModelo * 90.0));
    // molhado: o lado de fora do casco até a linha da física, com a borda irregular
    float irregular = (ruido(vModelo * 7.0) - 0.5) * 0.035;
    float molhado = vParte < 0.5 && fora ? 1.0 - smoothstep(uMolhado - 0.012, uMolhado + 0.012, vModelo.y + irregular) : 0.0;
    papel = mix(papel, papel * vec3(0.64, 0.69, 0.72), molhado);
    float frente = max(dot(n, lua), 0.0);
    float atras = max(dot(-n, lua), 0.0);
    float baixo = max(dot(n, daAgua), 0.0);
    vec3 luz = vec3(0.34, 0.38, 0.5) + vec3(1.0, 0.98, 0.94) * frente * 0.72 + vec3(0.2, 0.55, 0.55) * baixo * 0.3
        + vec3(1.0, 0.95, 0.85) * atras * (0.25 + 0.2 * molhado);
    vec3 c = papel * luz;
    // por dentro, mais escuro no fundo dos bolsos (e as folhas do meio, abaixo da borda)
    if (!fora && vParte < 0.5) c *= mix(0.36, 0.62, smoothstep(0.05, 0.5, vModelo.y));
    if (vParte > 0.5) c *= mix(0.42, 1.0, smoothstep(0.12, 0.56, vModelo.y));
    c += vec3(0.07, 0.09, 0.11) * pow(1.0 - abs(n.z), 3.0);
    c += molhado * 0.2 * pow(max(dot(n, normalize(lua + vec3(0.0, 0.0, 1.0))), 0.0), 24.0);
    // as arestas, em px da tela: as dobras escurecem e as bordas de corte clareiam
    vec3 px = vBorda / max(fwidth(vBorda), vec3(1e-5));
    for (int i = 0; i < 3; i++) {
        float t = vTipos[i];
        if (t < 0.5) continue;
        float linha = 1.0 - smoothstep(0.3, 1.3, px[i]);
        if (t < 1.5) c *= 1.0 - 0.28 * linha;
        else c += vec3(0.16, 0.16, 0.14) * linha;
    }
    float a;
    if (uReflexo > 0.5) {
        // o reflexo: tingido de água, curto e quebrado em faixas
        float faixas = pow(0.5 + 0.5 * sin(vTela.y * 0.8 + uTempo * 5.0 + 2.0 * sin(vTela.x * 0.05 + uTempo * 1.3)), 1.5);
        a = 0.26 * exp(-d / (0.22 * uEscala)) * faixas;
        c = mix(c * 0.8, vec3(0.1, 0.3, 0.4), 0.35);
    } else {
        // abaixo da água: tingido e mais apagado, cada vez mais com a profundidade, até sumir (de onde ele surge e para
        // onde afunda); na linha, o menisco claro
        float fundo = smoothstep(-0.5, 1.5, d);
        c = mix(c, vec3(0.05, 0.2, 0.3), (0.5 + 0.35 * (1.0 - exp(-max(d, 0.0) / (0.25 * uEscala)))) * fundo);
        c += vec3(0.5, 0.85, 0.85) * exp(-d * d / 1.4) * (fora ? 0.35 : 0.12);
        a = (1.0 - 0.45 * fundo) * (1.0 - smoothstep(0.3 * uEscala, 0.9 * uEscala, d));
    }
    cor = vec4(c * a, a);
}`;

const VERT_GOTA = `#version 300 es
in vec2 aCanto;
in vec2 aPos;
in vec2 aVel;
in float aTam;
in float aAlfa;
in float aTipo;
uniform vec2 uTela;
out vec2 vLocal;
out float vMeio;
out float vRaio;
out float vAlfa;
out float vTipo;
void main() {
    float vel = length(aVel);
    vec2 dir = vel > 1.0 ? aVel / vel : vec2(0.0, 1.0);
    // uma cápsula: o raio da gota e o rastro dela na direção do movimento (o que ela anda em meio quadro de câmera); a
    // espuma deita na superfície; a bolha é redonda. O quadrado tem 1,5 px a mais em volta, para o antisserrilhado
    float raio = aTam * 0.5 + 0.35;
    float meio = vel * 0.0045;
    if (aTipo > 2.5) {
        dir = vec2(0.0, 1.0);
        raio = aTam * 0.5 + 0.5;
        meio = 0.0;
    } else if (aTipo > 1.5) {
        dir = vec2(1.0, 0.0);
        raio = aTam * 0.42 + 0.3;
        meio = aTam * 0.45;
    }
    vec2 lado = vec2(-dir.y, dir.x);
    vLocal = vec2(aCanto.x * (raio + 1.5), aCanto.y * (meio + raio + 1.5));
    vec2 p = aPos + dir * vLocal.y + lado * vLocal.x;
    vMeio = meio;
    vRaio = raio;
    vAlfa = aAlfa;
    vTipo = aTipo;
    gl_Position = vec4(p.x / uTela.x * 2.0 - 1.0, 1.0 - p.y / uTela.y * 2.0, 0.0, 1.0);
}`;

const FRAG_GOTA = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vMeio;
in float vRaio;
in float vAlfa;
in float vTipo;
out vec4 cor;
void main() {
    // a distância à cápsula (px), com a borda antisserrilhada; o rastro apaga para trás da cabeça
    vec2 q = vec2(vLocal.x, max(abs(vLocal.y) - vMeio, 0.0));
    float d = length(q) - vRaio;
    float forma = clamp(0.5 - d / max(fwidth(d), 1e-3), 0.0, 1.0);
    float rastro = vMeio > 0.5 ? mix(0.4, 1.0, smoothstep(-vMeio, vMeio, vLocal.y)) : 1.0;
    float miolo = 1.0 - clamp(length(q) / max(vRaio, 0.5), 0.0, 1.0);
    vec3 c;
    float a;
    if (vTipo < 0.5) {
        // a gota: o miolo claro e a borda turquesa
        c = mix(vec3(0.45, 0.82, 0.8), vec3(0.95, 1.0, 0.98), smoothstep(0.0, 0.7, miolo));
        a = forma * rastro;
    } else if (vTipo < 1.5) {
        // a névoa, macia
        c = vec3(0.75, 0.93, 0.93);
        a = forma * miolo * rastro;
    } else if (vTipo < 2.5) {
        c = vec3(0.9, 0.97, 0.96);
        a = forma * (0.6 + 0.4 * miolo);
    } else {
        // a bolha: um anel fino e claro, quase vazio por dentro, com um brilho no alto à esquerda
        float anel = 1.0 - smoothstep(0.25, 0.9, abs(d + 0.45));
        float brilho = exp(-dot(vLocal + 0.35 * vRaio, vLocal + 0.35 * vRaio) / (0.09 * vRaio * vRaio + 0.2));
        c = vec3(0.8, 0.96, 1.0);
        a = max(anel * 0.85, brilho * 0.7) + 0.08 * forma;
    }
    a *= vAlfa;
    cor = vec4(c * a, a);
}`;

// os campos de cada gota no buffer: x, y, vx, vy, tamanho, alfa, tipo
export const CAMPOS_DA_GOTA = 7;

function programa(gl: WebGL2RenderingContext, vs: string, fs: string) {
    const sombreador = (tipo: number, fonte: string) => {
        const s = gl.createShader(tipo)!;
        gl.shaderSource(s, fonte);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
        return s;
    };
    const p = gl.createProgram()!;
    const v = sombreador(gl.VERTEX_SHADER, vs), f = sombreador(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
    return p;
}

function atributo(gl: WebGL2RenderingContext, prog: WebGLProgram, nome: string, tam: number, passo: number, de: number) {
    const loc = gl.getAttribLocation(prog, nome);
    if (loc < 0) return -1;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, tam, gl.FLOAT, false, passo * 4, de * 4);
    return loc;
}

type PoseDoBarco = { modelo: Float32Array; giro: Float32Array; profundo: Float32Array };

// o barco na tela pequena: o reflexo, a profundidade limpa e o barco
export class DesenhoDoBarco {
    private gl: WebGL2RenderingContext;
    private prog: WebGLProgram;
    private vao: WebGLVertexArrayObject;
    private buffer: WebGLBuffer;
    private n: number;
    private u: Record<string, WebGLUniformLocation | null> = {};

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.prog = programa(gl, VERT_BARCO, FRAG_BARCO);
        for (const n of ['uModelo', 'uGiro', 'uProfundo', 'uTela', 'uOrigem', 'uReflexo', 'uS0', 'uTempo', 'uSup', 'uSupX', 'uSenE', 'uMolhado', 'uEscala'])
            this.u[n] = gl.getUniformLocation(this.prog, n);
        const dados = malha();
        this.n = dados.length / POR_VERTICE;
        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);
        this.buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, dados, gl.STATIC_DRAW);
        atributo(gl, this.prog, 'aPos', 3, POR_VERTICE, 0);
        atributo(gl, this.prog, 'aNormal', 3, POR_VERTICE, 3);
        atributo(gl, this.prog, 'aBorda', 3, POR_VERTICE, 6);
        atributo(gl, this.prog, 'aTipos', 3, POR_VERTICE, 9);
        atributo(gl, this.prog, 'aParte', 1, POR_VERTICE, 12);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    // a tela (px CSS) e o canvas (px do aparelho), o canto da tela na janela, o barco e o reflexo, a água sob a tela (16
    // pontos de x0 a x1) e sob a âncora, o seno da elevação, o papel molhado, o meio comprimento e o tempo
    desenhar(o: {
        tela: number;
        canvas: number;
        origem: [number, number];
        barco: PoseDoBarco;
        reflexo: PoseDoBarco;
        superficie: Float32Array;
        supX: [number, number];
        s0: number;
        senE: number;
        molhado: number;
        escala: number;
        tempo: number;
    }) {
        const { gl, u } = this;
        gl.viewport(0, 0, o.canvas, o.canvas);
        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.prog);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform2f(u.uTela, o.tela, o.tela);
        gl.uniform2f(u.uOrigem, o.origem[0], o.origem[1]);
        gl.uniform1fv(u.uSup, o.superficie);
        gl.uniform2f(u.uSupX, o.supX[0], o.supX[1]);
        gl.uniform1f(u.uS0, o.s0);
        gl.uniform1f(u.uSenE, o.senE);
        gl.uniform1f(u.uMolhado, o.molhado);
        gl.uniform1f(u.uEscala, o.escala);
        gl.uniform1f(u.uTempo, o.tempo);
        gl.bindVertexArray(this.vao);
        const pose = (p: PoseDoBarco, reflexo: number) => {
            gl.uniformMatrix4fv(u.uModelo, false, p.modelo);
            gl.uniformMatrix3fv(u.uGiro, false, p.giro);
            gl.uniform4fv(u.uProfundo, p.profundo);
            gl.uniform1f(u.uReflexo, reflexo);
            gl.drawArrays(gl.TRIANGLES, 0, this.n);
        };
        pose(o.reflexo, 1);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        pose(o.barco, 0);
        gl.bindVertexArray(null);
    }

    destruir() {
        const { gl } = this;
        gl.deleteBuffer(this.buffer);
        gl.deleteVertexArray(this.vao);
        gl.deleteProgram(this.prog);
    }
}

// as gotas na tela da janela
export class DesenhoDasGotas {
    private gl: WebGL2RenderingContext;
    private prog: WebGLProgram;
    private vao: WebGLVertexArrayObject;
    private cantos: WebGLBuffer;
    private bGotas: WebGLBuffer;
    private uTela: WebGLUniformLocation | null;

    constructor(gl: WebGL2RenderingContext, maximo: number) {
        this.gl = gl;
        this.prog = programa(gl, VERT_GOTA, FRAG_GOTA);
        this.uTela = gl.getUniformLocation(this.prog, 'uTela');
        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);
        this.cantos = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cantos);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        atributo(gl, this.prog, 'aCanto', 2, 2, 0);
        this.bGotas = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bGotas);
        gl.bufferData(gl.ARRAY_BUFFER, maximo * CAMPOS_DA_GOTA * 4, gl.DYNAMIC_DRAW);
        const porGota = (nome: string, tam: number, de: number) => {
            const loc = atributo(gl, this.prog, nome, tam, CAMPOS_DA_GOTA, de);
            if (loc >= 0) gl.vertexAttribDivisor(loc, 1);
        };
        porGota('aPos', 2, 0);
        porGota('aVel', 2, 2);
        porGota('aTam', 1, 4);
        porGota('aAlfa', 1, 5);
        porGota('aTipo', 1, 6);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    // limpa e desenha as n gotas (a tela em px CSS, o canvas em px do aparelho)
    desenhar(W: number, H: number, larguraDoCanvas: number, alturaDoCanvas: number, dados: Float32Array, n: number) {
        const { gl } = this;
        gl.viewport(0, 0, larguraDoCanvas, alturaDoCanvas);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (!n) return;
        gl.useProgram(this.prog);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform2f(this.uTela, W, H);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bGotas);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, dados, 0, n * CAMPOS_DA_GOTA);
        gl.bindVertexArray(this.vao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    destruir() {
        const { gl } = this;
        gl.deleteBuffer(this.cantos);
        gl.deleteBuffer(this.bGotas);
        gl.deleteVertexArray(this.vao);
        gl.deleteProgram(this.prog);
    }
}
