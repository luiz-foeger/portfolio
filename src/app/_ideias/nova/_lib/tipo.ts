import type { CSSProperties } from 'react';

// a tipografia do site: a Bricolage sozinha, mudando peso, largura e tamanho óptico conforme o papel.
// A família vem do layout (--ff-bricolage-w); a Foeger Sans fica só na logo e na amostra do laboratório
const eixos = (opsz: number, wdth: number, wght: number) => `'opsz' ${opsz}, 'wdth' ${wdth}, 'wght' ${wght}`;

export const TIPO = {
    // estreito e pesado, em caixa alta: a parte brutalista
    titulo: { fontVariationSettings: eixos(96, 75, 800), fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.88, textTransform: 'uppercase' },
    frase: { fontVariationSettings: eixos(96, 100, 700), fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.96 },
    // fina que engrossa perto do mouse (pesoFino)
    fina: { fontVariationSettings: eixos(96, 75, 200), fontWeight: 200, letterSpacing: '-0.015em', lineHeight: 0.88 },
    texto: { fontVariationSettings: eixos(14, 100, 400), fontWeight: 400, letterSpacing: '0', lineHeight: 1.45 },
    menu: { fontVariationSettings: eixos(14, 100, 500), fontWeight: 500, letterSpacing: '0', lineHeight: 1.2 },
    largo: { fontVariationSettings: eixos(96, 100, 800), fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.06, textTransform: 'uppercase' },
} satisfies Record<string, CSSProperties>;

export const PESO_FINO = { de: 200, ate: 800 };
export const pesoFino = (k: number) => eixos(96, 75, Math.round(PESO_FINO.de + (PESO_FINO.ate - PESO_FINO.de) * k));
export const variacao = eixos;
