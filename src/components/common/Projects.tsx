'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';
import { FiGithub, FiExternalLink } from 'react-icons/fi';

// --- DADOS DOS PROJETOS (Mantidos iguais) ---
const projects = [
    {
        title: "LD Consultoria",
        description: "Landing Page de alta conversão desenvolvida para uma dupla de personal trainers, com foco em captar leads qualificados e facilitar a venda de consultorias e infoprodutos.",
        tags: ["WordPress", "Elementor", "WooCommerce"],
        link: "#",
        github: "",
        src: "https://res.cloudinary.com/db43xalo3/image/upload/v1766803724/Opera_Instant%C3%A2neo_2025-12-26_232210_iutute.png"
    },
    {
        title: "CineDev",
        description: "Plataforma de exploração cinematográfica que consome a API do TMDB em tempo real, oferecendo busca dinâmica, detalhes técnicos de obras e avaliações, tudo em uma interface moderna e responsiva.",
        tags: ["React", "JavaScript", "CSS", "API Integration"],
        link: "https://cinedev-project.vercel.app",
        github: "https://github.com/luiz-foeger/CineDev",
        src: "https://res.cloudinary.com/db43xalo3/image/upload/v1766803494/Opera_Instant%C3%A2neo_2025-12-26_232210_ywekyc.png"
    },
    {
        title: "Street&Wear",
        description: "E-commerce conceito, focado na estética urbana e skate, desenvolvido para aprimorar lógicas complexas de carrinho de compras, filtragem de produtos e checkout utilizando React e JavaScript.",
        tags: ["React", "JavaScript", "CSS"],
        link: "https://streetwear-project.vercel.app",
        github: "https://github.com/luiz-foeger/StreetWear",
        src: "https://res.cloudinary.com/db43xalo3/image/upload/v1766800107/937bb523-0ec2-4ab7-8365-ea6ed0557761.png"
    },
    {
        title: "EA SPORTS FC™ 24",
        description: "Landing page para o jogo EA SPORTS FC 24. Destaque para a arquitetura da informação, focados em apresentar o conteúdo de forma imersiva e direta, utilizando elementos visuais de alta qualidade e CTAs claras.",
        tags: ["HTML", "JavaScript", "CSS"],
        link: "https://streetwear-project.vercel.app",
        github: "https://github.com/luiz-foeger/StreetWear",
        src: "https://res.cloudinary.com/db43xalo3/image/upload/v1766803785/6ba57bac-e44e-459f-bdfd-1957ee72d4f4.png"
    },
    // {
    //     title: "BarberHub",
    //     description: "Uma plataforma completa para agendamento de serviços em barbearias. Conecta clientes a profissionais da região de Santa Teresa, com gestão de horários em tempo real e sistema de avaliação.",
    //     tags: ["React", "JavaScript", "CSS", "Python"],
    //     link: "https://barber-hub.vercel.app",
    //     github: "",
    //     src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop"
    // },
];

// --- COMPONENTE DO CARD INDIVIDUAL ---
const Card = ({
    i,
    title,
    description,
    tags,
    src,
    link,
    github,
    progress,
    range,
    targetScale
}: {
    i: number;
    title: string;
    description: string;
    tags: string[];
    src: string;
    link: string;
    github: string;
    progress: MotionValue<number>;
    range: number[];
    targetScale: number;
}) => {
    const container = useRef(null);
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start end', 'start start']
    });

    const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
    const scale = useTransform(progress, range, [1, targetScale]);

    return (
        <div ref={container} className="h-screen flex items-center justify-center sticky top-0 px-4">
            <motion.div
                style={{
                    scale,
                    top: `calc(-5vh + ${i * 25}px)`,
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    transformStyle: "preserve-3d",
                }}

                className="flex flex-col relative -top-[25%] h-[550px] w-full max-w-[1100px] rounded-3xl p-8 md:p-12 origin-top border border-white/10 bg-[rgb(13,23,30)]/90 backdrop-blur-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]"

            >
                <div className="relative z-10 flex flex-col md:flex-row h-full gap-4 md:gap-10 items-center">
                    {/* LADO ESQUERDO */}
                    <div className="w-full md:w-[45%] flex flex-col justify-between h-full py-4 z-20 order-2 md:order-1">
                        <div>
                            <h2 className="text-2xl md:text-5xl font-bold mb-2 md:mb-6 text-white tracking-tight">{title}</h2>

                            <div className="flex flex-wrap gap-2 mb-4 md:mb-8">
                                {tags.map((tag, idx) => (
                                    <span key={idx} className="px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-sm font-medium bg-[#8dcffb]/10 text-[#8dcffb] border border-[#8dcffb]/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <p className="text-sm md:text-lg md:leading-7 text-white/80 leading-relaxed mb-4 md:mb-8">{description}</p>
                        </div>

                        <div className="flex items-center gap-6">
                            {github && (
                                <a href={github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/80 hover:text-white transition-all text-base font-medium group py-2 border-b border-transparent hover:border-white">
                                    <FiGithub size={22} /> Code
                                </a>
                            )}
                            <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#8dcffb] hover:text-[#8dcffb]/80 transition-all text-base font-bold group py-2 border-b border-transparent hover:border-[#8dcffb]">
                                {/* <FiExternalLink size={22} /> Live Demo */}
                                <FiExternalLink size={22} /> Ver Projeto
                            </a>
                        </div>
                    </div>

                    {/* LADO DIREITO */}
                    <div className="w-full md:w-[55%] flex-1 md:h-full min-h-[200px] rounded-2xl overflow-hidden relative border border-white/10 z-10 order-1 md:order-2 bg-[#111] pt-10 pl-6 pr-6  shadow-xl">
                        <motion.div style={{ scale: imageScale }} className="w-full h-full relative">
                            <img
                                src={src}
                                alt={`Imagem do projeto ${title}`}
                                className="object-cover object-top w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-500 rounded-t-lg"
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const Projects = () => {
    const container = useRef(null);
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start start', 'end end']
    });

    return (
        <section ref={container} id="projetos" className="relative mt-32 mb-32">

            <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[80%] h-[60%] bg-[#8dcffb] opacity-10 blur-[120px] rounded-full z-0 pointer-events-none"></div>

            <div className="max-w-[1000px] mx-auto px-6 mb-24 relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-white font-bold text-3xl md:text-6xl text-center mb-8 md:mb-12 tracking-tight"
                >
                    Projetos Destaques
                </motion.h2>
                <motion.p className="text-white/90 text-sm sm:text-base sm:leading-6 md:text-2xl md:leading-8 leading-relaxed text-center max-w-3xl mx-auto">
                    Uma coleção de projetos que desafiaram minhas habilidades de design e código.
                </motion.p>
            </div>

            <div className="flex flex-col gap-0 relative z-10">
                {projects.map((project, i) => {
                    const targetScale = 1 - ((projects.length - i) * 0.05);
                    return (
                        <Card
                            key={i}
                            i={i}
                            {...project}
                            progress={scrollYProgress}
                            range={[i * 0.25, 1]}
                            targetScale={targetScale}
                        />
                    );
                })}
            </div>
        </section >
    );
};

export default Projects;