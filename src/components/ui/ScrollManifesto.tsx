
'use client';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';

const manifestoText = "ENGINEERING DIGITAL EXPERIENCES. CRAFTING PIXEL-PERFECT INTERFACES AND SCALABLE WEB APPLICATIONS. COMPLEX LOGIC MEETS MODERN AESTHETICS.";

const ScrollManifesto = () => {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // start and end points of the scroll animation relative to the viewport
    offset: ["start 60%", "end 50%"]
  });

  const words = manifestoText.split(" ");

  return (
    <section ref={containerRef} className="bg-[#050505] min-h-[150vh] relative pt-32 pb-64 px-4 sm:px-8">
      <div className="sticky top-1/4 max-w-7xl mx-auto flex flex-col gap-6">

        {/* <div className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest border-b border-white/10 pb-4 w-fit">
          [ 00 — Filosofia & Manifesto ]
        </div> */}

        <h2 className="font-bebas font-black uppercase text-[12vw] sm:text-[10vw] md:text-[7.5vw] lg:text-[6vw] leading-[0.85] tracking-wide sm:tracking-normal flex flex-wrap justify-center text-center gap-x-2 md:gap-x-4 gap-y-2 sm:gap-y-4">
          {words.map((word, i) => {
            // define the range for each word based on its index and total number of words
            const start = i / words.length;
            const end = start + (1 / words.length);

            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
            );
          })}
        </h2>
        
      </div>
    </section>
  );
};

// opacity word animation
interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}

const Word = ({ children, progress, range }: WordProps) => {
  const opacity = useTransform(progress, range, [0.15, 1]);

  return (
    <span className="relative inline-block">
      <span className="absolute opacity-0">{children}</span>

      <motion.span style={{ opacity }} className="text-white inline-block">
        {children}
      </motion.span>
    </span>
  );
};

export default ScrollManifesto;