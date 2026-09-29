import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Bricolage_Grotesque, Lexend, Montserrat } from 'next/font/google';

import './globals.css';

import { CursorProvider } from '../components/ui/CursorContext';
// import { CustomCursor } from '../components/ui/CustomCursor';
import SmoothScroll from '../components/ui/SmoothScroll';
import { PageTransitionProvider } from '../components/ui/PageTransition';

const lexend = Lexend({ subsets: ['latin'], variable: '--ff-lexend' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz'], variable: '--ff-bricolage' });
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--ff-bebas' });
// sem preload: por enquanto só os componentes fora de uso usam a Montserrat
const montserrat = Montserrat({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--ff-montserrat', preload: false });

export const metadata: Metadata = {
  title: 'Portfólio - Luiz Felipe Föeger dos Santos',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-br" className={`${lexend.variable} ${bricolage.variable} ${bebas.variable} ${montserrat.variable}`}>
      <body>
        <SmoothScroll>
          <CursorProvider>
            {/* <CustomCursor /> */}
            <div className="App">
              {/* <Header /> */}
              <PageTransitionProvider>
                {children}
              </PageTransitionProvider>
            </div>
          </CursorProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
