// todo o texto da home nova, em português e inglês
export type Idioma = 'pt' | 'en';
export type IdServico = 'saas' | 'branding' | 'ux' | 'ui';

export const EMAIL = 'foegerluiz@gmail.com';
export const LINKS = [
    { texto: 'Instagram', href: 'https://instagram.com/foeger.dev' },
    { texto: 'LinkedIn', href: 'https://www.linkedin.com/in/luizfoeger' },
    { texto: 'Behance', href: 'https://behance.net/foeger' },
    { texto: 'GitHub', href: 'https://github.com/luiz-foeger' },
];

export const TEXTOS = {
    pt: {
        inicio: 'Início',
        menu: { servicos: 'Serviços', laboratorio: 'Laboratório', contato: 'Contato' },
        // o manifesto em arranjos de linhas, do mais largo ao mais estreito (vale o primeiro que cabe sem quebrar), com
        // a palavra da escala (centro) no meio exato da linha do meio; palavras: os verbos que ela vira no ato da
        // escala, na ordem dele, todos encaixando na frase
        manifesto: {
            centro: 'escalam',
            arranjos: [['SaaS e marcas', 'que escalam com', 'design e código.'], ['SaaS', 'e marcas que', 'escalam', 'com design', 'e código.']],
            palavras: ['se adaptam', 'performam', 'resolvem'],
        },
        servicos: [
            { id: 'saas', nome: 'Produto', texto: 'Da ideia ao SaaS no ar: estratégia, design e desenvolvimento.' },
            { id: 'branding', nome: 'Identidade', texto: 'Nome, logo e um sistema visual que aguenta crescer.' },
            { id: 'ux', nome: 'Experiência', texto: 'Pesquisa de UX, fluxos e protótipos para o produto fazer sentido para quem usa.' },
            { id: 'ui', nome: 'Interface', texto: 'UI com personalidade, desenhada para virar código sem perder nada.' },
        ] as { id: IdServico; nome: string; texto: string }[],
        // o processo abre os pontos dos serviços: o jeito de trabalhar que passa por todos eles
        processo: { nome: 'Processo', texto: 'Do protótipo ao produto final, em etapas curtas e entregas que dá para ver.' },
        laboratorio: {
            titulo: 'Laboratório',
            texto: 'Estudos e projetos próprios. O primeiro é a Foeger Sans, a fonte da logo: desenhada do zero e ainda em processo.',
            amostra: 'Föeger Sans',
        },
        contato: { chamada: 'Tem um projeto em mente?' },
        demos: {
            saas: { etapas: ['Ideia', 'Design', 'No ar'], titulo: 'Reservas', semana: 'esta semana', botao: 'Nova reserva', aviso: 'Nova reserva', agora: 'agora', aoVivo: 'ao vivo', dias: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] },
            branding: { rotulo: 'Nome da marca', padrao: 'Aurora', direcao: 'Outra direção', cartao: 'contato' },
            ux: { antes: 'Antes', depois: 'Depois', etapa: 'Etapa 1 de 3', nome: 'Nome', email: 'E-mail', continuar: 'Continuar', enviar: 'Enviar', cancelar: 'Cancelar', limpar: 'Limpar', legenda: 'O mesmo pedido, em etapas que fazem sentido.' },
            ui: { peso: 'Peso', largura: 'Largura', escuro: 'Escuro', salvar: 'Salvar', salvo: 'Salvo', palavra: 'Personalidade' },
        },
    },
    en: {
        inicio: 'Home',
        menu: { servicos: 'Services', laboratorio: 'Lab', contato: 'Contact' },
        manifesto: {
            centro: 'scale',
            arranjos: [['SaaS and brands', 'that scale with', 'design and code.'], ['SaaS and', 'brands that', 'scale', 'with design', 'and code.']],
            palavras: ['adapt', 'perform', 'solve'],
        },
        servicos: [
            { id: 'saas', nome: 'Product', texto: 'From idea to a live SaaS: strategy, design and development.' },
            { id: 'branding', nome: 'Identity', texto: 'Name, logo and a visual system built to grow.' },
            { id: 'ux', nome: 'Experience', texto: 'UX research, flows and prototypes so the product makes sense to the people using it.' },
            { id: 'ui', nome: 'Interface', texto: 'UI with character, designed to become code without losing anything.' },
        ] as { id: IdServico; nome: string; texto: string }[],
        processo: { nome: 'Process', texto: 'From prototype to final product, in short stages with deliveries you can see.' },
        laboratorio: {
            titulo: 'Laboratory',
            texto: 'Studies and personal projects. The first is Foeger Sans, the typeface behind the logo: drawn from scratch and still in progress.',
            amostra: 'Föeger Sans',
        },
        contato: { chamada: 'Got a project in mind?' },
        demos: {
            saas: { etapas: ['Idea', 'Design', 'Live'], titulo: 'Bookings', semana: 'this week', botao: 'New booking', aviso: 'New booking', agora: 'now', aoVivo: 'live', dias: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] },
            branding: { rotulo: 'Brand name', padrao: 'Aurora', direcao: 'Another direction', cartao: 'hello' },
            ux: { antes: 'Before', depois: 'After', etapa: 'Step 1 of 3', nome: 'Name', email: 'Email', continuar: 'Continue', enviar: 'Send', cancelar: 'Cancel', limpar: 'Clear', legenda: 'The same request, in steps that make sense.' },
            ui: { peso: 'Weight', largura: 'Width', escuro: 'Dark', salvar: 'Save', salvo: 'Saved', palavra: 'Character' },
        },
    },
};

export type Textos = (typeof TEXTOS)['pt'];
