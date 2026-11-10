import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Equilibra.ai — Sorteio de Times Equilibrados",
  description:
    "Monte times equilibrados para qualquer esporte. Sorteio inteligente baseado no Elo dos jogadores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-violet-500/30 selection:text-violet-200">
        <Header />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="border-t border-zinc-900 bg-zinc-950/60 py-6 text-center text-xs text-zinc-600">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-medium text-zinc-500">
              Equilibra<span className="text-violet-400">.ai</span> • Sorteio inteligente e justo para esportes
            </span>
            <span className="text-zinc-600">
              Otimizado para até 100 jogadores • Vercel Ready
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
