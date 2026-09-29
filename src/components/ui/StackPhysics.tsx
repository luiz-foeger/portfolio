'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import {
    SiNextdotjs, SiTypescript, SiJavascript, SiTailwindcss,
    SiFigma, SiReact, SiWordpress, SiGit, SiNodedotjs
} from 'react-icons/si';
import { SiAdobephotoshop } from './BrandIcons';

const SKILLS = [
    { icon: SiNextdotjs, label: 'Next.js', color: '#fff' },
    { icon: SiReact, label: 'React', color: '#61DAFB' },
    { icon: SiTypescript, label: 'TypeScript', color: '#3178C6' },
    { icon: SiJavascript, label: 'JavaScript', color: '#F7DF1E' },
    { icon: SiTailwindcss, label: 'Tailwind', color: '#38B2AC' },
    { icon: SiFigma, label: 'Figma', color: '#F24E1E' },
    { icon: SiNodedotjs, label: 'Node.js', color: '#339933' },
    { icon: SiGit, label: 'Git', color: '#F05032' },
    { icon: SiAdobephotoshop, label: 'Photoshop', color: '#31A8FF' },
    { icon: SiWordpress, label: 'WordPress', color: '#21759B' },
];

const TechPhysicsSimple = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

    // tamanho do bloco visual (px)
    const BOX_SIZE = 80;

    const initPhysics = useCallback(() => {
        if (!containerRef.current) return;

        // limpeza prévia
        if (engineRef.current) {
            Matter.Engine.clear(engineRef.current);
            if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
            engineRef.current = null;
        }

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        if (width === 0) {
            setTimeout(initPhysics, 100);
            return;
        }

        const Engine = Matter.Engine,
            World = Matter.World,
            Bodies = Matter.Bodies,
            Mouse = Matter.Mouse,
            MouseConstraint = Matter.MouseConstraint,
            Runner = Matter.Runner;

        const engine = Engine.create();
        engineRef.current = engine;

        // paredes (invisíveis)
        const wallThick = 100;
        const floor = Bodies.rectangle(width / 2, height + wallThick / 2, width, wallThick, { isStatic: true });
        const ceiling = Bodies.rectangle(width / 2, -wallThick * 2, width, wallThick, { isStatic: true });
        const leftWall = Bodies.rectangle(0 - wallThick / 2, height / 2, wallThick, height * 2, { isStatic: true });
        const rightWall = Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 2, { isStatic: true });

        World.add(engine.world, [floor, ceiling, leftWall, rightWall]);

        // física dos blocos
        const iconBodies = SKILLS.map((_, i) => {
            // blocos spawnam espalhados no topo da área visível
            const x = Math.random() * (width - BOX_SIZE) + BOX_SIZE / 2;
            const y = Math.random() * (height / 2); // spawnam na metade superior

            return Bodies.rectangle(x, y, BOX_SIZE, BOX_SIZE, {
                chamfer: { radius: 12 }, // border-radius
                restitution: 0.4, // bounce
                friction: 0.3,
                density: 0.002
            });
        });

        World.add(engine.world, iconBodies);

        // mouse
        const mouse = Mouse.create(containerRef.current);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: { stiffness: 0.1, render: { visible: false } }
        });
        mouse.element.removeEventListener("mousewheel", (mouse as any).mousewheel);
        mouse.element.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);
        World.add(engine.world, mouseConstraint);

        // runner
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);

        // loop visual
        const updateLoop = () => {
            if (!engineRef.current) return;

            iconBodies.forEach((body, index) => {
                const domItem = itemsRef.current[index];
                if (domItem) {
                    const { x, y } = body.position;
                    const angle = body.angle;
                    domItem.style.transform = `translate(${x - BOX_SIZE / 2}px, ${y - BOX_SIZE / 2}px) rotate(${angle}rad)`;
                    domItem.style.opacity = '1';
                }
            });
            requestAnimationFrame(updateLoop);
        };
        updateLoop();

    }, []);

    useEffect(() => {
        initPhysics();
        const handleResize = () => setTimeout(initPhysics, 200);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
            if (engineRef.current) Matter.Engine.clear(engineRef.current);
        };
    }, [initPhysics]);

    return (
        <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden rounded-3xl border border-white/5 bg-[#0A0A0A]/50">

            {/* container matter.js */}
            <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing">

                {/* renderização dos blocos html */}
                {SKILLS.map((skill, index) => (
                    <div
                        key={index}
                        // @ts-ignore
                        ref={(el) => (itemsRef.current[index] = el)}
                        className="absolute top-0 left-0 flex items-center justify-center p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-xs select-none will-change-transform opacity-0 hover:border-[#8DCFFB]/50 transition-colors duration-300"
                        style={{
                            width: `${BOX_SIZE}px`,
                            height: `${BOX_SIZE}px`,
                            pointerEvents: 'none' // Importante para o mouse atravessar e pegar a física
                        }}
                    >
                        <div className="relative flex flex-col items-center justify-center">
                            <skill.icon className="text-3xl md:text-4xl text-white/80" />
                            {/* tooltip para mobile/hover */}
                            <span className="text-[10px] text-gray-400 font-mono mt-1 opacity-0 md:opacity-100">{skill.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* reset */}
            {/* <button 
            onClick={initPhysics}
            className="absolute top-4 right-4 text-white/20 hover:text-white/80 transition-colors z-20"
            title="Resetar Posições"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" /><path d="M3 3v9h9" /></svg>
        </button>
         */}
            <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
                <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Drag to throw</p>
            </div>
        </div>
    );
};

export default TechPhysicsSimple;