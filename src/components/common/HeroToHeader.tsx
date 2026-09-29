'use client';
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { HiArrowDown } from 'react-icons/hi2';
import { AnimatedLogoHeader } from '../ui/AnimatedLogoHeader';

const HeroToHeader = () => {
    const [dimensions, setDimensions] = useState({ height: 1000, isMobile: false });
    const [isMounted, setIsMounted] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        setDimensions({
            height: window.innerHeight,
            isMobile: window.innerWidth < 768
        });
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsHidden(entry.isIntersecting);
        }, { threshold: 0.1 });

        const footer = document.querySelector('footer');
        if (footer) observer.observe(footer);
        
        return () => {
            if (footer) observer.unobserve(footer);
        };
    }, []);

    // Ganchos de Scroll do Framer Motion pareados com a rolagem real
    const { scrollY } = useScroll();
    const scrollRange = [0, 400]; 

    const currentHeight = useTransform(scrollY, scrollRange, [dimensions.height, 88]);
    const currentScale = useTransform(scrollY, scrollRange, [dimensions.isMobile ? 1.5 : 3, 0.45]);
    
    const exploreOpacity = useTransform(scrollY, [0, 150], [1, 0]);
    const exploreY = useTransform(scrollY, [0, 150], [0, 50]);

    if (!isMounted) return <div className="h-screen w-full bg-[#0a0a0a]" />;

    return (
        <>
            <section className="relative w-full h-[100dvh] flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
                
                {/* <motion.div 
                    style={{ opacity: exploreOpacity }}
                    className="absolute inset-0 w-full h-full pointer-events-none p-6 md:p-12 flex flex-col justify-between z-10"
                >
                    <div className="flex justify-between items-start font-mono text-[9px] md:text-[10px] text-neutral-500 uppercase tracking-widest">
                        <div>
                            <span className="block text-white mb-0.5">Role // 01</span>
                            Fullstack Developer
                        </div>
                        <div className="text-right">
                            <span className="block text-white mb-0.5">Role // 02</span>
                            Visual & Graphic Design
                        </div>
                    </div>

                    <div className="flex justify-between items-end font-mono text-[9px] md:text-[10px] text-neutral-500 uppercase tracking-widest">
                        <div>
                            <span className="block text-white mb-0.5">Location</span>
                            Espírito Santo, BR
                        </div>
                        <div className="text-right">
                            <span className="block text-white mb-0.5">Portfolio</span>
                            2026 © Föeger
                        </div>
                    </div>
                </motion.div> */}

                <motion.div 
                    style={{ opacity: exploreOpacity, y: exploreY }}
                    className="absolute bottom-12 flex flex-col items-center gap-2 text-neutral-500 pointer-events-none z-10"
                >
                    <span className="text-xs uppercase tracking-[0.3em] font-light">Explore o Portfolio</span>
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <HiArrowDown size={20} />
                    </motion.div>
                </motion.div>
            </section>

            <motion.div
                style={{
                    height: currentHeight,
                }}
                animate={{ 
                    opacity: isHidden ? 0 : 1 
                }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 left-0 w-full z-50 flex flex-col justify-center items-center overflow-visible pointer-events-none"
            >
                <motion.div
                    style={{ scale: currentScale }}
                    className="relative flex justify-center items-center pointer-events-auto"
                >
                    <button 
                        onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} 
                        className="block bg-transparent border-none p-0 cursor-pointer outline-hidden"
                    >
                        <AnimatedLogoHeader />
                    </button>
                </motion.div>
            </motion.div>
        </>
    );
};

export default HeroToHeader;