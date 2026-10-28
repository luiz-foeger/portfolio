'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { TEXTOS, type Idioma } from './textos';

type Contexto = { idioma: Idioma; definir: (i: Idioma) => void };
const IdiomaContext = createContext<Contexto | null>(null);
const CHAVE = 'foeger-idioma';

// português por padrão; na primeira visita, inglês se o navegador não estiver em português. A escolha fica salva
export function IdiomaProvider({ children }: { children: React.ReactNode }) {
    const [idioma, setIdioma] = useState<Idioma>('pt');
    const [pronto, setPronto] = useState(false);

    useEffect(() => {
        let escolhido: Idioma = navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
        try {
            const salvo = localStorage.getItem(CHAVE);
            if (salvo === 'pt' || salvo === 'en') escolhido = salvo;
        } catch { }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- o idioma salvo e o do navegador só existem no navegador
        setIdioma(escolhido);
        setPronto(true);
    }, []);

    useEffect(() => {
        document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en';
        if (!pronto) return;
        try { localStorage.setItem(CHAVE, idioma); } catch { }
    }, [idioma, pronto]);

    return <IdiomaContext.Provider value={{ idioma, definir: setIdioma }}>{children}</IdiomaContext.Provider>;
}

export function useIdioma() {
    const contexto = useContext(IdiomaContext);
    if (!contexto) throw new Error('useIdioma precisa do IdiomaProvider');
    return contexto;
}

export const useTexto = () => TEXTOS[useIdioma().idioma];
