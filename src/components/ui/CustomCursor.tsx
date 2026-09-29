'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'motion/react';
import { useCursor } from '../ui/CursorContext';
import { FaRegHandPaper, FaRegHandRock } from "react-icons/fa";

export const CustomCursor = () => {
    const { cursorType, cursorText } = useCursor();

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, [mouseX, mouseY]);

    const variants = {
        default: { color: '#000000', scale: 1 },
        hero: { color: '#8DCFFB', scale: 1 },
        grab: { color: '#ffffff', scale: 0.9 },
        grabbing: { color: '#8DCFFB', scale: 0.85 },
        hidden: { opacity: 0 }
    };

    if (cursorType === 'hidden') return null;

    return (
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-normal isolate"
            style={{ x: mouseX, y: mouseY }}
            initial="default"
            animate={cursorType}
            variants={variants}
        >
            {(cursorType === 'grab' || cursorType === 'grabbing') ? (
                <div className="relative z-20 drop-shadow-md -translate-x-2 -translate-y-2">
                    {cursorType === 'grab' ? (
                        <FaRegHandPaper size={24} strokeWidth={1} color="currentColor" />
                    ) : (
                        <FaRegHandRock size={24} strokeWidth={1} color="currentColor" />
                    )}
                </div>
            ) : (
                // setinha padrão
                <svg
                    width="24" height="24" viewBox="0 0 24 24"
                    fill="none" xmlns="http://www.w3.org/2000/svg"
                    className="relative z-20 drop-shadow-md"
                >
                    <path
                        d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                        fill="currentColor" stroke="white" strokeWidth="1"
                    />
                </svg>
            )}

            {/* badge föeger */}
            <AnimatePresence>
                {cursorText && cursorType === 'hero' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0, x: -10, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0, transition: { duration: 0.15 } }}
                        transition={{ type: "spring", stiffness: 500, damping: 28 }}
                        className="absolute top-4 left-3 z-10 px-2 py-1 bg-[#8DCFFB] rounded-br-lg rounded-bl-lg rounded-tr-lg shadow-xl origin-top-left"
                    >
                        <p className="font-montserrat text-black text-[12px] font-bold whitespace-nowrap  tracking-wider">
                            {cursorText}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};