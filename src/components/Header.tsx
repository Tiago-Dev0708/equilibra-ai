'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { href: '/', label: 'Sorteio' },
  { href: '/jogadores', label: 'Jogadores' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Equilibra, página inicial"
          className="-mx-1 rounded-md px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Principal" className="flex items-center gap-0.5 sm:gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-md px-2.5 py-1.5 text-sm sm:px-3 transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                    active ? 'bg-subtle font-medium text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
