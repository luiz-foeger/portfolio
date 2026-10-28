import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaTimes, FaBehance } from "react-icons/fa";

// --- Definição de Tipos e Dados ---

interface DesignProject {
    id: number;
    title: string;
    category: string;
    imageUrl: string;
    description: string;
}

// Imagem padrão (Placeholder Dark)
const imagemPadrao = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

const designs: DesignProject[] = [
    {
        id: 1,
        title: "Identidade Visual BarberHub",
        category: "Branding",
        imageUrl: imagemPadrao,
        description: "Criação de logotipo, paleta de cores e guia de estilos para aplicativo de agendamento, focando em modernidade e masculinidade.",
    },
    {
        id: 2,
        title: "Cyberpunk Social Kit",
        category: "Social Media",
        imageUrl: imagemPadrao,
        description: "Pacote de templates para redes sociais com estética futurista e neon.",
    },
    {
        id: 3,
        title: "Festival de Jazz",
        category: "Print Design",
        imageUrl: imagemPadrao,
        description: "Poster tipográfico e material impresso para evento musical noturno.",
    },
    {
        id: 4,
        title: "App Dark Mode UI",
        category: "UI/UX",
        imageUrl: imagemPadrao,
        description: "Interface de usuário focada em alto contraste e acessibilidade para uso noturno.",
    },
    {
        id: 5,
        title: "Capa de Álbum",
        category: "Art Direction",
        imageUrl: imagemPadrao,
        description: "Direção de arte e composição 3D para capa de single digital.",
    },
    {
        id: 6,
        title: "Banner E-commerce",
        category: "Web Design",
        imageUrl: imagemPadrao,
        description: "Banner promocional de alta conversão para campanha de Black Friday.",
    }
];

// --- O Componente ---

const DesignProjects: React.FC = () => {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const selectedProject = designs.find((p) => p.id === selectedId);

    return (
        <section className="py-24 relative overflow-hidden" id="design">

            {/* Detalhe de fundo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">

                {/* Cabeçalho */}
                <div className="max-w-[1000px] mx-auto px-6 mb-24 relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-white font-bold text-3xl md:text-6xl text-center mb-8 md:mb-12 tracking-tight"
                    >
                        Principais Designs
                    </motion.h2>
                    <motion.p className="text-white/90 text-sm sm:text-base sm:leading-6 md:text-2xl md:leading-8 leading-relaxed text-center">
                        Explorando a estética visual além do código.
                    </motion.p>
                </div>

                {/* Grid Masonry */}
                <div className="columns-1 gap-6 space-y-6 sm:columns-2 md:columns-3">
                    {designs.map((project) => (
                        <motion.div
                            key={project.id}
                            layoutId={`card-${project.id}`} // Link mágico para animação de expandir/fechar
                            onClick={() => setSelectedId(project.id)}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 break-inside-avoid shadow-lg"
                            whileHover={{ scale: 1.02 }} // Leve zoom no hover
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={project.imageUrl}
                                alt={project.title}
                                className="h-auto w-full object-cover transition-opacity duration-500 group-hover:opacity-80"
                                loading="lazy"
                            />

                            <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t/srgb from-black via-transparent to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                    {project.category}
                                </span>
                                <h3 className="mt-1 text-xl font-bold text-white">
                                    {project.title}
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Modal / Lightbox */}
                <AnimatePresence>
                    {selectedId && selectedProject && (
                        // Wrapper Fixo (Backdrop)
                        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">

                            {/* Fundo Escuro com Fade In/Out Independente */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/90 backdrop-blur-xs"
                                onClick={() => setSelectedId(null)}
                            />

                            {/* Card do Modal com Morphing (LayoutId) */}
                            <motion.div
                                layoutId={`card-${selectedId}`}
                                className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl"
                                transition={{ type: "spring", damping: 25, stiffness: 300 }} // Deixa a animação mais "elástica"
                            >
                                {/* Botão Fechar */}
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white border border-white/10 hover:bg-white hover:text-black transition-all"
                                >
                                    <FaTimes />
                                </button>

                                <div className="flex flex-col md:flex-row max-h-[85vh] overflow-y-auto md:overflow-hidden">
                                    {/* Imagem */}
                                    <div className="bg-black p-4 flex items-center justify-center md:w-2/3 h-[300px] md:h-auto">
                                        <motion.img
                                            src={selectedProject.imageUrl}
                                            alt={selectedProject.title}
                                            className="max-h-full max-w-full object-contain shadow-2xl rounded-lg"
                                            // Pequena transição suave na imagem interna
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        />
                                    </div>

                                    {/* Textos */}
                                    <div className="p-8 md:w-1/3 flex flex-col justify-center bg-neutral-900">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <span className="mb-2 text-sm font-bold uppercase tracking-wider text-blue-400">
                                                {selectedProject.category}
                                            </span>
                                            <h2 className="mb-4 text-3xl font-bold text-white">
                                                {selectedProject.title}
                                            </h2>
                                            <div className="h-1 w-20 bg-blue-600 mb-6 rounded-full"></div>
                                            <p className="text-gray-300 leading-relaxed">
                                                {selectedProject.description}
                                            </p>

                                            <div className="mt-8 pt-6 border-t border-white/10">
                                                <a
                                                    href="https://be.net/plenta"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-black transition-transform hover:scale-105"
                                                >
                                                    <FaBehance size={20} />
                                                    Ver no Behance
                                                </a>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default DesignProjects;