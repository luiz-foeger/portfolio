import type { Metadata } from 'next';
import NovaLayout from './_ideias/nova/layout';
import Nova from './_ideias/nova/page';

// a home é a da marca Föeger, feita em _ideias/nova. O layout de lá (as fontes, o idioma e a entrada sem véu) vem
// aqui dentro, e não como layout da rota, porque as páginas de services/ repetem esta e precisam dele junto
export const metadata: Metadata = {
    title: 'Föeger',
};

export default function Home() {
    return (
        <NovaLayout>
            <Nova />
        </NovaLayout>
    );
}
