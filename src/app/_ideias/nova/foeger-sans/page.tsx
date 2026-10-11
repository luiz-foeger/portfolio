'use client';

// Página da Foeger Sans, a fonte da logo. Guardada sem uso junto com a home nova (ver nova/page.tsx); publicada,
// fica em /nova/foeger-sans.
// É um caderno à parte da home: fundo claro (#E4E4E4), cabeçalho e rodapé próprios, e é onde moram o ponto e as
// pedras. Começa como as páginas da Feixen: o nome sendo editado ao vivo por cursores (pontos do desenho, quinas
// que se gastam, pedra do trema que cai, e que vira é). Depois: o monte de pedras que vira alfabeto, como ela
// nasceu (Calligraphr), as características, o livro (o espécime de verdade, para folhear e baixar em PDF), todas
// as letras com lupa, cenários de uso, uma área para escrever e derrubar as letras, e o que ainda falta desenhar.
// Os desenhos das letras vêm de _lib/glifos.ts, gerado do arquivo da fonte (src/assets/fonts/Foeger-Regular.woff).
// O PDF do livro sai da rota livro/ (ver livro/page.tsx): o botão de baixar espera public/foeger-sans-especime-pt.pdf
// e -en.pdf, que só entram no repositório quando a página for publicada.
import CabecalhoFonte from './_components/CabecalhoFonte';
import AberturaViva from './_components/AberturaViva';
import Pedras from './_components/Pedras';
import Nasceu from './_components/Nasceu';
import Caracteristicas from './_components/Caracteristicas';
import SecaoLivro from './_components/livro/SecaoLivro';
import Glifos from './_components/Glifos';
import EmUso from './_components/EmUso';
import Brincar from './_components/Brincar';
import Proximas from './_components/Proximas';
import RodapeFonte from './_components/RodapeFonte';
import './tema-claro.css';

export default function FoegerSans() {
    return (
        <main data-tema="claro" className="bg-[#E4E4E4] text-[#111]">
            <CabecalhoFonte />
            <AberturaViva />
            <Pedras />
            <Nasceu />
            <Caracteristicas />
            <SecaoLivro />
            <Glifos />
            <EmUso />
            <Brincar />
            <Proximas />
            <RodapeFonte />
        </main>
    );
}
