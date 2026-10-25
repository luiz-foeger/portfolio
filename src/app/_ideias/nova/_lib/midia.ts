// as imagens das seções da home (o texto fica em textos.ts)
import type { IdProjeto } from './textos';

// o case de cada projeto: uma imagem alta (módulos de 1440 de largura), que rola dentro da capa na pilha. Os do site e
// da tipografia são telas de verdade; os dos conceitos são mockups, até entrarem os projetos novos
export const CASO_DO_PROJETO: Record<IdProjeto, string> = {
    site: '/nova-projetos/site-caso.jpg',
    tipografia: '/nova-projetos/tipografia-caso.jpg',
    turno: '/nova-projetos/turno-caso.jpg',
    aurora: '/nova-projetos/aurora-caso.jpg',
    pulso: '/nova-projetos/pulso-caso.jpg',
};
