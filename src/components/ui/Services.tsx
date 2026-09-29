'use client';
import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { FiArrowUpRight } from 'react-icons/fi';
import { usePageTransition } from './PageTransition';

const SERVICES = [
  {
    id: 1,
    title: "Digital Products",
    description: "Selected Works",
    image: "https://res.cloudinary.com/db43xalo3/image/upload/v1766800107/937bb523-0ec2-4ab7-8365-ea6ed0557761.png",
    href: "/services/digital-products"
  },
  {
    id: 2,
    title: "Web Prototyping",
    description: "Experience and Structure",
    image: "https://res.cloudinary.com/db43xalo3/image/upload/v1786410664/700d1bad-5eca-4bbf-a307-874e8e0d81e5.png",
    href: "/services/web-prototyping"
  },
  {
    id: 3,
    title: "Graphic & Visuals",
    description: "Branding and Design",
    image: "https://res.cloudinary.com/db43xalo3/image/upload/v1786410468/5171e707-4d5f-4f39-92a9-17e340cf528c.png",
    href: "/services/graphic-visuals"
  },
  {
    id: 4,
    title: "Experimental Lab",
    description: "Testing and Innovation",
    image: "https://res.cloudinary.com/db43xalo3/image/upload/v1786410965/c4c90e1b-6748-4894-844c-c63886ca0b92.png",
    href: "/services/experimental-lab"
  }
];

const Services = () => {
  const { navigate } = usePageTransition();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // física do mouse para as imagens
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const smoothY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const isAnyHovered = hoveredIndex !== null;

  return (
    <section className="bg-[#050505] py-24 md:py-32 relative z-20 w-full overflow-hidden">
      <div className="w-full px-6 md:px-12 lg:px-24 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

          <div className="lg:col-span-3 lg:flex flex-col justify-start hidden relative min-h-[400px]">
            <div className="sticky top-40">
              <div className="flex items-center gap-6 origin-top-left -rotate-90 absolute translate-y-[300px] opacity-60">
                <span className="w-16 h-[1px] bg-neutral-500"></span>
                <span className="font-bricolage font-bold text-neutral-400 tracking-[0.3em] uppercase text-xs whitespace-nowrap">
                  Core Capabilities // Architecture
                </span>
              </div>
            </div>
          </div>

          {/* lista */}
          <div className="lg:col-span-9 flex flex-col">

            <div className="flex flex-col border-t border-white/20">
              {SERVICES.map((service, index) => {

                const isActive = hoveredIndex === index;

                const titleColor = isAnyHovered
                  ? (isActive ? 'text-white' : 'text-[#222222]')
                  : 'text-white';

                const numberColor = isAnyHovered
                  ? (isActive ? 'text-[#8DCFFB]' : 'text-[#222222]')
                  : 'text-neutral-500';

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.1 }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onMouseMove={handleMouseMove}
                    onClick={() => navigate(service.href)} 
                    className="group relative border-b border-white/20 py-10 md:py-14 cursor-pointer flex flex-col md:flex-row md:items-center justify-between -mx-6 px-6 lg:mx-0 lg:px-2 z-10 hover:z-20"
                  >

                    {/* número + título */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 relative z-10 pointer-events-none">
                      <span className={`font-bricolage font-bold text-lg transition-colors duration-500 ${numberColor}`}>
                        0{service.id}
                      </span>
                      <h3 className={`font-bebas font-black text-[18vw] sm:text-[15vw] md:text-[12vw] lg:text-[6vw] leading-[0.85] tracking-wide sm:tracking-normal uppercase transition-colors duration-500 ${titleColor}`}>
                        {service.title}
                      </h3>
                    </div>

                    {/* seta e descrição */}
                    <div className={`flex items-center gap-6 mt-6 md:mt-0 transform transition-all duration-700 ease-out relative z-10 pointer-events-none ${isActive ? 'opacity-100 translate-x-0' : 'opacity-100 md:opacity-0 translate-x-0 md:-translate-x-6'}`}>

                      <div className="text-left md:text-right hidden sm:block">
                        <p className="font-bricolage font-bold text-[5vw] sm:text-[3.5vw] md:text-[2.5vw] lg:text-[1.5vw] text-neutral-400 tracking-widest mb-1 whitespace-nowrap">
                          {service.description}
                        </p>
                      </div>

                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border text-black flex items-center justify-center transform transition-all duration-500 flex-shrink-0 ${isActive ? 'bg-neutral-400 border-neutral-400 rotate-45 scale-110' : 'border-white/20 text-white bg-transparent rotate-0 scale-100'}`}>
                        <FiArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                      </div>

                    </div>

                    {/* imagem que segue o mouse */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          style={{
                            x: smoothX,
                            y: smoothY,
                            translateX: '-50%',
                            translateY: '-50%',
                          }}
                          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="hidden md:block absolute top-0 left-0 w-[300px] lg:w-[400px] h-[200px] lg:h-[260px] pointer-events-none z-30 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        >
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[#8DCFFB]/10 mix-blend-overlay" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default Services;