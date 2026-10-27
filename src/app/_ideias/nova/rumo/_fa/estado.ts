// o PLAY da página (o fim da cortina do carregamento): a entrada do hero e do indicador de rolagem partem dele
import { aCadaQuadro, geo } from './laco';

type Funcao = () => void;
const esperando = new Set<Funcao>();
export const pagina = { tocou: false };

export function aoTocar(f: Funcao) {
    if (pagina.tocou) {
        f();
        return () => { };
    }
    esperando.add(f);
    return () => {
        esperando.delete(f);
    };
}

export function tocar() {
    if (pagina.tocou) return;
    pagina.tocou = true;
    esperando.forEach(f => f());
    esperando.clear();
}

// um gatilho "top+=X% bottom", uma vez só: dispara quando o topo do elemento mais a fração X da altura dele
// passa pela base da tela (com X = 30 − 0,3·altura/janela, em %, no componente de texto). `topo` dá o topo no
// documento quando o elemento está dentro de um bloco preso (a medida direta sairia deslocada)
export function umaVez(el: HTMLElement, aoCruzar: Funcao, opcoes: { fracao?: number; topo?: () => number } = {}) {
    let versao = -1;
    let topo = 0;
    let altura = 0;
    let feito = false;
    const desligar = aCadaQuadro(({ y }) => {
        if (feito || !pagina.tocou) return;
        if (versao !== geo.versao) {
            versao = geo.versao;
            const r = el.getBoundingClientRect();
            altura = r.height;
            topo = opcoes.topo ? opcoes.topo() : r.top + y;
        }
        const fracao = opcoes.fracao ?? (30 - 0.3 * (altura / geo.vh)) / 100;
        if (y >= topo + fracao * altura - geo.vh) {
            feito = true;
            desligar();
            aoCruzar();
        }
    });
    return desligar;
}
