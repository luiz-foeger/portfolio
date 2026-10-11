'use client';

// O espécime para imprimir: as mesmas páginas do livro da página da fonte, uma por folha A5 (148×210 mm).
// É daqui que sai o PDF para baixar (public/foeger-sans-especime-pt.pdf e -en.pdf), com a fonte embutida.
// ?idioma=en troca a língua.
// Uso, com a página publicada: abrir /nova/foeger-sans/livro?idioma=pt no Chrome ou no Edge e imprimir em "Salvar
// como PDF" com gráficos de fundo (o tamanho da folha vem do @page), ou gerar com o puppeteer (page.pdf)
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIdioma } from '../../_lib/idioma';
import { FOLHA, usePaginas } from '../_components/livro/Paginas';

// 148 mm em px CSS (96 por polegada), dividido pela largura da folha desenhada
const ESCALA = (148 * 96) / 25.4 / FOLHA.w;

function Impressao() {
    const busca = useSearchParams();
    const { idioma, definir } = useIdioma();
    const pedido = busca.get('idioma');
    useEffect(() => { if (pedido === 'pt' || pedido === 'en') definir(pedido); }, [pedido, definir]);
    const paginas = usePaginas(idioma);

    return (
        <main className="bg-[#E4E4E4] print:bg-transparent">
            <style>{`
                @page { size: 148mm 210mm; margin: 0; }
                @media print { html, body { background: #F3F1EC !important; } .folha-a5:not(:last-child) { break-after: page; } }
            `}</style>
            <div className="flex flex-col items-center gap-6 py-8 print:gap-0 print:py-0">
                {paginas.map((p, i) => (
                    <div key={i} className="folha-a5 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)] print:shadow-none" style={{ width: '148mm', height: '210mm' }}>
                        <div className="absolute left-0 top-0 origin-top-left" style={{ width: FOLHA.w, height: FOLHA.h, transform: `scale(${ESCALA})` }}>{p}</div>
                    </div>
                ))}
            </div>
        </main>
    );
}

export default function LivroParaImprimir() {
    return (
        <Suspense>
            <Impressao />
        </Suspense>
    );
}
