'use client';

// o rodapé (26/10), sobre as ondas do hero numa cena própria, "voltar à tona": o hero mergulha nas ondas; o rodapé
// fecha a história ao contrário. Enquanto ele sobe da borda de baixo até o topo da tela, a câmera sobe de debaixo
// d'água (com os feixes de luz e um pouco de desfoque), atravessa a superfície e termina um pouco acima dela, vendo o mar
// calmo no horizonte. As ondas são a camada de baixo do fundo (_comp/Fundo.tsx, com a cenaDoRodape de
// _comp/FundoOndas.tsx), de tela cheia e reveladas quando o mar da seção de imagens some: dentro do rodapé, a parte de
// baixo delas ficava fora da tela enquanto ele entrava, e a subida não aparecia. O rodapé em si é transparente.
// A composição (a grade, escolhida em 27/10 entre seis; a lista está guardada em C:\pessoal\ideias): o slogan de quatro
// linhas à esquerda (a 12rem) e, do lado direito e na altura dele, o contato com o mesmo peso, alinhado à direita: o
// rótulo, o e-mail grande e o começo de projeto em cima e as redes embaixo, fechando na linha de baixo do slogan; os
// direitos no pé.
// - a palavra troca a cada 5 s (parada com a aba oculta): a que sai some com desfoque em 1 s e a que entra aparece em
//   1,6 s, as duas power3.inOut no mesmo instante;
// - os links: o texto rola (0,7 s power3.out), com os sublinhados que correm (fa.css);
// - a troca de idioma: o rodapé remonta com o idioma (page.tsx), e os textos reaparecem pelo desfoque; na palavra que
//   troca, a animação vai no contêiner, para não mexer no laço dela.
import { useEffect, useRef } from 'react';
import { animate } from 'motion';
import { useIdioma } from '../../_lib/idioma';
import { EMAIL, LINKS } from '../../_lib/textos';
import { textosDoRumo } from '../_lib/textos';
import { useTrocaDeIdioma } from '../_lib/troca';
import { power3InOut } from '../_fa/movimento';
import { Rola, rolarTexto } from '../_fa/Pecas';

export default function Rodape() {
    const r = textosDoRumo(useIdioma().idioma).rodape;
    const rodape = useRef<HTMLElement>(null);
    const troca = useRef<HTMLSpanElement>(null);
    useTrocaDeIdioma(rodape, '[data-idioma]');

    useEffect(() => {
        const palavras = [...(troca.current?.children ?? [])] as HTMLElement[];
        let atual = 0;
        let id: number | undefined;
        const passo = () => {
            const a = palavras[atual];
            const b = palavras[(atual + 1) % palavras.length];
            animate(a, { opacity: 0, filter: 'blur(10px)' }, { duration: 1, ease: power3InOut });
            animate(b, { opacity: [0, 1], filter: ['blur(10px)', 'blur(0px)'] }, { duration: 1.6, ease: power3InOut });
            atual = (atual + 1) % palavras.length;
        };
        const liga = () => {
            if (id === undefined && !document.hidden) id = window.setInterval(passo, 5000);
        };
        const desliga = () => {
            window.clearInterval(id);
            id = undefined;
        };
        const aba = () => (document.hidden ? desliga() : liga());
        document.addEventListener('visibilitychange', aba);
        liga();
        return () => {
            desliga();
            document.removeEventListener('visibilitychange', aba);
        };
    }, []);

    return (
        <footer ref={rodape} id="footer">
            <div className="fa-grade fa-ro-grade">
                <h2 className="fa-ro-slogan">
                    {r.linhas.map(l => (
                        <span key={l} data-idioma>
                            {l}
                        </span>
                    ))}
                    <span ref={troca} className="fa-ro-troca" data-idioma>
                        {r.troca.map(p => (
                            <span key={p}>{p}</span>
                        ))}
                    </span>
                    <span data-idioma>{r.fim}</span>
                </h2>
                <div className="fa-ro-lado">
                    <div className="fa-ro-contato">
                        <span className="fa-ro-rotulo" data-idioma>
                            {r.contato}
                        </span>
                        <a href={`mailto:${EMAIL}`} className="fa-ro-email fa-sublinha" onMouseEnter={rolarTexto(0.7)}>
                            <Rola texto={EMAIL} />
                        </a>
                        <p className="fa-ro-comecar" data-idioma>
                            <a href={`mailto:${EMAIL}`} className="fa-sublinha2" onMouseEnter={rolarTexto(0.7)}>
                                <Rola texto={r.comecar} />
                            </a>
                        </p>
                    </div>
                    <div className="fa-ro-redes">
                        {LINKS.map(l => (
                            <a key={l.texto} href={l.href} target="_blank" rel="noreferrer" className="fa-sublinha2" onMouseEnter={rolarTexto(0.7)}>
                                <Rola texto={l.texto} />
                            </a>
                        ))}
                    </div>
                </div>
                <div className="fa-ro-base">
                    <p className="fa-ro-direitos" data-idioma>
                        {r.direitos}
                    </p>
                </div>
            </div>
        </footer>
    );
}
