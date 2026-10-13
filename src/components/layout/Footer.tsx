'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// o grupo tem nome para o texto subir só com o mouse no próprio link: a coluna em volta também é um group (o número
// dela acende), e com o group sem nome todos os links da coluna subiam juntos
const Links = ({ text, href, className = "" }: { text: string, href?: string, className?: string }) => {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      href={href}
      target={href?.startsWith('http') ? "_blank" : "_self"}
      rel={href?.startsWith('http') ? "noopener noreferrer" : ""}
      className={`group/link relative overflow-hidden inline-flex ${className}`}
    >
      <span className="transition-transform duration-500 group-hover/link:-translate-y-full">
        {text}
      </span>
      <span className="absolute inset-0 transition-transform duration-500 translate-y-full group-hover/link:translate-y-0 text-white">
        {text}
      </span>
    </Tag>
  );
};

// cada letra do e-mail troca dentro da sua própria janela, do tamanho da linha, aberta dos lados para não cortar o
// encaixe com a vizinha. O "@" desce uns 0,05em além da linha: a janela dele vai até o pé e ele anda essa altura a
// mais, com uns pixels de folga para o arredondamento das telas pequenas (com a janela única do tamanho da linha, ele
// ficava cortado parado e deixava um pedaço em cima depois do hover)
const JANELA_LETRA = 'inset(0 -0.2em)';
const JANELA_ARROBA = 'inset(-1px -0.2em calc(-0.06em - 1px) -0.2em)';
const PASSO_ARROBA = { paddingBottom: 'calc(0.05em + 3px)', marginBottom: 'calc(-0.05em - 3px)' };

const FlipDigit = ({ char }: { char: string }) => {
  return (
    <div className="relative inline-flex overflow-hidden items-center justify-center leading-none">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={char}
          initial={{ y: "100%", rotateX: -90, opacity: 0 }}
          animate={{ y: "0%", rotateX: 0, opacity: 1 }}
          exit={{ y: "-100%", rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block origin-bottom"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const FlipNumber = ({ value }: { value: string }) => (
  <div className="flex items-center">
    <FlipDigit char={value[0] || '0'} />
    <FlipDigit char={value[1] || '0'} />
  </div>
);

const Footer = () => {
  const [time, setTime] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState('26');

  const email = "foegerluiz@gmail.com";

  // Lógica do Horário BR e Ano
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      const parts = formatter.formatToParts(now);
      const hh = parts.find(p => p.type === 'hour')?.value || '00';
      const mm = parts.find(p => p.type === 'minute')?.value || '00';
      const ss = parts.find(p => p.type === 'second')?.value || '00';

      setTime({ hours: hh, minutes: mm, seconds: ss });
      setCurrentYear(now.getFullYear().toString().slice(-2));
    };

    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  const handleScrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const staggerHover = { hover: { transition: { staggerChildren: 0.015 } } };
  const charVariantOut = {
    initial: { y: 0 },
    hover: { y: "-100%", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };
  const charVariantIn = {
    initial: { y: "100%" },
    hover: { y: "0%", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  return (
    <footer className="w-full min-h-screen bg-[#050505] text-white flex flex-col justify-between p-6 md:p-8 lg:p-12 relative z-20 border-t border-white/10 font-sans">

      {/* navigation superior */}
      <div className="font-bricolage font-bold text-[4vw] sm:text-[3.5vw] md:text-[2.5vw] lg:text-[1vw] grid grid-cols-2 md:grid-cols-4 w-full items-start uppercase tracking-[0.2em]">

        <div className="font-bricolage items-start md:items-start flex flex-col gap-2">
          <Links text="INFO" href="#" className="text-neutral-500 w-fit hover:text-white" />
          <Links text="CONTACT" href="#" className="text-neutral-500 w-fit hover:text-white" />
        </div>

        <div className="flex flex-col gap-2 items-end md:items-start md:pr-10 pb-10">
          <Links text="GITHUB" href="https://github.com/luiz-foeger" className="text-neutral-500 w-fit hover:text-white" />
          <Links text="LINKEDIN" href="https://www.linkedin.com/in/luizfoeger" className="text-neutral-500 w-fit hover:text-white" />
          <Links text="BEHANCE" href="https://behance.net/foeger" className="text-neutral-500 w-fit hover:text-white" />
        </div>

        <div className="flex flex-col gap-2 md:items-end md:pr-10 pb-10">
          <span onClick={handleScrollToTop} className="w-fit">
            <Links text="INDEX" className="text-neutral-500 hover:text-white" />
          </span>
        </div>

        <div className="flex flex-col gap-2 items-end md:items-end text-right md:pr-10">
          <div className="flex font-mono text-white normal-case leading-none font-bold text-[4vw] sm:text-[3.5vw] md:text-[2.5vw] lg:text-[1vw] tracking-widest items-center">
            {mounted ? (
              <>
                <FlipNumber value={time.hours} />
                <span className="mx-[2px] animate-pulse relative -top-[1px]">:</span>
                <FlipNumber value={time.minutes} />
                <span className="mx-[2px] animate-pulse text-neutral-500 relative -top-[1px]">:</span>
                <span className="text-neutral-500"><FlipNumber value={time.seconds} /></span>
              </>
            ) : <span>--:--:--</span>}
          </div>
          <span className="font-bold text-neutral-500">BRAZIL</span>
        </div>
      </div>

      {/* centro */}
      <div className="flex-grow flex flex-col justify-center items-center py-16 md:py-24 w-full">

        <motion.a
          href={`mailto:${email}`}
          initial="initial"
          whileHover="hover"
          className="font-bricolage text-[8.5vw] lg:text-[9.25vw] mb-1 md:mb-0 font-black text-white leading-[0.8] tracking-tighter uppercase drop-shadow-2xl relative"
          style={{ clipPath: 'inset(-1em 0)' }}
        >
          <motion.div className="flex" variants={staggerHover}>
            {email.split('').map((char, i) => {
              const arroba = char === '@';
              // a coluna só repassa o atraso do stagger para as duas letras dela
              return (
                <motion.span key={i} variants={{}} className="relative inline-block" style={{ clipPath: arroba ? JANELA_ARROBA : JANELA_LETRA }}>
                  <motion.span variants={charVariantOut} className="inline-block" style={arroba ? PASSO_ARROBA : undefined}>
                    {char}
                  </motion.span>

                  {/* Texto que entra (Branco puro tbm, como pedido) */}
                  <motion.span variants={charVariantIn} className="absolute top-0 left-0 inline-block text-white" style={arroba ? PASSO_ARROBA : undefined}>
                    {char}
                  </motion.span>
                </motion.span>
              );
            })}
          </motion.div>
        </motion.a>

        {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center w-full pointer-events-none">
                <h1 className="font-bricolage text-[8.5vw] lg:text-[9.25vw] mb-1 md:mb-0 font-black  text-white leading-[0.8] tracking-tighter uppercase drop-shadow-2xl">
                    foegerluiz@gmail.com
                </h1>
                <h1 className="font-bricolage text-[8.5vw] lg:text-[9.25vw] font-black text-white leading-[0.8] tracking-tighter uppercase drop-shadow-2xl">
                    ©2026
                </h1>
            </div> */}

        {/* a trajetória: o ano em que começou e o atual, que vira sozinho */}
        <h1 className="font-bricolage text-[8.5vw] lg:text-[9.25vw] font-black text-white leading-[0.8] tracking-tighter uppercase drop-shadow-2xl">
          ©23-{currentYear}
        </h1>
      </div>

      {/* baseline */}
      {/* [1] @FOEGER.DEV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-6 w-full items-start">

        <div className="flex flex-col group">
          <span className="text-base md:text-xl md:leading-7 leading-none -mt-[3px] text-neutral-600 mb-2 font-bricolage transition-colors group-hover:text-white">
            [1]
          </span>
          <h3 className="text-xl lg:text-2xl uppercase font-bricolage font-bold tracking-widest text-white mb-2">
            <Links text="@FOEGER.DEV" href="https://instagram.com/foeger.dev" />
          </h3>
        </div>

        {/* [2] 23—26 */}
        <div className="font-bricolage flex flex-col group">
          <span className="text-base md:text-xl md:leading-7 leading-none -mt-[3px] text-neutral-600 mb-2 font-bricolage transition-colors group-hover:text-white">
            [2]
          </span>
          <h3 className="text-xl lg:text-2xl uppercase font-bricolage font-bold tracking-widest text-white mb-4">
            23—{currentYear}
          </h3>
          <p className="text-neutral-400 normal-case leading-relaxed text-[4.5vw] sm:text-[3.5vw] md:text-[2.5vw] lg:text-[1vw] pr-2">
            The architecture fills its space with clean code and uncompromising design, building high-performance products tailored for modern demands.
          </p>
        </div>

        {/* [3] STATUS */}
        <div className="font-bricolage flex flex-col group md:items-end md:text-right">
          <span className="text-base md:text-xl md:leading-7 leading-none -mt-[3px] text-neutral-600 mb-2 font-bricolage transition-colors group-hover:text-white">
            [3]
          </span>
          <h3 className="text-xl lg:text-2xl uppercase font-bricolage font-bold tracking-widest text-white mb-4">
            STATUS
          </h3>
          <p className="text-neutral-400 normal-case leading-relaxed text-[4.5vw] sm:text-[3.5vw] md:text-[2.5vw] lg:text-[1vw] mix-blend-difference">
            Available for new projects.
          </p>
        </div>

        {/* [4] SCOPE */}
        <div className="font-bricolage flex flex-col group md:items-end md:text-right">
          <div className="flex flex-col items-start md:items-end">
            <span className="text-base md:text-xl md:leading-7 leading-none -mt-[3px] text-neutral-600 mb-2 font-bricolage transition-colors group-hover:text-white">
              [4]
            </span>
            <h3 className="text-xl lg:text-2xl uppercase font-bricolage font-bold tracking-widest text-white mb-4">
              SCOPE
            </h3>
          </div>
          <p className="text-neutral-400 normal-case text-[4.5vw] sm:text-[3.5vw] md:text-[2.5vw] lg:text-[1vw] leading-relaxed max-w-[250px]">
            4/4
          </p>
        </div>

      </div>

    </footer>
  );
}

export default Footer;