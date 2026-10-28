'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HiArrowDown } from 'react-icons/hi2';
import { AnimatedLogoHeader } from '../ui/AnimatedLogoHeader';

const Header = () => {
    const [hasScrolled, setHasScrolled] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- a medida da tela só existe no navegador
        setIsMobile(window.innerWidth < 768);
        const handleScroll = () => {
            if (window.scrollY > 15 && !hasScrolled) setHasScrolled(true);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasScrolled]);

    // CORREÇÃO DO ERRO DE SINTAXE (FECHAMENTO DE PARENTESES)
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

    const isIntro = !hasScrolled;

    return (
        <motion.header
            initial={{ height: "100vh", backgroundColor: "rgb(10,10,10)" }}
            animate={{
                height: isIntro ? "100dvh" : "5.5rem",
                backgroundColor: isIntro ? "rgb(10,10,10)" : "rgba(10,10,10,0)",
                opacity: isHidden ? 0 : 1,
                pointerEvents: isIntro ? "none" : "auto" 
            }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 w-full z-50 flex flex-col justify-center items-center overflow-visible"
        >
            <motion.div
                className="relative flex justify-center items-center"
                initial={{ scale: isMobile ? 1.5 : 3 }}
                animate={{ scale: isIntro ? (isMobile ? 1.5 : 3) : 0.45 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
                <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="block pointer-events-auto bg-transparent border-none p-0 cursor-pointer outline-hidden">
                    <AnimatedLogoHeader />
                </button>
            </motion.div>

            <AnimatePresence>
                {isIntro && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ delay: 0.8, duration: 0.6 }} className="absolute bottom-12 flex flex-col items-center gap-2 text-neutral-500">
                        <span className="text-xs uppercase tracking-[0.3em] font-light">Explore o Portfolio</span>
                        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                            <HiArrowDown size={20} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

export default Header;