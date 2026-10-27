import localFont from 'next/font/local';
import './fa.css';
import './rumo.css';

// o rumo visual (23/10): a abertura e o cabeçalho, o segredo da logo acima do hero e as seções da primeira rodada.
// Sem a Bricolage: a sans é a Inter Tight e a serifa itálica pequena é a Instrument Serif (as duas OFL, servidas da
// pasta _fontes).
// Uso: abrir http://localhost:3400/nova/rumo
const grotesca = localFont({
    src: './_fontes/inter-tight-latin.woff2',
    weight: '300 700',
    variable: '--ff-grotesca',
    display: 'swap',
});
const serifa = localFont({
    src: './_fontes/instrument-serif-italic-latin.woff2',
    style: 'italic',
    weight: '400',
    variable: '--ff-serifa',
    display: 'swap',
});

export default function RumoLayout({ children }: { children: React.ReactNode }) {
    return <div className={`${grotesca.variable} ${serifa.variable}`}>{children}</div>;
}
