import React from "react";
import { motion, Variants } from "motion/react";
import { FaGithub, FaMapMarkerAlt, FaCircle, FaCheckDouble, FaInstagram } from "react-icons/fa";
import { SiSpeedtest } from "react-icons/si";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const Bento: React.FC = () => {
  return (
    <section id="engenharia" className="relative w-full bg-[rgb(16,23,28)] py-24 px-6 lg:px-20 overflow-hidden">
      
      {/* Luz de fundo sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        
        <motion.div variants={itemVariants} className="mb-12">
          <h2 className="text-3xl md:text-5xl md:leading-none font-black text-white leading-tight tracking-tight">
            Engenharia <span className="text-cyan-500">&</span> <br className="md:hidden" /> Consistência.
          </h2>
          <p className="text-slate-400 text-lg mt-4 max-w-xl">
            Unindo a base acadêmica do IFES com a prática de desenvolvimento para criar software resiliente e visualmente impactante.
          </p>
        </motion.div>

        {/* BENTO GRID SIMÉTRICO (3 Colunas / 2 Linhas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           
           {/* LINHA 1 - COLUNA 1 & 2: GITHUB ACTIVITY */}
           <motion.div 
             variants={itemVariants}
             className="lg:col-span-2 bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 group hover:border-cyan-500/30 transition-colors flex flex-col justify-between"
           >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FaGithub size={24} className="text-white/70" />
                  <h3 className="text-white font-bold text-lg">Histórico de Commits</h3>
                </div>
                <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-tighter">Activity Track</span>
              </div>

              <div className="w-full rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden p-2 shadow-inner">
                 <img 
                   src="https://github-readme-activity-graph.vercel.app/graph?username=luiz-foeger&bg_color=0d1117&color=22d3ee&line=22d3ee&point=ffffff&area=true&hide_border=true" 
                   alt="GitHub Activity Graph"
                   className="w-full h-auto"
                 />
              </div>
           </motion.div>

           {/* LINHA 1 - COLUNA 3: SOCIAL / BRANDING */}
           <motion.div 
              variants={itemVariants}
              className="bg-linear-to-br/srgb from-slate-800 to-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between group hover:border-pink-500/20 transition-all"
           >
              <div className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                 <FaInstagram className="text-pink-500 text-xl" />
              </div>
              <div>
                 <h3 className="text-white font-bold text-xl mb-1">@foeger.dev</h3>
                 <p className="text-slate-500 text-sm leading-tight">
                    Compartilhando processos de design e código no Instagram.
                 </p>
              </div>
              <a 
                href="https://instagram.com/foeger.dev" 
                target="_blank" 
                className="text-[10px] font-mono text-pink-400 uppercase tracking-widest mt-2 hover:underline"
              >
                Seguir Perfil
              </a>
           </motion.div>

           {/* LINHA 2 - COLUNA 1: LOCALIZAÇÃO */}
           <motion.div 
              variants={itemVariants}
              className="bg-[#1c2630] border border-white/5 rounded-3xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:border-white/10 transition-colors"
           >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                 <FaMapMarkerAlt className="text-cyan-400 text-xl" />
              </div>
              <h3 className="text-white font-bold text-lg">Vila Velha</h3>
              <p className="text-slate-500 text-sm font-mono">Espírito Santo, BR</p>
           </motion.div>

           {/* LINHA 2 - COLUNA 2: STATUS */}
           <motion.div 
              variants={itemVariants}
              className="bg-[#1c2630] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-green-500/20 transition-colors"
           >
             <div className="flex flex-col">
               <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Status</span>
               <span className="text-white font-bold text-xl">Disponível</span>
               <span className="text-green-400/80 text-xs mt-1">Freelance / Fullstack</span>
             </div>
             <div className="relative flex items-center justify-center w-4 h-4">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20"></span>
               <FaCircle className="text-green-500 text-xs relative z-10" />
             </div>
           </motion.div>

           {/* LINHA 2 - COLUNA 3: QUALIDADE / QA */}
           <motion.div 
             variants={itemVariants}
             className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:border-teal-500/30 transition-all"
           >
              <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4">
                 <FaCheckDouble className="text-teal-400 text-lg" />
              </div>
              <div>
                 <h3 className="text-white font-bold text-lg mb-1">Qualidade & QA</h3>
                 <p className="text-slate-400 text-xs leading-relaxed">
                    Lógica testada via <strong>Particionamento por Equivalência</strong> e Análise de Valor Limite.
                 </p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-teal-400/60 uppercase">
                 <SiSpeedtest /> Logic Validation
              </div>
           </motion.div>

        </div>
      </motion.div>
    </section>
  );
};

export default Bento;