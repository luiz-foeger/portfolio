// a física do barquinho de papel do rodapé (26/10; a água como superfície em 27/10), sem tela nem DOM: o barco como um
// corpo rígido no plano da tela (o centro de massa, a velocidade, o ângulo e o giro), a água em volta dele (Agua2D, o
// plano do mar em largura e profundidade) e as gotas dos respingos. O barco e as gotas em px e segundos, com y para
// baixo; a água nas unidades do mundo das ondas, e a vista (de _comp/FundoOndas.tsx, a cada quadro) leva de um ao outro.
// - O empuxo: o perfil do casco (o trapézio da quilha às pontas, de lado) cortado em fatias verticais; a parte de cada
//   fatia abaixo da superfície (a onda do shader mais a água simulada, na profundidade do barco) é a área submersa. O
//   empuxo é o peso vezes a área submersa sobre a área em repouso, no centroide dela: afundar mais empurra mais, e
//   inclinar desloca o centroide e endireita o barco (ele acompanha a inclinação da onda). Na água inclinada ele desce
//   a encosta.
// - O arrasto: em cada fatia submersa, contra a velocidade daquele ponto do casco em relação à água (linear e
//   quadrático), o que também amortece o balanço; de lado, ele vai com a corrente, que muda devagar.
// - A água sente o casco: sob o casco submerso (o comprimento dele na linha e a boca na profundidade), a velocidade da
//   água é puxada para a do fundo do casco (que desce quando o barco afunda, ou quando a quilha chega ao andar de lado),
//   e a água tirada sobe num anel em volta dele. Daí saem a coroa da batida, a onda da proa e os anéis em que o barco
//   balança.
// - Na mão: uma mola no ponto em que foi pego (o barco pendura e balança como um pêndulo); solto, cai com o empurrão
//   do gesto.
// - Os respingos nascem da física: quando o casco entra depressa na água (a batida, um mergulho forçado), sai água por
//   toda a volta da linha d'água, para fora e para cima, na velocidade em que ele entra: gotas grandes e pequenas,
//   névoa e espuma que fica boiando, na frente e atrás dele. Arrastado rente à água, a proa espirra; tirado da água, o
//   casco pinga. Cada gota que cai de volta empurra a água onde caiu (os anéis menores) e, se cai forte, espirra
//   gotinhas. As gotas andam no plano vertical do barco e também em profundidade (em unidades do mundo): na tela, mais
//   longe é mais acima e menor.
// - Virado (27/10): até ~90° fora de pé o lastro o endireita; além disso ele some aos poucos, e o barco de papel fica
//   boiando de cabeça para baixo, como um de verdade, até alguém desvirá-lo (o desvirar: um pulo e um giro, com o lastro
//   inteiro até ele rolar de volta).
// - Surgir e afundar (27/10): ele aparece subindo de bem fundo, como se tivesse sido puxado para baixo e solto (o
//   empuxo o traz, ele fura a superfície e volta balançando); ao subir a página, é puxado para o fundo (sem o empuxo,
//   numa mola até bem abaixo da superfície). Inteiro debaixo d'água e andando, solta bolhas pelo alto do casco, que
//   sobem ziguezagueando e estouram na superfície; subindo por baixo dela, levanta a água em cima dele.
import { Agua2D } from './agua2d';

// o perfil do casco de lado, em unidades do modelo (x no comprimento, de -1 a 1; y para cima): a quilha, a proa, a popa
const CASCO: [number, number][] = [
    [-0.55, 0],
    [0.55, 0],
    [1, 0.62],
    [-1, 0.62],
];
// a linha d'água em repouso e o centro de massa (y do modelo), o raio de giração (fração do meio comprimento) e a meia
// boca do casco na linha d'água (unidades do modelo)
export const LINHA_DAGUA = 0.18;
export const CENTRO_DE_MASSA = 0.4;
const GIRACAO = 0.5;
const BOCA = 0.15;
// a física, em px e segundos: a gravidade; o arrasto na água (de pé, linear e quadrático, e de lado, para a corrente);
// o arrasto do ar (e do giro); o lastro que endireita; a mola da mão (e o amortecimento do giro na mão); o giro máximo
// (rad/s) solto e na mão, para um arremesso não o fazer cair de cabeça para baixo; a corrente (nas telas estreitas, mais
// fraca) e a mola que o traz de volta para o meio da tela (a faixa do meio, em fração da largura e em comprimentos do
// barco a partir das bordas); o quanto ele desce as encostas (a água da onda também anda e segura; inteiro, ele
// escorregaria depressa); o quanto a água acompanha o fundo do casco; o desvirar (o pulo, em px/s, o giro e quanto
// tempo o lastro fica inteiro); o surgir (a profundidade de onde ele sobe, em meios comprimentos) e o afundar (a mola
// que o puxa para o fundo e a profundidade dele, em meios comprimentos)
const FISICA = {
    gravidade: 2200,
    arrasto: 8,
    arrastoQ: 0.016,
    lateral: 3.5,
    ar: 0.6,
    arGiro: 1.2,
    endireita: 30,
    mao: 1100,
    maoAmortece: 48,
    maoGiro: 12,
    giro: { solto: 4, mao: 8 },
    corrente: 12,
    meio: { mola: 2, faixa: 0.2, comprimentos: 2.5 },
    encosta: 0.35,
    acopla: 10,
    desvirar: { pulo: 520, giro: 7, tempo: 1.2 },
    surgir: 2.3,
    afundar: { mola: 40, amortece: 9, fundo: 2.6 },
};
const FATIAS = 20;
// os passos fixos do barco (as molas da mão e da água pedem passos menores que os da água)
const PASSO_DO_BARCO = 1 / 240;
// a velocidade em que o casco entra na água (px/s) do menor e do maior respingo
const RESPINGO = { limiar: 150, cheio: 1300 };
export const MAX_GOTAS = 420;
// os tipos das gotas
export const GOTA = 0, NEVOA = 1, ESPUMA = 2, BOLHA = 3;
// a ponta da vela (y do modelo), para o ponto mais alto do barco
const VELA = 1.28;

// a vista: o meio da tela e a unidade do quadro (px), o quanto a largura encolhe nas telas estreitas, o mouse (o
// paralaxe), a profundidade Z da linha do barco e a distância dela à câmera; em px por unidade do mundo, a largura (sx)
// e a altura (sy) na linha do barco, e o quanto a superfície sobe na tela por unidade de profundidade (prof)
export type Vista = { meio: number; unidade: number; larg: number; mx: number; Zb: number; d: number; sx: number; sy: number; prof: number };

// a área de um polígono abaixo da altura L (o polígono cortado e a fórmula do laço)
function areaAbaixo(poligono: [number, number][], L: number) {
    const pts: [number, number][] = [];
    poligono.forEach((a, k) => {
        const b = poligono[(k + 1) % poligono.length];
        const dentroA = a[1] <= L, dentroB = b[1] <= L;
        if (dentroA) pts.push(a);
        if (dentroA !== dentroB) {
            const t = (L - a[1]) / (b[1] - a[1]);
            pts.push([a[0] + (b[0] - a[0]) * t, L]);
        }
    });
    let area = 0;
    pts.forEach((a, k) => {
        const b = pts[(k + 1) % pts.length];
        area += a[0] * b[1] - b[0] * a[1];
    });
    return Math.abs(area) / 2;
}
const AREA0 = areaAbaixo(CASCO, LINHA_DAGUA);
const AREA_CHEIA = areaAbaixo(CASCO, 1);

// o lastro que um barco de papel não tem: o quanto ele endireita estando d (rad) fora de pé. Até 90°, como um pêndulo;
// além disso ele some até 150° e o barco fica virado. No desvirar, ele cresce até 180° (de cabeça para baixo o seno
// zeraria, e o casco, com a borda larga para baixo, boiaria assim)
function lastro(d: number, desvirando: boolean) {
    const a = Math.atan2(Math.sin(d), Math.cos(d)), alem = Math.abs(a) - Math.PI / 2;
    if (alem <= 0) return Math.sin(a);
    return Math.sign(a) * (desvirando ? 1 + 3 * alem : Math.max(0, 1 - alem / (Math.PI / 3)));
}
const aleatorio = (de: number, ate: number) => de + Math.random() * (ate - de);

export class FisicaDoBarco {
    agua = new Agua2D();
    vista: Vista = { meio: 0, unidade: 1, larg: 1, mx: 0, Zb: 2.4, d: 2.6, sx: 340, sy: 340, prof: 74 };
    // a onda do shader na linha do barco (px, de cima) em pontos a cada ~4 px da tela, atualizada a cada quadro por quem
    // desenha
    base = new Float32Array(2);
    W = 1;
    H = 1;
    // o meio comprimento do barco (px) e a guinada do desenho (encurta o perfil de lado)
    s = 60;
    guinada = 0;
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    th = 0;
    w = 0;
    mao = { ativa: false, x: 0, y: 0, vx: 0, vy: 0, bx: 0, by: 0, xAntes: 0, yAntes: 0 };
    // solto e ainda sem tocar a água; a área submersa (px²); até onde o papel está molhado (y do modelo); as batidas
    // (contadas) e a força da última (0 a 1)
    voando = false;
    area = 0;
    molhado = 0;
    batidas = 0;
    forcaDaBatida = 0;
    // puxado para o fundo (0 a 1, ao subir a página)
    afundar = 0;
    // as gotas: a posição no plano vertical do barco (px) e a profundidade (unidades do mundo, para longe), as três
    // velocidades, o tamanho (px), a vida (s), a vida inicial e o tipo
    n = 0;
    gx = new Float32Array(MAX_GOTAS);
    gy = new Float32Array(MAX_GOTAS);
    gp = new Float32Array(MAX_GOTAS);
    gvx = new Float32Array(MAX_GOTAS);
    gvy = new Float32Array(MAX_GOTAS);
    gvp = new Float32Array(MAX_GOTAS);
    gtam = new Float32Array(MAX_GOTAS);
    gvida = new Float32Array(MAX_GOTAS);
    gvida0 = new Float32Array(MAX_GOTAS);
    gtipo = new Uint8Array(MAX_GOTAS);
    private tempo = 0;
    private acumulado = 0;
    private areaAntes = 0;
    private calmo = 1;
    private emitir = 0;
    private emitirProa = 0;
    private escorre = 0;
    private pingar = 0;
    private bolhas = 0;
    private desvirando = 0;
    private profundidadeAntes = 0;
    // o fundo do casco no passo anterior em cada coluna da água, e as colunas que ele cobria
    private fundoAntes = new Float32Array(2);
    private de0 = 0;
    private ate0 = -1;
    // a água que o casco tirou desde o último passo da água, e o anel em que ela volta (o meio e os raios)
    private tirada = { total: 0, X: 0, rx: 1, rz: 1 };
    // o casco na tela (os quatro cantos) e a última coluna medida
    private px = new Float64Array(4);
    private py = new Float64Array(4);
    private cTopo = 0;
    private cFundo = 0;

    // o tamanho da tela e o meio comprimento do barco (px)
    redimensionar(W: number, H: number, s: number) {
        this.W = W;
        this.H = H;
        this.s = s;
        const n = Math.round(W / 4) + 1;
        if (this.base.length !== n) this.base = new Float32Array(n);
    }

    // a área da água (unidades do mundo) e o tamanho das células; a água recomeça parada
    configurarAgua(x0: number, x1: number, z0: number, z1: number, hx: number, hz: number) {
        this.agua.configurar(x0, x1, z0, z1, hx, hz);
        this.fundoAntes = new Float32Array(this.agua.nx).fill(NaN);
        this.de0 = 0;
        this.ate0 = -1;
    }

    // de px da tela para a largura do mundo na linha do barco, e de volta
    X(x: number) {
        const v = this.vista;
        return (((x - v.meio) / v.unidade) * v.d - 0.05 * v.mx) / v.larg;
    }

    xDe(X: number) {
        const v = this.vista;
        return v.meio + ((X * v.larg + 0.05 * v.mx) / v.d) * v.unidade;
    }

    // a linha da onda do shader (px, de cima) no ponto x
    private linha(x: number) {
        const { base } = this;
        const p = Math.max(0, Math.min(base.length - 1, (x / this.W) * (base.length - 1)));
        const i = Math.min(base.length - 2, Math.floor(p));
        return base[i] + (base[i + 1] - base[i]) * (p - i);
    }

    // a altura da água (px, de cima) no ponto x da linha do barco: a onda do shader e a água simulada
    superficie(x: number) {
        return this.superficieEm(x, 0);
    }

    // o mesmo a uma profundidade p (unidades do mundo, para longe) da linha, no plano vertical do barco (na tela, a
    // superfície ali fica p·prof mais acima)
    superficieEm(x: number, p: number) {
        const v = this.vista;
        return this.linha(x) - this.agua.altura(this.X(x), v.Zb + p) * v.sy;
    }

    // a velocidade da água (px/s, para baixo) no ponto x da linha do barco
    private velocidadeDaAgua(x: number) {
        const v = this.vista;
        return -this.agua.velocidade(this.X(x), v.Zb) * v.sy;
    }

    // parado e boiando no ponto x
    colocar(x: number) {
        this.x = x;
        this.th = 0;
        this.vx = this.vy = this.w = 0;
        this.y = this.superficie(x) - (CENTRO_DE_MASSA - LINHA_DAGUA) * this.s;
    }

    // fundo, debaixo d'água, no ponto x: o empuxo o traz de volta à superfície (o surgir), e ele chega encharcado
    colocarSubmerso(x: number) {
        this.colocar(x);
        this.y += FISICA.surgir * this.s;
        this.afundar = 0;
        this.voando = false;
        this.molhado = 0.45;
        this.profundidadeAntes = this.profundidade();
    }

    // virado: boiando com mais de ~110° fora de pé
    get virado() {
        return this.area > 0 && !this.mao.ativa && Math.abs(Math.atan2(Math.sin(this.th), Math.cos(this.th))) > 1.9;
    }

    // o clique no barco virado: um pulo e um giro para o lado mais perto de pé, com o lastro inteiro até ele rolar de volta
    desvirar() {
        const a = Math.atan2(Math.sin(this.th), Math.cos(this.th));
        this.desvirando = FISICA.desvirar.tempo;
        this.vy = Math.min(this.vy, -FISICA.desvirar.pulo);
        this.w = -Math.sign(a) * FISICA.desvirar.giro;
        this.voando = true;
    }

    // o quanto o ponto mais alto do barco (a ponta da vela ou um canto do casco) está abaixo da superfície (px; negativo
    // acima dela)
    profundidade() {
        this.poligono();
        const by = -(VELA - CENTRO_DE_MASSA) * this.s;
        const topo = Math.min(this.y + by * Math.cos(this.th), this.py[0], this.py[1], this.py[2], this.py[3]);
        return topo - this.superficie(this.x);
    }

    // o paralaxe do mouse anda com o mundo: o barco e as gotas vão junto (dx em px)
    deslocar(dx: number) {
        if (!dx) return;
        this.x += dx;
        for (let i = 0; i < this.n; i++) this.gx[i] += dx;
    }

    // a mão pega o barco no ponto (px, py) da tela, move e solta
    pegar(px: number, py: number) {
        const rx = px - this.x, ry = py - this.y, c = Math.cos(this.th), sn = Math.sin(this.th);
        Object.assign(this.mao, { ativa: true, x: px, y: py, vx: 0, vy: 0, bx: rx * c + ry * sn, by: -rx * sn + ry * c, xAntes: px, yAntes: py });
        this.voando = false;
    }

    mover(px: number, py: number) {
        this.mao.x = px;
        this.mao.y = py;
    }

    largar() {
        this.mao.ativa = false;
        this.voando = this.area <= 0;
        const v = Math.hypot(this.vx, this.vy);
        if (v > 2400) {
            this.vx *= 2400 / v;
            this.vy *= 2400 / v;
        }
        this.w = Math.max(-FISICA.giro.solto, Math.min(FISICA.giro.solto, this.w));
    }

    // um quadro: a velocidade da mão, os passos fixos do barco junto com os da água, as gotas e o papel molhado
    passo(dt: number) {
        const m = this.mao;
        if (m.ativa) {
            const k = 1 - Math.exp(-dt / 0.04);
            m.vx += ((m.x - m.xAntes) / dt - m.vx) * k;
            m.vy += ((m.y - m.yAntes) / dt - m.vy) * k;
            m.xAntes = m.x;
            m.yAntes = m.y;
        }
        // o barco em passos de 1/240 s, e a água nos dela; a água que o casco tirou volta no anel a cada passo da água
        this.acumulado = Math.min(this.acumulado + dt, 12 * PASSO_DO_BARCO);
        while (this.acumulado >= PASSO_DO_BARCO) {
            this.acumulado -= PASSO_DO_BARCO;
            this.passoFixo(PASSO_DO_BARCO);
        }
        this.agua.passo(dt, () => {
            const t = this.tirada;
            if (t.total) this.agua.espalharAnel(t.X, this.vista.Zb, -t.total, t.rx, t.rz);
            t.total = 0;
        });
        this.passoDasGotas(dt);
        // a água sobe no papel até a linha em que ele está (e mais nas batidas) e seca devagar
        if (this.area > 0) {
            const nivel = CENTRO_DE_MASSA - ((this.superficie(this.x) - this.y) * Math.cos(this.th)) / this.s;
            this.molhado = Math.max(this.molhado, Math.min(0.62, nivel + 0.02));
        }
        this.molhado = Math.max(0, this.molhado - dt * 0.005);
        this.sanear();
    }

    // se alguma conta der um valor que não é número (a onda do shader num caso extremo), a água para e o barco volta a
    // boiar parado, em vez de ficar travado
    private sanear() {
        const { alt, v } = this.agua;
        for (let i = 0; i < alt.length; i++)
            if (!Number.isFinite(alt[i]) || !Number.isFinite(v[i])) {
                this.agua.zerar();
                break;
            }
        if ([this.x, this.y, this.vx, this.vy, this.th, this.w].every(Number.isFinite)) return;
        this.mao.ativa = false;
        this.colocar(Number.isFinite(this.x) ? this.x : this.W / 2);
        if (!Number.isFinite(this.y)) this.y = this.H * 0.8;
    }

    private poligono() {
        const { s } = this;
        const c = Math.cos(this.th), sn = Math.sin(this.th), cg = Math.cos(this.guinada);
        for (let k = 0; k < 4; k++) {
            const bx = CASCO[k][0] * s * cg, by = -(CASCO[k][1] - CENTRO_DE_MASSA) * s;
            this.px[k] = this.x + bx * c - by * sn;
            this.py[k] = this.y + bx * sn + by * c;
        }
    }

    // o alto e o fundo do casco na vertical x (em cTopo e cFundo); false fora dele
    private coluna(x: number) {
        let topo = Infinity, fundo = -Infinity;
        for (let k = 0; k < 4; k++) {
            const j = (k + 1) & 3;
            const ax = this.px[k], bx = this.px[j];
            if ((x < ax && x < bx) || (x > ax && x > bx) || ax === bx) continue;
            const y = this.py[k] + ((this.py[j] - this.py[k]) * (x - ax)) / (bx - ax);
            if (y < topo) topo = y;
            if (y > fundo) fundo = y;
        }
        this.cTopo = topo;
        this.cFundo = fundo;
        return fundo >= topo;
    }

    private passoFixo(dt: number) {
        const { s, mao } = this;
        const g = FISICA.gravidade, I = (GIRACAO * s) ** 2;
        const area0 = AREA0 * s * s * Math.cos(this.guinada);
        const corrente = FISICA.corrente * Math.min(1, this.W / 1100) * Math.sin(this.tempo * 0.06 + 1.2);
        this.tempo += dt;
        this.poligono();
        let xmin = Infinity, xmax = -Infinity;
        for (let k = 0; k < 4; k++) {
            xmin = Math.min(xmin, this.px[k]);
            xmax = Math.max(xmax, this.px[k]);
        }

        // o empuxo e o arrasto, fatia a fatia
        let fx = 0, fy = g, tq = 0;
        let A = 0, Ax = 0, Ay = 0, Av = 0, xL = Infinity, xR = -Infinity;
        const dxs = (xmax - xmin) / FATIAS;
        for (let j = 0; j < FATIAS; j++) {
            const xc = xmin + (j + 0.5) * dxs;
            if (!this.coluna(xc)) continue;
            const S = this.superficie(xc);
            const topo = Math.max(S, this.cTopo);
            const sub = this.cFundo - topo;
            if (sub <= 0) continue;
            const a = sub * dxs, yc = this.cFundo - sub / 2;
            A += a;
            Ax += a * xc;
            Ay += a * yc;
            xL = Math.min(xL, xc - dxs / 2);
            xR = Math.max(xR, xc + dxs / 2);
            const rx = xc - this.x, ry = yc - this.y;
            const vpx = this.vx - this.w * ry, vpy = this.vy + this.w * rx;
            const rel = vpy - this.velocidadeDaAgua(xc);
            Av += a * rel;
            const k = a / area0;
            const fyc = -(FISICA.arrasto * rel + FISICA.arrastoQ * Math.abs(rel) * rel) * k;
            const fxc = -FISICA.lateral * (vpx - corrente) * k;
            fx += fxc;
            fy += fyc;
            tq += rx * fyc - ry * fxc * 0.35;
        }
        let incl = 0;
        if (A > 0) {
            const cx = Ax / A, cy = Ay / A;
            const empuxo = ((g * A) / area0) * (1 - this.afundar);
            incl = xR - xL > 1 ? (this.superficie(xR) - this.superficie(xL)) / (xR - xL) : 0;
            fy -= empuxo;
            fx += empuxo * incl * FISICA.encosta;
            tq += (cx - this.x) * -empuxo - (cy - this.y) * empuxo * incl * FISICA.encosta;
            // o lastro, de pé em relação à água
            tq -= FISICA.endireita * I * lastro(this.th - Math.atan(incl), this.desvirando > 0) * Math.min(1, A / area0);
            // a corrente e as encostas não o deixam encostado numa borda: perto dela, uma mola o traz de volta
            if (!mao.ativa) {
                const borda = Math.max(this.W * FISICA.meio.faixa, FISICA.meio.comprimentos * s);
                const de = Math.min(borda, this.W / 2), ate = Math.max(this.W - borda, this.W / 2);
                fx -= FISICA.meio.mola * (this.x - Math.max(de, Math.min(ate, this.x)));
            }
        } else if (!mao.ativa) {
            // no ar, um lastro de leve, como numa peteca: ele tende a cair de pé
            tq -= (this.desvirando > 0 ? 1 : 0.3) * FISICA.endireita * I * lastro(this.th, this.desvirando > 0);
        }
        // puxado para o fundo: numa mola até bem abaixo da superfície
        if (this.afundar > 0) {
            const fundo = this.superficie(this.x) + FISICA.afundar.fundo * s;
            fy += this.afundar * (FISICA.afundar.mola * (fundo - this.y) - FISICA.afundar.amortece * this.vy);
        }
        this.desvirando = Math.max(0, this.desvirando - dt);
        fx -= FISICA.ar * this.vx;
        fy -= FISICA.ar * this.vy;
        tq -= FISICA.arGiro * this.w * I;
        // a mão: a mola no ponto pego (com o barco no máximo meio comprimento abaixo da água)
        if (mao.ativa) {
            const c = Math.cos(this.th), sn = Math.sin(this.th);
            const rgx = mao.bx * c - mao.by * sn, rgy = mao.bx * sn + mao.by * c;
            const vgx = this.vx - this.w * rgy, vgy = this.vy + this.w * rgx;
            const ty = Math.min(mao.y, this.superficie(mao.x) + 0.5 * s + rgy);
            const Fx = FISICA.mao * (mao.x - this.x - rgx) + FISICA.maoAmortece * (mao.vx - vgx);
            const Fy = FISICA.mao * (ty - this.y - rgy) + FISICA.maoAmortece * (mao.vy - vgy);
            fx += Fx;
            fy += Fy;
            tq += rgx * Fy - rgy * Fx - FISICA.maoGiro * this.w * I;
            // pendurado ele balança à vontade, mas um gesto rápido não o vira além de ~100°
            const a = Math.atan2(Math.sin(this.th), Math.cos(this.th));
            tq -= 2 * FISICA.endireita * I * Math.sign(a) * Math.max(0, Math.abs(a) - 1.75);
        }
        this.vx += fx * dt;
        this.vy += fy * dt;
        this.w += (tq / I) * dt;
        const giroMax = mao.ativa ? FISICA.giro.mao : this.desvirando > 0 ? FISICA.desvirar.giro : FISICA.giro.solto;
        this.w = Math.max(-giroMax, Math.min(giroMax, this.w));
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.th += this.w * dt;
        this.bordas();

        // a batida e os respingos: a velocidade em que o casco submerso desce em relação à água (a média das fatias)
        const entra = A > 0 ? Av / A : 0;
        const saiu = A <= 0 && this.areaAntes > 0;
        this.areaAntes = A;
        this.area = A;
        if (A > 0) this.voando = false;
        this.calmo += dt;
        if (A > 0 && entra > RESPINGO.limiar && !this.afundar) {
            const forca = Math.min(1, (entra - RESPINGO.limiar) / (RESPINGO.cheio - RESPINGO.limiar));
            if (this.calmo > 0.2) {
                this.batidas++;
                this.forcaDaBatida = forca;
                this.espumar(xL, xR, forca);
                // a coroa da batida: a água sobe num anel logo além do casco e sai correndo pela superfície (o meio já
                // afunda com o casco)
                const v = this.vista;
                const meio = (xR - xL) / 2 / v.sx;
                this.agua.levantarAnel(this.X((xL + xR) / 2), v.Zb, (entra / v.sy) * (0.004 + 0.008 * forca), 1.4 * meio, Math.max(1.6 * this.boca(), 0.5 * meio));
                const nivel = CENTRO_DE_MASSA - ((this.superficie(this.x) - this.y) * Math.cos(this.th)) / s;
                this.molhado = Math.max(this.molhado, Math.min(0.62, nivel + 0.05 + 0.18 * forca));
            } else this.forcaDaBatida = Math.max(this.forcaDaBatida, forca);
            this.calmo = 0;
            this.emitir += dt * (150 + 2200 * forca);
            while (this.emitir >= 1) {
                this.emitir--;
                this.respingar(xL, xR, entra);
            }
        }
        // arrastado rente à água, a proa espirra
        if (mao.ativa && A > 0) {
            const rapidez = Math.abs(this.vx - corrente);
            if (rapidez > 220) {
                this.emitirProa += dt * ((rapidez - 220) / 600) * 120;
                while (this.emitirProa >= 1) {
                    this.emitirProa--;
                    this.espirrarDaProa(this.vx > 0 ? xR : xL, Math.sign(this.vx), rapidez);
                }
            }
        }
        // debaixo d'água inteiro, ele solta bolhas pelo alto do casco (mais quanto mais depressa anda); furando a
        // superfície de baixo para cima, espalha espuma e gotas em volta
        if (A > 0.9 * AREA_CHEIA * s * s * Math.cos(this.guinada)) {
            this.bolhas += dt * Math.min(60, 8 + Math.hypot(this.vx, this.vy) / 6);
            while (this.bolhas >= 1) {
                this.bolhas--;
                this.bolha(xmin, xmax);
            }
        }
        const profundidade = this.profundidade();
        if (this.profundidadeAntes > 0 && profundidade <= 0 && this.vy < -120 && xR > xL) {
            this.espumar(xL, xR, 0.4);
            for (let k = 0; k < 14; k++) this.respingar(xL, xR, -this.vy * 0.7);
        }
        this.profundidadeAntes = profundidade;
        // tirado da água, o casco pinga
        if (saiu) this.escorre = Math.min(1, 0.3 + this.molhado * 2);
        if (A > 0) this.escorre = 0;
        if (this.escorre > 0.02) {
            this.escorre *= Math.exp(-dt / 0.9);
            this.pingar += dt * this.escorre * 9;
            while (this.pingar >= 1) {
                this.pingar--;
                this.pingo();
            }
        }

        this.acoplar(dt);
    }

    private bordas() {
        const { s, W, H } = this;
        const min = s * 0.9, max = W - s * 0.9;
        if (this.x < min) {
            this.x = min;
            if (this.vx < 0) this.vx *= -0.35;
        } else if (this.x > max) {
            this.x = max;
            if (this.vx > 0) this.vx *= -0.35;
        }
        if (this.y < s * 1.1) {
            this.y = s * 1.1;
            if (this.vy < 0) this.vy *= -0.3;
        } else if (this.y > H + s * 0.2) {
            this.y = H + s * 0.2;
            if (this.vy > 0) this.vy = 0;
        }
    }

    // a meia boca do casco em unidades do mundo
    private boca() {
        return (BOCA * this.s) / this.vista.sx;
    }

    // a água sob o casco submerso é empurrada pelo fundo dele (que desce em relação a ela, ou segura a água que sobe;
    // quando ele sobe mais depressa, os dois se separam), e a que sai dali sobe num anel em volta (no passo da água)
    private acoplar(dt: number) {
        const { agua, vista: v } = this;
        if (this.fundoAntes.length !== agua.nx) return;
        this.poligono();
        let xmin = Infinity, xmax = -Infinity;
        for (let k = 0; k < 4; k++) {
            xmin = Math.min(xmin, this.px[k]);
            xmax = Math.max(xmax, this.px[k]);
        }
        const i0 = Math.max(0, Math.ceil((this.X(xmin) - agua.x0) / agua.hx)), i1 = Math.min(agua.nx - 1, Math.floor((this.X(xmax) - agua.x0) / agua.hx));
        for (let i = this.de0; i <= this.ate0; i++) if (i < i0 || i > i1) this.fundoAntes[i] = NaN;
        this.de0 = i0;
        this.ate0 = i1;
        // as fileiras da água sob a boca do casco (pelo menos a mais perto da linha do barco)
        const boca = this.boca();
        let j0 = Math.max(0, Math.ceil((v.Zb - boca - agua.z0) / agua.hz)), j1 = Math.min(agua.nz - 1, Math.floor((v.Zb + boca - agua.z0) / agua.hz));
        if (j1 < j0) j0 = j1 = Math.max(0, Math.min(agua.nz - 1, Math.round((v.Zb - agua.z0) / agua.hz)));
        const f = 1 - Math.exp(-FISICA.acopla * dt);
        let total = 0, XL = Infinity, XR = -Infinity;
        for (let i = i0; i <= i1; i++) {
            const X = agua.x0 + i * agua.hx, x = this.xDe(X);
            if (!this.coluna(x)) {
                this.fundoAntes[i] = NaN;
                continue;
            }
            const antes = this.fundoAntes[i];
            this.fundoAntes[i] = this.cFundo;
            // a velocidade do fundo do casco nesse ponto da água (com o casco andando de lado, a quilha que chega desce),
            // em unidades do mundo por segundo e para cima
            const vb = Number.isNaN(antes) ? this.vy + this.w * (x - this.x) : (this.cFundo - antes) / dt;
            const alvo = -Math.min(2500, vb) / v.sy;
            const linha = this.linha(x);
            for (let j = j0; j <= j1; j++) {
                const k = j * agua.nx + i;
                const fundo = this.cFundo - (linha - agua.alt[k] * v.sy);
                if (!(fundo > 0)) continue;
                const empurra = agua.v[k] - alvo;
                // inteiro debaixo d'água e subindo, o casco levanta a água de cima (o calombo antes de ele surgir)
                if (empurra < 0 && this.cTopo > linha - agua.alt[k] * v.sy + 2) {
                    const dv = -empurra * f * 0.5;
                    agua.v[k] += dv;
                    total += dv;
                    XL = Math.min(XL, X);
                    XR = Math.max(XR, X);
                    continue;
                }
                if (empurra <= 0) continue;
                const dv = -empurra * f * Math.min(1, fundo / 6);
                agua.v[k] += dv;
                total += dv;
                XL = Math.min(XL, X);
                XR = Math.max(XR, X);
            }
        }
        if (total !== 0 && XR >= XL) Object.assign(this.tirada, { total: this.tirada.total + total, X: (XL + XR) / 2, rx: (XR - XL) / 2 + 3 * agua.hx, rz: boca + 2 * agua.hz });
    }

    // uma gota nova (sem lugar, nada)
    private soltar(tipo: number, x: number, y: number, p: number, vx: number, vy: number, vp: number, tam: number, vida: number) {
        if (this.n >= MAX_GOTAS) return;
        const i = this.n++;
        this.gx[i] = x;
        this.gy[i] = y;
        this.gp[i] = p;
        this.gvx[i] = vx;
        this.gvy[i] = vy;
        this.gvp[i] = vp;
        this.gtam[i] = tam;
        this.gvida[i] = this.gvida0[i] = vida;
        this.gtipo[i] = tipo;
    }

    private tirar(i: number) {
        const j = --this.n;
        this.gx[i] = this.gx[j];
        this.gy[i] = this.gy[j];
        this.gp[i] = this.gp[j];
        this.gvx[i] = this.gvx[j];
        this.gvy[i] = this.gvy[j];
        this.gvp[i] = this.gvp[j];
        this.gtam[i] = this.gtam[j];
        this.gvida[i] = this.gvida[j];
        this.gvida0[i] = this.gvida0[j];
        this.gtipo[i] = this.gtipo[j];
    }

    // um ponto da volta da linha d'água (o comprimento submerso de xL a xR e a boca na profundidade) no ângulo a, com a
    // direção para fora
    private naVolta(xL: number, xR: number, a: number, folga = 1) {
        const c = Math.cos(a), sn = Math.sin(a);
        return { x: (xL + xR) / 2 + ((c * (xR - xL)) / 2) * folga, p: sn * this.boca() * folga, c, sn };
    }

    // a água que sai por toda a volta da linha d'água quando o casco entra depressa: para fora e para cima, mais perto da
    // vertical quanto mais rápido; a maioria pequena, umas poucas grandes (mais lentas), e um terço de névoa
    private respingar(xL: number, xR: number, entra: number) {
        const { x, p, c, sn } = this.naVolta(xL, xR, Math.random() * 2 * Math.PI);
        const nevoa = Math.random() < 0.32;
        const grande = Math.random() ** 3;
        const tam = nevoa ? aleatorio(0.7, 1.5) : 1.3 + 3.2 * grande;
        const vel = Math.min(entra, 1700) * aleatorio(0.22, 0.68) * (nevoa ? 1.25 : 1 - 0.35 * grande);
        const subida = aleatorio(0.35, 1.25);
        const lado = vel * Math.cos(subida);
        this.soltar(
            nevoa ? NEVOA : GOTA,
            x,
            this.superficieEm(x, p) - 1,
            p,
            c * lado + this.vx * 0.4,
            -vel * Math.sin(subida),
            (sn * lado) / this.vista.sx,
            tam,
            nevoa ? aleatorio(0.35, 0.75) : 3,
        );
    }

    // a espuma da batida, que sai boiando de toda a volta
    private espumar(xL: number, xR: number, forca: number) {
        const quantas = Math.round(8 + 22 * forca);
        for (let k = 0; k < quantas; k++) {
            const { x, p, c, sn } = this.naVolta(xL, xR, Math.random() * 2 * Math.PI, aleatorio(1, 1.25));
            const vel = aleatorio(30, 150) * (0.5 + forca);
            this.soltar(ESPUMA, x, this.superficieEm(x, p), p, c * vel, 0, (sn * vel) / this.vista.sx, aleatorio(1.2, 2.6), aleatorio(1, 2.6));
        }
    }

    // arrastado rente à água: da proa, para a frente e para os lados dela
    private espirrarDaProa(x: number, lado: number, rapidez: number) {
        const nevoa = Math.random() < 0.4;
        const a = (lado > 0 ? 0 : Math.PI) + aleatorio(-0.8, 0.8);
        const fora = rapidez * aleatorio(0.3, 0.8);
        this.soltar(
            nevoa ? NEVOA : GOTA,
            x,
            this.superficie(x) - 1,
            Math.sin(a) * this.boca(),
            Math.cos(a) * fora,
            -rapidez * aleatorio(0.2, 0.55),
            (Math.sin(a) * fora) / this.vista.sx,
            nevoa ? aleatorio(0.7, 1.3) : aleatorio(1.1, 2.4),
            nevoa ? aleatorio(0.3, 0.6) : 3,
        );
    }

    // uma bolha do alto do casco (o ar dos bolsos), num ponto qualquer do comprimento dele
    private bolha(xmin: number, xmax: number) {
        const x = aleatorio(xmin, xmax);
        if (!this.coluna(x)) return;
        this.soltar(BOLHA, x, this.cTopo, aleatorio(-1, 1) * this.boca(), aleatorio(-40, 40), aleatorio(-120, -40), 0, aleatorio(1.2, 3.4), 2.5);
    }

    // um pingo do fundo do casco: quase sempre do canto mais baixo, às vezes de qualquer ponto da quilha
    private pingo() {
        this.poligono();
        let x: number, y: number;
        if (Math.random() < 0.7) {
            const k = this.py[0] > this.py[1] ? 0 : 1;
            x = this.px[k];
            y = this.py[k];
        } else {
            const t = Math.random();
            x = this.px[0] + (this.px[1] - this.px[0]) * t;
            y = this.py[0] + (this.py[1] - this.py[0]) * t;
        }
        this.soltar(GOTA, x + aleatorio(-2, 2), y + 1, aleatorio(-0.5, 0.5) * this.boca(), this.vx * 0.6 + aleatorio(-15, 15), this.vy * 0.6 + 20, 0, aleatorio(1.2, 2.4), 3);
    }

    // as gotas no ar caem com a gravidade e um pouco de ar (a névoa, muito); a espuma vai na superfície e apaga; as bolhas
    // sobem
    private passoDasGotas(dt: number) {
        const g = FISICA.gravidade;
        for (let i = 0; i < this.n; ) {
            const tipo = this.gtipo[i];
            let vida = (this.gvida[i] -= dt);
            if (tipo === BOLHA) {
                // a bolha sobe pelo empuxo dela contra o arrasto, ziguezagueando; na superfície estoura num anelzinho
                const k = Math.exp(-dt * 5);
                this.gvy[i] = this.gvy[i] * k - g * 0.4 * dt;
                this.gvx[i] = this.gvx[i] * k + Math.sin(this.gy[i] * 0.08 + this.gtam[i] * 7) * 60 * dt;
                this.gx[i] += this.gvx[i] * dt;
                this.gy[i] += this.gvy[i] * dt;
                if (this.gy[i] < this.superficieEm(this.gx[i], this.gp[i])) {
                    const r = (2 + this.gtam[i]) / this.vista.sx;
                    this.agua.empurrarAnel(this.X(this.gx[i]), this.vista.Zb + this.gp[i], 0.15, r, r);
                    vida = 0;
                }
            } else if (tipo === ESPUMA) {
                const k = Math.exp(-dt * 1.6);
                this.gvx[i] *= k;
                this.gvp[i] *= k;
                this.gx[i] += this.gvx[i] * dt;
                this.gp[i] += this.gvp[i] * dt;
                this.gy[i] = this.superficieEm(this.gx[i], this.gp[i]) - 0.8;
            } else {
                const k = Math.exp(-dt * (tipo === NEVOA ? 2.4 : 0.12 + 0.3 / this.gtam[i]));
                this.gvx[i] *= k;
                this.gvp[i] *= k;
                this.gvy[i] = this.gvy[i] * k + g * (tipo === NEVOA ? 0.55 : 1) * dt;
                this.gx[i] += this.gvx[i] * dt;
                this.gy[i] += this.gvy[i] * dt;
                this.gp[i] += this.gvp[i] * dt;
                if (this.gvy[i] > 0 && this.gy[i] > this.superficieEm(this.gx[i], this.gp[i])) {
                    if (tipo === GOTA) this.cair(i);
                    vida = 0;
                }
            }
            if (vida <= 0 || this.gx[i] < -40 || this.gx[i] > this.W + 40 || this.gy[i] > this.H + 40) this.tirar(i);
            else i++;
        }
    }

    // a gota que volta para a água: o anel onde ela caiu, e se ela é grande e vem forte, gotinhas e espuma
    private cair(i: number) {
        const x = this.gx[i], p = this.gp[i], vy = this.gvy[i], tam = this.gtam[i], v = this.vista;
        const r = (2.5 + tam * 0.8) / v.sx;
        this.agua.empurrarAnel(this.X(x), v.Zb + p, (-vy / v.sy) * (tam / 3) ** 2 * 0.5, r, r);
        if (tam > 2.2 && vy > 420 && Math.random() < 0.6) {
            const quantas = Math.random() < 0.5 ? 1 : 2;
            for (let k = 0; k < quantas; k++) {
                const a = Math.random() * 2 * Math.PI, fora = aleatorio(60, 140);
                this.soltar(GOTA, x, this.superficieEm(x, p) - 1, p, Math.cos(a) * fora, -vy * aleatorio(0.2, 0.35), (Math.sin(a) * fora) / v.sx, aleatorio(0.8, 1.3), 3);
            }
        }
        if (Math.random() < 0.35 * (tam / 4)) this.soltar(ESPUMA, x, this.superficieEm(x, p), p, aleatorio(-30, 30), 0, aleatorio(-30, 30) / v.sx, aleatorio(1, 1.8), aleatorio(0.6, 1.4));
    }

    // as gotas para o desenho, nas duas telas: as da frente do barco e as de trás (mais longe que o meio dele). Por gota:
    // x, y e a velocidade na tela, o tamanho (menor mais longe), o alfa e o tipo; devolve quantas há em cada uma
    paraDesenho(frente: Float32Array, atras: Float32Array) {
        const v = this.vista;
        let nf = 0, na = 0;
        for (let i = 0; i < this.n; i++) {
            const tipo = this.gtipo[i], vida = this.gvida[i], vida0 = this.gvida0[i], p = this.gp[i];
            const alfa =
                tipo === GOTA
                    ? 0.95 * Math.min(1, vida / 0.2)
                    : tipo === NEVOA
                      ? 0.45 * (vida / vida0)
                      : tipo === BOLHA
                        ? 0.5 * Math.min(1, (vida0 - vida) / 0.2)
                        : 0.6 * Math.min(1, (vida0 - vida) / 0.15) * Math.min(1, vida / 0.6);
            const saida = p > 0 ? atras : frente;
            const o = (p > 0 ? na++ : nf++) * 7;
            saida[o] = this.gx[i];
            saida[o + 1] = this.gy[i] - p * v.prof;
            saida[o + 2] = this.gvx[i];
            saida[o + 3] = this.gvy[i] - this.gvp[i] * v.prof;
            saida[o + 4] = (this.gtam[i] * v.d) / Math.max(0.3, v.d + p);
            saida[o + 5] = alfa;
            saida[o + 6] = tipo;
        }
        return [nf, na] as const;
    }
}
