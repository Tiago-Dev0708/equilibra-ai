import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { LogoMark } from '@/components/Logo';
import { themeInitScript } from '@/components/ThemeToggle';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Equilibra · Sorteio de times equilibrados',
    template: '%s · Equilibra',
  },
  description:
    'Monte times equilibrados para futebol, vôlei, basquete e outras modalidades a partir do nível de cada jogador.',
  applicationName: 'Equilibra',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-fg">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 text-xs text-faint sm:px-6">
            <span className="flex items-center gap-2">
              <LogoMark size={16} />
              Equilibra
            </span>
            <span className="hidden sm:inline">Times equilibrados pelo nível de cada jogador</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
