// ferramentas sobre o desenho das letras (os caminhos SVG de glifos.ts): os pontos do contorno (para mostrar a
// letra "em edição") e um contorno tremido, para cada cópia de uma letra sair um pouco diferente, como pedra
// cortada à mão
type Ponto = [number, number];

const NUMERO = /-?\d*\.?\d+/g;

// os pontos que ficam em cima do contorno (fim de reta ou de curva), sem os de controle
export function pontosDe(d: string): Ponto[] {
    const pontos: Ponto[] = [];
    const comandos = d.match(/[MLQCZ][^MLQCZ]*/g) ?? [];
    for (const c of comandos) {
        const n = (c.slice(1).match(NUMERO) ?? []).map(Number);
        if (c[0] === 'M' || c[0] === 'L') pontos.push([n[0], n[1]]);
        else if (c[0] === 'Q') pontos.push([n[2], n[3]]);
        else if (c[0] === 'C') pontos.push([n[4], n[5]]);
    }
    return pontos;
}

// ruído fixo por semente
const ruido = (s: number) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x) - 0.5;
};

// cada par de coordenadas anda um pouco, sempre igual para a mesma semente
export function tremer(d: string, semente: number, amplitude = 14): string {
    let i = 0;
    let par = 0;
    return d.replace(NUMERO, m => {
        const eixo = i++ % 2;
        if (eixo === 0) par++;
        return (Number(m) + ruido(semente * 1000 + par * 2 + eixo) * amplitude).toFixed(1);
    });
}
