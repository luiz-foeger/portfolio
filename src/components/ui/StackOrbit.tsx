'use client';

    import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// import { useCursor } from '../ui/CursorContext';

import {
    SiNextdotjs, SiTypescript, SiJavascript, SiTailwindcss,
    SiFigma, SiReact, SiWordpress, SiGit, SiNodedotjs,
    SiGithub
} from 'react-icons/si';
import { SiAdobephotoshop, SiCss3, SiVisualstudiocode } from './BrandIcons';

interface OrbitItem {
    icon: React.ElementType;
    color: string;
    label: string;
}

const INNER_ORBIT: OrbitItem[] = [
    { icon: SiReact, color: '#61DAFB', label: 'React' },
    { icon: SiTailwindcss, color: '#38B2AC', label: 'Tailwind' },
    { icon: SiCss3 , color: '#2496ED', label: 'CSS3' },
];

const MIDDLE_ORBIT: OrbitItem[] = [
    { icon: SiNextdotjs, color: '#FFFFFF', label: 'Next.js' },
    { icon: SiTypescript, color: '#3178C6', label: 'TypeScript' },
    { icon: SiNodedotjs, color: '#339933', label: 'Node.js' },
    { icon: SiJavascript, color: '#F7DF1E', label: 'JavaScript' },
];

const OUTER_ORBIT: OrbitItem[] = [
    { icon: SiAdobephotoshop, color: '#31A8FF', label: 'Photoshop' },
    { icon: SiGit, color: '#F05032', label: 'Git' },
    { icon: SiWordpress, color: '#21759B', label: 'WordPress' },
    { icon: SiVisualstudiocode, color: '#47A248', label: 'VSCode' },
    { icon: SiFigma, color: '#F24E1E', label: 'Figma' },
];

const RING_CONTENT = {
    default: {
        title: "Tech\nEcosystem",
        subtitle: "Architecture Overview",
        desc: "Interact with the orbital rings to dissect the specialized tools, runtimes, and frameworks driving my high-performance digital solutions.",
    },
    center: {
        title: "Source\nControl",
        subtitle: "Central Hub",
        desc: "The architectural anchor where logical structures, creative code, and automation pipelines converge securely."
        // cta: "SCROLL TO EXPLORE"
    },
    0: {
        title: "Client\nLayer",
        subtitle: "Client Architecture",
        desc: "Engineers immersive client-side experiences through reactive component architectures, fluid styling systems, and ultra-responsive layouts.",
        // cta: "VIEW COMPONENTS"
    },
    1: {
        title: "Fullstack\nEngine",
        subtitle: "Server, Logic and Data",
        desc: "Powers high-throughput server infrastructures, integrating hybrid data-fetching, robust server-side execution, and type-safe backend environments.",
        // cta: "VIEW REPOSITORIES"
    },
    2: {
        title: "Design\n& Ops",
        subtitle: "Creative Control",
        desc: "Unites user experience with infrastructure management, ensuring intuitive interfaces backed by resilient deployment pipelines.",
        // cta: "VIEW CASE STUDIES"
    }
};

const StackOrbit = () => {
    // const { setCursorType } = useCursor();
    const [isMobile, setIsMobile] = useState(false);
    const [arrastandoIcone, setArrastandoIcone] = useState(false);
    
    // estado que guarda qual anel está com o mouse em cima (0, 1, 2 ou null)
    const [activeText, setActiveText] = useState<number | 'default' | 'center'>('default');
    // const [activeRing, setActiveRing] = useState<number | null>(null);;

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 1024);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        if (!arrastandoIcone) return;
        document.body.classList.add('arrastando');
        const encerrarArrasto = () => setArrastandoIcone(false);
        window.addEventListener('pointerup', encerrarArrasto);
        window.addEventListener('pointercancel', encerrarArrasto);
        return () => {
            document.body.classList.remove('arrastando');
            window.removeEventListener('pointerup', encerrarArrasto);
            window.removeEventListener('pointercancel', encerrarArrasto);
        };
    }, [arrastandoIcone]);

    // define o conteúdo baseado no hover
    const currentContent = RING_CONTENT[activeText !== null ? activeText as keyof typeof RING_CONTENT : 'default'];
    // const currentContent = RING_CONTENT[activeRing !== null ? activeRing as keyof typeof RING_CONTENT : 'default'];

    return (
        <div className="relative flex flex-col lg:flex-row items-center justify-between w-full min-h-[700px] md:min-h-[900px] py-20 lg:py-0 px-6 md:px-12 lg:px-24 overflow-hidden bg-[#050505]"
            // onMouseEnter={() => setCursorType('grab')}
            // onMouseLeave={() => setCursorType('default')}
            // onMouseDown={() => setCursorType('grabbing')}
            // onMouseUp={() => setCursorType('grab')}
        >
            
            {/* left content */}
            <div className="z-30 w-full lg:w-[30%] flex flex-col items-start justify-center text-left mb-16 lg:mb-0 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentContent.title}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* <h2 className="text-5xl md:text-6xl md:leading-none lg:text-7xl lg:leading-none font-lexend font-black tracking-tighter text-white leading-[1.05] whitespace-pre-line"> */}
                        <h2 className="font-bebas font-black text-[18vw] sm:text-[15vw] md:text-[12vw] lg:text-[6vw] leading-[0.85] tracking-wide sm:tracking-normal text-white whitespace-pre-line">
                            {currentContent.title}
                        </h2>
                        <div className="mt-8 md:mt-16">
                            {/* <p className="text-xs font-lexend text-neutral-500 mb-4 tracking-widest uppercase"> */}
                            <p className="font-bricolage font-bold text-[5vw] sm:text-[3.5vw] md:text-[2.5vw] lg:text-[1.5vw] text-neutral-400 mb-4 leading-relaxed max-w-sm">
                                {currentContent.subtitle}
                            </p>
                            <div className="h-[2px] w-full max-w-[500px] bg-white/40" />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>


            {/* center content */}
            <div className="relative flex items-center justify-center w-full lg:w-[40%] h-[500px] md:h-[650px] z-20 cursor-grab">  
                <div 
                    className="absolute z-20 flex items-center justify-center pointer-events-auto group"
                    onMouseEnter={() => setActiveText('center')}
                    onMouseLeave={() => setActiveText('default')}
                >
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        // CORREÇÃO: O hover da borda e da sombra agora têm valores absolutos e transição suave
                        className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(141,207,251,0.15)] relative z-10 cursor-pointer p-4 transition-all duration-500 hover:border-[#8DCFFB]/60 hover:shadow-[0_0_60px_rgba(141,207,251,0.6)]"
                    >
                        <a href="https://github.com/luiz-foeger" target="_blank" rel="noopener noreferrer">
                            <SiGithub className="text-4xl md:text-6xl text-white transition-colors duration-300 group-hover:text-white" />
                        </a>
                    </motion.div>
                    
                    {/* Opcional: Aumentei levemente a opacidade do pulso de fundo para dar mais presença */}
                    <div className="absolute inset-0 bg-[#8DCFFB]/15 blur-3xl rounded-full animate-pulse"></div>
                </div>

                  <OrbitRing 
                    index={0} size={isMobile ? 180 : 300} duration={25} items={INNER_ORBIT} 
                    isActive={activeText === 0} onHover={(idx) => setActiveText(idx ?? 'default')} onArrastar={setArrastandoIcone} 
                />
                <OrbitRing 
                    index={1} size={isMobile ? 290 : 470} duration={40} reverse items={MIDDLE_ORBIT} 
                    isActive={activeText === 1} onHover={(idx) => setActiveText(idx ?? 'default')} onArrastar={setArrastandoIcone} 
                />
                <OrbitRing 
                    index={2} size={isMobile ? 400 : 640} duration={60} items={OUTER_ORBIT} 
                    isActive={activeText === 2} onHover={(idx) => setActiveText(idx ?? 'default')} onArrastar={setArrastandoIcone} 
                />
            </div>


            {/* right content */}
            <div className="z-30 w-full lg:w-[30%] flex flex-col items-start lg:items-end justify-center text-left lg:text-right mt-16 lg:mt-0 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentContent.desc}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-start lg:items-end"
                    >
                        <p className="font-bricolage font-bold text-neutral-400 text-[5vw] sm:text-[3.5vw] md:text-[2.5vw] lg:text-[1.5vw] text-left max-w-sm">
                            {currentContent.desc}
                        </p>
                        {/* <div className="mt-8 pointer-events-auto">
                            <a href="#" className="text-xs font-lexend text-white tracking-widest uppercase hover:text-[#8DCFFB] transition-colors flex items-center gap-3 group">
                                {currentContent.cta} 
                                <span className="text-lg transform group-hover:translate-x-1 transition-transform">→</span>
                            </a>
                        </div> */}
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    );
};

interface OrbitRingProps {
    index: number;
    size: number;
    duration: number;
    reverse?: boolean;
    items: OrbitItem[];
    isActive: boolean;
    onHover: (index: number | null) => void;
    onArrastar: (arrastando: boolean) => void;
}

const OrbitRing = ({ index, size, duration, reverse = false, items, isActive, onHover, onArrastar }: OrbitRingProps) => {
    const angleStep = 360 / items.length;
    const svgSize = size + 60; 

    return (
        <div className="absolute flex items-center justify-center pointer-events-none z-10">
            
            <svg width={svgSize} height={svgSize} className="absolute pointer-events-none" style={{ overflow: 'visible' }}>
                
                {/* style com pointerEvents: 'stroke' força o navegador a ler o hover */}
                <circle
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    r={size / 2}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="40"
                    style={{ pointerEvents: 'stroke' }}
                    onMouseEnter={() => onHover(index)}
                    onMouseLeave={() => onHover(null)}
                />
                
                <circle
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    r={size / 2}
                    fill="none"
                    stroke={isActive ? "rgba(141, 207, 251, 0.5)" : "rgba(255,255,255,0.05)"}
                    strokeWidth={isActive ? "2" : "1"}
                    className="pointer-events-none transition-all duration-300 ease-out"
                />
            </svg>

            {/* container giratório dos ícones */}
            <motion.div
                animate={{ rotate: reverse ? -360 : 360 }}
                transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
                className="relative rounded-full flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {items.map((item, idx) => {
                    const angle = idx * angleStep;
                    return (
                        <div
                            key={idx}
                            className="absolute flex items-center justify-center pointer-events-auto"
                            style={{
                                transform: `rotate(${angle}deg) translate(${size / 2}px) rotate(-${angle}deg)`,
                            }}
                        >
                            {/* contra-rotação para os ícones ficarem retos */}
                            <motion.div
                                animate={{ rotate: reverse ? 360 : -360 }}
                                transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
                                style={{ transformOrigin: 'center center' }}
                            >
                                <motion.div
                                    drag
                                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    dragElastic={0.2}
                                    whileHover={{ scale: 1.2, backgroundColor: "rgba(255,255,255,0.1)" }}
                                    whileTap={{ scale: 0.9 }}
                                    onDragStart={() => onArrastar(true)}
                                    onDragEnd={() => onArrastar(false)}
                                    // a caixinha acende a borda levemente se o anel inteiro estiver ativo
                                    className={`w-11 h-11 md:w-16 md:h-16 bg-[#0a0a0afb] border rounded-xl flex items-center justify-center shadow-lg group transition-colors duration-300 ${isActive ? 'border-[#8DCFFB]/50' : 'border-white/10 hover:border-[#8DCFFB]'}`}
                                >
                                    <item.icon className={`text-xl md:text-3xl transition-colors ${isActive ? 'text-white' : 'text-gray-500'} group-hover:text-white`} />

                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[12px] font-lexend text-[#8DCFFB] whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-white/10 pointer-events-none z-20">
                                        {item.label}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};  

export default StackOrbit;