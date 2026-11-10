import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jogadores',
};

export default function JogadoresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
