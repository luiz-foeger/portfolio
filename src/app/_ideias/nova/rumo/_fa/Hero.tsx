'use client';

// o hero, que agora também é o manifesto, com o texto nos dois idiomas (_lib/textos.ts): uma escada de quatro linhas,
// 11rem em caixa alta com recuos de 25,9 / 33,3 / 26,7 / 42,9rem num bloco de 129,6rem, a palavra da escala na
// segunda linha e a janela na terceira; o canto de cima convida a rolar e o de baixo fica com o ano. Nas telas
// pequenas a escada inteira cresce até ocupar a largura (os ajustes no fim de fa.css). A página remonta o hero quando
// o idioma troca.
// A entrada, por tempo a partir do PLAY:
// - as palavras: opacidade e desfoque de 10 px juntos, 1,8 s power3.out, 0,05 s entre elas na ordem do DOM;
// - a janela: cortina dura da esquerda para a direita, 1,4 s power3.out com atraso de 0,5 s; depois as capas passam
//   de uma para a outra pelo desfoque;
// - os cantos sobem da máscara em 1,4 s (o de cima em 0,6 s, o de baixo em 0,8 s); o separador sobe 12 px e acende;
// - a última palavra troca a cada 2 s depois do fim da entrada (t = 2,8 s): a que sai some com desfoque em 1 s, a que
//   entra aparece em 1,6 s, as duas power3.inOut e no mesmo instante; ela só troca com a página parada no topo.
// Daí em diante a seção é alta e o texto fica preso no meio da tela. Ao rolar, o fundo mergulha nas ondas e o resto do
// texto sobe, desfoca e apaga preso à rolagem (SAIDA), nos dois sentidos; depois de SEGURA começa o ato da escala
// (_comp/Escala.tsx): a palavra da escala dá lugar à cópia dela no ato, idêntica, que desliza até o meio da tela; em volta vêm as barras, os < >, o anel de sinais, o código e
// as capas, todos saindo do desfoque; a palavra troca pelos verbos, cresce e mergulha na haste reta do último mais
// perto do meio dele até a tela ficar creme, e o site segue. Voltando a rolagem, tudo se desfaz.
import { Fragment, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { animate, stagger } from 'motion';
import { aoTocar } from './estado';
import { aCadaQuadro, geo, rolagem } from './laco';
import { power3InOut, power3Out } from './movimento';
import { Palavras } from './Pecas';
import { Escala } from '../_comp/Escala';
import { COR_DA_ABERTURA } from '../_lib/rumo';
import { useIdioma } from '../../_lib/idioma';
import { textosDoRumo } from '../_lib/textos';
import { CAPA_DO_PROJETO } from '../../_lib/midia';

// a janela do hero: as capas (todas 1440 × 900) passando de uma para a outra. Cada uma com o seu enquadramento, em
// pixels da capa: o centro (x, y) e a largura que aparece, escolhidos para a marca do projeto ficar no meio e com altura
// parecida entre elas (as capas têm a marca em tamanhos e lugares diferentes, e cortadas pelo meio, como antes, umas
// sumiam e outras mostravam a barra de rolagem da captura)
const CAPA = { w: 1440, h: 900 };
const RAZAO_DA_JANELA = 22.7 / 7.9;
const JANELA = [
    { src: CAPA_DO_PROJETO.turno, x: 460, y: 385, w: 910 },
    { src: CAPA_DO_PROJETO.aurora, x: 725, y: 512, w: 718 },
    { src: CAPA_DO_PROJETO.tipografia, x: 712, y: 390, w: 1300 },
    { src: CAPA_DO_PROJETO.pulso, x: 400, y: 400, w: 862 },
    { src: CAPA_DO_PROJETO.site, x: 720, y: 448, w: 1080 },
];
// a capa enquadrada, em porcentagens da janela
const enquadrar = ({ x, y, w }: (typeof JANELA)[number]): CSSProperties => {
    const h = w / RAZAO_DA_JANELA;
    return {
        width: `${((CAPA.w / w) * 100).toFixed(3)}%`,
        height: `${((CAPA.h / h) * 100).toFixed(3)}%`,
        left: `${((-(x - w / 2) / w) * 100).toFixed(3)}%`,
        top: `${((-(y - h / 2) / h) * 100).toFixed(3)}%`,
    };
};
// a passagem de uma capa para a outra: a nova vem por cima saindo do desfoque e de um leve zoom, como as palavras
const PASSA = { a_cada: 2.4, duracao: 1.2, desfoque: 10, zoom: 1.08 };
// a rolagem, em svh: o texto parado antes do ato e o ato
const SEGURA = 40;
const ATO = 360;
// a saída do texto presa à rolagem (em alturas de tela a partir do hero): cada peça começa em de + entre × índice, leva
// dura para sair, sobe sobe × altura da tela (um pouco mais a cada peça, o paralaxe) e chega a desfoque px de desfoque;
// a última termina antes do ato (0,4)
const SAIDA = { de: 0.02, entre: 0.022, dura: 0.22, sobe: 0.06, desfoque: 10 };
// a altura das maiúsculas da Inter Tight, em em (a janela usa a mesma, em fa.css)
const ALTURA_DAS_MAIUSCULAS = 0.7275;
const suave = (x: number) => x * x * (3 - 2 * x);
// a letra do hero (.fa-hero h1 em fa.css), para as palavras soltas do ato saírem iguais
const ESTILO: CSSProperties = {
    fontSize: 'calc(11 * var(--fa-r))',
    fontWeight: 600,
    lineHeight: '0.9em',
    letterSpacing: 'calc(-0.33 * var(--fa-r))',
    textTransform: 'uppercase',
};

export default function Hero() {
    const HERO = textosDoRumo(useIdioma().idioma).hero;
    const raiz = useRef<HTMLDivElement>(null);
    const janela = useRef<HTMLSpanElement>(null);

    // o progresso do ato, lido da rolagem do quadro (o ato registra o laço dele antes deste)
    const progressoDoAto = useCallback(() => {
        const s = geo.s.hero;
        return Math.min(1, Math.max(0, (rolagem.y - s.top - (geo.vh * SEGURA) / 100) / ((geo.vh * ATO) / 100)));
    }, []);

    useEffect(() => {
        const r = raiz.current;
        if (!r) return;
        const timers: number[] = [];
        let intervalo: number | undefined;
        let vivo = true;
        let pronto = false;
        // em repouso: a página parada no topo do hero (a troca automática só roda aí)
        let repouso = true;

        const trocas = [...r.querySelectorAll<HTMLElement>('.fa-hero-troca > span')];
        let atual = 0;
        const trocar = () => {
            const k = (atual + 1) % trocas.length;
            animate(trocas[atual], { opacity: 0, filter: 'blur(10px)' }, { duration: 1, ease: power3InOut });
            animate(trocas[k], { opacity: 1, filter: 'blur(0px)' }, { duration: 1.6, ease: power3InOut });
            atual = k;
        };
        const liga = () => {
            if (pronto && repouso && !document.hidden && intervalo === undefined) intervalo = window.setInterval(trocar, 2000);
        };
        const desliga = () => {
            window.clearInterval(intervalo);
            intervalo = undefined;
        };
        const aba = () => (document.hidden ? desliga() : liga());
        document.addEventListener('visibilitychange', aba);

        // a janela: a capa nova vem por cima da anterior saindo do desfoque; quando ela assenta, a anterior apaga
        const fotos = [...(janela.current?.querySelectorAll('img') ?? [])];
        let foto = 0;
        if (fotos[0]) fotos[0].style.opacity = '1';
        const passar = () => {
            const antes = fotos[foto];
            foto = (foto + 1) % fotos.length;
            const nova = fotos[foto];
            fotos.forEach(f => (f.style.zIndex = f === nova ? '2' : f === antes ? '1' : '0'));
            animate(nova, { opacity: [0, 1], filter: [`blur(${PASSA.desfoque}px)`, 'blur(0px)'], scale: [PASSA.zoom, 1] }, { duration: PASSA.duracao, ease: power3InOut }).then(() => {
                if (fotos[foto] === nova) antes.style.opacity = '0';
            });
        };
        const reel = window.setInterval(passar, PASSA.a_cada * 1000);

        const desligarPlay = aoTocar(() => {
            if (!vivo) return;
            animate(r.querySelectorAll('h1 .fa-w'), { opacity: [0, 1], filter: ['blur(10px)', 'blur(0px)'] }, { duration: 1.8, ease: power3Out, delay: stagger(0.05) });
            const j = janela.current;
            if (j)
                animate(0, 1.4, {
                    duration: 1.4,
                    delay: 0.5,
                    ease: power3Out,
                    onUpdate: p => (j.style.clipPath = `inset(0 ${((1 - Math.min(p, 1)) * 100).toFixed(3)}% 0 0)`),
                });
            animate(r.querySelectorAll('.fa-hero-idiomas .fa-linha'), { y: ['105%', '0%'] }, { duration: 1.4, ease: power3Out, delay: 0.6 });
            // o separador só existe com mais de um texto no canto de cima
            const sep = r.querySelectorAll('.fa-hero-sep');
            if (sep.length) animate(sep, { y: [12, 0], opacity: [0, 1] }, { duration: 1.6, ease: power3Out, delay: 0.6 });
            animate(r.querySelectorAll('.fa-hero-desde .fa-linha'), { y: ['105%', '0%'] }, { duration: 1.4, ease: power3Out, delay: 0.8 });
            timers.push(
                window.setTimeout(() => {
                    pronto = true;
                    liga();
                }, 2800),
            );
        });

        // ao rolar: a troca para; enquanto o fundo mergulha nas ondas (_comp/FundoOndas.tsx), o resto do texto fica acima
        // da superfície: cada peça sobe, desfoca e apaga presa à rolagem, uma depois da outra na ordem do DOM, e volta
        // pelo mesmo caminho ao rolar para cima. A palavra da escala fica, e no ato dá lugar à cópia dela
        const saidas = [...r.querySelectorAll<HTMLElement>('[data-sai]')];
        const daEscala = r.querySelector<HTMLElement>('[data-palavra]');
        const fases = saidas.map(() => -1);
        let noAto = false;

        // os cantos junto da escada (a partir de 768 px; abaixo, eles vão acima e abaixo dela, em fa.css): o de cima
        // termina junto com o fim da segunda linha e fica logo acima da primeira (que agora vai até quase o fim); o de baixo começa junto
        // com a terceira linha e assenta na linha de base da última. As medidas dependem do texto (cada idioma tem as
        // suas larguras), por isso são lidas na tela: depois das fontes, a cada mudança de tamanho, e sempre com o texto
        // parado (a saída mexe nas peças)
        const linhas = [...r.querySelectorAll<HTMLElement>('h1 .fa-hero-linha')];
        const cantoTopo = r.querySelector<HTMLElement>('.fa-hero-idiomas');
        const cantoBaixo = r.querySelector<HTMLElement>('.fa-hero-desde');
        const linhaDeBase = (linha: HTMLElement) => {
            const marca = document.createElement('span');
            marca.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
            linha.appendChild(marca);
            const y = marca.getBoundingClientRect().top;
            marca.remove();
            return y;
        };
        // a palavra da escala no meio da largura do palco (a tela): o recuo da segunda linha leva o centro dela ao meio;
        // a altura fica a da escada. Repete algumas vezes porque no celular o bloco se ajusta à linha mais larga, e mudar
        // o recuo muda a largura dele
        const centralizar = () => {
            const palavra = r.querySelector<HTMLElement>('[data-palavra]');
            const palco = r.parentElement;
            if (!palavra || !palco || linhas.length < 2) return;
            linhas[1].style.paddingLeft = '';
            for (let k = 0; k < 4; k++) {
                const p = palco.getBoundingClientRect();
                const b = palavra.getBoundingClientRect();
                const dx = p.left + p.width / 2 - (b.left + b.width / 2);
                if (Math.abs(dx) < 0.5) break;
                linhas[1].style.paddingLeft = `${Math.max(0, parseFloat(getComputedStyle(linhas[1]).paddingLeft) + dx).toFixed(1)}px`;
            }
        };
        // no celular a escada inteira encolhe (o --fa-r da seção) até a parte mais larga caber com 14 px de cada lado:
        // com a palavra da escala no meio, a segunda linha ganha um recuo grande, e as linhas mudam de largura por idioma
        const caber = () => {
            const secao = r.closest('section');
            if (!secao) return;
            secao.style.removeProperty('--fa-r');
            centralizar();
            if (window.innerWidth >= 768) return;
            for (let k = 0; k < 3; k++) {
                const caixa = r.getBoundingClientRect();
                const direita = Math.max(...linhas.map(l => (l.lastElementChild ?? l).getBoundingClientRect().right));
                const largura = direita - caixa.left;
                const cabe = window.innerWidth - 28;
                if (largura <= cabe + 0.5) break;
                const rem = parseFloat(getComputedStyle(linhas[0]).fontSize) / 11;
                secao.style.setProperty('--fa-r', `${((rem * cabe) / largura).toFixed(3)}px`);
                centralizar();
            }
        };
        const encaixarCantos = () => {
            caber();
            if (!cantoTopo || !cantoBaixo || linhas.length < 4) return;
            const cantos = [cantoTopo, cantoBaixo];
            cantos.forEach(c => (c.style.top = c.style.right = c.style.bottom = c.style.left = ''));
            if (window.innerWidth < 768) return;
            const caixa = r.getBoundingClientRect();
            const fonte = parseFloat(getComputedStyle(linhas[0]).fontSize);
            const fim = [...linhas[1].querySelectorAll<HTMLElement>('.fa-w')].pop()?.getBoundingClientRect().right ?? caixa.right;
            const inicio = linhas[2].querySelector<HTMLElement>('.fa-w')?.getBoundingClientRect().left ?? caixa.left;
            cantoTopo.style.right = `${(caixa.right - fim).toFixed(1)}px`;
            cantoTopo.style.top = `${(linhaDeBase(linhas[0]) - ALTURA_DAS_MAIUSCULAS * fonte - 0.22 * fonte - cantoTopo.offsetHeight - caixa.top).toFixed(1)}px`;
            cantoBaixo.style.left = `${(inicio - caixa.left).toFixed(1)}px`;
            cantoBaixo.style.bottom = 'auto';
            cantoBaixo.style.top = `${(linhaDeBase(linhas[3]) - cantoBaixo.offsetHeight - caixa.top).toFixed(1)}px`;
        };
        let medir = true;
        const remedir = () => (medir = true);
        document.fonts.ready.then(remedir);
        window.addEventListener('resize', remedir);

        const desligarLaco = aCadaQuadro(({ y }) => {
            const s = geo.s.hero;
            if (!s.h) return;
            const parado = y <= s.top + 0.02 * geo.vh;
            if (parado !== repouso) {
                repouso = parado;
                if (repouso) liga();
                else desliga();
            }
            const rolado = (y - s.top) / geo.vh;
            if (medir && rolado <= SAIDA.de) {
                medir = false;
                encaixarCantos();
            }
            saidas.forEach((el, i) => {
                const inicio = SAIDA.de + SAIDA.entre * i;
                const e = suave(Math.min(1, Math.max(0, (rolado - inicio) / SAIDA.dura)));
                if (Math.abs(e - fases[i]) < 0.0005) return;
                fases[i] = e;
                el.style.opacity = e > 0 ? (1 - e).toFixed(3) : '';
                el.style.filter = e > 0 ? `blur(${(SAIDA.desfoque * e).toFixed(2)}px)` : '';
                el.style.transform = e > 0 ? `translateY(${(-SAIDA.sobe * (1 + 0.12 * i) * e * geo.vh).toFixed(1)}px)` : '';
            });
            const d = progressoDoAto();
            if (d > 0 === noAto) return;
            noAto = d > 0;
            if (daEscala) daEscala.style.visibility = noAto ? 'hidden' : '';
        });

        return () => {
            vivo = false;
            desligarPlay();
            desligarLaco();
            desliga();
            document.removeEventListener('visibilitychange', aba);
            window.removeEventListener('resize', remedir);
            window.clearInterval(reel);
            timers.forEach(t => window.clearTimeout(t));
        };
    }, [progressoDoAto]);

    const [l1, l2, l3] = HERO.linhas;
    return (
        <section id="hero" style={{ height: `${100 + SEGURA + ATO}svh` }}>
            <div className="fa-hero-palco">
                <div ref={raiz} className="fa-hero">
                    <h1>
                        <span className="fa-hero-linha" data-sai>
                            {l1.map((w, i) => (
                                <Fragment key={i}>
                                    {i > 0 && ' '}
                                    <span className={w === '—' ? 'fa-w fa-hero-traco' : 'fa-w'}>{w}</span>
                                </Fragment>
                            ))}
                        </span>
                        <span className="fa-hero-linha">
                            {/* a palavra da escala (a primeira que não é o traço) fica no meio da largura da tela
                                (centralizar), onde o ato a copia (data-palavra) sem deslocá-la para os lados */}
                            {l2.map((w, i) => (
                                <Fragment key={i}>
                                    {i > 0 && ' '}
                                    {i === l2.findIndex(x => x !== '—') ? (
                                        <span className="fa-w" data-palavra="">
                                            {w}
                                        </span>
                                    ) : (
                                        <span data-sai className="inline-block">
                                            <span className={w === '—' ? 'fa-w fa-hero-traco' : 'fa-w'}>{w}</span>
                                        </span>
                                    )}
                                </Fragment>
                            ))}
                        </span>
                        <span className="fa-hero-linha">
                            <span data-sai className="inline-block">
                                <Palavras texto={l3.join(' ')} />
                            </span>
                            <span data-sai className="inline-block">
                                <span ref={janela} className="fa-hero-janela" aria-hidden>
                                    {JANELA.map((c, i) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img key={i} src={c.src} alt="" style={enquadrar(c)} />
                                    ))}
                                </span>
                            </span>
                        </span>
                        <span className="fa-hero-linha" data-sai>
                            <span className="fa-hero-troca">
                                {HERO.troca.map(t => (
                                    <span key={t}>
                                        <span className="fa-w">{t}</span>
                                    </span>
                                ))}
                            </span>
                        </span>
                    </h1>
                    <p className="fa-hero-idiomas" data-sai>
                        {HERO.cantos.topo.map((c, i) => (
                            <span key={c} style={{ display: 'contents' }}>
                                {i > 0 && <span className="fa-hero-sep" aria-hidden />}
                                <span className="fa-mascara">
                                    <span className="fa-linha">{c}</span>
                                </span>
                            </span>
                        ))}
                    </p>
                    <p className="fa-hero-desde" data-sai>
                        <span className="fa-mascara">
                            <span className="fa-linha">{HERO.cantos.baixo}</span>
                        </span>
                    </p>
                </div>
                {/* o ato: a haste do último verbo cobre a tela com o creme, e o site segue nele com a tinta navy */}
                <Escala progresso={progressoDoAto} texto={raiz} palavra={0} estilo={ESTILO} novas={HERO.verbos} corDoFim={COR_DA_ABERTURA.tinta} tintaDoFim={COR_DA_ABERTURA.fundo} fundo={COR_DA_ABERTURA.fundo} tinta={COR_DA_ABERTURA.tinta} />
            </div>
        </section>
    );
}
