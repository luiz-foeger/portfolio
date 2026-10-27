'use client';

// o cabeçalho da página do rumo, com três peças pedidas em 23/10:
// - à direita, o seletor de idioma do site em produção (PT / EN, o ativo aceso e o outro apagado);
// - a logo é a logo animada do site, parada na versão escrita e na altura --logo-h do cabeçalho;
// - o segredo: rolando para cima a partir do topo, entra um pedaço escondido acima do hero. Nele a logo sai do
//   cabeçalho, cresce até o meio da tela e liga a animação de hoje (empilha e alterna com a escrita); rolando de volta,
//   ela encolhe para o cabeçalho e para na versão escrita.
// O resto: o Menu com o hambúrguer e o texto que rola no hover, o menu de cortina com os itens que entram do desfoque
// (no hover de um item, os outros apagam e desfocam e o sublinhado corre). O modo diferença fica sempre ligado, como
// no índice lateral (ver .fa-cab no fim de fa.css): o cabeçalho acompanha o que passa atrás dele, inclusive as imagens
// e o creme do ato da escala, que ficam por cima do fundo de cores da página
import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import { aCadaQuadro, geo, rolagem, rolarPara } from './laco';
import { power3Out } from './movimento';
import { Rola, rolarTexto } from './Pecas';
import { LogoViva } from '../_comp/LogoViva';
import { useIdioma } from '../../_lib/idioma';
import { textosDoRumo, type Alvo } from '../_lib/textos';
import { useTrocaDeIdioma, useTrocou } from '../_lib/troca';

// a largura da logo grande no segredo, em fração da tela
const LARGURA_HERO = { desktop: 0.5, celular: 0.82 };
const suave = (x: number) => x * x * (3 - 2 * x);
// o desenho da logo animada (3800 × 1200) na escala da logo escrita (2580 × 890 na altura --logo-h do cabeçalho)
const ALTURA_DESENHO = 'calc(var(--logo-h) * 1200 / 890)';
const LARGURA_DESENHO = 'calc(var(--logo-h) * 3800 / 890)';

export default function Cabecalho() {
    const { idioma, definir } = useIdioma();
    const t = textosDoRumo(idioma);
    const cab = useRef<HTMLElement>(null);
    const menu = useRef<HTMLDivElement>(null);
    const rotulo = useRef<HTMLSpanElement>(null);
    const caixaLogo = useRef<HTMLAnchorElement>(null);
    const logo = useRef<HTMLDivElement>(null);
    const desenho = useRef<HTMLDivElement>(null);
    const [aberto, setAberto] = useState(false);
    const [viva, setViva] = useState(false);
    const abertoRef = useRef(false);

    // a troca de idioma com o menu aberto: os itens reaparecem pelo desfoque com a entrada do hero, como as outras seções
    // (sem limpar o estilo no fim, porque fechado o CSS os deixa apagados), e o rótulo "Fechar"/"Close" também
    // (_lib/troca.ts)
    const trocou = useTrocou();
    useEffect(() => {
        const m = menu.current;
        if (!trocou || !abertoRef.current || !m) return;
        const itens = [...m.querySelectorAll<HTMLElement>('button')];
        const a = itens.map((it, i) => animate(it, { opacity: [0, 1], filter: ['blur(10px)', 'blur(0px)'] }, { duration: 1.8, ease: power3Out, delay: 0.05 * i }));
        return () => a.forEach(x => x.stop());
    }, [trocou]);
    useTrocaDeIdioma(cab, '[data-menu] .fa-rola-externa');

    // o segredo da logo. Ela cresce mudando o tamanho de verdade (não com scale), para o desenho ser refeito a cada
    // quadro e ficar nítido o caminho todo. Com o menu aberto, ela volta ao cabeçalho e para (em ~0,5 s), para não
    // brigar com os itens
    useEffect(() => {
        let ativa = false;
        let fechado = 1;
        return aCadaQuadro(({ y, dt }) => {
            const seg = geo.s.segredo;
            const caixa = caixaLogo.current, el = logo.current, d = desenho.current;
            if (!seg.h || !caixa || !el || !d) return;
            fechado += ((abertoRef.current ? 0 : 1) - fechado) * (1 - Math.exp(-dt / 0.15));
            const p = suave(Math.min(1, Math.max(0, 1 - y / seg.h))) * fechado;
            if (p <= 0.0005) {
                el.style.transform = '';
                d.style.height = ALTURA_DESENHO;
                d.style.width = LARGURA_DESENHO;
            } else {
                const r = caixa.getBoundingClientRect();
                const alvo = (geo.vw < 768 ? LARGURA_HERO.celular : LARGURA_HERO.desktop) * geo.vw;
                const escala = 1 + p * (alvo / r.width - 1);
                const dx = p * (geo.vw / 2 - (r.left + r.width / 2));
                const dy = p * (geo.vh / 2 - (r.top + r.height / 2));
                el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
                d.style.height = `${((r.height * 1200) / 890) * escala}px`;
                d.style.width = `${((r.height * 3800) / 890) * escala}px`;
            }
            // com folga, para não ligar e desligar na borda
            if (!ativa && p > 0.6) { ativa = true; setViva(true); }
            else if (ativa && p < 0.3) { ativa = false; setViva(false); }
        });
    }, []);

    const passarHamburguer = (e: React.MouseEvent<HTMLElement>) => {
        const [l1, l2] = e.currentTarget.querySelectorAll<HTMLElement>('.fa-hamburguer i');
        if (!l1 || !l2) return;
        animate([
            [l1, { x: ['0%', '105%'] }, { duration: 0.4, ease: power3Out, at: 0 }],
            [l2, { x: ['0%', '105%'] }, { duration: 0.4, ease: power3Out, at: 0.1 }],
            [l1, { x: ['-105%', '0%'] }, { duration: 0.4, ease: power3Out, at: 0.5 }],
            [l2, { x: ['-105%', '0%'] }, { duration: 0.4, ease: power3Out, at: 0.6 }],
        ]);
        rolarTexto(1.2)(e);
    };

    const alternar = () => {
        const abrir = !abertoRef.current;
        abertoRef.current = abrir;
        setAberto(abrir);
        const m = menu.current;
        if (!m) return;
        const itens = m.querySelectorAll<HTMLElement>('button');
        if (abrir) {
            rolagem.lenis?.stop();
            m.style.visibility = 'visible';
            animate(100, 0, { duration: 1.4, ease: power3Out, onUpdate: v => (m.style.clipPath = `inset(0 0 ${v}% 0)`) });
            itens.forEach((it, i) =>
                animate(it, { opacity: [0, 1], filter: ['blur(10px)', 'blur(0px)'] }, { duration: 0.5, ease: x => 1 - (1 - x) ** 2, delay: 0.3 + 0.05 * i }),
            );
        } else {
            rolagem.lenis?.start();
            animate(0, 100, {
                duration: 0.8,
                ease: power3Out,
                onUpdate: v => (m.style.clipPath = `inset(0 0 ${v}% 0)`),
                onComplete: () => {
                    if (!abertoRef.current) {
                        m.style.visibility = 'hidden';
                        itens.forEach(it => {
                            it.style.opacity = '0';
                            it.style.filter = 'blur(10px)';
                        });
                    }
                },
            });
        }
        const r = rotulo.current;
        if (r) {
            const [a, b] = r.children as unknown as HTMLElement[];
            animate(a, { y: abrir ? ['0%', '-100%'] : ['-100%', '0%'] }, { duration: 1.2, ease: power3Out });
            animate(b, { y: abrir ? ['100%', '0%'] : ['0%', '100%'] }, { duration: 1.2, ease: power3Out });
        }
    };

    const ir = (alvo: Alvo) => () => {
        alternar();
        const s = geo.s[alvo];
        if (!s) return;
        window.setTimeout(() => rolarPara(s.top), 350);
    };

    useEffect(() => {
        const tecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && abertoRef.current) alternar();
        };
        window.addEventListener('keydown', tecla);
        return () => window.removeEventListener('keydown', tecla);
    });

    return (
        <>
            <div ref={menu} className="fa-menu" aria-hidden={!aberto}>
                <div className="fa-menu-lista">
                    {t.itens.map(m => (
                        <button key={m.alvo} type="button" onClick={ir(m.alvo)} tabIndex={aberto ? 0 : -1}>
                            <span className="fa-sublinha">{m.texto}</span>
                        </button>
                    ))}
                </div>
            </div>
            <header ref={cab} className="fa-cab" data-menu={aberto ? '' : undefined}>
                <button type="button" className="fa-cab-menu" onMouseEnter={passarHamburguer} onClick={alternar} aria-expanded={aberto}>
                    <span className="fa-hamburguer" aria-hidden>
                        <span>
                            <i />
                        </span>
                        <span>
                            <i />
                        </span>
                    </span>
                    <span ref={rotulo} className="fa-rola-externa">
                        <span>
                            <Rola texto={t.menu} />
                        </span>
                        <span aria-hidden>
                            <Rola texto={t.fechar} />
                        </span>
                    </span>
                </button>
                <a
                    ref={caixaLogo}
                    href="#hero"
                    className="fa-cab-logo relative"
                    style={{ width: 'calc(var(--logo-h) * 2580 / 890)' }}
                    aria-label="Föeger"
                    onClick={e => {
                        e.preventDefault();
                        // com o menu aberto, a logo também o fecha (e vai ao topo depois da cortina, como os itens)
                        if (abertoRef.current) {
                            alternar();
                            window.setTimeout(() => rolarPara(geo.s.hero.top), 350);
                        } else rolarPara(geo.s.hero.top);
                    }}
                >
                    {/* o desenho da logo animada é mais largo (3800 × 1200) que a caixa da logo escrita (2580 × 890): na
                        mesma escala, a versão escrita fica do tamanho da caixa */}
                    <div ref={logo} className="absolute left-1/2 top-1/2 h-0 w-0">
                        <div ref={desenho} className="absolute left-0 top-0" style={{ height: ALTURA_DESENHO, width: LARGURA_DESENHO, transform: 'translate(-50%, -50%)' }}>
                            <LogoViva ativo={viva} />
                        </div>
                    </div>
                </a>
                <span className="fa-cab-chat flex items-center gap-[0.4em] uppercase" role="group" aria-label="Idioma / Language">
                    {(['pt', 'en'] as const).map((i, n) => (
                        <span key={i} className="flex items-center gap-[0.4em]">
                            {n > 0 && <span aria-hidden className="opacity-30">/</span>}
                            <button
                                type="button"
                                onClick={() => definir(i)}
                                aria-pressed={idioma === i}
                                lang={i === 'pt' ? 'pt-BR' : 'en'}
                                className={`uppercase transition-opacity ${idioma === i ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
                            >
                                {i}
                            </button>
                        </span>
                    ))}
                </span>
            </header>
        </>
    );
}
