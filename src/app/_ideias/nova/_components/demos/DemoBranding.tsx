'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTexto } from '../../_lib/idioma';
import { useSozinha } from '../Palco';

// Branding, "um sistema visual que aguenta crescer": a pessoa escreve o nome de uma marca e vê o sistema aplicado
// (assinatura, ícone de app e cartão). "Outra direção" troca símbolo, tipografia e cores de uma vez, e tudo
// acompanha. As cores aqui são da marca de exemplo, não do site
type Direcao = { fundo: string; tinta: string; acento: string; raio: string; largura: number; peso: number; caixa: 'none' | 'uppercase' | 'lowercase'; espaco: string };
const DIRECOES: Direcao[] = [
    { fundo: '#EEEAE3', tinta: '#141414', acento: '#FF5A1F', raio: '50%', largura: 100, peso: 700, caixa: 'none', espaco: '-0.03em' },
    { fundo: '#141414', tinta: '#F1EEE8', acento: '#E3FF3B', raio: '18%', largura: 75, peso: 800, caixa: 'uppercase', espaco: '0em' },
    { fundo: '#B8A4FF', tinta: '#15121C', acento: '#15121C', raio: '50% 50% 8% 8%', largura: 88, peso: 600, caixa: 'lowercase', espaco: '-0.02em' },
];
const MOLA = { type: 'spring', stiffness: 170, damping: 22 } as const;
// cor não vai de mola: no meio do caminho ela passa por tons sujos; troca curta e assenta
const COR = { duration: 0.4, ease: [0.4, 0, 0.2, 1] } as const;
const TROCA = { default: MOLA, backgroundColor: COR, color: COR } as const;
const varia = (d: Direcao, opsz = 96) => `'opsz' ${opsz}, 'wdth' ${d.largura}, 'wght' ${d.peso}`;

// o endereço de e-mail do cartão sai do nome (sem acento, sem espaço)
const apelido = (nome: string) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'marca';

export default function DemoBranding({ ativo }: { ativo: boolean }) {
    const t = useTexto().demos.branding;
    const [nome, setNome] = useState('');
    const [n, setN] = useState(0);
    const { sozinha, tocou } = useSozinha(ativo);
    const d = DIRECOES[n];
    const marca = nome.trim() || t.padrao;
    const inicial = [...marca][0]?.toUpperCase() ?? 'A';

    useEffect(() => {
        if (!sozinha) return;
        const id = setInterval(() => setN(i => (i + 1) % DIRECOES.length), 2600);
        return () => clearInterval(id);
    }, [sozinha]);

    const simbolo = (tamanho: number, cor: string, fundo: string) => (
        <motion.span
            className="flex shrink-0 items-center justify-center"
            style={{ width: tamanho, height: tamanho }}
            initial={false}
            animate={{ borderRadius: d.raio, backgroundColor: cor, color: fundo }}
            transition={TROCA}
        >
            <motion.span
                style={{ fontSize: tamanho * 0.56, lineHeight: 1, fontWeight: d.peso }}
                initial={false}
                animate={{ fontVariationSettings: varia(d) }}
                transition={TROCA}
            >
                {inicial}
            </motion.span>
        </motion.span>
    );

    return (
        <div className="absolute inset-0 text-white">
            {/* nome e direção */}
            <div className="absolute left-6 right-6 top-6 flex items-end gap-3">
                <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-[12px] text-white/50">{t.rotulo}</span>
                    <input
                        value={nome}
                        onChange={e => { setNome(e.target.value.slice(0, 14)); tocou(); }}
                        onFocus={tocou}
                        placeholder={t.padrao}
                        className="h-10 w-full rounded-[8px] border border-white/15 bg-transparent px-3 text-[16px] text-white outline-none placeholder:text-white/35 focus:border-white/50"
                        style={{ fontWeight: 500 }}
                    />
                </label>
                <button
                    onClick={() => { setN(i => (i + 1) % DIRECOES.length); tocou(); }}
                    className="h-10 shrink-0 rounded-[8px] border border-white/15 px-3 text-[14px] text-white/85 transition-colors hover:border-white/50 hover:text-white"
                    style={{ fontWeight: 500 }}
                >
                    {t.direcao} ↻
                </button>
            </div>

            {/* assinatura */}
            <motion.div
                className="absolute left-6 right-6 top-[104px] flex h-[150px] items-center justify-center gap-4 overflow-hidden rounded-[12px] px-5"
                initial={false}
                animate={{ backgroundColor: d.fundo, color: d.tinta }}
                transition={TROCA}
            >
                {simbolo(52, d.acento === d.tinta ? d.tinta : d.acento, d.fundo)}
                <motion.span
                    className="truncate text-[46px]"
                    style={{ textTransform: d.caixa, fontWeight: d.peso, lineHeight: 1.05 }}
                    initial={false}
                    animate={{ fontVariationSettings: varia(d), letterSpacing: d.espaco }}
                    transition={TROCA}
                >
                    {marca}
                </motion.span>
            </motion.div>

            {/* ícone de app */}
            <div className="absolute left-6 top-[270px] flex w-[104px] flex-col items-center gap-2">
                <motion.div
                    className="flex h-[84px] w-[84px] items-center justify-center rounded-[22px]"
                    initial={false}
                    animate={{ backgroundColor: d.fundo }}
                    transition={TROCA}
                >
                    {simbolo(46, d.acento === d.tinta ? d.tinta : d.acento, d.fundo)}
                </motion.div>
                <span className="max-w-full truncate text-[13px] text-white/70">{marca}</span>
            </div>

            {/* cartão */}
            <div className="absolute left-[146px] right-6 top-[262px] h-[170px]">
                <motion.div
                    className="absolute inset-x-1 top-3 flex h-[128px] flex-col justify-between rounded-[10px] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
                    initial={false}
                    animate={{ backgroundColor: d.fundo, color: d.tinta, rotate: n % 2 ? 3 : -4 }}
                    transition={TROCA}
                >
                    <div className="flex items-center gap-2">
                        {simbolo(26, d.acento === d.tinta ? d.tinta : d.acento, d.fundo)}
                        <motion.span
                            className="truncate text-[20px]"
                            style={{ textTransform: d.caixa, fontWeight: d.peso, lineHeight: 1.05 }}
                            initial={false}
                            animate={{ fontVariationSettings: varia(d), letterSpacing: d.espaco }}
                            transition={TROCA}
                        >
                            {marca}
                        </motion.span>
                    </div>
                    <span className="truncate text-[13px] opacity-75" style={{ fontWeight: 500 }}>
                        {t.cartao}@{apelido(marca)}.com
                    </span>
                </motion.div>
            </div>
        </div>
    );
}
