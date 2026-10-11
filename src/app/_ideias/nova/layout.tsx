import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import localFont from 'next/font/local';
import { IdiomaProvider } from './_lib/idioma';
import '../sem-veu.css';

// uma fonte só no site (Bricolage, variável em tamanho óptico, largura e peso) e a Foeger Sans para a amostra
const bricolage = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], axes: ['opsz', 'wdth'], variable: '--ff-bricolage-w' });
const foeger = localFont({ src: '../../../assets/fonts/Foeger-Regular.woff', variable: '--ff-foeger', display: 'swap' });

export const metadata: Metadata = {
    title: 'Föeger',
    robots: { index: false, follow: false },
};

export default function NovaLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            data-sem-veu
            className={`${bricolage.variable} ${foeger.variable} min-h-screen bg-[#050505] text-white`}
            // sem font-variation-settings aqui: no resto da página o peso segue o font-weight e o tamanho óptico é automático
            style={{ fontFamily: 'var(--ff-bricolage-w), sans-serif' }}
        >
            <IdiomaProvider>{children}</IdiomaProvider>
        </div>
    );
}
