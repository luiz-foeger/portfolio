'use client';

// Home nova da marca Föeger, guardada sem uso: _ideias é uma pasta privada do Next (o _ tira do roteamento), então
// nada daqui vira página no site.
// Parte do site de hoje (a logo animada que vira o cabeçalho) e soma o que foi aprovado nas simulações: uma fonte
// só (Bricolage), o manifesto que sobe dos pontos com desfoque de movimento, a letra fina que engrossa nos serviços
// e o e-mail de ponta a ponta. Sem azul claro, sem stacks e sem trabalhos antigos: os serviços se demonstram
// funcionando e o laboratório guarda os estudos próprios, começando pela Foeger Sans.
// Português por padrão, com inglês no cabeçalho (na primeira visita, segue o idioma do navegador).
// Para publicar em /nova: mover nova/, _comum/ e sem-veu.css de _ideias para src/app/ e tirar um ../ do caminho da
// fonte em nova/layout.tsx.
import ManifestoComum from '../_comum/Manifesto';
import Cabecalho from './_components/Cabecalho';
import Servicos from './_components/Servicos';
import Laboratorio from './_components/Laboratorio';
import Footer from '../../../components/layout/Footer';
import { useTexto } from './_lib/idioma';
import { TIPO } from './_lib/tipo';

export default function Nova() {
    const t = useTexto();
    return (
        <main className="bg-[#050505] text-white">
            <Cabecalho />
            <ManifestoComum linhas={t.manifesto} estilo={TIPO.manifesto} entrada="pontos-de-baixo" />
            <Servicos />
            <Laboratorio />
            {/* o rodapé do site; o id é o destino do "Contato" do menu */}
            <div id="contato">
                <Footer />
            </div>
        </main>
    );
}
