'use client';

// o barquinho de papel nas ondas do rodapé (26/10, o "pedido maluco" dele; em 3D e com a água simulada a pedido dele,
// "mais realista"; a água como superfície em 27/10, porque a linha simulada parecia 2D perto do barco 3D): navega numa
// das ondas do meio do mar (a que passa mais perto de 84% da altura da tela, com o rodapé parado). A física (o corpo
// rígido que boia pelo empuxo, a superfície da água em volta dele, os respingos) fica em _lib/barco-fisica.ts, e o
// desenho (o modelo 3D do papel dobrado, o reflexo, as gotas) em _lib/barco-gl.ts. Aqui: as três telas (uma pequena que
// anda com o barco, para o antisserrilhado, e duas da janela para as gotas, uma atrás dele e outra na frente), a área de
// pegar, a vista da linha dele (de _comp/FundoOndas.tsx, para a física passar do mundo das ondas para a tela), a onda do
// shader passada à física a cada quadro (alturaDaOnda) e a água simulada devolvida ao shader das ondas (aguaDoRodape): a
// linha que se vê é a mesma em que ele boia, e os anéis dele passam pelas outras linhas e acendem a superfície.
// - Pegar: o mouse (ou o dedo) pega o barco no ponto em que clicou, e ele vem pendurado nesse ponto (balança como um
//   pêndulo); solto, cai com o empurrão do gesto. Na água ele boia, balança nos anéis que ele mesmo faz e desce as
//   encostas; dá para afundá-lo um pouco e soltar.
// - Virado (de cabeça para baixo, como um barco de papel de verdade fica), um clique o desvira: ele dá um pulo e rola de
//   volta; o cursor vira "Desvirar". Arrastando, ele é pego como sempre.
// - Além do balanço de lado (o da física), ele rola um pouco para quem olha e gira devagar no eixo de pé (a guinada),
//   com um empurrão a cada batida; na mão, gira com o gesto. É visto do mesmo alto que a câmera vê a água.
// - Surgir e afundar (27/10, no lugar do desfoque): quando o rodapé chega, ele sobe do fundo como se tivesse sido puxado
//   para baixo e solto (primeiro um vulto apagado na água, as bolhas, e ele fura a superfície); subindo a página, é puxado
//   para o fundo e some lá embaixo.
// O cursor do site vira "Pegue" sobre ele e "Solte" com ele na mão, com a mãozinha fechada do sistema.
import { useEffect, useRef } from 'react';
import { aCadaQuadro, geo } from '../_fa/laco';
import { ramp } from '../_fa/movimento';
import { useIdioma } from '../../_lib/idioma';
import { CENTRO_DE_MASSA, FisicaDoBarco, MAX_GOTAS } from '../_lib/barco-fisica';
import { CAMPOS_DA_GOTA, CONTORNO, DesenhoDasGotas, DesenhoDoBarco, matrizDoBarco } from '../_lib/barco-gl';
import { textosDoRumo } from '../_lib/textos';
import { ONDAS, aguaDoRodape, alturaDaOnda, cenaDoRodape, linhaNoMundo, ondasNoQuadro, repousoDaOnda, vistaDaLinha } from './FundoOndas';

// a onda em que ele navega (a mais perto desta fração da altura da tela) e onde ele começa (fração da largura)
const NAVEGA = 0.84;
const COMECA = 0.72;
// o meio comprimento do barco (px): uma fração da largura da tela, entre limites
const TAMANHO = { fracao: 0.036, min: 42, max: 66 };
// a guinada de repouso (a proa um pouco para quem olha, para mostrar o volume)
const GUINADA = -0.3;
// o lado da tela pequena, em meios comprimentos (cabe o barco em qualquer ângulo e o reflexo); a folga da área de pegar
// em volta do contorno (px)
const LADO = 3.6;
const FOLGA = 6;
// a grade da água: a profundidade para cada lado da linha do barco (unidades do mundo) e o tamanho das células na tela
// (px de largura e de profundidade)
const AGUA = { profundidade: 1.3, celula: { x: 10, z: 3 } };
// o rodapé que traz o barco (o quanto ele entrou, de 0 a 1): ele surge a partir de 0,9 e afunda abaixo de 0,85 (a folga
// não o deixa ir e voltar na divisa); some quando o alto dele está a esta profundidade (em meios comprimentos)
const RODAPE = { surge: 0.9, afunda: 0.85, some: 0.95 };
// a fase dele: fora (escondido), surgindo (subindo do fundo), boiando e afundando (puxado para o fundo)
type Fase = 'fora' | 'surgindo' | 'boiando' | 'afundando';

// o fecho convexo de pontos da tela (a cadeia monótona)
function fechoConvexo(pontos: [number, number, number][]) {
    const p = [...pontos].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const vira = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const metade = (lista: [number, number, number][]) => {
        const h: [number, number, number][] = [];
        for (const q of lista) {
            while (h.length >= 2 && vira(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
            h.push(q);
        }
        h.pop();
        return h;
    };
    return [...metade(p), ...metade(p.reverse())];
}

export default function Barquinho() {
    const T = textosDoRumo(useIdioma().idioma).rodape.barco;
    const alvo = useRef<HTMLDivElement>(null);
    const telaDoBarco = useRef<HTMLCanvasElement>(null);
    const telaDaFrente = useRef<HTMLCanvasElement>(null);
    const telaDeTras = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const el = alvo.current, cb = telaDoBarco.current, cf = telaDaFrente.current, ct = telaDeTras.current;
        if (!el || !cb || !cf || !ct) return;
        const contexto = (c: HTMLCanvasElement, antialias: boolean) =>
            c.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias, depth: antialias, stencil: false });
        const glb = contexto(cb, true), glf = contexto(cf, false), glt = contexto(ct, false);
        if (!glb || !glf || !glt) return;
        const barco = new DesenhoDoBarco(glb);
        // as gotas: as da frente do barco por cima dele, as de trás por baixo
        const gotas = [
            { tela: cf, desenho: new DesenhoDasGotas(glf, MAX_GOTAS), dados: new Float32Array(MAX_GOTAS * CAMPOS_DA_GOTA), na: false },
            { tela: ct, desenho: new DesenhoDasGotas(glt, MAX_GOTAS), dados: new Float32Array(MAX_GOTAS * CAMPOS_DA_GOTA), na: false },
        ];
        const fisica = new FisicaDoBarco();
        const sup = new Float32Array(16);
        const giro = { rol: 0, vrol: 0, gui: GUINADA, vgui: 0 };
        let W = 1, H = 1, dpr = 1, lado = 1;
        let onda = -1, ondaW = 0, ondaH = 0, fase: Fase = 'fora', primeira = true, batidas = 0, tempo = 0, id = -1, mxAntes = 0;
        let mostra: boolean | null = null;
        // o clique no barco virado: esperando para ver se é clique (desvira) ou arrasto (pega)
        let pendente: { id: number; x: number; y: number } | null = null;

        // as telas das gotas são a janela (fixas, inset 0): o tamanho delas é o das contas
        const medir = () => {
            W = Math.max(1, cf.clientWidth);
            H = Math.max(1, cf.clientHeight);
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            for (const c of [cf, ct]) {
                c.width = Math.round(W * dpr);
                c.height = Math.round(H * dpr);
            }
            const s = Math.max(TAMANHO.min, Math.min(TAMANHO.max, W * TAMANHO.fracao));
            lado = Math.ceil(LADO * s);
            cb.style.width = cb.style.height = `${lado}px`;
            cb.width = cb.height = Math.round(lado * dpr);
            fisica.redimensionar(W, H, s);
        };
        medir();
        const obs = new ResizeObserver(medir);
        obs.observe(cf);

        const mostrar = (sim: boolean) => {
            if (mostra === sim) return;
            mostra = sim;
            cb.style.visibility = sim ? 'visible' : 'hidden';
            if (!sim) {
                for (const g of gotas) {
                    g.tela.style.visibility = 'hidden';
                    g.na = false;
                }
                el.style.pointerEvents = 'none';
            }
        };

        const pegar = (pid: number, x: number, y: number) => {
            id = pid;
            fisica.pegar(x, y);
            // na mão ele pendura embaixo da seta: a etiqueta do cursor vai para cima dela
            el.setAttribute('data-cursor-acima', '');
            el.dataset.cursor = el.dataset.soltar;
            el.setAttribute('data-segurando', '');
        };
        const apertar = (e: PointerEvent) => {
            if (fase !== 'boiando' || (e.pointerType === 'mouse' && e.button !== 0)) return;
            e.preventDefault();
            el.setPointerCapture(e.pointerId);
            if (fisica.virado) pendente = { id: e.pointerId, x: e.clientX, y: e.clientY };
            else pegar(e.pointerId, e.clientX, e.clientY);
        };
        const mover = (e: PointerEvent) => {
            // virado e arrastado: pega do ponto em que apertou
            if (pendente && e.pointerId === pendente.id && Math.hypot(e.clientX - pendente.x, e.clientY - pendente.y) > 8) {
                const { id: pid, x, y } = pendente;
                pendente = null;
                pegar(pid, x, y);
            }
            if (e.pointerId === id) fisica.mover(e.clientX, e.clientY);
        };
        const soltar = (e: PointerEvent) => {
            if (pendente && e.pointerId === pendente.id) {
                pendente = null;
                fisica.desvirar();
                el.style.pointerEvents = 'none';
                el.dataset.cursor = el.dataset.pegar;
                return;
            }
            if (e.pointerId !== id) return;
            id = -1;
            fisica.largar();
            // enquanto cai, ele não pega o mouse: assim o cursor do site, que confere o rótulo quando ele muda, não fica
            // com "Pegue" parado no alto
            if (fisica.voando) el.style.pointerEvents = 'none';
            el.removeAttribute('data-cursor-acima');
            el.dataset.cursor = el.dataset.pegar;
            el.removeAttribute('data-segurando');
        };
        el.addEventListener('pointerdown', apertar);
        window.addEventListener('pointermove', mover, { passive: true });
        window.addEventListener('pointerup', soltar);
        window.addEventListener('pointercancel', soltar);

        const desligar = aCadaQuadro(({ y: rolagem, dt: passo }) => {
            const dt = Math.min(passo, 1 / 30);
            const q = ondasNoQuadro.get(cenaDoRodape);
            // o quanto o rodapé entrou (o topo dele do pé ao topo da tela)
            const s = geo.s.footer;
            const p = s.h ? ramp(rolagem + geo.vh - s.top, 0, Math.min(s.h, geo.vh)) : 0;
            // a onda dele: a que passa mais perto de NAVEGA em repouso (sem depender da fase das ondas), escolhida de novo
            // quando a largura muda ou a altura muda muito (não a cada vez que a barra do navegador do celular aparece); a
            // grade da água vem junto (a largura da tela na linha dele, com folga para o paralaxe, e a profundidade para os
            // dois lados, sem passar da onda da frente), e o barco surge de novo
            if (onda < 0 || ondaW !== W || Math.abs(H - ondaH) > 0.2 * ondaH) {
                let melhor = Infinity;
                for (let i = 0; i < ONDAS.z.length; i++) {
                    const d = Math.abs(repousoDaOnda(i, W, H) - NAVEGA * H);
                    if (d < melhor) {
                        melhor = d;
                        onda = i;
                    }
                }
                ondaW = W;
                ondaH = H;
                const v = vistaDaLinha(null, onda, W, H);
                const meia = ((W / 2 / v.unidade) * v.d) / v.larg + 0.15;
                fisica.configurarAgua(-meia, meia, Math.max(ONDAS.z[0] - 0.1, v.Zb - AGUA.profundidade), v.Zb + AGUA.profundidade, AGUA.celula.x / v.sx, AGUA.celula.z / v.prof);
                fase = 'fora';
            }
            if (!q) {
                fase = 'fora';
                return mostrar(false);
            }

            // a vista da linha dele neste quadro; o paralaxe do mouse anda com o mundo, e o barco e as gotas vão junto
            const vista = vistaDaLinha(q, onda, W, H);
            if (fase !== 'fora') fisica.deslocar(((0.05 * (vista.mx - mxAntes)) / vista.d) * vista.unidade);
            mxAntes = vista.mx;
            fisica.vista = vista;
            // a onda do shader sob a linha dele, para a física
            const { base } = fisica;
            for (let i = 0; i < base.length; i++) base[i] = alturaDaOnda(q, onda, (i * W) / (base.length - 1), W, H);

            // as fases: o rodapé chegando o traz do fundo; subindo a página (e não na mão), ele afunda
            const naMao = fisica.mao.ativa;
            if (fase === 'fora' && p >= RODAPE.surge) {
                fisica.colocarSubmerso(primeira ? W * COMECA : fisica.x);
                primeira = false;
                fase = 'surgindo';
            } else if (fase === 'afundando' && p >= RODAPE.surge) {
                fisica.afundar = 0;
                fase = 'surgindo';
            } else if ((fase === 'surgindo' || fase === 'boiando') && p < RODAPE.afunda && !naMao) {
                fisica.afundar = 1;
                fase = 'afundando';
            }
            if (fase === 'fora') return mostrar(false);
            tempo += dt;

            // o giro do desenho: a rolagem balança com o mar e, na mão, inclina com o gesto; a guinada passeia devagar e,
            // na mão, torce com o gesto; cada batida dá um empurrão nas duas
            if (fisica.batidas !== batidas) {
                batidas = fisica.batidas;
                const f = fisica.forcaDaBatida, sinal = Math.random() < 0.5 ? -1 : 1;
                giro.vrol += sinal * (1.5 + 5 * f);
                giro.vgui -= sinal * (0.4 + 1.4 * f);
            }
            const alvoRol = naMao
                ? Math.max(-0.35, Math.min(0.35, -fisica.vx * 0.00025))
                : fisica.area > 0
                  ? 0.07 * Math.sin(tempo * 1.13) + 0.04 * Math.sin(tempo * 1.97 + 1.3)
                  : 0;
            giro.vrol += ((alvoRol - giro.rol) * 40 - giro.vrol * 3.2) * dt;
            giro.rol += giro.vrol * dt;
            const alvoGui = GUINADA + 0.12 * Math.sin(tempo * 0.17) + 0.06 * Math.sin(tempo * 0.43 + 2) + (naMao ? Math.max(-0.5, Math.min(0.5, -fisica.mao.vx * 0.0008)) : 0);
            giro.vgui += ((alvoGui - giro.gui) * 8 - giro.vgui * (naMao ? 1.4 : 2.6)) * dt;
            giro.gui = Math.max(-0.8, Math.min(0.5, giro.gui + giro.vgui * dt));
            fisica.guinada = giro.gui;

            // a física, e a água simulada vai para o shader das ondas, com a altura do plano da água perto do barco
            fisica.passo(dt);
            const { agua } = fisica;
            Object.assign(aguaDoRodape, { dados: agua.alt, nx: agua.nx, nz: agua.nz, x0: agua.x0, z0: agua.z0, hx: agua.hx, hz: agua.hz });
            aguaDoRodape.planoY = linhaNoMundo(q, onda, fisica.x, W, H);
            aguaDoRodape.versao++;
            // furou a superfície: boiando; lá no fundo: some
            const profundidade = fisica.profundidade();
            if (fase === 'surgindo' && profundidade < -0.3 * fisica.s) fase = 'boiando';
            if (fase === 'afundando' && profundidade > RODAPE.some * fisica.s) {
                fase = 'fora';
                return mostrar(false);
            }
            mostrar(true);

            // o barco: a tela pequena centrada nele (no pixel inteiro do aparelho, para não borrar), a água sob ela
            const pose = matrizDoBarco({ x: fisica.x, y: fisica.y, escala: fisica.s, arfagem: -fisica.th, guinada: giro.gui, rolagem: giro.rol, elevacao: vista.elevacao, ancora: CENTRO_DE_MASSA });
            const centro = pose.aplicar([0, 0.45, 0]);
            const ox = Math.round((centro[0] - lado / 2) * dpr) / dpr, oy = Math.round((centro[1] - lado / 2) * dpr) / dpr;
            cb.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
            for (let k = 0; k < 16; k++) sup[k] = fisica.superficie(ox + (k / 15) * lado);
            const s0 = fisica.superficie(fisica.x);
            barco.desenhar({
                tela: lado,
                canvas: cb.width,
                origem: [ox, oy],
                barco: pose,
                reflexo: pose.reflexo(s0),
                superficie: sup,
                supX: [ox, ox + lado],
                s0,
                senE: Math.sin(vista.elevacao),
                molhado: fisica.molhado,
                escala: fisica.s,
                tempo,
            });

            // as gotas e as bolhas, nas duas telas (cada uma some quando não tem nenhuma)
            const ns = fisica.paraDesenho(gotas[0].dados, gotas[1].dados);
            gotas.forEach((g, k) => {
                const n = ns[k];
                if (!n && !g.na) return;
                g.desenho.desenhar(W, H, g.tela.width, g.tela.height, g.dados, n);
                if (!!n !== g.na) g.tela.style.visibility = n ? 'visible' : 'hidden';
                g.na = n > 0;
            });

            // a área de pegar: o contorno do barco na tela (o fecho dos pontos, com folga), recortado na caixa dele, para não
            // cobrir o que está em volta (um link logo abaixo da onda); só com ele boiando
            const fecho = fechoConvexo(CONTORNO.map(c => pose.aplicar(c)));
            let mx = 0, my = 0;
            for (const [x, y] of fecho) {
                mx += x / fecho.length;
                my += y / fecho.length;
            }
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            const largo = fecho.map(([x, y]) => {
                const d = Math.hypot(x - mx, y - my) || 1;
                const q = [x + ((x - mx) / d) * FOLGA, y + ((y - my) / d) * FOLGA];
                x0 = Math.min(x0, q[0]);
                y0 = Math.min(y0, q[1]);
                x1 = Math.max(x1, q[0]);
                y1 = Math.max(y1, q[1]);
                return q;
            });
            el.style.transform = `translate3d(${x0.toFixed(1)}px, ${y0.toFixed(1)}px, 0)`;
            el.style.width = `${(x1 - x0).toFixed(1)}px`;
            el.style.height = `${(y1 - y0).toFixed(1)}px`;
            el.style.clipPath = `polygon(${largo.map(([x, y]) => `${(x - x0).toFixed(1)}px ${(y - y0).toFixed(1)}px`).join(', ')})`;
            el.style.pointerEvents = (fase === 'boiando' && !fisica.voando) || naMao ? 'auto' : 'none';
            // o rótulo: virado, "Desvirar"
            if (!naMao && !pendente) {
                const rotulo = fisica.virado ? el.dataset.desvirar : el.dataset.pegar;
                if (el.dataset.cursor !== rotulo) el.dataset.cursor = rotulo;
            }
        });

        return () => {
            desligar();
            obs.disconnect();
            el.removeEventListener('pointerdown', apertar);
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('pointerup', soltar);
            window.removeEventListener('pointercancel', soltar);
            barco.destruir();
            for (const g of gotas) g.desenho.destruir();
            Object.assign(aguaDoRodape, { dados: null, nx: 0, nz: 0 });
        };
    }, []);

    return (
        <>
            <canvas ref={telaDeTras} className="fa-barco-gotas fa-barco-gotas-atras" aria-hidden />
            <canvas ref={telaDoBarco} className="fa-barco-tela" aria-hidden />
            <canvas ref={telaDaFrente} className="fa-barco-gotas" aria-hidden />
            <div ref={alvo} className="fa-barco" data-cursor={T.pegar} data-pegar={T.pegar} data-soltar={T.soltar} data-desvirar={T.desvirar} aria-hidden />
        </>
    );
}
