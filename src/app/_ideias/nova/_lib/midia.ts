// as capas dos projetos (1440×900), a primeira tela de cada case. Este site e a tipografia são trabalhos de verdade;
// Turno, Aurora e Pulso são conceitos, um por serviço, até entrarem os projetos novos
export type IdProjeto = 'site' | 'tipografia' | 'turno' | 'aurora' | 'pulso';

export const CAPA_DO_PROJETO: Record<IdProjeto, string> = {
    site: '/nova-projetos/site-capa.png',
    tipografia: '/nova-projetos/tipografia-capa.png',
    turno: '/nova-projetos/turno-capa.jpg',
    aurora: '/nova-projetos/aurora-capa.jpg',
    pulso: '/nova-projetos/pulso-capa.jpg',
};
