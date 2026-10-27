// a água do barquinho do rodapé como superfície (27/10; antes era uma linha só, a da onda dele): o plano do mar em
// volta da linha em que ele navega, em largura (X) e profundidade (Z), nas unidades do mundo das ondas (as de
// _comp/FundoOndas.tsx: a profundidade é a distância Z das ondas, e a altura é para cima).
// - A equação da onda em duas dimensões: um impacto sai como um anel que se abre em todas as direções da superfície (na
//   tela, uma elipse achatada pela perspectiva) e, por ser 2D, deixa anéis menores atrás dele;
// - amortecimento leve, uma mola fraca que traz tudo de volta ao zero e uma esponja nas quatro bordas;
// - passos fixos de 1/60 s, com integração simplética (velocidade e depois altura); quem mexe na água (o casco, as
//   gotas) mexe entre os passos, no aCada do passo;
// - as células podem ser mais longas em Z que em X: a perspectiva achata a profundidade na tela, e com elas do mesmo
//   tamanho na tela a grade fica pequena;
// - o empurrar soma velocidade num sino elíptico; o empurrarAnel, num sino com um anel em volta que devolve o volume (o
//   meio desce e a água que ele tira sobe em volta); o levantarAnel ergue um anel que já sai correndo para fora (a
//   coroa de uma batida); o espalharAnel reparte uma quantidade num anel em volta de um ponto (a água que o casco tira).
// O ponto (i, j) fica em (x0 + i·hx, z0 + j·hz); a leitura é bilinear, a mesma do shader com o filtro linear.

export const PASSO_DA_AGUA = 1 / 60;
// a velocidade das ondas (unidades do mundo por segundo), o amortecimento (1/s), a mola de volta ao zero (1/s²), a
// esponja das bordas (a fração da grade e o amortecimento máximo) e o limite da altura (unidades)
const C = 0.8;
const AMORTECE = 0.5;
const VOLTA = 2;
const ESPONJA = { fracao: 0.12, maximo: 10 };
const LIMITE = 0.25;
// o máximo de passos num quadro (a mais, a água anda devagar em vez de explodir), de células e de Courant (a
// estabilidade: c·dt·√(1/hx² + 1/hz²))
const PASSOS = 6;
const MAX_CELULAS = 10000;
const COURANT = 0.7;

export class Agua2D {
    nx = 2;
    nz = 2;
    x0 = 0;
    z0 = 0;
    hx = 1;
    hz = 1;
    alt = new Float32Array(4);
    v = new Float32Array(4);
    private esponja = new Float32Array(4);
    private acumulado = 0;

    // a área (x0 a x1 e z0 a z1, em unidades do mundo) e o tamanho desejado das células; a grade cabe no máximo de
    // células e no limite de estabilidade, e recomeça parada
    configurar(x0: number, x1: number, z0: number, z1: number, hx: number, hz: number) {
        let k = Math.sqrt(Math.max(1, ((x1 - x0) / hx) * ((z1 - z0) / hz) / MAX_CELULAS));
        k = Math.max(k, (C * PASSO_DA_AGUA * Math.sqrt(1 / (hx * hx) + 1 / (hz * hz))) / COURANT);
        const nx = Math.max(8, Math.round((x1 - x0) / (hx * k)) + 1), nz = Math.max(8, Math.round((z1 - z0) / (hz * k)) + 1);
        this.x0 = x0;
        this.z0 = z0;
        this.hx = (x1 - x0) / (nx - 1);
        this.hz = (z1 - z0) / (nz - 1);
        this.nx = nx;
        this.nz = nz;
        const n = nx * nz;
        this.alt = new Float32Array(n);
        this.v = new Float32Array(n);
        this.esponja = new Float32Array(n);
        const bx = Math.max(2, Math.round(nx * ESPONJA.fracao)), bz = Math.max(2, Math.round(nz * ESPONJA.fracao));
        for (let j = 0; j < nz; j++)
            for (let i = 0; i < nx; i++) {
                const dx = Math.min(i, nx - 1 - i), dz = Math.min(j, nz - 1 - j);
                const t = Math.max(dx < bx ? 1 - dx / bx : 0, dz < bz ? 1 - dz / bz : 0);
                this.esponja[j * nx + i] = AMORTECE + ESPONJA.maximo * t * t;
            }
        this.acumulado = 0;
    }

    passo(dt: number, aCada?: (dt: number) => void) {
        this.acumulado = Math.min(this.acumulado + dt, PASSOS * PASSO_DA_AGUA);
        while (this.acumulado >= PASSO_DA_AGUA) {
            this.acumulado -= PASSO_DA_AGUA;
            aCada?.(PASSO_DA_AGUA);
            this.umPasso(PASSO_DA_AGUA);
        }
    }

    private umPasso(dt: number) {
        const { nx, nz, alt, v, esponja } = this;
        const ix = (C * C) / (this.hx * this.hx), iz = (C * C) / (this.hz * this.hz);
        // a velocidade pela laplaciana da altura de antes (com as bordas espelhadas, sem fluxo), e depois a altura
        for (let j = 0; j < nz; j++) {
            const o = j * nx, jm = (j > 0 ? j - 1 : 1) * nx, jp = (j < nz - 1 ? j + 1 : nz - 2) * nx;
            for (let i = 0; i < nx; i++) {
                const k = o + i, a = alt[k];
                const e = alt[o + (i > 0 ? i - 1 : 1)], d = alt[o + (i < nx - 1 ? i + 1 : nx - 2)];
                v[k] += ((e - 2 * a + d) * ix + (alt[jm + i] - 2 * a + alt[jp + i]) * iz - esponja[k] * v[k] - VOLTA * a) * dt;
            }
        }
        for (let k = 0; k < nx * nz; k++) {
            const h = alt[k] + v[k] * dt;
            alt[k] = h > LIMITE ? LIMITE : h < -LIMITE ? -LIMITE : h;
        }
    }

    // a altura (unidades, para cima) e a velocidade (unidades por segundo) da água no ponto (X, Z); fora da grade, zero
    altura(X: number, Z: number) {
        return this.ler(this.alt, X, Z);
    }

    velocidade(X: number, Z: number) {
        return this.ler(this.v, X, Z);
    }

    private ler(arr: Float32Array, X: number, Z: number) {
        const fx = (X - this.x0) / this.hx, fz = (Z - this.z0) / this.hz;
        if (!(fx >= 0 && fz >= 0 && fx <= this.nx - 1 && fz <= this.nz - 1)) return 0;
        const i = Math.min(this.nx - 2, Math.floor(fx)), j = Math.min(this.nz - 2, Math.floor(fz));
        const tx = fx - i, tz = fz - j, k = j * this.nx + i;
        const a = arr[k] + (arr[k + 1] - arr[k]) * tx, b = arr[k + this.nx] + (arr[k + this.nx + 1] - arr[k + this.nx]) * tx;
        return a + (b - a) * tz;
    }

    // cada célula num retângulo em volta de (X, Z), com a distância a ele em raios (rx, rz)
    private emVolta(X: number, Z: number, alcanceX: number, alcanceZ: number, rx: number, rz: number, cada: (k: number, tx: number, tz: number) => void) {
        const i0 = Math.max(0, Math.floor((X - alcanceX - this.x0) / this.hx)), i1 = Math.min(this.nx - 1, Math.ceil((X + alcanceX - this.x0) / this.hx));
        const j0 = Math.max(0, Math.floor((Z - alcanceZ - this.z0) / this.hz)), j1 = Math.min(this.nz - 1, Math.ceil((Z + alcanceZ - this.z0) / this.hz));
        for (let j = j0; j <= j1; j++)
            for (let i = i0; i <= i1; i++) cada(j * this.nx + i, (this.x0 + i * this.hx - X) / rx, (this.z0 + j * this.hz - Z) / rz);
    }

    // soma uma velocidade (unidades por segundo, para cima) num sino elíptico de raios rx e rz em volta de (X, Z); os
    // raios não ficam menores que a célula
    empurrar(X: number, Z: number, dv: number, rx: number, rz: number) {
        rx = Math.max(rx, this.hx);
        rz = Math.max(rz, this.hz);
        this.emVolta(X, Z, 2.5 * rx, 2.5 * rz, rx, rz, (k, tx, tz) => {
            this.v[k] += dv * Math.exp(-tx * tx - tz * tz);
        });
    }

    // o mesmo, com um anel do dobro dos raios que devolve o volume: a soma do que muda é zero
    empurrarAnel(X: number, Z: number, dv: number, rx: number, rz: number) {
        rx = Math.max(rx, this.hx);
        rz = Math.max(rz, this.hz);
        this.empurrar(X, Z, dv, rx, rz);
        this.empurrar(X, Z, -0.25 * dv, 2 * rx, 2 * rz);
    }

    // o perfil do anel: 1 no raio e zero a 45% dele para dentro e para fora
    private static noAnel(tx: number, tz: number) {
        const r = Math.sqrt(tx * tx + tz * tz) - 1, u = 1 - (r * r) / 0.2;
        return u > 0 ? u * u : 0;
    }

    // ergue um anel elíptico de altura a (unidades) e raios rx e rz em volta de (X, Z), já com a velocidade de uma onda
    // que sai (−c·∂altura/∂r): sem a metade que voltaria para o meio e se juntaria ali num esguicho
    levantarAnel(X: number, Z: number, a: number, rx: number, rz: number) {
        rx = Math.max(rx, 2 * this.hx);
        rz = Math.max(rz, 2 * this.hz);
        const R = Math.sqrt(rx * rz);
        this.emVolta(X, Z, 1.5 * rx, 1.5 * rz, rx, rz, (k, tx, tz) => {
            const u = Math.sqrt(tx * tx + tz * tz) - 1, q = 1 - 5 * u * u;
            if (q <= 0) return;
            this.alt[k] += a * q * q;
            this.v[k] += (C * a * 20 * u * q) / R;
        });
    }

    // reparte a soma total (de velocidades, somadas célula a célula) num anel elíptico de raios rx e rz em volta de (X, Z)
    espalharAnel(X: number, Z: number, total: number, rx: number, rz: number) {
        rx = Math.max(rx, 2 * this.hx);
        rz = Math.max(rz, 2 * this.hz);
        let soma = 0;
        this.emVolta(X, Z, 1.5 * rx, 1.5 * rz, rx, rz, (_, tx, tz) => {
            soma += Agua2D.noAnel(tx, tz);
        });
        if (soma <= 0) return;
        this.emVolta(X, Z, 1.5 * rx, 1.5 * rz, rx, rz, (k, tx, tz) => {
            this.v[k] += (total * Agua2D.noAnel(tx, tz)) / soma;
        });
    }

    zerar() {
        this.alt.fill(0);
        this.v.fill(0);
    }
}
