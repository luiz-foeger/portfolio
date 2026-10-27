import type { Metadata } from 'next';
import NovaLayout from './_ideias/nova/layout';
import RumoLayout from './_ideias/nova/rumo/layout';
import Rumo from './_ideias/nova/rumo/page';

// a home é a da marca Föeger, feita em _ideias/nova/rumo (a anterior, a do pontilhado, segue em _ideias/nova/page e na
// tag v3-next). Os layouts de lá (o do nova: o idioma e a entrada sem véu; o do rumo: a sans e a serifa) vêm aqui
// dentro, e não como layout da rota, porque as páginas de services/ repetem esta e precisam deles junto
export const metadata: Metadata = {
    title: 'Föeger',
};

export default function Home() {
    return (
        <NovaLayout>
            <RumoLayout>
                <Rumo />
            </RumoLayout>
        </NovaLayout>
    );
}
