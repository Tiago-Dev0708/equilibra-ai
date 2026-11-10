'use client';

import { Elo } from '@/lib/types';
import { LEVELS, LEVEL_DOT, LEVEL_LABEL } from '@/lib/levels';

export function LevelDot({ level, className = '' }: { level: Elo; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-1.5 shrink-0 rounded-full ${LEVEL_DOT[level]} ${className}`}
    />
  );
}

/** Rótulo compacto de nível (somente leitura). */
export function LevelTag({ level }: { level: Elo }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <LevelDot level={level} />
      {LEVEL_LABEL[level]}
    </span>
  );
}

interface LevelSelectorProps {
  value: Elo;
  onChange: (level: Elo) => void;
  label?: string;
}

/** Controle segmentado Alto / Médio / Baixo. */
export function LevelSelector({ value, onChange, label = 'Nível' }: LevelSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex shrink-0 rounded-lg border border-line bg-subtle p-0.5"
    >
      {LEVELS.map((level) => {
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(level)}
            className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-accent sm:h-6 sm:px-2 ${
              active ? 'bg-raised font-medium text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            <LevelDot level={level} className={active ? '' : 'opacity-40'} />
            {LEVEL_LABEL[level]}
          </button>
        );
      })}
    </div>
  );
}
