// os textos próprios da tela de teste, nos dois idiomas (o resto vem de /nova/_lib/textos.ts). Nada fica fixo em uma
// língua só: o seletor do cabeçalho troca tudo junto
import type { Idioma } from '../../_lib/textos';

export type Alvo = 'hero' | 'projetos' | 'galeria' | 'footer';

const R = {
    pt: {
        ola: 'Olá, boas-vindas à Föeger!',
        // o hero, que também é o manifesto, numa escada de quatro linhas: duas palavras, — palavra — palavra com a da escala no meio
        // da largura da tela (medido em _fa/Hero.tsx), palavra e a janela, e a palavra que troca. Ao rolar, a palavra da escala vira os verbos no ato,
        // todos encaixando na frase. Os textos pequenos dos cantos, na serifa: o convite para rolar, que abre o ato, e o
        // ano. As palavras que trocam têm quase a mesma largura em caixa alta (3,6 a 4,3 em nos dois idiomas), para a
        // última linha da escada não encolher e esticar a cada troca
        hero: {
            linhas: [['Marcas', 'que'], ['—', 'Escalam', 'com'], ['Design', 'e']],
            troca: ['Código', 'Clareza', 'Método', 'Sentido'],
            verbos: ['Adaptam', 'Performam', 'Resolvem'],
            cantos: { topo: ['Role para escalar'], baixo: 'Desde 2023' },
        },
        // a seção depois do creme (_comp/Projetos.tsx): enquanto há poucos projetos, a lista mostra os problemas que a
        // Föeger resolve, cada um com o problema e a solução; o exemplo na janela é uma capa falsa ou um dos conceitos
        projetos: {
            titulo: 'O que resolvemos',
            exemplo: 'Ex.:',
            conceito: 'conceito',
            itens: [
                { nome: 'Identidade', problema: 'Marca que ninguém entende', solucao: 'uma marca que se explica sozinha' },
                { nome: 'Websites', problema: 'Site bonito que não vende', solucao: 'páginas que levam ao contato' },
                { nome: 'Produtos', problema: 'Processo preso em planilha', solucao: 'um sistema que roda sozinho' },
                { nome: 'Plataformas', problema: 'Ideia parada no papel', solucao: 'no ar, medindo e melhorando' },
            ],
        },
        // a seção de imagens depois da lista (_comp/Imagens.tsx): a legenda de cada capa no hover (na ordem das capas: o
        // nome, o tipo, o ano e uma linha), os rótulos do cursor (sobre a capa, com ela aberta e na faixa, que se arrasta) e o fecho para ver mais projetos (que ainda não têm página),
        // em duas palavras de tamanho parecido
        galeria: {
            ver: 'Ver projeto',
            fechar: 'Fechar',
            arraste: 'Arraste',
            mais: ['Veja', 'mais'],
            emBreve: 'Em breve',
            itens: [
                { nome: 'Turno', tipo: 'App', ano: 2025, texto: 'Agenda de salão sem planilha' },
                { nome: 'Norte', tipo: 'Marca', ano: 2025, texto: 'Crédito explicado em uma marca' },
                { nome: 'Aurora', tipo: 'Marca', ano: 2024, texto: 'Padaria de fermentação natural' },
                { nome: 'Lume', tipo: 'Site', ano: 2025, texto: 'Encomendas em três toques' },
                { nome: 'Föeger Sans', tipo: 'Tipografia', ano: 2025, texto: 'Uma fonte desenhada à mão' },
                { nome: 'Prumo', tipo: 'App', ano: 2024, texto: 'A obra inteira no celular' },
                { nome: 'Pulso', tipo: 'App', ano: 2024, texto: 'Treinos que se ajustam à semana' },
                { nome: 'Orla', tipo: 'Marca', ano: 2024, texto: 'Uma pousada com cara de mar' },
                { nome: 'Föeger', tipo: 'Site', ano: 2026, texto: 'Este site, de ponta a ponta' },
                { nome: 'Vela', tipo: 'Site', ano: 2023, texto: 'Matrícula on-line para uma escola' },
                { nome: 'Brisa', tipo: 'Produto', ano: 2023, texto: 'Um painel que responde antes' },
                { nome: 'Fio', tipo: 'Marca', ano: 2023, texto: 'Ateliê de costura sob medida' },
                { nome: 'Maré', tipo: 'App', ano: 2023, texto: 'A tábua de marés no bolso' },
            ],
        },
        menu: 'Menu',
        fechar: 'Fechar',
        itens: [
            { texto: 'Início', alvo: 'hero' },
            { texto: 'Contato', alvo: 'footer' },
        ] as { texto: string; alvo: Alvo }[],
        rotulos: { indice: 'Seções', hero: 'Escala', projetos: 'Serviços', galeria: 'Projetos' },
        // o rodapé (_comp/Rodape.tsx): o slogan em quatro linhas com a palavra que troca, o lugar com o relógio e a base
        rodape: {
            linhas: ['Vamos', 'tirar'],
            troca: ['ideias', 'marcas', 'produtos', 'sites'],
            fim: 'do papel',
            comecar: 'Começar um projeto',
            // o barquinho de papel nas ondas: o rótulo do cursor sobre ele, com ele na mão e com ele virado
            barco: { pegar: 'Pegue', soltar: 'Solte', desvirar: 'Desvirar' },
            contato: 'Contato',
            direitos: '© 2026 Todos os direitos reservados. Föeger.',
        },
    },
    en: {
        ola: 'Hi, welcome to Föeger!',
        hero: {
            linhas: [['Brands', 'that'], ['—', 'Scale', 'with'], ['Design', 'and']],
            troca: ['Coding', 'Clarity', 'Method', 'Purpose'],
            verbos: ['Adapt', 'Perform', 'Solve'],
            cantos: { topo: ['Scroll to scale'], baixo: 'Since 2023' },
        },
        projetos: {
            titulo: 'What we solve',
            exemplo: 'e.g.',
            conceito: 'concept',
            itens: [
                { nome: 'Identity', problema: 'A brand nobody gets', solucao: 'a brand that explains itself' },
                { nome: 'Websites', problema: 'A pretty site that doesn’t sell', solucao: 'pages that lead to contact' },
                { nome: 'Products', problema: 'A process stuck in spreadsheets', solucao: 'a system that runs itself' },
                { nome: 'Platforms', problema: 'An idea stuck on paper', solucao: 'live, measuring and improving' },
            ],
        },
        galeria: {
            ver: 'View project',
            fechar: 'Close',
            arraste: 'Drag',
            mais: ['View', 'more'],
            emBreve: 'Coming soon',
            itens: [
                { nome: 'Turno', tipo: 'App', ano: 2025, texto: 'Salon bookings without spreadsheets' },
                { nome: 'Norte', tipo: 'Brand', ano: 2025, texto: 'Credit explained in one brand' },
                { nome: 'Aurora', tipo: 'Brand', ano: 2024, texto: 'A sourdough bakery' },
                { nome: 'Lume', tipo: 'Website', ano: 2025, texto: 'Orders in three taps' },
                { nome: 'Föeger Sans', tipo: 'Typeface', ano: 2025, texto: 'A hand-drawn typeface' },
                { nome: 'Prumo', tipo: 'App', ano: 2024, texto: 'The whole building site on a phone' },
                { nome: 'Pulso', tipo: 'App', ano: 2024, texto: 'Workouts that fit the week' },
                { nome: 'Orla', tipo: 'Brand', ano: 2024, texto: 'An inn that feels like the sea' },
                { nome: 'Föeger', tipo: 'Website', ano: 2026, texto: 'This site, end to end' },
                { nome: 'Vela', tipo: 'Website', ano: 2023, texto: 'Online enrolment for a school' },
                { nome: 'Brisa', tipo: 'Product', ano: 2023, texto: 'A dashboard that answers first' },
                { nome: 'Fio', tipo: 'Brand', ano: 2023, texto: 'A made-to-measure sewing studio' },
                { nome: 'Maré', tipo: 'App', ano: 2023, texto: 'Tide tables in your pocket' },
            ],
        },
        menu: 'Menu',
        fechar: 'Close',
        itens: [
            { texto: 'Home', alvo: 'hero' },
            { texto: 'Contact', alvo: 'footer' },
        ] as { texto: string; alvo: Alvo }[],
        rotulos: { indice: 'Sections', hero: 'Scale', projetos: 'Services', galeria: 'Projects' },
        rodape: {
            linhas: ["Let's", 'get'],
            troca: ['ideas', 'brands', 'products', 'sites'],
            fim: 'off the ground',
            comecar: 'Start a project',
            barco: { pegar: 'Grab', soltar: 'Drop', desvirar: 'Flip' },
            contato: 'Contact',
            direitos: '© 2026 All rights reserved. Föeger.',
        },
    },
} satisfies Record<Idioma, unknown>;

export const textosDoRumo = (idioma: Idioma) => R[idioma];
