'use client';

import { useMemo } from 'react';
import { GLIFOS, FALTAM_MAIUSCULAS } from '../../_lib/glifos';
import { pontosDe, tremer } from '../../_lib/caminho';
import { PEDRAS_COR, TEMA } from '../../_lib/tema';
import { FALTAM_OUTRAS } from '../../_lib/textos';
import { ALTO, BAIXO, PedraBruta } from '../Glifo';

// as páginas do espécime, desenhadas numa folha A5 de 420×594 (a mesma no livro da página e no PDF). Os textos
// que aparecem na Föeger Sans usam só o que ela tem (letras, alguns acentos, ponto e vírgula)
export const FOLHA = { w: 420, h: 594 };
const TOTAL = ALTO + BAIXO;
const FOEGER = { fontFamily: 'var(--ff-foeger)' } as const;
const BRICOLAGE = { fontFamily: 'var(--ff-bricolage-w), sans-serif' } as const;
const VERSAO = '001.013';

const TEXTO = {
    pt: {
        especime: 'Espécime',
        processo: 'em processo',
        sumario: 'Sumário',
        secoes: ['Capa', 'Sumário', 'Abertura', 'Alfabeto', 'Acentos', 'Tamanhos', 'Texto', 'Construção', 'Como nasceu', 'Em teste', 'Em uso', 'O que falta', 'Colofão', 'Contracapa'],
        abertura: 'A Föeger Sans é a fonte da logo da Föeger: pesada, de quinas tortas, desenhada à mão letra por letra. Este espécime mostra o que ela já tem e o que ainda falta.',
        maiusculas: 'Maiúsculas',
        minusculas: 'Minúsculas',
        numeros: 'Números e sinais',
        acentos: 'Acentos',
        soltas: 'Pingos, tremas e acentos são pedras à parte, como o ponto da logo.',
        corpo: 'corpo',
        pedra: 'pedra',
        texto: 'Toda pedra começa bruta. Alguém olha para ela, escolhe um lado e começa a cortar. Uma letra também é assim. Esta fonte nasceu de traços desenhados um por quadrado e virou um alfabeto pesado, torto e cheio de personalidade. Ela ainda está em processo, e cada versão nova traz mais pedras.',
        construcao: 'Os pontos do contorno do a, como estão no arquivo da fonte.',
        nasceu: ['Gabarito', 'Contorno', 'Fonte'],
        nasceuTexto: 'Desenhada à mão no Calligraphr, uma letra por quadrado. Cada desenho vira contorno e entra na fonte com a mesma folga dos dois lados.',
        teste: 'Ensaios do que ela pode virar. Nada disso está na fonte ainda.',
        desgaste: 'Desgaste',
        niveis: ['cortada', 'polida', 'gasta'],
        nenhuma: 'Nenhuma igual',
        nenhumaTexto: 'Cada letra repetida sai com um corte diferente.',
        hoje: 'hoje',
        proposta: 'proposta',
        uso: ['Café', 'com', 'pão.'],
        falta: 'Ainda por desenhar',
        passos: ['Maiúsculas acentuadas', 'Pontuação e símbolos', 'Espaçamento e kerning par a par', 'Outros pesos'],
        proximos: 'Próximos passos',
        colofao: [['Fonte', 'Föeger Sans'], ['Versão', VERSAO], ['Feita no', 'Calligraphr'], ['Um projeto da', 'Föeger'], ['Contato', 'foegerluiz@gmail.com']],
    },
    en: {
        especime: 'Specimen',
        processo: 'in progress',
        sumario: 'Contents',
        secoes: ['Cover', 'Contents', 'Opening', 'Alphabet', 'Accents', 'Sizes', 'Text', 'Construction', 'How it was born', 'In testing', 'In use', 'Still missing', 'Colophon', 'Back cover'],
        abertura: 'Föeger Sans is the typeface behind the Föeger logo: heavy, with crooked corners, drawn by hand letter by letter. This specimen shows what it already has and what is still missing.',
        maiusculas: 'Uppercase',
        minusculas: 'Lowercase',
        numeros: 'Numbers and signs',
        acentos: 'Accents',
        soltas: 'Dots, umlauts and accents are separate stones, like the dot in the logo.',
        corpo: 'body',
        pedra: 'stone',
        texto: 'Every stone starts rough. Someone looks at it, picks a side and starts cutting. A letter works the same way. This typeface was born from strokes drawn one per square and became a heavy, crooked alphabet full of character. It is still in progress, and each new version brings more stones.',
        construcao: 'The outline points of the a, as they are in the font file.',
        nasceu: ['Template', 'Outline', 'Font'],
        nasceuTexto: 'Drawn by hand in Calligraphr, one letter per square. Each drawing becomes an outline and goes into the font with the same space on both sides.',
        teste: 'Tests of what it could become. None of this is in the font yet.',
        desgaste: 'Wear',
        niveis: ['cut', 'polished', 'worn'],
        nenhuma: 'No two alike',
        nenhumaTexto: 'Every repeated letter comes out with a different cut.',
        hoje: 'today',
        proposta: 'proposal',
        uso: ['Coffee', 'and', 'bread.'],
        falta: 'Still to be drawn',
        passos: ['Accented capitals', 'Punctuation and symbols', 'Pair by pair spacing and kerning', 'More weights'],
        proximos: 'Next steps',
        colofao: [['Typeface', 'Föeger Sans'], ['Version', VERSAO], ['Made in', 'Calligraphr'], ['A project by', 'Föeger'], ['Contact', 'foegerluiz@gmail.com']],
    },
};
type Texto = (typeof TEXTO)['pt'];
export const SECOES = (idioma: 'pt' | 'en') => TEXTO[idioma].secoes;

// moldura de uma página: papel, cabeçalho corrido e número
function Folha({ n, secao, fundo = TEMA.papel, tinta = TEMA.tinta, limpa = false, children }: { n: number; secao: string; fundo?: string; tinta?: string; limpa?: boolean; children: React.ReactNode }) {
    const par = n % 2 === 0;
    return (
        <div className="relative overflow-hidden" style={{ width: FOLHA.w, height: FOLHA.h, backgroundColor: fundo, color: tinta, ...BRICOLAGE }}>
            {!limpa && (
                <div className="absolute inset-x-[28px] top-[20px] flex justify-between text-[9.5px] opacity-55" style={{ flexDirection: par ? 'row' : 'row-reverse' }}>
                    <span>{secao}</span>
                    <span>Föeger Sans</span>
                </div>
            )}
            <div className="absolute inset-0">{children}</div>
            {!limpa && <span className="absolute bottom-[18px] text-[10px] opacity-60" style={par ? { left: 28 } : { right: 28 }}>{n}</span>}
        </div>
    );
}

// uma letra desenhada pelo arquivo da fonte (para o que precisa dos pedaços ou do contorno)
function Letra({ c, altura, cor = 'currentColor', d }: { c: string; altura: number; cor?: string; d?: (pd: string, k: number) => string }) {
    const g = GLIFOS[c];
    if (!g) return null;
    return (
        <svg viewBox={`0 ${-ALTO} ${g.w} ${TOTAL}`} style={{ height: altura, width: (g.w / TOTAL) * altura }} overflow="visible">
            {g.pecas.map((p, k) => <path key={k} d={d ? d(p.d, k) : p.d} fill={cor} fillRule="evenodd" />)}
        </svg>
    );
}

export function usePaginas(idioma: 'pt' | 'en', irPara?: (n: number) => void) {
    const t: Texto = TEXTO[idioma];
    const s = t.secoes;
    const pontosA = useMemo(() => GLIFOS['a'].pecas.flatMap(p => pontosDe(p.d)), []);
    // o ponto mais alto do contorno do a (y para baixo: o menor y)
    const quinaA = useMemo(() => pontosA.reduce((m, q) => (q[1] < m[1] ? q : m), pontosA[0]), [pontosA]);

    return useMemo(() => [
        // 1 capa
        <Folha key={1} n={1} secao={s[0]} fundo="#111" tinta={TEMA.papel} limpa>
            <div className="absolute left-[30px] top-[40px] text-[96px] leading-[0.9]" style={FOEGER}>Föeger<br />Sans</div>
            <div className="absolute bottom-[34px] left-[30px] flex flex-col gap-1 text-[12px]">
                <span style={{ fontWeight: 600 }}>{t.especime}</span>
                <span className="opacity-60">v{VERSAO} · {t.processo}</span>
            </div>
            <div className="absolute bottom-[-30px] right-[6px]"><Letra c="." altura={520} cor={PEDRAS_COR.terracota} /></div>
        </Folha>,
        // 2 sumário (as linhas levam à página)
        <Folha key={2} n={2} secao={s[1]}>
            <div className="absolute inset-x-[28px] top-[58px]">
                <div className="mb-6 text-[34px] leading-none" style={{ ...BRICOLAGE, fontWeight: 700, letterSpacing: '-0.03em' }}>{t.sumario}</div>
                <ol className="flex flex-col">
                    {s.slice(2, 13).map((nome, i) => (
                        <li key={nome}>
                            {/* o gesto de virar passa por cima dos links; um toque curto leva à página */}
                            <button
                                type="button"
                                data-pagina-link
                                onClick={e => { e.stopPropagation(); irPara?.(i + 3); }}
                                className="flex w-full items-baseline justify-between border-b border-black/10 py-[7px] text-left text-[13px] transition-colors hover:text-[#E0501D]"
                            >
                                <span>{nome}</span>
                                <span className="opacity-60">{i + 3}</span>
                            </button>
                        </li>
                    ))}
                </ol>
            </div>
        </Folha>,
        // 3 abertura
        <Folha key={3} n={3} secao={s[2]}>
            <div className="absolute left-[26px] top-[50px] text-[250px] leading-[0.85]" style={FOEGER}>Aa</div>
            <p className="absolute bottom-[56px] left-[28px] right-[28px] text-[12.5px] leading-[1.45]">{t.abertura}</p>
        </Folha>,
        // 4 alfabeto
        <Folha key={4} n={4} secao={s[3]}>
            <div className="absolute inset-x-[28px] top-[52px] flex flex-col gap-5">
                {[[t.maiusculas, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'], [t.minusculas, 'abcdefghijklmnopqrstuvwxyz'], [t.numeros, '0123456789.,']].map(([rotulo, letras]) => (
                    <div key={rotulo} className="flex flex-col gap-1.5">
                        <span className="text-[9.5px] opacity-55">{rotulo}</span>
                        <div className="flex flex-wrap gap-x-[7px] gap-y-0 text-[33px] leading-[1.12]" style={FOEGER}>
                            {[...letras].map(c => <span key={c}>{c}</span>)}
                        </div>
                    </div>
                ))}
            </div>
        </Folha>,
        // 5 acentos e pedras soltas
        <Folha key={5} n={5} secao={s[4]}>
            <div className="absolute inset-x-[28px] top-[52px] flex flex-col gap-1.5">
                <span className="text-[9.5px] opacity-55">{t.acentos}</span>
                <div className="flex flex-wrap gap-x-[8px] text-[40px] leading-[1.1]" style={FOEGER}>
                    {[...'áâãçéêíóôöÖ'].map(c => <span key={c}>{c}</span>)}
                </div>
            </div>
            {/* o ö desmontado: o corpo embaixo e as pedras levantadas */}
            <div className="absolute left-1/2 top-[250px] -translate-x-1/2">
                <svg viewBox={`0 ${-ALTO - 360} ${GLIFOS['ö'].w} ${TOTAL + 360}`} style={{ height: 230 }} overflow="visible">
                    {GLIFOS['ö'].pecas.map((p, k) => (
                        <path key={k} d={p.d} fill={k === 0 ? '#111' : PEDRAS_COR.terracota} fillRule="evenodd" transform={k === 0 ? undefined : `translate(${k === 1 ? -40 : 40} -300) rotate(${k === 1 ? -14 : 12} ${(p.x0 + p.x1) / 2} ${(p.y0 + p.y1) / 2})`} />
                    ))}
                </svg>
                <span className="absolute -right-12 top-[30px] text-[10px] opacity-60">{t.pedra}</span>
                <span className="absolute -right-12 bottom-[50px] text-[10px] opacity-60">{t.corpo}</span>
            </div>
            <p className="absolute bottom-[50px] left-[28px] right-[28px] text-[12px] leading-[1.45]">{t.soltas}</p>
        </Folha>,
        // 6 tamanhos
        <Folha key={6} n={6} secao={s[5]}>
            <div className="absolute inset-x-[28px] top-[52px] flex flex-col gap-3">
                {[72, 52, 36, 26, 19, 14, 11].map(px => (
                    <div key={px} className="flex items-baseline gap-3">
                        <span className="w-[22px] shrink-0 text-[9.5px] opacity-50">{px}</span>
                        <span className="whitespace-nowrap leading-[1.05]" style={{ ...FOEGER, fontSize: px }}>Föeger</span>
                    </div>
                ))}
            </div>
        </Folha>,
        // 7 texto
        <Folha key={7} n={7} secao={s[6]}>
            <div className="absolute inset-x-[28px] top-[52px] flex flex-col gap-6">
                <p className="text-[17px] leading-[1.28]" style={FOEGER}>{t.texto}</p>
                <p className="text-[11px] leading-[1.35]" style={FOEGER}>{t.texto}</p>
            </div>
        </Folha>,
        // 8 construção: o a com os pontos e uma lupa num detalhe
        <Folha key={8} n={8} secao={s[7]}>
            <div className="absolute left-1/2 top-[70px] -translate-x-1/2">
                <svg viewBox={`0 ${-ALTO} ${GLIFOS['a'].w} ${TOTAL}`} style={{ height: 380 }} overflow="visible">
                    {GLIFOS['a'].pecas.map((p, k) => <path key={k} d={p.d} fill={PEDRAS_COR.terracota} fillOpacity={0.85} fillRule="evenodd" stroke="#111" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
                    {pontosA.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={8} fill={TEMA.papel} stroke="#111" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
                    {/* lupa: acima da letra, ampliando a quina de cima (o ponto mais alto do contorno), ligada a ela por um fio */}
                    <line x1={quinaA[0]} y1={quinaA[1] - 14} x2={quinaA[0]} y2={quinaA[1] - 230 + 140} stroke="#111" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    <defs>
                        <clipPath id="lupa-livro"><circle cx={quinaA[0]} cy={quinaA[1] - 230} r={140} /></clipPath>
                    </defs>
                    <circle cx={quinaA[0]} cy={quinaA[1] - 230} r={142} fill={TEMA.papel} stroke="#111" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                    <g clipPath="url(#lupa-livro)">
                        <g transform={`translate(${quinaA[0]} ${quinaA[1] - 230}) scale(2.6) translate(${-quinaA[0]} ${-quinaA[1]})`}>
                            {GLIFOS['a'].pecas.map((p, k) => <path key={k} d={p.d} fill={PEDRAS_COR.terracota} fillOpacity={0.85} fillRule="evenodd" stroke="#111" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
                            {pontosA.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={5} fill={TEMA.papel} stroke="#111" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
                        </g>
                    </g>
                </svg>
            </div>
            <p className="absolute bottom-[50px] left-[28px] right-[28px] text-[12px] leading-[1.45]">{t.construcao}</p>
        </Folha>,
        // 9 como nasceu
        <Folha key={9} n={9} secao={s[8]}>
            <div className="absolute inset-x-[28px] top-[60px] grid grid-cols-3 gap-3">
                {t.nasceu.map((nome, i) => (
                    <div key={nome} className="flex flex-col gap-2">
                        <div className="relative flex aspect-[4/5] items-end justify-center overflow-hidden border border-black/20 pb-3">
                            {i === 0 && <span className="absolute left-1.5 top-1 text-[9px] opacity-50">g</span>}
                            {i === 0 && <span className="absolute inset-x-1.5 bottom-[26%] h-px bg-black/20" />}
                            <div style={{ filter: i === 0 ? 'url(#tinta-livro)' : undefined }}>
                                {i === 1 ? (
                                    <svg viewBox={`0 ${-ALTO} ${GLIFOS['g'].w} ${TOTAL}`} style={{ height: 80 }} overflow="visible">
                                        {GLIFOS['g'].pecas.map((p, k) => <path key={k} d={p.d} fill="none" stroke="#111" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />)}
                                        {GLIFOS['g'].pecas.flatMap(p => pontosDe(p.d)).map(([x, y], k) => <circle key={k} cx={x} cy={y} r={12} fill={TEMA.papel} stroke="#111" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />)}
                                    </svg>
                                ) : <Letra c="g" altura={80} />}
                            </div>
                            {i === 2 && (
                                <>
                                    <span className="absolute inset-y-2 left-[27%] w-[5%] bg-[#E0501D]/30" />
                                    <span className="absolute inset-y-2 right-[27%] w-[5%] bg-[#E0501D]/30" />
                                </>
                            )}
                        </div>
                        <span className="text-[11px]" style={{ fontWeight: 600 }}>{i + 1}. {nome}</span>
                    </div>
                ))}
            </div>
            <svg width="0" height="0" className="absolute">
                <filter id="tinta-livro" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="r" />
                    <feDisplacementMap in="SourceGraphic" in2="r" scale="4" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </svg>
            <p className="absolute bottom-[50px] left-[28px] right-[28px] text-[12px] leading-[1.45]">{t.nasceuTexto}</p>
        </Folha>,
        // 10 em teste: desgaste e nenhuma igual
        <Folha key={10} n={10} secao={s[9]}>
            <svg width="0" height="0" className="absolute">
                {[26, 50].map(v => (
                    <filter key={v} id={`desgaste-livro-${v}`} x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation={v} />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 13 -6" />
                    </filter>
                ))}
            </svg>
            <p className="absolute left-[28px] right-[28px] top-[50px] text-[11px] leading-[1.4] opacity-70">{t.teste}</p>
            <div className="absolute inset-x-[28px] top-[96px] flex flex-col gap-2">
                <span className="text-[13px]" style={{ fontWeight: 600 }}>{t.desgaste}</span>
                {[0, 26, 50].map((v, i) => (
                    <div key={v} className="flex items-center gap-3">
                        <span className="w-[52px] text-[9.5px] opacity-55">{t.niveis[i]}</span>
                        <svg viewBox={`0 ${-ALTO} ${['P', 'e', 'd', 'r', 'a'].reduce((a, c) => a + GLIFOS[c].w, 0)} ${TOTAL}`} style={{ height: 52 }} overflow="visible">
                            <g filter={v ? `url(#desgaste-livro-${v})` : undefined}>
                                {(() => {
                                    let x = 0;
                                    return ['P', 'e', 'd', 'r', 'a'].map((c, k) => {
                                        const g = GLIFOS[c];
                                        const el = <g key={k} transform={`translate(${x} 0)`}>{g.pecas.map((p, j) => <path key={j} d={p.d} fill="#111" fillRule="evenodd" />)}</g>;
                                        x += g.w;
                                        return el;
                                    });
                                })()}
                            </g>
                        </svg>
                    </div>
                ))}
            </div>
            <div className="absolute inset-x-[28px] top-[330px] flex flex-col gap-2">
                <span className="text-[13px]" style={{ fontWeight: 600 }}>{t.nenhuma}</span>
                <span className="text-[11px] opacity-70">{t.nenhumaTexto}</span>
                {[false, true].map(variado => (
                    <div key={String(variado)} className="flex items-center gap-3">
                        <span className="w-[52px] text-[9.5px] opacity-55">{variado ? t.proposta : t.hoje}</span>
                        <div className="flex">
                            {[0, 1, 2, 3, 4, 5].map(k => <Letra key={k} c="a" altura={50} d={variado ? (pd, j) => tremer(pd, k * 7 + j + 1, 48) : undefined} />)}
                        </div>
                    </div>
                ))}
            </div>
        </Folha>,
        // 11 em uso: um cartaz
        <Folha key={11} n={11} secao={s[10]} fundo={PEDRAS_COR.ocre}>
            <div className="absolute left-[28px] top-[56px] text-[92px] leading-[0.88]" style={FOEGER}>
                {t.uso.map(l => <div key={l}>{l}</div>)}
            </div>
            <div className="absolute bottom-[56px] right-[30px] rotate-[-8deg]">
                <div className="relative flex h-[96px] w-[110px] items-center justify-center text-[#111]">
                    <PedraBruta cheia className="absolute inset-0 h-full w-full text-[#F3F1EC]" />
                    <span className="relative text-[26px]" style={FOEGER}>Uau</span>
                </div>
            </div>
        </Folha>,
        // 12 o que falta
        <Folha key={12} n={12} secao={s[11]}>
            <div className="absolute inset-x-[28px] top-[52px] flex flex-col gap-2">
                <span className="text-[13px]" style={{ fontWeight: 600 }}>{t.falta}</span>
                <div className="grid grid-cols-7 gap-1.5">
                    {[...FALTAM_MAIUSCULAS, ...FALTAM_OUTRAS].map(c => (
                        <span key={c} className="relative flex aspect-square items-center justify-center text-[13px] text-black/70">
                            <PedraBruta className="absolute inset-0 h-full w-full text-black/30" />
                            <span className="relative">{c}</span>
                        </span>
                    ))}
                </div>
            </div>
            <div className="absolute inset-x-[28px] top-[372px] flex flex-col gap-2">
                <span className="text-[13px]" style={{ fontWeight: 600 }}>{t.proximos}</span>
                <ol className="flex flex-col">
                    {t.passos.map((x, i) => (
                        <li key={x} className="flex gap-3 border-b border-black/10 py-[6px] text-[12px]">
                            <span className="opacity-50">{i + 1}</span>{x}
                        </li>
                    ))}
                </ol>
            </div>
        </Folha>,
        // 13 colofão
        <Folha key={13} n={13} secao={s[12]}>
            <div className="absolute inset-x-[28px] bottom-[70px] flex flex-col">
                {t.colofao.map(([rotulo, valor]) => (
                    <div key={rotulo} className="flex justify-between border-b border-black/10 py-[7px] text-[12px]">
                        <span className="opacity-55">{rotulo}</span>
                        <span>{valor}</span>
                    </div>
                ))}
            </div>
            <div className="absolute left-[28px] top-[56px] text-[64px] leading-none" style={FOEGER}>föeger.</div>
        </Folha>,
        // 14 contracapa
        <Folha key={14} n={14} secao={s[13]} fundo={PEDRAS_COR.terracota} tinta="#111" limpa>
            <div className="absolute inset-0 flex items-center justify-center pb-[120px]"><Letra c="." altura={900} cor="#111" /></div>
            <span className="absolute bottom-[30px] left-1/2 -translate-x-1/2 text-[12px]" style={{ fontWeight: 600 }}>Föeger Sans</span>
        </Folha>,
    ], [t, s, pontosA, quinaA, irPara]);
}
