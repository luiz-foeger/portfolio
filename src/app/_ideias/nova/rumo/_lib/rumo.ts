// o que mais de um arquivo da tela de teste usa: o trecho (a fração de v entre a e b), as cores da abertura e a luz do
// ato
export const trecho = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

// o navy da bolha e o creme do texto: a abertura (o segredo e o hero) e o manifesto
export const COR_DA_ABERTURA = { fundo: '#051236', tinta: '#FFFDE2' };

// a luz do ato da escala, de 0 a 1: o ato (_comp/Escala.tsx) escreve a cada troca de verbo e as ondas
// (_comp/FundoOndas.tsx) clareiam o azul de debaixo d'água com ela, um passo por verbo, como quem sobe para a superfície
export const luzDoAto = { clareia: 0 };
