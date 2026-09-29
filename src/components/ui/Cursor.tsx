'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function Cursor() {
  const CURSOR_SIZE = 20;

  // Estado para controlar a opacidade (evita flash inicial)
  const [isVisible, setIsVisible] = useState(false);

  // Inicializamos com 0, mas vamos ajustar no useEffect para o topo central
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Configuração da física da mola
  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(mouseX, smoothOptions);
  const smoothY = useSpring(mouseY, smoothOptions);

  useEffect(() => {
    // 1. Definir Posição Inicial: Topo Central (fora da tela)
    // Assim que o componente monta, definimos X no meio e Y um pouco acima do topo (-100)
    if (typeof window !== 'undefined') {
      mouseX.set(window.innerWidth / 2 - CURSOR_SIZE / 2);
      mouseY.set(-100); 
    }

    const manageMouseMove = (e: MouseEvent) => {
      // Na primeira mexida, tornamos visível
      if (!isVisible) setIsVisible(true);

      // Atualiza para a posição real do mouse
      mouseX.set(e.clientX - CURSOR_SIZE / 2);
      mouseY.set(e.clientY - CURSOR_SIZE / 2);
    };

    window.addEventListener('mousemove', manageMouseMove);

    return () => {
      window.removeEventListener('mousemove', manageMouseMove);
    };
  }, [mouseX, mouseY, isVisible]);

  return (
    <motion.div
      style={{
        left: smoothX,
        top: smoothY,
        opacity: isVisible ? 1 : 0, 
      }}
      // transition-opacity duration-500: Faz a bolinha aparecer suavemente (fade-in) enquanto viaja
      className="fixed pointer-events-none z-[9999] rounded-full mix-blend-difference bg-white hidden md:block transition-opacity duration-500"
    >
      <div 
        className="w-[20px] h-[20px] bg-white rounded-full"
      />
    </motion.div>
  );
}