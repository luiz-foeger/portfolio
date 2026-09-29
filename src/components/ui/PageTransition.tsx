'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useAnimationControls } from 'motion/react';

// mesma saída que o AnimatePresence fazia no App.js: as duas <motion.main> da página (AnimatedPage + Home) saíam juntas
const saida = { opacity: 0, y: -30, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } };
const visivel = { opacity: 1, y: 0 };

const PageTransitionContext = createContext<{ navigate: (href: string) => void }>({
  navigate: () => {},
});

export const PageTransitionProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const externo = useAnimationControls();
  const interno = useAnimationControls();
  const saindo = useRef(false);

  const navigate = useCallback(async (href: string) => {
    if (saindo.current || href === pathname) return;
    saindo.current = true;

    // a página nova carrega enquanto a atual sai
    router.prefetch(href);
    await Promise.all([externo.start(saida), interno.start(saida)]);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    router.push(href, { scroll: false });
  }, [externo, interno, pathname, router]);

  // a página nova monta dentro de um wrapper novo (key); o externo volta ao normal na hora
  useEffect(() => {
    if (!saindo.current) return;
    saindo.current = false;
    externo.set(visivel);
  }, [pathname, externo]);

  return (
    <PageTransitionContext.Provider value={{ navigate }}>
      <motion.div animate={externo}>
        <motion.div key={pathname} animate={interno}>
          {children}
        </motion.div>
      </motion.div>
    </PageTransitionContext.Provider>
  );
};

export const usePageTransition = () => useContext(PageTransitionContext);
