// a água das capas da faixa curva (_comp/Imagens.tsx): uma onda amortecida que o mouse levanta (o tamanho das ondas em
// relação à capa, a velocidade, os 2 a 3 s até assentar, a força da refração e do escurecimento), polida pixel a pixel.
// - Uma simulação por capa, em ping-pong RGBA16F (h, v) com EXT_color_buffer_float (sem a extensão as capas ficam sem a
//   água), em passos fixos de 1/60 s: v += (média dos vizinhos − h)·k; v *= 0,97; h += v; pincel; h e v *= 0,98. A
//   grade tem 96×60 células quadradas, na proporção 16:10 das capas, cada uma do tamanho das de uma grade de 64×64 num
//   plano de 1,28: é esse tamanho que dá a velocidade, o amortecimento por passo e a escala do gradiente.
// - A média é dos oito vizinhos (4 nos lados e 1 nos cantos, sobre 20), com k = 5/12 no lugar do 0,5 dos quatro: ao
//   longo dos eixos a onda anda e se espalha como com os quatro vizinhos, e nas diagonais também (com os quatro as
//   frentes saem em losango).
// - O pincel é uma cápsula do ponto do passo anterior ao atual, de raio 0,04 da altura da capa e força min(60·|Δ|, 1,2)
//   com Δ em alturas: o disco carimbado uma vez por passo deixava um rastro pontilhado quando o mouse corria. Ao entrar
//   numa capa (ou trocar de capa) o ponto anterior é esquecido, para não haver salto.
// - Depois dos passos do quadro, um passe guarda a altura e o gradiente (diferenças centrais com pesos 4 e 1 de lado,
//   iguais em todas as direções) numa terceira textura, que a capa lê com o filtro bicúbico B-spline (LER_AGUA, quatro
//   leituras bilineares): liso até a segunda derivada. Uma leitura bilinear deixava o gradiente constante por
//   célula (as facetas e os losangos) e o relevo em degraus.
// - Só simulam as capas com energia recente: VIDA s depois do último toque a onda já assentou (menos de um quinto de
//   pixel de deslocamento), e os alvos voltam a zero.

// as células da simulação de cada capa (quadradas na proporção 16:10)
export const NX = 96;
export const NY = 60;
const PASSO = 1 / 60;
// o raio do pincel, em alturas da capa
const RAIO = 0.04;
// os segundos depois do último toque até a onda zerar
const VIDA = 4;
// a gota do clique (a capa que abre): um carimbo só, mais forte que o pincel, que sai em anéis
const GOTA = 2.6;

const VERT_QUAD = `#version 300 es
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// um passo da onda: as células por texelFetch (a borda repete a última, como num CLAMP_TO_EDGE: a onda reflete
// nas bordas da capa) e o pincel em cápsula de uDe a uPara (em células)
const FRAG_ONDA = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uAntes;
uniform vec2 uDe, uPara;
uniform float uForca;
out vec4 cor;
const ivec2 FIM = ivec2(${NX - 1}, ${NY - 1});
float h(ivec2 p) { return texelFetch(uAntes, clamp(p, ivec2(0), FIM), 0).r; }
void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    vec2 s = texelFetch(uAntes, p, 0).rg;
    float lados = h(p + ivec2(1, 0)) + h(p - ivec2(1, 0)) + h(p + ivec2(0, 1)) + h(p - ivec2(0, 1));
    float cantos = h(p + ivec2(1, 1)) + h(p - ivec2(1, 1)) + h(p + ivec2(1, -1)) + h(p - ivec2(1, -1));
    float v = s.y + ((4.0 * lados + cantos) / 20.0 - s.x) * (5.0 / 12.0);
    v *= 0.97;
    float hh = s.x + v;
    vec2 ab = uPara - uDe;
    vec2 c = gl_FragCoord.xy - uDe;
    float t = clamp(dot(c, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    hh += (1.0 - smoothstep(0.0, ${(RAIO * NY).toFixed(3)}, length(c - ab * t))) * uForca;
    cor = vec4(clamp(hh * 0.98, -5.0, 5.0), clamp(v * 0.98, -5.0, 5.0), 0.0, 0.0);
}`;

// a altura e o gradiente por célula, para a capa ler lisos
const FRAG_GRADIENTE = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uOnda;
out vec4 cor;
const ivec2 FIM = ivec2(${NX - 1}, ${NY - 1});
float h(ivec2 p) { return texelFetch(uOnda, clamp(p, ivec2(0), FIM), 0).r; }
void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    float l = h(p + ivec2(1, 0)), o = h(p - ivec2(1, 0)), b = h(p + ivec2(0, 1)), c = h(p - ivec2(0, 1));
    float lb = h(p + ivec2(1, 1)), ob = h(p + ivec2(-1, 1)), lc = h(p + ivec2(1, -1)), oc = h(p - ivec2(1, 1));
    float gx = (4.0 * (l - o) + (lb - ob) + (lc - oc)) / 12.0;
    float gy = (4.0 * (b - c) + (lb - lc) + (ob - oc)) / 12.0;
    cor = vec4(h(p), gx, gy, 0.0);
}`;

// a leitura da água nos shaders da capa: bicúbica B-spline com quatro leituras bilineares (Sigg e Hadwiger, GPU Gems 2,
// cap. 20), lisa até a segunda derivada. Devolve (h, gradiente em x, gradiente em y) por célula
export const LER_AGUA = `
vec3 lerAgua(sampler2D s, vec2 uv) {
    vec2 tam = vec2(${NX}.0, ${NY}.0);
    vec2 p = uv * tam - 0.5;
    vec2 i = floor(p);
    vec2 f = p - i;
    vec2 f2 = f * f, f3 = f2 * f;
    vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
    vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
    vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
    vec2 w3 = f3 / 6.0;
    vec2 g0 = w0 + w1, g1 = w2 + w3;
    vec2 a = (i - 0.5 + w1 / g0) / tam;
    vec2 b = (i + 1.5 + w3 / g1) / tam;
    return (g0.y * (g0.x * textureLod(s, a, 0.0) + g1.x * textureLod(s, vec2(b.x, a.y), 0.0))
          + g1.y * (g0.x * textureLod(s, vec2(a.x, b.y), 0.0) + g1.x * textureLod(s, b, 0.0))).xyz;
}`;

type Alvo = { tex: WebGLTexture; fb: WebGLFramebuffer };
type Sim = { ab: [Alvo, Alvo]; n: Alvo; lido: number; vida: number };

// o mouse sobre uma capa: o índice, o ponto em uv dela (u ao longo do arco, v = 0 em cima) e a proporção dela agora
export type Toque = { capa: number; u: number; v: number; aspecto: number };

export class Agua {
    private gl: WebGL2RenderingContext;
    private onda: WebGLProgram | null = null;
    private gradiente: WebGLProgram | null = null;
    private vao: WebGLVertexArrayObject | null = null;
    private uo: Record<'antes' | 'de' | 'para' | 'forca', WebGLUniformLocation | null> = { antes: null, de: null, para: null, forca: null };
    private ug: WebGLUniformLocation | null = null;
    private sims: Sim[] = [];
    // a textura das capas sem água (1×1 zerada: o sampler nunca fica sem textura)
    private zero: WebGLTexture;
    private acumulado = 0;
    // o pincel: a capa e o ponto (em células) do último passo
    private pincel = { capa: -1, x: 0, y: 0 };
    private viva = 0;
    // as gotas esperando o próximo passo (em células)
    private gotas: { capa: number; x: number; y: number }[] = [];

    constructor(gl: WebGL2RenderingContext, quantas: number) {
        this.gl = gl;
        this.zero = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.zero);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // a simulação precisa de alvo em ponto flutuante; sem ele, as capas ficam sem a água
        if (!gl.getExtension('EXT_color_buffer_float')) return;
        const onda = programa(gl, FRAG_ONDA);
        const gradiente = programa(gl, FRAG_GRADIENTE);
        if (!onda || !gradiente) {
            gl.deleteProgram(onda);
            gl.deleteProgram(gradiente);
            return;
        }
        this.onda = onda;
        this.gradiente = gradiente;
        this.uo = {
            antes: gl.getUniformLocation(onda, 'uAntes'),
            de: gl.getUniformLocation(onda, 'uDe'),
            para: gl.getUniformLocation(onda, 'uPara'),
            forca: gl.getUniformLocation(onda, 'uForca'),
        };
        this.ug = gl.getUniformLocation(gradiente, 'uOnda');
        // o triângulo da tela inteira sai do gl_VertexID; o VAO vazio é só para não depender do estado de fora
        this.vao = gl.createVertexArray();
        const alvo = (): Alvo => {
            const tex = gl.createTexture()!;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, NX, NY, 0, gl.RGBA, gl.HALF_FLOAT, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            const fb = gl.createFramebuffer()!;
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            return { tex, fb };
        };
        for (let i = 0; i < quantas; i++) this.sims.push({ ab: [alvo(), alvo()], n: alvo(), lido: 0, vida: 0 });
        gl.bindTexture(gl.TEXTURE_2D, null);
        const completo = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if (!completo) {
            this.destruir();
            return;
        }
        this.sims.forEach(s => this.zerar(s));
    }

    get ok() {
        return this.sims.length > 0;
    }

    // se a capa tem água agora, e a textura que ela lê (a da água ou a zerada)
    ativa(i: number) {
        return (this.sims[i]?.vida ?? 0) > 0;
    }

    textura(i: number) {
        return this.ativa(i) ? this.sims[i].n.tex : this.zero;
    }

    // uma gota num ponto da capa (u, v em uv dela), aplicada no próximo passo
    gota(capa: number, u: number, v: number) {
        const s = this.sims[capa];
        if (!s) return;
        this.gotas.push({ capa, x: u * NX, y: v * NY });
        if (s.vida <= 0) this.viva++;
        s.vida = VIDA;
    }

    // um quadro: o pincel (o mouse sobre uma capa, ou null) e os passos fixos das capas com energia recente
    avancar(dt: number, toque: Toque | null) {
        if (!this.ok || !this.onda || !this.gradiente) return;
        const gl = this.gl;
        // entrou numa capa ou trocou de capa: o ponto anterior é o de agora (sem salto)
        if (!toque || toque.capa !== this.pincel.capa) {
            this.pincel.capa = toque ? toque.capa : -1;
            if (toque) {
                this.pincel.x = toque.u * NX;
                this.pincel.y = toque.v * NY;
            }
        }
        this.acumulado = Math.min(this.acumulado + dt, 4 * PASSO);
        let passos = 0;
        while (this.acumulado >= PASSO) {
            this.acumulado -= PASSO;
            passos++;
        }
        if (!passos) return;
        // o traço desde o último passo, dividido igualmente entre os passos deste quadro; a força vem do quanto anda
        // cada passo, em alturas da capa
        const x0 = this.pincel.x, y0 = this.pincel.y;
        let x1 = x0, y1 = y0, forca = 0;
        if (toque) {
            x1 = toque.u * NX;
            y1 = toque.v * NY;
            const d = Math.hypot(((x1 - x0) / NX) * toque.aspecto, (y1 - y0) / NY) / passos;
            forca = Math.min(60 * d, 1.2);
            if (forca > 1e-4) {
                if (this.sims[toque.capa].vida <= 0) this.viva++;
                this.sims[toque.capa].vida = VIDA;
            }
            this.pincel.x = x1;
            this.pincel.y = y1;
        }
        if (!this.viva) return;

        gl.bindVertexArray(this.vao);
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, NX, NY);
        gl.activeTexture(gl.TEXTURE0);
        for (let i = 0; i < this.sims.length; i++) {
            const s = this.sims[i];
            if (s.vida <= 0) continue;
            gl.useProgram(this.onda);
            gl.uniform1i(this.uo.antes, 0);
            const pinta = toque !== null && toque.capa === i && forca > 0;
            const gota = this.gotas.find(g => g.capa === i);
            for (let k = 0; k < passos; k++) {
                gl.uniform1f(this.uo.forca, gota && k === 0 ? GOTA : pinta ? forca : 0);
                if (gota && k === 0) {
                    gl.uniform2f(this.uo.de, gota.x, gota.y);
                    gl.uniform2f(this.uo.para, gota.x, gota.y);
                } else if (pinta) {
                    gl.uniform2f(this.uo.de, x0 + ((x1 - x0) * k) / passos, y0 + ((y1 - y0) * k) / passos);
                    gl.uniform2f(this.uo.para, x0 + ((x1 - x0) * (k + 1)) / passos, y0 + ((y1 - y0) * (k + 1)) / passos);
                } else {
                    gl.uniform2f(this.uo.de, -100, -100);
                    gl.uniform2f(this.uo.para, -100, -100);
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, s.ab[1 - s.lido].fb);
                gl.bindTexture(gl.TEXTURE_2D, s.ab[s.lido].tex);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                s.lido = 1 - s.lido;
            }
            gl.useProgram(this.gradiente);
            gl.uniform1i(this.ug, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, s.n.fb);
            gl.bindTexture(gl.TEXTURE_2D, s.ab[s.lido].tex);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            s.vida -= passos * PASSO;
            if (s.vida <= 0) {
                this.zerar(s);
                this.viva--;
            }
        }
        this.gotas.length = 0;
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }

    // a seção saiu da tela: zera as capas com água e para
    parar() {
        this.pincel.capa = -1;
        this.acumulado = 0;
        this.gotas.length = 0;
        if (!this.viva) return;
        this.sims.forEach(s => {
            if (s.vida > 0) this.zerar(s);
        });
        this.viva = 0;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    private zerar(s: Sim) {
        const gl = this.gl;
        s.vida = 0;
        s.lido = 0;
        gl.clearColor(0, 0, 0, 0);
        for (const a of [s.ab[0], s.ab[1], s.n]) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    destruir() {
        const gl = this.gl;
        this.sims.forEach(s =>
            [s.ab[0], s.ab[1], s.n].forEach(a => {
                gl.deleteFramebuffer(a.fb);
                gl.deleteTexture(a.tex);
            }),
        );
        this.sims = [];
        this.viva = 0;
        gl.deleteTexture(this.zero);
        gl.deleteVertexArray(this.vao);
        gl.deleteProgram(this.onda);
        gl.deleteProgram(this.gradiente);
        this.vao = this.onda = this.gradiente = null;
    }
}

function programa(gl: WebGL2RenderingContext, fragmento: string) {
    const sombreador = (tipo: number, fonte: string) => {
        const s = gl.createShader(tipo)!;
        gl.shaderSource(s, fonte);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
        return s;
    };
    const p = gl.createProgram()!;
    const v = sombreador(gl.VERTEX_SHADER, VERT_QUAD), f = sombreador(gl.FRAGMENT_SHADER, fragmento);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    // os shaders ficam com o programa; soltos, saem com ele
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p));
        gl.deleteProgram(p);
        return null;
    }
    return p;
}
