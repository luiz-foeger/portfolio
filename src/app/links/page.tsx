'use client';

import React from "react";
import { motion } from "motion/react";
import { FaInstagram, FaLinkedin, FaGithub, FaWhatsapp, FaGlobe, FaRocket, FaPaintBrush } from "react-icons/fa";

const links = [
  {
    title: "BarberHub — Gestão Inteligente",
    description: "Sistema completo para barbearias e agendamentos.",
    icon: <FaRocket className="text-cyan-400" />,
    url: "#", // Link para o BarberHub
    featured: true
  },
  {
    title: "Portfolio Principal",
    description: "Explore meus projetos de Dev & Design.",
    icon: <FaGlobe className="text-teal-400" />,
    url: "/",
    featured: false
  },
  {
    title: "Landing Page para Personais",
    description: "Projeto freelance desenvolvido para treinadores.",
    icon: <FaPaintBrush className="text-purple-400" />,
    url: "#",
    featured: false
  }
];

export default function Links() {
  return (
    <main className="min-h-screen bg-[rgb(16,23,28)] text-white px-6 py-16 flex flex-col items-center">
      
      {/* 1. HEADER: PERFIL @FOEGER.DEV */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-10 text-center"
      >
        <div className="w-24 h-24 rounded-full bg-linear-to-tr/srgb from-cyan-500 to-teal-500 p-1 mb-4 shadow-xl shadow-cyan-500/20">
          <div className="w-full h-full rounded-full bg-[#1c2630] flex items-center justify-center overflow-hidden">
             {/* Sua foto de perfil */}
             <span className="text-2xl font-black">LF</span>
          </div>
        </div>
        <h1 className="text-xl font-bold">Luiz Föeger</h1>
        <p className="text-cyan-400 text-sm font-mono mt-1">@foeger.dev</p>
        <p className="text-slate-400 text-xs mt-3 max-w-[250px]">
          Desenvolvedor Fullstack & Designer em Vila Velha, ES.
        </p>
      </motion.div>

      {/* 2. LINKS PRINCIPAIS */}
      <div className="w-full max-w-md flex flex-col gap-4">
        {links.map((link, index) => (
          <motion.a
            key={index}
            href={link.url}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group relative p-4 rounded-2xl border flex items-center gap-4 transition-all ${
              link.featured 
              ? "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20" 
              : "bg-[#1c2630] border-white/5 hover:border-white/20"
            }`}
          >
            <div className="text-2xl">{link.icon}</div>
            <div className="flex flex-col">
              <span className="font-bold text-sm">{link.title}</span>
              <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">
                {link.description}
              </span>
            </div>
            {link.featured && (
               <span className="absolute -top-2 -right-2 bg-cyan-500 text-[9px] font-black px-2 py-1 rounded-md">DESTAQUE</span>
            )}
          </motion.a>
        ))}
      </div>

      {/* 3. REDES SOCIAIS (ÍCONES) */}
      <div className="flex gap-6 mt-12">
        {[
          { icon: <FaLinkedin />, url: "https://linkedin.com/in/luizfoeger" },
          { icon: <FaGithub />, url: "https://github.com/luizfoeger" },
          { icon: <FaInstagram />, url: "https://instagram.com/foeger.dev" },
          { icon: <FaWhatsapp />, url: "#" }
        ].map((social, i) => (
          <motion.a 
            key={i} 
            href={social.url}
            whileHover={{ scale: 1.2 }}
            className="text-2xl text-slate-500 hover:text-white transition-colors"
          >
            {social.icon}
          </motion.a>
        ))}
      </div>

      {/* 4. FOOTER / STATUS */}
      <div className="mt-auto pt-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Disponível para Freelance</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-4 font-mono">
          luizfoeger.vercel.app
        </p>
      </div>
      

    </main>
  );
}