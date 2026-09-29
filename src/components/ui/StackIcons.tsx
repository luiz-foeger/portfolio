'use client';

import {
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiTailwindcss,
  SiFigma,
  SiReact,
  SiWordpress,
  SiGit,
} from 'react-icons/si';
import { SiAdobephotoshop } from './BrandIcons';
import React from 'react';
import { motion } from 'motion/react';

const Icones = () => {
  const listaIcones = [
    { Icone: SiNextdotjs, nome: "Next.js" },
    { Icone: SiTypescript, nome: "TypeScript" },
    { Icone: SiJavascript, nome: "JavaScript" },
    { Icone: SiTailwindcss, nome: "Tailwind CSS" },
    { Icone: SiReact, nome: "React" },
    { Icone: SiFigma, nome: "Figma" },
    { Icone: SiAdobephotoshop, nome: "Photoshop" },
    { Icone: SiWordpress, nome: "WordPress" },
    { Icone: SiGit, nome: "Git" },
  ];
  return (
    <div className="flex flex-wrap justify-center items-center gap-4 mt-12">
      {listaIcones.map((item, index) => (
        <motion.div
          key={index}
          whileHover={{
            scale: 1.1,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            // borderColor: "#45a7e8"
            borderColor: "rgba(109, 197, 255, 0.5)"
          }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="group relative flex items-center justify-center p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl cursor-help transition-colors duration-300"
        >
          <item.Icone
            size={50}
            className="text-white/70 group-hover:text-[#8dcffb] transition-colors duration-300 text-4xl md:text-5xl"
            title={item.nome}
          />

          {/* tooltip mobile/hover */}
          <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-[#1a1a1a] text-white text-xs py-1 px-2 rounded border border-white/10 whitespace-nowrap">
            {item.nome}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export default Icones;