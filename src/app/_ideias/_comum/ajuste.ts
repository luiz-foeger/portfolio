// acha o tamanho de fonte em que a linha ocupa a largura pedida. Mede de novo no tamanho achado, porque a proporção
// muda com o tamanho nas fontes com tamanho óptico automático (a Bricolage alarga as letras quando fica pequena).
// medir: o elemento da linha (vale a largura dele) ou uma função que devolve a largura que precisa caber
export function ajustarLargura(alvo: HTMLElement, medir: HTMLElement | (() => number), largura: number, maximo = Infinity) {
    const medida = typeof medir === 'function' ? medir : () => medir.scrollWidth;
    let tamanho = 100;
    alvo.style.fontSize = `${tamanho}px`;
    for (let i = 0; i < 5; i++) {
        const m = medida();
        if (!m) return;
        const novo = Math.min(maximo, tamanho * (largura / m) * 0.998);
        if (Math.abs(novo - tamanho) < 0.05) break;
        tamanho = novo;
        alvo.style.fontSize = `${tamanho}px`;
    }
}
