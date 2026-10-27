// as curvas de movimento (nos nomes do GSAP: power2 = cúbica, power3 = quártica) e a do CSS, e um registro de animações
// por chave: começar uma animação nova na mesma chave encerra a anterior (o overwrite do GSAP)
import { animate, type AnimationPlaybackControlsWithThen } from 'motion';

export type Curva = (x: number) => number;

export const power2Out: Curva = x => 1 - (1 - x) ** 3;
export const power3Out: Curva = x => 1 - (1 - x) ** 4;
export const power3InOut: Curva = x => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2);
// a do lenis.scrollTo dos botões do índice (expo.out de 1,5 s)
export const expoOut: Curva = x => Math.min(1, 1.001 - 2 ** (-10 * x));
// a --easeOutQuart do fa.css (é outra curva: difere da power3.out em até 0,044)
export const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;

export const ramp = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const vivas = new Map<string, AnimationPlaybackControlsWithThen>();

// anima e guarda pela chave; a anterior da mesma chave para no valor em que estava
export function animar(chave: string, ...args: Parameters<typeof animate>): AnimationPlaybackControlsWithThen {
    vivas.get(chave)?.stop();
    const a = (animate as (...p: unknown[]) => AnimationPlaybackControlsWithThen)(...args);
    vivas.set(chave, a);
    return a;
}

export function parar(chave: string) {
    vivas.get(chave)?.stop();
    vivas.delete(chave);
}
