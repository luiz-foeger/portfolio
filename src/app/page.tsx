'use client';

import { motion } from "motion/react";

import Cursor from "../components/ui/Cursor";
import HeroToHeader from "../components/common/HeroToHeader";
// import About from "../components/common/About";
// import Projects from "../components/common/Projects";
// import Designs from "../components/common/Designs";
// import Bento from "../components/common/Bento";
import Services from "../components/ui/Services";
import ScrollManifesto from "../components/ui/ScrollManifesto";
import StackOrbit from "../components/ui/StackOrbit";
import AnimatedPage from "../components/ui/AnimatedPage";
import Footer from "../components/layout/Footer";

function Home() {
  return (
    <AnimatedPage className="bg-[#050505] min-h-screen w-full">
      <motion.main
        // 2. Props de transição adicionadas aqui:
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-black min-h-screen w-full"
      >
        <Cursor />

        <HeroToHeader />
        
        <ScrollManifesto />
        <StackOrbit />
        <Services />

        <Footer />
      </motion.main>
    </AnimatedPage>
  );
}

export default Home;