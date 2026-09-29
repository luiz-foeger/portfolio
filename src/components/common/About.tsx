'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import StackOrbit from '../ui/StackOrbit';
// import Icones from '../ui/Icones';
// import TechPhysics from '../ui/TechPhysics';

// conteúdo reutilizável para mobile e desktop
const content = {
    intro: (
        <div className="flex flex-col justify-center h-full px-6 md:px-20 w-full md:w-[95vw] shrink-0">
            <h2 className="font-montserrat text-4xl md:text-9xl font-black text-white uppercase tracking-tighter mb-4 md:mb-0">
                Não é apenas <br />
                <span className="text-4xl md:text-9xl font-black text-white uppercase tracking-tighter mb-4 md:mb-0">
                    Código
                </span>
            </h2>
            <p className="text-gray-400 text-lg md:text-2xl font-light max-w-xl border-l-2 border-[#8DCFFB] pl-6">
                Bem-vindo aos bastidores! Aqui é onde a lógica encontra a estética.
                <span className="hidden md:inline"> Role para explorar.</span>
                <span className="md:hidden"> Deslize para ver.</span>
            </p>
            {/* <div className="mt-10 hidden md:flex items-center gap-4 text-sm font-mono text-gray-500 animate-pulse">
                <span>SCROLL TO EXPLORE</span>
                <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div> */}
        </div>
    ),
    bio: (
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center h-full px-6 md:px-20 w-full md:w-[95vw] shrink-0">
            <div className="w-full md:w-[60vh] aspect-square md:aspect-[4/5] bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden group">
                <img
                    src="https://res.cloudinary.com/db43xalo3/image/upload/v1769742982/foeger_kxpqbn.jpg"
                    alt="Luiz Föeger"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-110 grayscale md:grayscale md:group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-linear-to-t/srgb from-[#050505] via-[#8DCFFB]/20 to-transparent opacity-80 md:group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
                <div className="absolute bottom-6 left-6 z-10">
                    <a href="https://instagram.com/foeger.dev" target="_blank" rel="noopener noreferrer"><p className="font-montserrat text-xs md:text-2xl font-bold text-[#8DCFFB] mb-1">@foeger.dev</p></a>
                    <h3 className="font-montserrat text-2xl md:text-5xl font-black text-white drop-shadow-md">Luiz Föeger</h3>
                </div>
            </div>

            <div className="w-full md:w-1/2 space-y-6 pb-10 md:pb-0">
                <h3 className="font-montserrat text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 md:mb-0">DESIGN DRIVEN <br /> DEVELOPER.</h3>
                <p className="text-gray-300 text-base md:text-lg md:leading-7 leading-relaxed">
                    Minha trajetória une a precisão do <span className="text-white font-semibold">Design Gráfico</span> com a lógica do <span className="text-white font-semibold">Desenvolvimento Full-Stack</span>. Essa combinação me permite criar <span className="text-white font-semibold">experiências digitais</span> como um todo: da estética à funcionalidade.
                </p>

                <p className="text-gray-300 text-base md:text-lg md:leading-7 leading-relaxed">
                    Sou apaixonado por construir <span className="text-white font-semibold">ecossistemas digitais</span> completos. Utilizo ferramentas como
                    <strong className="text-[#8dcffb] font-bold hover:text-white transition-colors duration-300"> React</strong>,
                    <strong className="text-[#8dcffb] font-bold hover:text-white transition-colors duration-300"> Next.js</strong>,
                    <strong className="text-[#8dcffb] font-bold hover:text-white transition-colors duration-300"> JavaScript </strong>
                    e <strong className="text-[#8dcffb] font-bold hover:text-white transition-colors duration-300">TypeScript</strong> para interfaces fluidas, e
                    <strong className="text-[#8dcffb] font-bold hover:text-white transition-colors duration-300"> Node.js </strong> 
                    e <strong className="text-[#8dcffb] font-bold hover:text-white transition-colors duration-300">Docker</strong> para criar sistemas robustos e escaláveis.
                </p>

                <p className="text-gray-300 text-base md:text-lg md:leading-7 leading-relaxed">
                    Meu foco principal é criar interfaces <span className="text-white font-semibold not-italic">criativas e intuitivas</span>, sempre com uma abordagem centrada na
                    Experiência do Usuário.
                </p>
            </div>
        </div>
    ),
    stack: (
        <div className="flex flex-col justify-center h-full px-6 md:px-20 w-full md:w-[85vw] shrink-0">

            {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-0 w-full border-b border-white/10 pb-6 relative z-10"> */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-0 w-full pb-6 relative z-10">
                <h3 className="font-montserrat text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 md:mb-0">
                    {/* Hard <br/> Skills */}
                    Hard Skills
                </h3>
                <div className="text-left md:text-right font-mono text-xs text-gray-500">
                    <p>// HOVER_TO_IDENTIFY</p>
                    {/* <p className="flex items-center gap-2 justify-end">
                        <span className="w-2 h-2 rounded-full bg-[#8DCFFB] animate-pulse"></span>
                        ORBITAL_VIEW
                    </p> */}
                </div>
            </div>

            <div className="w-full h-[50vh] md:h-[70vh] flex items-center justify-center scale-[0.6] md:scale-100 origin-center transition-transform duration-500">
                <StackOrbit />
            </div>

        </div>
    ),
    cta: (
        <div className="flex flex-col justify-center items-center h-full px-6 md:px-20 w-full md:w-[95vw] shrink-0 text-center py-20 md:py-0">
            <h2 className="text-[15vw] md:text-[12vw] font-black text-white leading-none tracking-tighter mb-8 md:hover:text-[#8DCFFB] transition-colors duration-300 cursor-default">
                READY?
            </h2>
            <button className="px-10 py-4 bg-white text-black text-xl font-bold rounded-full active:scale-95 md:hover:scale-110 transition-transform duration-300 shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                Iniciar Projeto
            </button>
        </div>
    )
};

const About = () => {
    // refs desktop
    const targetRef = useRef<HTMLDivElement>(null);
    const horizontalContainerRef = useRef<HTMLDivElement>(null);
    const [xTransform, setXTransform] = useState(0);

    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    // cálculo scroll horizontal desktop
    useEffect(() => {
        const handleResize = () => {
            if (horizontalContainerRef.current && window.innerWidth >= 768) {
                const totalWidth = horizontalContainerRef.current.scrollWidth;
                const windowWidth = window.innerWidth;
                setXTransform(totalWidth - windowWidth);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const x = useTransform(scrollYProgress, [0, 1], ["0px", `-${xTransform}px`]);
    const bgTextX = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
    const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <section id="sobre-mim" className="relative bg-[#050505]">

            {/* scroll vertical mobile (block md:hidden)*/}
            <div className="block md:hidden w-full overflow-hidden relative pb-20 px-4">
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-50 mix-blend-overlay"
                    style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>

                {/* texto background */}
                {/* <div className="absolute top-0 right-0 h-full w-full pointer-events-none opacity-[0.02] overflow-hidden">
                    <h1 className="text-[15vh] font-black text-white writing-vertical-rl rotate-180 absolute -right-4 top-0 sticky">
                        WHO I AM
                    </h1>
                </div> */}

                <div className="flex flex-col gap-24 pt-20">
                    <section className="min-h-[60vh] flex flex-col justify-center">
                        {content.intro}
                    </section>
                    <section>
                        {content.bio}
                    </section>
                    <section>
                        {content.stack}
                    </section>
                    <section className="pb-20">
                        {content.cta}
                    </section>
                </div>
            </div>

            {/* scroll horizontal desktop (hidden md:block -> h-[400vh])*/}
            <div ref={targetRef} className="hidden md:block relative h-[400vh]">
                <div className="sticky top-0 flex h-screen items-center overflow-hidden">

                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-50 mix-blend-overlay"></div>

                    {/* texto background parallax */}
                    <motion.div
                        style={{ x: bgTextX }}
                        className="absolute bottom-0 left-0 -translate-y-1/2 flex gap-40 pointer-events-none opacity-[0.03] select-none z-0 whitespace-nowrap"
                    >
                        <span className="text-[14vh] font-black font-montserrat text-white">WHO I AM</span>
                        <span className="text-[14vh] font-black font-montserrat text-white">WHAT I DO</span>
                        <span className="text-[14vh] font-black font-montserrat text-white">LETS WORK</span>
                    </motion.div>

                    {/* container horizontal animado */}
                    <motion.div
                        ref={horizontalContainerRef}
                        style={{ x }}
                        className="flex h-screen items-center z-10 w-max"
                    >
                        {/* render sections */}
                        <div className="h-full flex items-center justify-center border-r border-white/5">{content.intro}</div>
                        <div className="h-full flex items-center justify-center border-r border-white/5">{content.bio}</div>
                        <div className="h-full flex items-center justify-center border-r border-white/5">{content.stack}</div>
                        <div className="h-full flex items-center justify-center border-r border-white/5">{content.cta}</div>
                    </motion.div>

                    {/* barra de progresso */}
                    <div className="absolute bottom-10 left-10 right-10 h-[2px] bg-white/10 rounded-full overflow-hidden z-20">
                        <motion.div
                            style={{ width: progressWidth }}
                            className="h-full bg-[#8DCFFB] shadow-[0_0_10px_#8DCFFB]"
                        />
                    </div>

                    <div className="absolute bottom-12 right-10 text-xs font-mono text-gray-500 uppercase tracking-widest z-20">
                        02. About Me
                    </div>
                </div>
            </div>

        </section>
    );
};

export default About;